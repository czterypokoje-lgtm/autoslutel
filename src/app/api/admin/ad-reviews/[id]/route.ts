import { NextResponse } from 'next/server';
import { readDecision } from '@/lib/adReviews';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** A person's verdict on one chat. A row already sent to Google stays as it is. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const result = readDecision(body ?? {});
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('whatsapp_ad_reviews')
    .update({
      decision: result.decision,
      value: result.value,
      work_date: result.workDate,
      decided_at: new Date().toISOString(),
      decided_by: auth.user.id,
    })
    .eq('id', id)
    .is('exported_at', null)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('ad review update failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Al geüpload of niet gevonden' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
