import { createClient } from '@supabase/supabase-js';
import { checkAdsFeedAuth } from '@/lib/adsConversionsFeed';
import { buildConfirmedFeed, type FeedRow } from '@/lib/conversionMatcher';
import { logOps } from '@/lib/opsAuth';

/**
 * Daily offline-conversion file for Google Ads (Goals > Conversions >
 * Uploads > Schedules, source HTTPS). See docs/ads-conversions-feed.md.
 *
 * HTTP Basic, user `google-ads`, password ADS_FEED_PASSWORD (24+ characters).
 * Any failure, including a missing env, answers 404 with an empty body: the
 * route does not admit it exists.
 *
 * Only sales a person confirmed on /admin/conversies are in it (table
 * ad_conversion_matches, migration 0109), valued excl. BTW. Before 0109 this
 * file picked clicks for finished jobs by itself; it no longer guesses. Until
 * 0109 has been run the file is empty apart from its two header lines.
 *
 * Nothing personal is written: click id, conversion name, time, value, currency.
 * Each row Google receives for the first time gets uploaded_at, so the office
 * screen can say "door Google opgehaald" and stop offering an undo.
 */

export const dynamic = 'force-dynamic';

const notFound = () => new Response(null, { status: 404 });

export async function GET(request: Request) {
  if (!checkAdsFeedAuth(request.headers.get('authorization'), process.env.ADS_FEED_PASSWORD)) return notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.storage_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.storage_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return notFound();
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('ad_conversion_matches')
    .select('id, click_kind, click_id, clicked_at, conversion_at, value_excl_btw, decision, uploaded_at')
    .eq('decision', 'bevestigd')
    .limit(5000);
  if (error) console.error('ads feed: ad_conversion_matches read failed (migration 0109 run?):', error.message);

  const rows = (data ?? []) as (FeedRow & { uploaded_at: string | null })[];
  const { csv, counts, ids } = buildConfirmedFeed(rows, new Date());

  const served = new Set(ids);
  const fresh = rows.filter((r) => !r.uploaded_at && served.has(r.id)).map((r) => r.id);
  if (fresh.length) {
    const marked = await supabase.from('ad_conversion_matches').update({ uploaded_at: new Date().toISOString() }).in('id', fresh);
    if (marked.error) console.error('ads feed: marking uploaded_at failed:', marked.error.message);
  }
  await logOps(supabase, 'ads_conversions_feed', { ...counts, first_time: fresh.length });

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
