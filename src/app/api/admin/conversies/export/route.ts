import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildConfirmedFeed, type FeedRow } from '@/lib/conversionMatcher';

export const dynamic = 'force-dynamic';

/**
 * Dry run: exactly the file Google's daily fetch of /api/ads/conversions.csv
 * would receive right now, for the office to look at. Downloading it marks
 * nothing and sends nothing.
 */
export async function GET() {
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('ad_conversion_matches')
    .select('id, click_kind, click_id, clicked_at, conversion_at, value_excl_btw, decision')
    .eq('decision', 'bevestigd')
    .limit(5000);
  if (error) {
    console.error('conversion dry run failed:', error.message);
    return NextResponse.json({ error: 'Lezen mislukt (migratie 0109 uitgevoerd?)' }, { status: 500 });
  }

  const { csv } = buildConfirmedFeed((data ?? []) as FeedRow[], new Date());
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="google-ads-conversies-proef.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
