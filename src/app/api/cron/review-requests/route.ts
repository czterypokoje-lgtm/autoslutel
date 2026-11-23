import { NextResponse } from 'next/server';
import { amsterdamParts, amsterdamToUtc } from '@/lib/amsterdamTime';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendWhatsAppTemplate, whatsappConfigured } from '@/lib/inbox/whatsapp';
import { toE164NL } from '@/lib/phone';
import { REVIEW_TEMPLATE_DEFAULT, MAX_PER_RUN, DAILY_MAX_DEFAULT, isDue, inSendingHours, recentlyAsked } from '@/lib/reviewRequest';

export const dynamic = 'force-dynamic';

/**
 * One WhatsApp review request per completed job, sent 2–72 h after
 * completion. Completion is written from several screens and the Telegram
 * bot, so this is a scan (like openai-paid-jobs), not a hook off any one of
 * them.
 *
 * REVIEW_REQUESTS gates it: unset/'0' counts candidates only, 'dry' computes
 * and reports who would be messaged, '1' actually sends. See
 * docs/review-requests.md for the rollout order and the template to submit
 * in Meta Business Manager.
 */

const JOB_COLS = 'id, completed_at, status, customer_phone, review_requested_at, review_request_attempts';

type JobRow = {
  id: string;
  completed_at: string | null;
  status: string;
  customer_phone: string | null;
  review_requested_at: string | null;
  review_request_attempts: number;
};

/** Last 3 digits visible, the rest masked — enough to spot-check in a cron response. */
function maskPhone(e164: string): string {
  return e164.length <= 3 ? e164 : `${'•'.repeat(e164.length - 3)}${e164.slice(-3)}`;
}

export async function GET(request: Request) {
  return handle(request);
}
export async function POST(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const envMode = process.env.REVIEW_REQUESTS;
  const mode: 'off' | 'dry' | 'send' = envMode === 'dry' ? 'dry' : envMode === '1' ? 'send' : 'off';
  const supabase = createSupabaseAdminClient();
  const since = new Date(Date.now() - 72 * 3_600_000).toISOString();

  if (mode === 'off') {
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'afgerond')
      .is('review_requested_at', null)
      .gte('completed_at', since)
      .not('customer_phone', 'is', null);
    return NextResponse.json({ ok: true, mode: 'off', candidates: count ?? 0 });
  }

  const now = new Date();
  if (!inSendingHours(now)) {
    return NextResponse.json({ ok: true, mode: 'quiet_hours' });
  }
  if (mode === 'send' && !whatsappConfigured()) {
    return NextResponse.json({ error: 'WhatsApp Cloud API niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_COLS)
    .eq('status', 'afgerond')
    .is('review_requested_at', null)
    .gte('completed_at', since)
    .not('customer_phone', 'is', null)
    .limit(200);
  if (error) {
    console.error('[review-requests] query failed', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const candidates = (data ?? []) as JobRow[];

  // One query for "has this phone been asked in the last 90 days": across any
  // job, not just this one, so two jobs for the same customer never both ask.
  const since90 = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const { data: recent } = await supabase.from('jobs').select('customer_phone, review_requested_at').not('review_requested_at', 'is', null).gte('review_requested_at', since90);
  const lastAskedByPhone = new Map<string, string>();
  for (const row of (recent ?? []) as { customer_phone: string | null; review_requested_at: string | null }[]) {
    const phone = toE164NL(row.customer_phone);
    if (!phone || !row.review_requested_at) continue;
    const prev = lastAskedByPhone.get(phone);
    if (!prev || row.review_requested_at > prev) lastAskedByPhone.set(phone, row.review_requested_at);
  }

  // Opted out (WhatsApp STOP reply, or an office entry) — loaded once per run
  // so every candidate job for that number is skipped, not just the first.
  const { data: optOuts } = await supabase.from('whatsapp_optouts').select('phone_e164');
  const optedOut = new Set((optOuts ?? []).map((r) => r.phone_e164 as string));

  // Daily send cap, Europe/Amsterdam calendar day: counts jobs already marked
  // 'sent' today, so a run never pushes the day's total past REVIEW_REQUESTS_DAILY_MAX
  // (docs/review-requests.md: start low, raise only while WhatsApp quality stays green).
  const dailyMaxRaw = Number.parseInt(process.env.REVIEW_REQUESTS_DAILY_MAX ?? '', 10);
  const dailyMax = Number.isFinite(dailyMaxRaw) && dailyMaxRaw >= 0 ? dailyMaxRaw : DAILY_MAX_DEFAULT;
  const todayStartUtc = amsterdamToUtc(amsterdamParts(now).day, '00:00').toISOString();
  const { count: sentTodayCount } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('review_request_status', 'sent')
    .gte('review_requested_at', todayStartUtc);
  const sentTodayBefore = sentTodayCount ?? 0;
  const remainingToday = Math.max(0, dailyMax - sentTodayBefore);
  const runCap = Math.min(MAX_PER_RUN, remainingToday);

  const template = process.env.WHATSAPP_REVIEW_TEMPLATE ?? REVIEW_TEMPLATE_DEFAULT;
  const seenInRun = new Set<string>(); // dedupe phones within this run
  const wouldSend: { job_id: string; phone: string }[] = [];
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of candidates) {
    const due = isDue(job, now);
    if (!due.due) {
      // too_soon (and the defensive not_done/already) are left for a later run; everything
      // else about this job can only get worse with time, so it is marked and never rescanned.
      if (due.reason === 'too_old' || due.reason === 'no_phone') {
        skipped++;
        if (mode === 'send') {
          await supabase.from('jobs').update({ review_requested_at: now.toISOString(), review_request_status: 'skipped', review_request_note: due.reason }).eq('id', job.id);
        }
      }
      continue;
    }

    const phone = toE164NL(job.customer_phone);
    if (!phone) {
      skipped++;
      if (mode === 'send') {
        await supabase
          .from('jobs')
          .update({ review_requested_at: now.toISOString(), review_request_status: 'skipped', review_request_note: 'invalid_phone' })
          .eq('id', job.id);
      }
      continue;
    }
    if (optedOut.has(phone)) {
      skipped++;
      if (mode === 'send') {
        await supabase.from('jobs').update({ review_requested_at: now.toISOString(), review_request_status: 'skipped', review_request_note: 'opt-out' }).eq('id', job.id);
      }
      continue;
    }
    if (seenInRun.has(phone) || recentlyAsked(lastAskedByPhone.get(phone) ?? null, now)) {
      skipped++;
      if (mode === 'send') {
        await supabase
          .from('jobs')
          .update({ review_requested_at: now.toISOString(), review_request_status: 'skipped', review_request_note: 'phone_recently_asked' })
          .eq('id', job.id);
      }
      continue;
    }

    if (mode === 'dry') {
      seenInRun.add(phone);
      wouldSend.push({ job_id: job.id, phone: maskPhone(phone) });
      continue;
    }

    // mode === 'send' from here
    if (sent >= runCap) break; // daily cap or MAX_PER_RUN, whichever bites first; next run picks up the rest
    seenInRun.add(phone);
    const result = await sendWhatsAppTemplate(phone, template, 'nl', []);
    if (result.ok) {
      await supabase.from('jobs').update({ review_requested_at: now.toISOString(), review_request_status: 'sent' }).eq('id', job.id);
      sent++;
    } else {
      failed++;
      const attempts = (job.review_request_attempts ?? 0) + 1;
      const giveUp = attempts >= 2; // never retried more than twice
      await supabase
        .from('jobs')
        .update({
          review_request_attempts: attempts,
          review_request_status: 'failed',
          review_request_note: result.error.slice(0, 200),
          review_requested_at: giveUp ? now.toISOString() : null,
        })
        .eq('id', job.id);
    }
  }

  return NextResponse.json({
    ok: true,
    mode: envMode,
    sent,
    failed,
    skipped,
    candidates: candidates.length,
    daily_max: dailyMax,
    sent_today_before: sentTodayBefore,
    remaining_today: remainingToday,
    ...(mode === 'dry' ? { would_send: wouldSend } : {}),
  });
}
