import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegram } from '@/lib/telegram';
import { esc } from '@/lib/telegramText';
import { rateLimit, rateLimitConfigured } from '@/lib/rateLimit';
import { addMessage, formThread } from '@/lib/inbox/store';
import { OWN_SHOP } from '@/lib/kfcOwnShop';
import type { OrderRow } from '@/lib/shopAgent';

/*
 * The database half of the webshop agent (/api/agent/shop/*). The decisions
 * live in shopAgent.ts; this file reads the order, keeps the limits and tells
 * the office.
 *
 * The chat widget is public: anyone can talk to the agent and talk it into
 * calling a tool. Everything below assumes the arguments are hostile.
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

/** ElevenLabs' conversation id, sent by the console as {{system__conversation_id}}; never typed by the model. */
export function conversationId(body: Record<string, unknown>): string | null {
  const v = body.conversation_id;
  return typeof v === 'string' && /^[A-Za-z0-9_-]{6,80}$/.test(v) ? v : null;
}

/**
 * Every bucket must have room, or the call is refused.
 *
 * In production a missing or failing limiter refuses too: the site-wide rateLimit fails
 * open so a forms outage never costs a lead, but here failing open means an
 * anonymous script can read orders or fill the office's Telegram unchecked.
 * ElevenLabs calls from its own servers, so a per-IP bucket would put every
 * customer in one: the buckets are per order number, per conversation and
 * global.
 */
export async function withinLimits(buckets: [key: string, limit: number, windowSeconds: number][]): Promise<boolean> {
  if (!rateLimitConfigured && process.env.VERCEL_ENV === 'production') return false;
  const production = process.env.VERCEL_ENV === 'production';
  for (const [key, limit, windowSeconds] of buckets) {
    const result = await rateLimit(`shop-agent:${key}`, limit, windowSeconds);
    /* rateLimit lets a request through when Upstash errors (degraded); here that is a no in production. */
    if (!result.ok || (result.degraded && production)) return false;
  }
  return true;
}

const ORDER_COLUMNS =
  'order_number, status, email, postcode, items, created_at, paid_at, shipped_at, delivered_at, refunded_at, carrier, tracking_code, return_requested_at, needs_technician';

/**
 * The order by number, corrected by the CRM ledger.
 *
 * A label printed in the CRM (kfcShipping.createLabel) puts carrier and
 * tracking code on the ledger row (kfc_shop_orders), and "Verzonden" there
 * reaches public.orders only when the write-back succeeds (kfcOwnShop
 * pushOwnShipped, retried nightly). Without this the agent would say "nog niet
 * verzonden, wilt u annuleren?" about a parcel that is on its way.
 */
export async function findOrder(candidates: string[]): Promise<OrderRow | null> {
  if (!candidates.length) return null;
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from('orders').select(ORDER_COLUMNS).in('order_number', candidates).limit(1).maybeSingle();
  if (error) throw new Error(`orders: ${error.message}`);
  if (!data) return null;
  const order = data as OrderRow;

  const ledger = await db.from('kfc_shop_orders').select('carrier, tracking_code, shipped_at, fulfilment')
    .eq('shop', OWN_SHOP).eq('number', order.order_number).maybeSingle();
  /* The ledger is optional here: a database without it still answers from public.orders. */
  if (!ledger.error && ledger.data) {
    const l = ledger.data as { carrier: string | null; tracking_code: string | null; shipped_at: string | null; fulfilment: string | null };
    if (!order.tracking_code && l.tracking_code) {
      order.carrier = l.carrier ?? order.carrier;
      order.tracking_code = l.tracking_code;
    }
    if (l.fulfilment === 'shipped' && (order.status === 'paid' || order.status === 'processing')) order.status = 'shipped';
    order.shipped_at = order.shipped_at ?? l.shipped_at ?? null;
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
 * Tell the office: a thread in Gesprekken (answerable by e-mail from the same
 * screen) and a Telegram message. Returns whether anyone was actually reached.
 *
 * The text is the agent's summary of what an anonymous visitor said, so it is
 * stored as the agent's, the thread gets ai_mode 'off' (no AI draft written
 * from text a stranger controls), and every value is escaped for Telegram's
 * HTML parser, which otherwise drops the whole message on a stray '<'.
 */
export async function tellOffice(input: {
  label: string;
  subject: string;
  lines: (string | null | undefined)[];
  name: string | null;
  email: string | null;
  phone: string | null;
  conversation: string | null;
  meta: Record<string, unknown>;
}): Promise<{ reached: boolean; thread: string | null }> {
  const lines = input.lines.filter((l): l is string => typeof l === 'string' && l.trim() !== '');
  if (input.conversation) lines.push(`ElevenLabs-gesprek: ${input.conversation}`);
  const db = createSupabaseAdminClient();

  let thread: string | null = null;
  try {
    const created = await formThread({ leadId: null, phone: input.phone, email: input.email, name: input.name, subject: input.subject });
    await db.from('inbox_threads').update({ ai_mode: 'off' }).eq('id', created.id);
    await addMessage(created, {
      direction: 'in',
      author: 'webshop_agent',
      body: lines.join('\n'),
      meta: { source: 'webshop_agent', conversation_id: input.conversation, ...input.meta },
    });
    thread = created.id;
  } catch (error) {
    console.error('[shop agent] inbox thread failed:', error instanceof Error ? error.message : error);
  }

  /*
   * Telegram has no processing agreement and keeps messages indefinitely, so
   * it gets the label and the subject only; the customer's details and words
   * stay in Gesprekken. Only when the thread could not be written does the
   * message carry the content, because then it is the only record.
   */
  const { data: recipients } = await db.from('admin_telegram').select('telegram_chat_id');
  const contact = [input.name, input.email, input.phone].filter(Boolean).join(' · ');
  const message = (thread
    ? [esc(input.label), esc(input.subject), 'Staat in Gesprekken.']
    : [esc(input.label), contact ? `Klant: ${esc(contact)}` : null, '', ...lines.map(esc), '\nNIET in Gesprekken opgeslagen.']
  ).filter((l) => l !== null).join('\n');

  let delivered = 0;
  for (const r of recipients ?? []) {
    if (await sendTelegram(r.telegram_chat_id, message)) delivered += 1;
  }
  return { reached: delivered > 0 || thread !== null, thread };
}
