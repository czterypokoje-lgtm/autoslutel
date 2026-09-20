import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Daily marketing spend, per network, into crm_marketing_costs.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * It does not invent numbers. The first version of this route ended with:
 *
 *     async function fetchGoogleAds() {
 *       if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) return null;
 *       return { cost: 145.50, clicks: 32, impressions: 1200 };
 *     }
 *
 * — the same three figures every day, written into the database as real spend.
 * Dormant only because the token was unset; the day anyone added it, the table
 * would have filled with fiction that is indistinguishable from measurement a
 * month later. A missing row is a visible gap someone fixes. A plausible row is
 * a decision made on a number nobody computed.
 *
 * So each fetcher returns null until it genuinely talks to its API, and the
 * response says which networks are still unconnected rather than reporting
 * success for all of them.
 *
 * Runs with the service-role client on purpose: a cron has no user session, and
 * crm_marketing_costs is readable by the office and writable by nobody through
 * the API.
 */

interface DailySpend {
  cost: number;
  clicks: number;
  impressions: number;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  /* Yesterday, not today. Ad networks keep restating the current day for hours
     after midnight, so syncing "today" stores a number that is still moving. */
  const day = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const synced: string[] = [];
  const notConnected: string[] = [];
  const failed: { source: string; error: string }[] = [];

  for (const [source, fetcher] of [
    ['google', fetchGoogleAds],
    ['bing', fetchBingAds],
  ] as const) {
    try {
      const spend = await fetcher(day);
      if (!spend) {
        notConnected.push(source);
        continue;
      }
      const { error } = await supabase
        .from('crm_marketing_costs')
        .upsert(
          { date: day, source, spend: spend.cost, clicks: spend.clicks, impressions: spend.impressions },
          { onConflict: 'date,source' },
        );
      if (error) throw new Error(error.message);
      synced.push(source);
    } catch (err) {
      failed.push({ source, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({
    date: day,
    synced,
    /* Named, not silently skipped: "bing is not connected" is the thing
       somebody needs to read to go and connect it. */
    notConnected,
    failed,
  });
}

/**
 * Google Ads.
 *
 * Needs a developer token, an OAuth client and a refresh token for an account
 * with access, then a GAQL query against customers/{id}/googleAds:searchStream
 * for metrics.cost_micros, metrics.clicks and metrics.impressions on the day.
 *
 * Returns null until all of that exists. Not a placeholder figure — null.
 */
async function fetchGoogleAds(_day: string): Promise<DailySpend | null> {
  const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const refresh = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  if (!token || !refresh || !customerId) return null;

  throw new Error(
    'Google Ads credentials are set but the API client is not implemented yet — ' +
      'refusing to report a number rather than reporting a made-up one.',
  );
}

/**
 * Microsoft Advertising (Bing). Same contract: null until it is real.
 */
async function fetchBingAds(_day: string): Promise<DailySpend | null> {
  const token = process.env.BING_ADS_DEVELOPER_TOKEN;
  const refresh = process.env.BING_ADS_REFRESH_TOKEN;
  if (!token || !refresh) return null;

  throw new Error(
    'Bing Ads credentials are set but the API client is not implemented yet — ' +
      'refusing to report a number rather than reporting a made-up one.',
  );
}
