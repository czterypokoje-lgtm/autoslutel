import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAuthorized, adminAuthConfigured } from '@/lib/adminAuth';

/**
 * Google Ads offline-conversion export.
 *
 * This route reads personal data (leads) with the Supabase service-role key,
 * which bypasses Row Level Security. It MUST never be publicly reachable.
 * Access requires the EXPORT_SECRET bearer token; without a correct token the
 * route answers 404 so its existence is not advertised.
 *
 * Set EXPORT_SECRET in the Vercel project environment before deploying.
 *
 * Split into two lists, not one, because a lead with a gclid is not
 * automatically a conversion worth bidding on:
 *   - `positive`: qualified or sold — a real conversion, reported once.
 *   - `negative`: spam or duplicate — the click itself was never a real
 *     conversion, reported as a Google Ads "conversion adjustment"
 *     (RETRACTION) so Smart Bidding stops treating that click as a signal
 *     to find more like it. Without this half, every spam form-fill trains
 *     the algorithm to spend more money finding more spam.
 * A lead sitting at `new`, `contacted` or a non-spam `rejected` is reported
 * as neither — the office hasn't decided yet, and guessing is worse than
 * waiting.
 */

export const dynamic = 'force-dynamic';

/*
 * The job is joined in for its revenue.
 *
 * The CSV has always had a Conversion Value column and the office had to type
 * every figure into it by hand, defaulting to 0 — so an export done quickly
 * told Google every click was worth nothing, which is worse than sending no
 * value at all: it trains Smart Bidding that this traffic has no worth.
 *
 * jobs.lead_id is the link. Only a finished job counts; a planned one has not
 * earned anything yet and reporting its quote as revenue would be inventing
 * a number.
 */
const EXPORT_COLUMNS =
  'id, created_at, service, status, gclid, wbraid, gbraid, jobs (status, final_price, completed_at)';

/*
 * A conversion is a finished job, not a hopeful lead.
 *
 * This export used to emit a conversion for every lead at `qualified` or
 * `sold`. The office's account of what those statuses mean in practice:
 * "customer is not accept most of them and some of them we miss and dont
 * reply". So `qualified` means the job was possible, which is a long way from
 * the customer saying yes.
 *
 * Measured at the time of the change: 16 leads with a click id sat at
 * qualified/sold, 2 had a job at all, and 0 had a completed paid one. Ten had
 * already been reported to Google under a conversion action literally named
 * "Job Completed". Smart Bidding was being taught that a person who asks for
 * a price and walks away is the outcome to find more of.
 *
 * So the money event is the source now: a job at `afgerond` with a
 * final_price, attributed through its lead's click id. That yields far fewer
 * conversions — one, when this was written — and every one of them is revenue
 * that actually arrived.
 */
const POSITIVE_FROM_JOBS =
  'id, final_price, completed_at, scheduled_date, lead_id, leads!inner(id, gclid, wbraid, gbraid, created_at)';

/* Google will not accept a conversion for a click older than this. */
const CLICK_WINDOW_DAYS = 90;

function unauthorized() {
  // 404 rather than 401: do not confirm that this endpoint exists.
  return new NextResponse(null, { status: 404 });
}

function supabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.storage_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.storage_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: Request) {
  // Defence in depth: middleware already gates this path, but a route that
  // reads personal data with the service-role key must check for itself too.
  if (!adminAuthConfigured()) {
    console.error('Admin credentials are not configured — refusing to export leads');
    return unauthorized();
  }
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    /*
     * Two queries, because the two halves need opposite filters — and the
     * single query they used to share had the negative half exactly backwards.
     *
     * A conversion is sent once: `exported_at is null`.
     *
     * A RETRACT is not a conversion, it is an instruction about one Google
     * already holds. Sending it for a lead that was never exported asks
     * Google to cancel something that does not exist, and it answers exactly
     * that — all four rows of the first retraction upload came back with
     * "This conversion does not exist. Double-check all the parameters."
     *
     * So a retraction requires the opposite: the lead WAS exported as a good
     * conversion, and has since been marked spam or duplicate. That is the
     * only case where there is something on Google's side to withdraw.
     */
    const clickIdFilter = 'gclid.not.is.null,wbraid.not.is.null,gbraid.not.is.null';

    const [positiveResult, negativeResult] = await Promise.all([
      supabase
        .from('jobs')
        .select(POSITIVE_FROM_JOBS)
        .eq('status', 'afgerond')
        /* !inner above already drops jobs with no lead; this drops the ones
           whose lead never carried a click — there is nothing for Google to
           attribute them to, however real the work was. */
        .not('lead_id', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(500),

      supabase
        .from('leads')
        .select(EXPORT_COLUMNS)
        .or(clickIdFilter)
        .not('exported_at', 'is', null)
        .is('retracted_at', null)
        .in('status', ['spam', 'duplicate'])
        .order('created_at', { ascending: false })
        .limit(500),
    ]);

    const error = positiveResult.error ?? negativeResult.error;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    /*
     * The two halves no longer share a shape: positives come from jobs,
     * negatives from leads. Mapped separately rather than merged and sorted
     * apart again, which is the arrangement that let a lead masquerade as a
     * completed job in the first place.
     */
    interface JobRow {
      id: string;
      final_price: number | string | null;
      completed_at: string | null;
      scheduled_date: string | null;
      lead_id: string;
      leads: { id: string; gclid: string | null; wbraid: string | null; gbraid: string | null; created_at: string } | null;
    }

    const cutoff = Date.now() - CLICK_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    const positive = ((positiveResult.data ?? []) as unknown as JobRow[])
      .map((job) => {
        const lead = job.leads;
        const clickId = lead?.gclid ?? lead?.wbraid ?? lead?.gbraid ?? null;
        const value = Number(job.final_price ?? 0);
        return { job, lead, clickId, value };
      })
      /* Three reasons a finished job is not reportable, none of them faults:
         no click paid for it, no money was recorded, or the click has aged
         out of Google's window. */
      .filter((r) => r.clickId && r.value > 0 && r.lead && new Date(r.lead.created_at).getTime() >= cutoff)
      .map((r) => ({
        id: r.lead!.id,
        job_id: r.job.id,
        status: 'afgerond',
        gclid: r.lead!.gclid,
        wbraid: r.lead!.wbraid,
        gbraid: r.lead!.gbraid,
        created_at: r.lead!.created_at,
        job_value: Math.round(r.value * 100) / 100,
        job_count: 1,
        /* The conversion happened when the work finished, not when the form
           was submitted. Falls back to the scheduled day at midday when a job
           was closed without a completion timestamp. */
        conversion_time: r.job.completed_at ?? (r.job.scheduled_date ? `${r.job.scheduled_date}T12:00:00Z` : null),
      }));

    const negative = ((negativeResult.data ?? []) as unknown as {
      id: string; status: string; created_at: string;
      gclid: string | null; wbraid: string | null; gbraid: string | null;
    }[]).map((lead) => ({
      ...lead,
      job_value: null,
      job_count: 0,
      conversion_time: null,
    }));

    return NextResponse.json(
      { success: true, positive, negative },
      {
        status: 200,
        headers: {
          // Never let a CDN or browser cache personal data.
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Marks leads as exported once their CSV has actually been downloaded, so
 * the next export run never reports the same click to Google Ads twice.
 */
export async function PATCH(request: Request) {
  if (!adminAuthConfigured()) return unauthorized();
  if (!isAuthorized(request)) return unauthorized();

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string') : [];
  if (!ids.length) {
    return NextResponse.json({ error: 'Geen ids opgegeven' }, { status: 400 });
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { error } = await supabase
    .from('leads')
    .update({ exported_at: new Date().toISOString() })
    .in('id', ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, count: ids.length });
}
