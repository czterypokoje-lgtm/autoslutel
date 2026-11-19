import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const PAGE = 1000;
const MAX_ROWS = 20000;

/** Click-id kolommen: leads en jobs hebben gclid/wbraid/gbraid en oppref (0045, 0053, 0074). */
const LEAD_COLUMNS = 'id, phone_e164, created_at, status, gclid, wbraid, gbraid, oppref';
const JOB_COLUMNS =
  'id, lead_id, customer_phone, created_at, status, final_price, scheduled_date, completed_at, gclid, wbraid, gbraid, oppref';
/* De advertentiecode ([K7F2]) staat alleen op call_clicks.ref; claimed_by_job_id wijst naar de klus. */
const CLICK_COLUMNS = 'ref, claimed_by_job_id';

/** Haalt alle rijen op in pagina's van 1000 (PostgREST kapt anders af). */
async function readAll(table: string, columns: string, order: string) {
  const supabase = createSupabaseAdminClient();
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(order, { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return { rows, error };
    rows.push(...((data ?? []) as unknown as Record<string, unknown>[]));
    if (!data || data.length < PAGE) break;
  }
  return { rows, error: null };
}

/**
 * Alleen lezen, voor het koppelen van WhatsApp-chats aan leads en klussen:
 * per lead en per klus precies wat daarvoor nodig is (nummer, datums, status,
 * klik-ids, advertentiecode, prijs). Geen namen, adressen of notities.
 * Het koppelen zelf gebeurt op de server (bin/chat-match.mjs); hier wordt
 * niets geclaimd, verstuurd of aan Google doorgegeven.
 */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const [leads, jobs, clicks] = await Promise.all([
    readAll('leads', LEAD_COLUMNS, 'created_at'),
    readAll('jobs', JOB_COLUMNS, 'created_at'),
    readAll('call_clicks', CLICK_COLUMNS, 'created_at'),
  ]);

  const failed = leads.error ?? jobs.error ?? clicks.error;
  if (failed) {
    console.error('ops match-export read failed:', failed.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  /* Eén ref per klus: de eerste geclaimde klik met een code wint. */
  const refByJob = new Map<string, string>();
  for (const click of clicks.rows) {
    const jobId = click.claimed_by_job_id;
    const ref = click.ref;
    if (typeof jobId === 'string' && typeof ref === 'string' && !refByJob.has(jobId)) {
      refByJob.set(jobId, ref);
    }
  }

  const jobRows = jobs.rows.map((job) => ({
    id: job.id,
    lead_id: job.lead_id,
    phone: job.customer_phone,
    created_at: job.created_at,
    status: job.status,
    final_price: job.final_price,
    scheduled_date: job.scheduled_date,
    completed_at: job.completed_at,
    gclid: job.gclid,
    wbraid: job.wbraid,
    gbraid: job.gbraid,
    oppref: job.oppref,
    ref: refByJob.get(job.id as string) ?? null,
  }));

  await logOps(createSupabaseAdminClient(), 'match_export.read', {
    leads: leads.rows.length,
    jobs: jobRows.length,
  });

  return NextResponse.json(
    { leads: leads.rows, jobs: jobRows },
    { headers: { 'Cache-Control': 'no-store, private', 'X-Robots-Tag': 'noindex, nofollow' } }
  );
}
