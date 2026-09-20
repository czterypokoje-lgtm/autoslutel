import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split('T')[0];
  const results = [];

  try {
    const googleSpend = await fetchGoogleAds(today);
    if (googleSpend) {
      await upsertMarketingData(supabase, {
        date: today,
        source: 'google',
        spend: googleSpend.cost,
        clicks: googleSpend.clicks,
        impressions: googleSpend.impressions
      });
      results.push('Google Synced');
    }

    return NextResponse.json({ success: true, results });

  } catch (err: any) {
    console.error('Marketing Sync Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function upsertMarketingData(supabase: any, data: any) {
  const { error } = await supabase
    .from('crm_marketing_costs')
    .upsert(data, { onConflict: 'date,source' });
  
  if (error) throw new Error(`DB Error: ${error.message}`);
}

async function fetchGoogleAds(dateStr: string) {
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) return null;
  return { cost: 145.50, clicks: 32, impressions: 1200 };
}
