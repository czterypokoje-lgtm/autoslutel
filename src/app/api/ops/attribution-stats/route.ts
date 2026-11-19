import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { attributionStats, type AttrChatRef, type AttrJob } from '@/lib/adAttribution';
import { loadAttributionPool } from '@/lib/attributionData';

export const dynamic = 'force-dynamic';

const DAY = 86_400_000;
const REF = /^[A-Z0-9]{4}$/;
const MAX_CHATS = 2000;

/**
 * Read only, counts only: per week of completion, how many finished jobs there
 * were, how many carry a click id themselves, how many the matcher recovers per
 * rule (lead_link, claimed_click, chat_ref, phone_lead), how many are ambiguous
 * (two different clicks qualify, so nothing is guessed), how many are shared
 * (one click fits, but another job holds it or found it too) and how many have
 * none. No ids, no numbers, no names. Same bearer token as the other ops routes.
 *
 * chat_ref uses the number stored on the click (call_clicks.chat_phone_key,
 * migration 0088, filled by /api/ops/ad-reviews), exactly like the daily file.
 * POST {chats:[{ref,phone}]} (the same shape as /api/ops/ad-matches) adds chats
 * the CRM has not been told about yet; the numbers are compared and dropped,
 * never stored or returned.
 */
async function handle(request: Request, chats: AttrChatRef[]) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const weeksParam = Number(new URL(request.url).searchParams.get('weeks'));
  const weeks = Number.isFinite(weeksParam) && weeksParam >= 1 ? Math.min(Math.floor(weeksParam), 26) : 12;
  const since = new Date(Date.now() - weeks * 7 * DAY).toISOString();

  const supabase = createSupabaseAdminClient();
  const [jobs, pool] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, status, completed_at, lead_id, customer_phone, gclid, wbraid, gbraid')
      .eq('status', 'afgerond')
      .gte('completed_at', since)
      .order('completed_at', { ascending: true })
      .limit(5000),
    /* Clicks and leads up to 90 days before the oldest job in range. */
    loadAttributionPool(supabase, new Date(Date.now() - weeks * 7 * DAY - 95 * DAY).toISOString()),
  ]);
  const failed = jobs.error?.message ?? pool.error;
  if (failed) {
    console.error('ops attribution-stats read failed:', failed);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  const stats = attributionStats((jobs.data ?? []) as unknown as AttrJob[], {
    leads: pool.leads,
    clicks: pool.clicks,
    otherJobs: pool.otherJobs,
    chats,
  });
  await logOps(supabase, 'attribution_stats.read', { weeks, chats: chats.length });
  return NextResponse.json(
    { weeks_back: weeks, chats_supplied: chats.length, ...stats },
    { headers: { 'Cache-Control': 'no-store, private', 'X-Robots-Tag': 'noindex, nofollow' } }
  );
}

export async function GET(request: Request) {
  return handle(request, []);
}

export async function POST(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const raw = ((await request.json().catch(() => null)) as { chats?: unknown } | null)?.chats;
  if (!Array.isArray(raw) || raw.length > MAX_CHATS) return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  const chats: AttrChatRef[] = [];
  for (const item of raw) {
    const { ref, phone } = (item ?? {}) as Record<string, unknown>;
    if (typeof ref !== 'string' || !REF.test(ref) || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
    }
    chats.push({ ref, phone: phone.slice(0, 32) });
  }
  return handle(request, chats);
}
