import { NextResponse } from 'next/server';
import { reviewsCsv } from '@/lib/adReviews';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function confirmed(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: reviews, error } = await supabase
    .from('whatsapp_ad_reviews')
    .select('id, ref, work_date, value')
    .eq('decision', 'gedaan')
    .is('exported_at', null);
  if (error) throw new Error(error.message);

  const refs = (reviews ?? []).map((r) => r.ref);
  const { data: clicks, error: clickError } = await supabase
    .from('call_clicks')
    .select('ref, gclid')
    .in('ref', refs.length ? refs : ['----']);
  if (clickError) throw new Error(clickError.message);

  const gclid = new Map((clicks ?? []).map((c) => [c.ref, c.gclid as string | null]));
  return (reviews ?? []).map((r) => ({ ...r, gclid: gclid.get(r.ref) ?? null }));
}

/** The upload file for Google Ads. Downloading changes nothing. */
export async function GET() {
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;

  try {
    const rows = await confirmed(await createSupabaseServerClient());
    return new NextResponse(reviewsCsv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="whatsapp-conversions.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('ad review export failed:', error);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }
}

/** Marks what was in the file as uploaded, so nothing is reported twice. */
export async function POST() {
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;

  try {
    const supabase = await createSupabaseServerClient();
    const ids = (await confirmed(supabase)).filter((r) => r.gclid && r.work_date).map((r) => r.id);
    const { error } = await supabase
      .from('whatsapp_ad_reviews')
      .update({ exported_at: new Date().toISOString() })
      .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    if (error) throw new Error(error.message);
    return NextResponse.json({ marked: ids.length });
  } catch (error) {
    console.error('ad review mark failed:', error);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }
}
