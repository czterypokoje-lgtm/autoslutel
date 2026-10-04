import { NextResponse, after } from 'next/server';
import { requireOfficeUserApi, getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = new Set(['aangevraagd', 'besteld', 'geleverd', 'afgewezen']);

/**
 * The office moving a request along.
 *
 * `geleverd` does the one thing that makes this worth having over a WhatsApp
 * message: it writes the part into that technician's van, at the price the
 * office actually paid. Without that step the part arrives, the van is
 * stocked, and nothing in the system knows — which is exactly the gap that
 * left cost_materials empty on 98% of jobs.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;
  const user = await getCrmUser();

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });

  let body: { status?: unknown; status_note?: unknown; unit_cost?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const status = typeof body.status === 'string' ? body.status : '';
  if (!STATUSES.has(status)) {
    return NextResponse.json({ error: 'Onbekende status' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data: order, error } = await supabase
    .from('part_orders')
    .update({
      status,
      status_note: typeof body.status_note === 'string' ? body.status_note.slice(0, 300) : null,
      handled_by: user?.id ?? null,
      handled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, technician_id, description, article_code, quantity, unit_cost, product_slug, stock_item_id')
    .maybeSingle();

  if (error || !order) {
    console.error('Part order update failed:', error?.message);
    return NextResponse.json({ error: 'Bijwerken mislukt' }, { status: 500 });
  }

  if (status === 'geleverd' && !order.stock_item_id) {
    /*
     * Into the van, on the same description the technician already sees in
     * Mijn bus — stock_items is unique on (technician, description), so a
     * second delivery of the same part adds to the row instead of opening a
     * duplicate the office then has to merge.
     */
    const { data: existing } = await supabase
      .from('stock_items')
      .select('id, quantity')
      .eq('technician_id', order.technician_id)
      .eq('description', order.description)
      .maybeSingle();

    const unitCost =
      typeof body.unit_cost === 'number' ? body.unit_cost : (order.unit_cost ?? null);

    const { data: stock } = existing
      ? await supabase
          .from('stock_items')
          .update({
            quantity: Number(existing.quantity) + Number(order.quantity),
            /* A null now must not wipe a price we already knew. */
            ...(unitCost !== null ? { unit_cost: unitCost } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select('id')
          .maybeSingle()
      : await supabase
          .from('stock_items')
          .insert({
            technician_id: order.technician_id,
            description: order.description,
            product_slug: order.product_slug,
            quantity: order.quantity,
            min_quantity: 0,
            unit_cost: unitCost,
          })
          .select('id')
          .maybeSingle();

    if (stock) {
      await supabase.from('part_orders').update({ stock_item_id: stock.id }).eq('id', order.id);
    }
  }

  after(async () => {
    const admin = createSupabaseAdminClient();
    const { data: tech } = await admin
      .from('technicians')
      .select('telegram_chat_id')
      .eq('id', order.technician_id)
      .maybeSingle();

    const said: Record<string, string> = {
      besteld: `📦 ${order.quantity}× ${order.description} is besteld.`,
      geleverd: `✅ ${order.quantity}× ${order.description} is binnen en staat in uw bus.`,
      afgewezen: `🚫 ${order.quantity}× ${order.description} wordt niet besteld.${
        typeof body.status_note === 'string' && body.status_note ? ` ${body.status_note}` : ''
      }`,
    };
    if (said[status]) await sendTelegram(tech?.telegram_chat_id, said[status]);
  });

  return NextResponse.json({ ok: true });
}
