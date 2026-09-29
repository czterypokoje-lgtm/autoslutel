import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Attaching a phone-in job to the ad click that caused it.
 *
 * The automatic claim in api/admin/jobs only looks back 45 minutes, on the
 * assumption that the office books the job while the caller is still on the
 * line. Measured across every click ever captured, the nearest job created
 * afterwards was 30 to 63 hours later, and not one click has ever been
 * claimed. The window is not wrong by a factor that widening would fix:
 * across three days "the nearest unclaimed click" is a coin toss between a
 * dozen candidates, and a wrong gclid uploaded to Google teaches Smart
 * Bidding to buy the wrong traffic.
 *
 * So the machine offers and a person decides. The office knows which call
 * this job came from; nothing in the database does.
 */

const ID = /^[0-9a-f-]{32,40}$/i;

/** How far either side of the job to look. Days, not minutes — see above. */
const WINDOW_DAYS = 7;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: 'Ongeldig id' }, { status: 400 });

  const supabase = await createSupabaseServerClient();

  const { data: job } = await supabase
    .from('jobs')
    .select('id, created_at, scheduled_date, gclid, wbraid, gbraid, msclkid, lead_id')
    .eq('id', id)
    .maybeSingle<{
      id: string; created_at: string; scheduled_date: string | null;
      gclid: string | null; wbraid: string | null; gbraid: string | null; msclkid: string | null;
      lead_id: string | null;
    }>();

  if (!job) return NextResponse.json({ error: 'Klus niet gevonden' }, { status: 404 });

  /* Already attributed, by its lead or by an earlier claim. Offering more
     would invite someone to overwrite a click that is already correct. */
  const attributed = Boolean(job.gclid || job.wbraid || job.gbraid || job.msclkid || job.lead_id);

  /*
   * Anchored on the planned day where there is one, because that is when the
   * customer actually rang — `created_at` is when the office got round to
   * typing it in, which is the whole reason the 45-minute window never fired.
   */
  const anchor = job.scheduled_date ? new Date(`${job.scheduled_date}T12:00:00Z`) : new Date(job.created_at);
  const from = new Date(anchor.getTime() - WINDOW_DAYS * 864e5).toISOString();
  const to = new Date(anchor.getTime() + WINDOW_DAYS * 864e5).toISOString();

  const { data, error } = await supabase
    .from('call_clicks')
    .select('id, created_at, gclid, wbraid, gbraid, msclkid, source_url')
    .is('claimed_by_job_id', null)
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('call_clicks lookup failed:', error.message);
    return NextResponse.json({ error: 'Zoeken mislukt' }, { status: 500 });
  }

  /*
   * The closest six, by time, not the most recent twenty-five.
   *
   * Seventeen clicks landed in two days, so a plain window hands the office
   * every one of them for every candidate job — a list that long is not a
   * choice, it is the same guess the automatic claim was making, moved to a
   * human. Six ordered by how near they fall to the job is something a person
   * can actually weigh against their own memory of the call.
   */
  const clicks = (data ?? [])
    .map((click) => ({
      id: click.id,
      created_at: click.created_at,
      source_url: click.source_url,
      network: click.msclkid && !click.gclid ? 'Microsoft' : 'Google',
      /* Hours between the click and the day of the job, so the office can see
         at a glance which one plausibly belongs to this call. */
      hoursFromJob: Math.round((new Date(click.created_at).getTime() - anchor.getTime()) / 36e5),
    }))
    .sort((a, b) => Math.abs(a.hoursFromJob) - Math.abs(b.hoursFromJob))
    .slice(0, 6);

  return NextResponse.json({ attributed, clicks }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: 'Ongeldig id' }, { status: 400 });

  let body: { click_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }
  const clickId = typeof body.click_id === 'string' ? body.click_id : '';
  if (!ID.test(clickId)) return NextResponse.json({ error: 'Ongeldige klik' }, { status: 400 });

  const supabase = await createSupabaseServerClient();

  /*
   * Claim first, and only on a click nobody else has taken. If this returns
   * no row the click was claimed in between, and copying its ids onto the job
   * anyway would report one ad click as the cause of two separate sales.
   */
  const { data: claimed, error: claimError } = await supabase
    .from('call_clicks')
    .update({ claimed_by_job_id: id })
    .eq('id', clickId)
    .is('claimed_by_job_id', null)
    .select('id, created_at, gclid, wbraid, gbraid, msclkid')
    .maybeSingle<{
      id: string; created_at: string;
      gclid: string | null; wbraid: string | null; gbraid: string | null; msclkid: string | null;
    }>();

  if (claimError) {
    console.error('call_clicks claim failed:', claimError.message);
    return NextResponse.json({ error: 'Koppelen mislukt' }, { status: 500 });
  }
  if (!claimed) {
    return NextResponse.json({ error: 'Deze klik is net aan een andere klus gekoppeld.' }, { status: 409 });
  }

  const { error: jobError } = await supabase
    .from('jobs')
    .update({
      gclid: claimed.gclid,
      wbraid: claimed.wbraid,
      gbraid: claimed.gbraid,
      msclkid: claimed.msclkid,
      click_captured_at: claimed.created_at,
    })
    .eq('id', id);

  if (jobError) {
    /* Give the click back rather than leave it spent on a job that never
       received it — an unclaimed click can still be offered again. */
    await supabase.from('call_clicks').update({ claimed_by_job_id: null }).eq('id', claimed.id);
    console.error('Job click write failed:', jobError.message);
    return NextResponse.json({ error: 'Koppelen mislukt' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
