import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendOpenAiEvent } from '@/lib/openaiAds';

export const dynamic = 'force-dynamic';

/**
 * Paid jobs back to ChatGPT ads, as order_created — once per job.
 *
 * A job counts only when all three are true: it is `afgerond` (the technician
 * or office closed it), a job_payments row is `betaald`, and it carries an
 * oppref — claimed from a call click by the office (call-clicks route) or
 * inherited from the web lead it came from. A tap, a form or a booking never
 * gets here.
 *
 * One daily sweep instead of a hook in each place a job can become reportable
 * (closing it, claiming its click, cash at the door, the Mollie webhook): the
 * last of those can happen in any order, and a sweep sees them all.
 * ponytail: daily, so the event lands up to a day late; the API takes 7 days.
 *
 * Value is gross_margin — what Autosleutel24 keeps — never final_price.
 *
 * The same sweep sends the earlier stage, qualified_service_call, once per job.
 * A job is the human qualification: the office booked a technician for a real
 * service in a covered city. An oppref only reaches a job through a person
 * claiming the click, or the web lead the job was booked from, so an
 * unanswered or unsuitable call never has a job and never counts. Cancelled
 * jobs are left out.
 */

const API_WINDOW_MS = 7 * 864e5 - 60 * 60 * 1000; // an hour of margin inside the API's 7 days

type Row = {
  id: string;
  completed_at: string | null;
  gross_margin: number | null;
  oppref: string | null;
  leads: { oppref: string | null } | null;
  job_payments: { status: string; paid_at: string }[];
};

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  if (!process.env.OPENAI_ADS_API_KEY) {
    return NextResponse.json({ skipped: true, reason: 'OPENAI_ADS_API_KEY not set' });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('id, completed_at, gross_margin, oppref, leads (oppref), job_payments (status, paid_at)')
    .eq('status', 'afgerond')
    .is('openai_reported_at', null)
    .gte('completed_at', new Date(Date.now() - 60 * 864e5).toISOString());

  if (error) {
    console.error('[openai-paid-jobs] query failed', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sent: string[] = [];
  const failed: string[] = [];
  let expired = 0;

  for (const job of (data ?? []) as unknown as Row[]) {
    const oppref = job.oppref ?? job.leads?.oppref;
    const paid = job.job_payments.filter((p) => p.status === 'betaald');
    if (!oppref || !paid.length || !job.completed_at) continue;

    // The later of completion and payment: the moment it became a paid job.
    const at = Math.max(Date.parse(job.completed_at), ...paid.map((p) => Date.parse(p.paid_at)));
    if (Date.now() - at > API_WINDOW_MS) {
      expired++; // too old for the API; stays unreported and visible as such
      continue;
    }

    const ok = await sendOpenAiEvent({
      eventName: 'order_created',
      id: `job_${job.id}`, // stable: a retry after a failed mark is deduplicated
      timestampMs: at,
      actionSource: 'offline',
      oppref,
      amount: job.gross_margin && job.gross_margin > 0 ? job.gross_margin : undefined,
    });
    if (!ok) {
      failed.push(job.id);
      continue;
    }
    await supabase.from('jobs').update({ openai_reported_at: new Date().toISOString() }).eq('id', job.id);
    sent.push(job.id);
  }

  const qualified = await reportQualifiedCalls(supabase);

  return NextResponse.json({ sent, failed, expired, qualified });
}

async function reportQualifiedCalls(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, created_at, oppref, leads (oppref)')
    .neq('status', 'geannuleerd')
    .is('openai_qualified_at', null)
    // Booking time is the qualification time; older than the API window cannot be sent.
    .gte('created_at', new Date(Date.now() - API_WINDOW_MS).toISOString());
  if (error) {
    console.error('[openai-paid-jobs] qualified query failed', error.message);
    return { error: error.message };
  }

  const sent: string[] = [];
  const failed: string[] = [];
  for (const job of (data ?? []) as unknown as { id: string; created_at: string; oppref: string | null; leads: { oppref: string | null } | null }[]) {
    const oppref = job.oppref ?? job.leads?.oppref;
    if (!oppref) continue;
    const ok = await sendOpenAiEvent({
      eventName: 'custom',
      customEventName: 'qualified_service_call',
      id: `qualified_${job.id}`,
      timestampMs: Date.parse(job.created_at),
      actionSource: 'phone_call',
      oppref,
    });
    if (!ok) {
      failed.push(job.id);
      continue;
    }
    await supabase.from('jobs').update({ openai_qualified_at: new Date().toISOString() }).eq('id', job.id);
    sent.push(job.id);
  }
  return { sent, failed };
}
