import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/*
 * WooCommerce for the three KeyForCars shops: read orders in, write one
 * status back.
 *
 * Credentials come from the environment, one pair per shop:
 *   WOO_<SHOP>_KEY, WOO_<SHOP>_SECRET          REST API key (read/write)
 *   WOO_<SHOP>_WEBHOOK_SECRET                  the webhook's secret
 * with <SHOP> = KEYFORCARS, KLAPSLEUTELS, REMKEYS. The owner creates them in
 * WooCommerce (Settings → Advanced → REST API) and pastes them into Vercel.
 *
 * Import rules (docs/kfc-crm-plan.md §5.2): unique on (shop, order id), an
 * upsert wins only when the shop's modified date is newer, lines keep the
 * shop's sku and map to an article by sku, refunds are stored separately. The
 * shop's `status` is copied as is; the CRM's `fulfilment` is never imported.
 */

export const WOO_SHOPS = {
  'keyforcars.nl': 'KEYFORCARS',
  'klapsleutels.nl': 'KLAPSLEUTELS',
  'remkeys.com': 'REMKEYS',
} as const;
export type WooShop = keyof typeof WOO_SHOPS;
export const isWooShop = (value: string): value is WooShop => value in WOO_SHOPS;

export function wooCredentials(shop: WooShop) {
  const tag = WOO_SHOPS[shop];
  return {
    key: process.env[`WOO_${tag}_KEY`] ?? '',
    secret: process.env[`WOO_${tag}_SECRET`] ?? '',
    webhook: process.env[`WOO_${tag}_WEBHOOK_SECRET`] ?? '',
  };
}
export const wooConfigured = (shop: WooShop) => { const c = wooCredentials(shop); return !!(c.key && c.secret); };

interface WooLine { id: number; sku: string; name: string; quantity: number; total: string; total_tax: string; price: number | string }
export interface WooOrder {
  id: number; number: string; status: string; currency: string;
  date_created_gmt: string; date_modified_gmt: string; date_paid_gmt: string | null;
  total: string; total_tax: string; shipping_total: string; shipping_tax: string;
  billing?: { email?: string; country?: string; phone?: string; first_name?: string; last_name?: string; company?: string; address_1?: string; address_2?: string; postcode?: string; city?: string };
  shipping?: { country?: string; first_name?: string; last_name?: string; company?: string; address_1?: string; address_2?: string; postcode?: string; city?: string; phone?: string };
  line_items: WooLine[];
  refunds?: { id: number; total: string }[];
}

const cents = (value: string | number | null | undefined) => Math.round(Number(value ?? 0) * 100);
const gmt = (value: string | null | undefined) => (value ? `${value}Z` : null);

async function wooFetch(shop: WooShop, path: string, init: RequestInit = {}) {
  const { key, secret } = wooCredentials(shop);
  if (!key || !secret) throw new Error(`WooCommerce credentials for ${shop} are not configured.`);
  const response = await fetch(`https://${shop}/wp-json/wc/v3${path}`, {
    ...init,
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    cache: 'no-store',
    // A hung shop must not hold the import, the nightly reconcile or the "ship" write-back until the platform kills the function.
    signal: init.signal ?? AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${shop} ${path}: HTTP ${response.status}`);
  return response;
}

async function syncRefunds(shop: WooShop, order: WooOrder, orderId: string) {
  const db = createSupabaseAdminClient();
  for (const summary of order.refunds ?? []) {
    const { data: previous, error: readError } = await db.from('kfc_shop_order_refunds')
      .select('created_at').eq('order_id', orderId).eq('woo_refund_id', summary.id).maybeSingle();
    if (readError) throw readError;
    if (previous?.created_at) continue;
    const response = await wooFetch(shop, `/orders/${order.id}/refunds/${summary.id}`);
    const detail = await response.json();
    const { error } = await db.from('kfc_shop_order_refunds').upsert({
      order_id: orderId, woo_refund_id: summary.id, amount_cents: Math.abs(cents(summary.total)),
      created_at: gmt(detail.date_created_gmt), raw: detail,
    }, { onConflict: 'order_id,woo_refund_id' });
    if (error) throw error;
  }
}

/** Store or refresh one order. Returns 'inserted' | 'updated' | 'unchanged'. */
export async function upsertOrder(shop: WooShop, order: WooOrder): Promise<'inserted' | 'updated' | 'unchanged'> {
  const db = createSupabaseAdminClient();
  const modified = gmt(order.date_modified_gmt)!;
  const existing = await db.from('kfc_shop_orders').select('id, modified_at, fulfilment').eq('shop', shop).eq('woo_order_id', order.id).maybeSingle();
  if (existing.data && Date.parse(existing.data.modified_at) >= Date.parse(modified)) {
    await syncRefunds(shop, order, existing.data.id);
    return 'unchanged';
  }

  const closed = ['cancelled', 'refunded', 'failed', 'trash'].includes(order.status);
  const fulfilment = existing.data
    ? (closed && ['open', 'picked'].includes(existing.data.fulfilment) ? 'cancelled' : existing.data.fulfilment)
    : order.status === 'completed' ? 'external' : closed ? 'cancelled' : 'open';
  const email = order.billing?.email?.trim().toLowerCase();
  const row = {
    shop, woo_order_id: order.id, number: String(order.number), status: order.status,
    created_at: gmt(order.date_created_gmt), modified_at: modified, paid_at: gmt(order.date_paid_gmt),
    currency: order.currency || 'EUR', country: order.shipping?.country || order.billing?.country || null,
    customer_email_hash: email ? createHash('sha256').update(email).digest('hex') : null,
    total_incl_cents: cents(order.total), tax_cents: cents(order.total_tax),
    total_excl_cents: cents(order.total) - cents(order.total_tax),
    shipping_incl_cents: cents(order.shipping_total) + cents(order.shipping_tax),
    fulfilment, raw: order, imported_at: new Date().toISOString(),
    ...shipTo(order),
  };
  const saved = await db.from('kfc_shop_orders').upsert(row, { onConflict: 'shop,woo_order_id' }).select('id').single();
  if (saved.error) throw new Error(`Order ${shop}#${order.number}: ${saved.error.message}`);
  const orderId = saved.data.id;

  const skus = [...new Set(order.line_items.map((line) => (line.sku || '').trim().toUpperCase()).filter(Boolean))];
  const articles = skus.length ? await db.from('kfc_articles').select('code, sku').in('sku', skus) : { data: [] as { code: string; sku: string }[] };
  const bySku = new Map((articles.data ?? []).map((a) => [a.sku.toUpperCase(), a.code]));
  const lines = order.line_items.map((line) => ({
    order_id: orderId, woo_line_id: line.id, sku: (line.sku || '').trim(), name: line.name.slice(0, 200),
    article_code: bySku.get((line.sku || '').trim().toUpperCase()) ?? null,
    quantity: line.quantity, unit_incl_cents: line.quantity ? Math.round((cents(line.total) + cents(line.total_tax)) / line.quantity) : null,
    total_excl_cents: cents(line.total),
  }));
  if (lines.length) {
    const result = await db.from('kfc_shop_order_lines').upsert(lines, { onConflict: 'order_id,woo_line_id' });
    if (result.error) throw new Error(`Lines ${shop}#${order.number}: ${result.error.message}`);
  }
  await syncRefunds(shop, order, orderId);
  return existing.data ? 'updated' : 'inserted';
}

/** One page of up to 100 orders. `after` and `modifiedAfter` are ISO strings. */
export async function importPage(shop: WooShop, page: number, filter: { after?: string; modifiedAfter?: string } = {}) {
  const params = new URLSearchParams({ per_page: '100', page: String(page), orderby: 'date', order: 'desc' });
  if (filter.after) params.set('after', filter.after);
  if (filter.modifiedAfter) params.set('modified_after', filter.modifiedAfter);
  const response = await wooFetch(shop, `/orders?${params}`);
  const orders = (await response.json()) as WooOrder[];
  let inserted = 0, updated = 0;
  for (const order of orders) {
    const result = await upsertOrder(shop, order);
    if (result === 'inserted') inserted++; else if (result === 'updated') updated++;
  }
  const totalPages = Number(response.headers.get('x-wp-totalpages') ?? '1');
  return { fetched: orders.length, inserted, updated, hasMore: page < totalPages, totalPages };
}

/** Tell the shop an order left the building. The only write to WooCommerce. */
export async function pushCompleted(shop: WooShop, wooOrderId: number): Promise<void> {
  await wooFetch(shop, `/orders/${wooOrderId}`, { method: 'PUT', body: JSON.stringify({ status: 'completed' }) });
  await createSupabaseAdminClient().from('kfc_shop_orders')
    .update({ shop_completed_at: new Date().toISOString() }).eq('shop', shop).eq('woo_order_id', wooOrderId);
}

/** X-WC-Webhook-Signature = base64(HMAC-SHA256(raw body, secret)). */
export function verifyWebhook(shop: WooShop, rawBody: string, signature: string | null): boolean {
  const { webhook } = wooCredentials(shop);
  if (!webhook || !signature) return false;
  const expected = Buffer.from(createHmac('sha256', webhook).update(rawBody).digest('base64'));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Nightly: re-fetch 72 hours of changes per shop, push missing completions, log the run. */
export async function reconcile(shop: WooShop) {
  const db = createSupabaseAdminClient();
  const run = await db.from('kfc_import_runs').insert({ shop, kind: 'reconcile' }).select('id').single();
  let orders = 0; let error: string | null = null;
  try {
    const modifiedAfter = new Date(Date.now() - 72 * 3600_000).toISOString().replace(/\.\d{3}Z$/, '');
    for (let page = 1; page <= 20; page++) {
      const result = await importPage(shop, page, { modifiedAfter });
      orders += result.fetched;
      if (!result.hasMore) break;
    }
    const pending = await db.from('kfc_shop_orders').select('woo_order_id').eq('shop', shop).eq('fulfilment', 'shipped').is('shop_completed_at', null).limit(50);
    for (const row of pending.data ?? []) {
      try { await pushCompleted(shop, row.woo_order_id); } catch (cause) { error = (cause as Error).message; }
    }
  } catch (cause) {
    error = (cause as Error).message;
  }
  if (run.data) await db.from('kfc_import_runs').update({ finished_at: new Date().toISOString(), orders, error }).eq('id', run.data.id);
  return { shop, orders, error };
}

/** Recipient from the shipping block, billing as fallback. Needed for the label; listed in the processing agreement. */
function shipTo(order: WooOrder) {
  const a = order.shipping?.address_1 ? order.shipping : order.billing;
  const name = [a?.first_name, a?.last_name].filter(Boolean).join(' ').trim() || null;
  return {
    ship_name: name, ship_company: a?.company?.trim() || null, ship_street: [a?.address_1, a?.address_2].filter(Boolean).join(' ').trim() || null,
    ship_postcode: a?.postcode?.trim() || null, ship_city: a?.city?.trim() || null,
    ship_phone: (order.shipping?.phone || order.billing?.phone || '').trim() || null, ship_email: order.billing?.email?.trim().toLowerCase() || null,
  };
}
