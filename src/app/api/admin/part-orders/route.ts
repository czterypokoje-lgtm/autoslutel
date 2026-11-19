import { NextResponse, after } from 'next/server';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram } from '@/lib/telegram';
import { block, euro } from '@/lib/telegramText';

export const dynamic = 'force-dynamic';

function number(value: unknown, fallback: number | null): number | null | 'invalid' {
  if (value === null || value === undefined || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 99_999) return 'invalid';
  return Math.round(n * 100) / 100;
}

/**
 * A monteur asking for a part.
 *
 * The technician is read from their session, never from the body: the RLS
 * policy says the same thing, but a route that accepts a technician_id from
 * the caller is one refactor away from letting somebody order on a
 * colleague's budget.
 */
export async function POST(request: Request) {
  const user = await requireCrmUser();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const description =
    typeof body.description === 'string' ? body.description.trim().slice(0, 300) : '';
  if (!description) {
    return NextResponse.json({ error: 'Omschrijving ontbreekt' }, { status: 400 });
  }

  const quantity = number(body.quantity, 1);
  const unitCost = number(body.unit_cost, null);
  if (quantity === 'invalid' || unitCost === 'invalid' || !quantity) {
    return NextResponse.json({ error: 'Ongeldig aantal' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data: me } = await supabase
    .from('technicians')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!me) {
    return NextResponse.json(
      { error: 'Uw login is niet aan een monteur gekoppeld.' },
      { status: 403 }
    );
  }

  const { data: order, error } = await supabase
    .from('part_orders')
    .insert({
      technician_id: me.id,
      product_slug: typeof body.product_slug === 'string' ? body.product_slug.slice(0, 200) : null,
      description,
      article_code: typeof body.article_code === 'string' ? body.article_code.slice(0, 60) : null,
      unit_cost: unitCost,
      quantity,
      note: typeof body.note === 'string' ? body.note.slice(0, 500) : null,
    })
    .select('id, description, article_code, quantity, unit_cost')
    .single();

  if (error || !order) {
    console.error('Part order insert failed:', error?.message);
    return NextResponse.json(
      {
        error: /does not exist|relation/i.test(error?.message ?? '')
          ? 'Voer supabase/migrations/0071_technician_part_orders.sql uit.'
          : 'Aanvragen mislukt',
      },
      { status: 500 }
    );
  }

  /* The office hears it where they already read everything else. After the
     row exists, and best-effort: a part was asked for whether or not Telegram
     was reachable. */
  after(async () => {
    const admin = createSupabaseAdminClient();
    const { data: recipients } = await admin.from('admin_telegram').select('telegram_chat_id');
    for (const recipient of recipients ?? []) {
      await sendTelegram(
        recipient.telegram_chat_id,
        block(
          `📦 ${me.name} vraagt een onderdeel`,
          [
            ['Artikel', `${order.quantity}× ${order.description}`],
            ['Artikelnr', order.article_code],
            ['Inkoop', order.unit_cost ? euro(order.unit_cost) : null],
          ],
          'Afhandelen doet u bij Voorraad in de CRM.'
        )
      );
    }
  });

  return NextResponse.json({ ok: true, order }, { status: 201 });
}
