import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const REVIEWS = new Set(['nieuw', 'goedgekeurd', 'afgewezen']);

/**
 * The office's check of one row the AI extracted from WhatsApp. Only the
 * review mark changes; the extracted facts stay as the chat said them.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { review?: unknown } | null;
  const review = typeof body?.review === 'string' ? body.review : '';
  if (!REVIEWS.has(review)) return NextResponse.json({ error: 'Ongeldige keuze' }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('whatsapp_quotes')
    .update({
      review,
      reviewed_at: review === 'nieuw' ? null : new Date().toISOString(),
      reviewed_by: review === 'nieuw' ? null : auth.user.id,
    })
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('whatsapp quote review failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
