import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram } from '@/lib/telegram';
import { addMessage, formThread } from '@/lib/inbox/store';
import { OWN_SHOP } from '@/lib/kfcOwnShop';
import type { OrderRow } from '@/lib/shopAgent';

/*
 * The database half of the webshop agent (/api/agent/shop/*). The decisions
 * live in shopAgent.ts; this file reads the order and tells the office.
 */

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const ORDER_COLUMNS =
  'order_number, status, email, postcode, items, created_at, paid_at, shipped_at, delivered_at, refunded_at, carrier, tracking_code, return_requested_at, needs_technician';

/**
 * The order by number, with the track & trace the CRM made.
 *
 * A label printed in the CRM (kfcShipping.createLabel) stores carrier and
 * tracking code on the ledger row (kfc_shop_orders), not on public.orders, so
 * the shop's own row can be shipped without a code. The ledger fills the gap;
 * a code typed on the order itself wins.
 */
export async function findOrder(candidates: string[]): Promise<OrderRow | null> {
  if (!candidates.length) return null;
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from('orders').select(ORDER_COLUMNS).in('order_number', candidates).limit(1).maybeSingle();
  if (error) throw new Error(`orders: ${error.message}`);
  if (!data) return null;
  const order = data as OrderRow;

  if (!order.tracking_code) {
    const ledger = await db.from('kfc_shop_orders').select('carrier, tracking_code, shipped_at')
      .eq('shop', OWN_SHOP).eq('number', order.order_number).maybeSingle();
    /* The ledger is optional here: a database without it still answers from public.orders. */
    if (!ledger.error && ledger.data?.tracking_code) {
      order.carrier = ledger.data.carrier ?? order.carrier;
      order.tracking_code = ledger.data.tracking_code;
      order.shipped_at = order.shipped_at ?? ledger.data.shipped_at ?? null;
    }
  }
  return order;
}

/**
 * Write the return request on the order, once. The conditional update is the
 * idempotency: a retried tool call finds return_requested_at set and changes
 * nothing.
 */
export async function markReturnRequested(orderNumber: string, reason: string): Promise<boolean> {
  const { data, error } = await createSupabaseAdminClient().from('orders')
    .update({ return_requested_at: new Date().toISOString(), return_reason: reason.slice(0, 500) })
    .eq('order_number', orderNumber).is('return_requested_at', null)
    .select('order_number');
  if (error) throw new Error(`orders return: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

/**
 * Tell the office: a thread in Gesprekken (so it can be answered by e-mail
 * from the same screen) and a Telegram message. Returns whether anyone was
 * actually reached, so the agent only promises what happened.
 */
export async function tellOffice(input: {
  label: string;
  subject: string;
  lines: (string | null | undefined)[];
  name: string | null;
  email: string | null;
  phone: string | null;
  meta: Record<string, unknown>;
}): Promise<{ reached: boolean; thread: string | null }> {
  const body = input.lines.filter((l): l is string => typeof l === 'string' && l.trim() !== '').join('\n');
  let thread: string | null = null;
  try {
    const created = await formThread({ leadId: null, phone: input.phone, email: input.email, name: input.name, subject: input.subject });
    await addMessage(created, { direction: 'in', author: 'customer', body, meta: { source: 'webshop_agent', ...input.meta } });
    thread = created.id;
  } catch (error) {
    console.error('[shop agent] inbox thread failed:', error instanceof Error ? error.message : error);
  }

  const { data: recipients } = await createSupabaseAdminClient().from('admin_telegram').select('telegram_chat_id');
  const contact = [input.name, input.email, input.phone].filter(Boolean).join(' · ');
  const message = [input.label, contact ? `Klant: ${contact}` : null, '', body, thread ? '\nStaat in Gesprekken.' : null]
    .filter((l) => l !== null).join('\n');
  let notified = 0;
  for (const r of recipients ?? []) {
    await sendTelegram(r.telegram_chat_id, message);
    notified += 1;
  }
  return { reached: notified > 0 || thread !== null, thread };
}
