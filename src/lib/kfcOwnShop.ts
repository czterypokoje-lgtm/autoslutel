import { createHash } from 'node:crypto';

/*
 * Autosleutel24's own webshop into the same order ledger.
 *
 * KeyForCars pulls its orders out of three WooCommerce shops (kfcWoo.ts).
 * Autosleutel24's shop is our own Next.js app writing straight into
 * `public.orders` in this same database, so there is nothing to fetch: the
 * import is a read of that table mapped onto kfc_shop_orders /
 * kfc_shop_order_lines, exactly the columns kfcWoo.upsertOrder writes.
 *
 * The ledger speaks WooCommerce's status vocabulary and the allocator, the
 * pick list and kfc_ship_order all key on `status = 'processing'`. So the
 * shop's own words are translated once, here:
 *
 *   pending                 → on-hold    (not imported at all; unpaid)
 *   paid, processing        → processing  · fulfilment open    → pick list
 *   shipped, delivered      → completed   · fulfilment external (handled outside the CRM)
 *   cancelled               → cancelled   · fulfilment cancelled
 *   refunded                → refunded    · fulfilment cancelled
 *
 * Every other consumer (dashboard, reports, order list, staff filters) then
 * needs no second vocabulary.
 *
 * No static import of the Supabase client: the pure mapper below is imported
 * by scripts/check-own-shop-import.mts under plain node, which cannot resolve
 * the '@/' alias. The two database functions import it when they run.
 */

export const OWN_SHOP = 'autosleutel24.nl';

/** 21% on everything in this shop (see the webshop's checkout: total_ex_vat = total_inc / 1.21). */
const VAT = 1.21;

/** Statuses worth having in the ledger. 'pending' is an unpaid order: not ours yet. */
export const OWN_IMPORT_STATUSES = ['paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;

const LEDGER_STATUS: Record<string, string> = {
  pending: 'on-hold',
  paid: 'processing',
  processing: 'processing',
  shipped: 'completed',
  delivered: 'completed',
  cancelled: 'cancelled',
  refunded: 'refunded',
};

type Money = number | string | null | undefined;

/** One `public.orders` row, as PostgREST hands it over (numeric may arrive as a string). */
export interface OwnOrderRow {
  id: string;
  order_number: string;
  status: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  street?: string | null;
  postcode?: string | null;
  city?: string | null;
  country?: string | null;
  items?: unknown;
  shipping_cost?: Money;
  total_inc?: Money;
  total_ex_vat?: Money;
  total_vat?: Money;
  currency?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

/** An `items` entry as the checkout writes it; older orders wrote `name`/`price`. */
interface OwnItem {
  slug?: string; sku?: string; supplierCode?: string | null;
  title?: string; name?: string;
  quantity?: number | string;
  unitPrice?: Money; price?: Money; surcharge?: Money; lineTotal?: Money;
}

export interface MappedOwnLine {
  woo_line_id: number;
  sku: string;
  name: string;
  quantity: number;
  unit_incl_cents: number | null;
  total_excl_cents: number;
}

export interface MappedOwnOrder {
  /** Ready for kfc_shop_orders, minus the fulfilment an existing row may already own. */
  order: {
    shop: string; woo_order_id: number; number: string; status: string;
    created_at: string; modified_at: string; paid_at: string | null;
    currency: string; country: string | null; customer_email_hash: string | null;
    total_incl_cents: number; total_excl_cents: number; shipping_incl_cents: number; tax_cents: number;
    fulfilment: string;
    ship_name: string | null; ship_company: null; ship_street: string | null;
    ship_postcode: string | null; ship_city: string | null; ship_phone: string | null; ship_email: string | null;
  };
  lines: MappedOwnLine[];
}

const cents = (value: Money) => Math.round(Number(value ?? 0) * 100);
const text = (value: string | null | undefined) => value?.trim() || null;

/**
 * The ledger keys orders on a bigint; our order numbers are text
 * ('AS24-2026-00042'). Six bytes of SHA-1 over the order number is stable per
 * order, fits a JavaScript safe integer, and will not collide in this lifetime.
 */
/**
 * The ledger article code for a shop product: 'AS24-1-' + the first 32 bits of
 * sha1(slug), the same derivation scripts/build-as24-stock.mjs uses for the
 * article master, so an order line finds its article without a lookup table.
 */
export const ownArticleCode = (slug: string) =>
  `AS24-1-${parseInt(createHash('sha1').update(slug).digest('hex').slice(0, 8), 16)}`;

export const ownOrderKey = (orderNumber: string) =>
  createHash('sha1').update(orderNumber).digest().readUIntBE(0, 6);

/**
 * Pure: one `orders` row to the ledger row and its lines. No database, no
 * clock — scripts/check-own-shop-import.mts runs it on synthetic rows.
 *
 * `fulfilment` is what a first import gets; upsertOwnOrder keeps the CRM's own
 * word when the order is already in the ledger.
 */
export function mapOwnOrder(row: OwnOrderRow): MappedOwnOrder {
  const status = LEDGER_STATUS[row.status] ?? 'cancelled';
  const closed = status === 'cancelled' || status === 'refunded';
  const email = row.email?.trim().toLowerCase() || '';
  const items = (Array.isArray(row.items) ? row.items : []) as OwnItem[];

  const lines = items.map((item, index) => {
    const quantity = Math.max(0, Math.round(Number(item.quantity ?? 1)) || 0);
    // The checkout stores lineTotal = unitPrice × quantity + surcharge, VAT included.
    const lineIncl = item.lineTotal != null
      ? cents(item.lineTotal)
      : cents(item.unitPrice ?? item.price) * quantity + cents(item.surcharge);
    return {
      woo_line_id: index + 1,
      // The article master's SKU is the supplier code; the checkout's `sku` is the catalogue product id.
      sku: (item.supplierCode || item.sku || item.slug || '').trim(),
      name: (item.title || item.name || 'Onbekend artikel').slice(0, 200),
      quantity,
      unit_incl_cents: quantity ? Math.round(lineIncl / quantity) : null,
      total_excl_cents: Math.round(lineIncl / VAT),
    };
  });

  return {
    order: {
      shop: OWN_SHOP,
      woo_order_id: ownOrderKey(row.order_number),
      number: row.order_number,
      status,
      created_at: row.created_at,
      modified_at: row.updated_at || row.created_at,
      paid_at: row.paid_at ?? null,
      currency: row.currency || 'EUR',
      country: text(row.country) ?? 'NL',
      customer_email_hash: email ? createHash('sha256').update(email).digest('hex') : null,
      total_incl_cents: cents(row.total_inc),
      total_excl_cents: cents(row.total_ex_vat),
      shipping_incl_cents: cents(row.shipping_cost),
      tax_cents: cents(row.total_vat),
      fulfilment: status === 'completed' ? 'external' : closed ? 'cancelled' : 'open',
      ship_name: text(row.name),
      ship_company: null,
      ship_street: text(row.street),
      ship_postcode: text(row.postcode),
      ship_city: text(row.city),
      ship_phone: text(row.phone),
      ship_email: email || null,
    },
    lines,
  };
}

const ORDER_FIELDS = 'id, order_number, status, email, name, phone, street, postcode, city, country, items, shipping_cost, total_inc, total_ex_vat, total_vat, currency, paid_at, created_at, updated_at';

const adminDb = async () => (await import('@/lib/supabase/admin')).createSupabaseAdminClient();

/**
 * Store or refresh one own-shop order. Idempotent on (shop, number) through
 * the derived key; an older `updated_at` than the ledger already has is left
 * alone. Returns 'inserted' | 'updated' | 'unchanged'.
 */
export async function upsertOwnOrder(row: OwnOrderRow): Promise<'inserted' | 'updated' | 'unchanged'> {
  const db = await adminDb();
  const { order, lines } = mapOwnOrder(row);
  const existing = await db.from('kfc_shop_orders')
    .select('id, modified_at, fulfilment').eq('shop', OWN_SHOP).eq('woo_order_id', order.woo_order_id).maybeSingle();
  if (existing.data && existing.data.modified_at >= order.modified_at) return 'unchanged';

  // The CRM's own word wins, except that a cancelled or refunded order stops being pickable.
  const fulfilment = existing.data
    ? ((order.fulfilment === 'cancelled' && ['open', 'picked'].includes(existing.data.fulfilment)) ? 'cancelled' : existing.data.fulfilment)
    : order.fulfilment;

  const saved = await db.from('kfc_shop_orders')
    .upsert({ ...order, fulfilment, raw: row, imported_at: new Date().toISOString() }, { onConflict: 'shop,woo_order_id' })
    .select('id').single();
  if (saved.error) throw new Error(`Bestelling ${row.order_number}: ${saved.error.message}`);

  if (lines.length) {
    // The article code is derived from the product slug exactly as scripts/build-as24-stock.mjs
    // derives it, so a line finds its article without a lookup table; the SKU match is the fallback.
    const items = (Array.isArray(row.items) ? row.items : []) as OwnItem[];
    const hints = lines.map((_, index) => (items[index]?.slug ? ownArticleCode(items[index].slug!) : null));
    const codes = [...new Set(hints.filter((code): code is string => !!code))];
    const known = codes.length ? await db.from('kfc_articles').select('code').in('code', codes) : { data: [] as { code: string }[] };
    const knownCodes = new Set((known.data ?? []).map((a) => a.code));
    const skus = [...new Set(lines.map((line) => line.sku.toUpperCase()).filter(Boolean))];
    const articles = skus.length
      ? await db.from('kfc_articles').select('code, sku').in('sku', skus)
      : { data: [] as { code: string; sku: string }[] };
    const bySku = new Map((articles.data ?? []).map((a) => [a.sku.toUpperCase(), a.code]));
    const result = await db.from('kfc_shop_order_lines').upsert(
      lines.map((line, index) => ({
        ...line,
        order_id: saved.data.id,
        article_code: (hints[index] && knownCodes.has(hints[index]!)) ? hints[index] : bySku.get(line.sku.toUpperCase()) ?? null,
      })),
      { onConflict: 'order_id,woo_line_id' },
    );
    if (result.error) throw new Error(`Regels ${row.order_number}: ${result.error.message}`);
  }
  return existing.data ? 'updated' : 'inserted';
}

/**
 * Every paid-or-later order since `since` (ISO, default: everything), oldest
 * first, plus a retry of the shipped statuses we failed to write back. Logged
 * in kfc_import_runs so the screen can show when it last ran.
 */
export async function importOwnOrders({ since, kind = 'backfill' }: { since?: string; kind?: 'backfill' | 'reconcile' } = {}) {
  const db = await adminDb();
  const run = await db.from('kfc_import_runs').insert({ shop: OWN_SHOP, kind }).select('id').single();
  let fetched = 0, inserted = 0, updated = 0, pushed = 0;
  let error: string | null = null;
  const page = 200;
  try {
    for (let from = 0; from < 100_000; from += page) {
      let query = db.from('orders').select(ORDER_FIELDS)
        .in('status', [...OWN_IMPORT_STATUSES])
        .order('created_at', { ascending: true }).range(from, from + page - 1);
      if (since) query = query.gte('created_at', since);
      const { data, error: read } = await query;
      if (read) throw new Error(`Webshopbestellingen lezen mislukt: ${read.message}`);
      const rows = (data ?? []) as unknown as OwnOrderRow[];
      fetched += rows.length;
      for (const row of rows) {
        const result = await upsertOwnOrder(row);
        if (result === 'inserted') inserted++; else if (result === 'updated') updated++;
      }
      if (rows.length < page) break;
    }
    pushed = await retryOwnWriteback();
  } catch (cause) {
    error = (cause as Error).message;
  }
  if (run.data) await db.from('kfc_import_runs').update({ finished_at: new Date().toISOString(), orders: fetched, error }).eq('id', run.data.id);
  if (error && !fetched) throw new Error(error);
  return { shop: OWN_SHOP, fetched, inserted, updated, pushed, error };
}

/**
 * Catch-up when the order screen opens: copy the last week's webshop orders
 * into the ledger, so a new paid order shows right away instead of after the
 * nightly reconcile (which only runs on production with CRON_SECRET, never on
 * a preview). At most once a minute across all viewers; never throws, the
 * screen still shows what the ledger has.
 */
export async function syncOwnOrdersOnView(minIntervalMs = 60_000): Promise<void> {
  try {
    const db = await adminDb();
    const { data } = await db.from('kfc_import_runs').select('started_at')
      .eq('shop', OWN_SHOP).order('started_at', { ascending: false }).limit(1).maybeSingle();
    const last = data?.started_at ? Date.parse(data.started_at as string) : 0;
    if (Date.now() - last < minIntervalMs) return;
    const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
    await importOwnOrders({ since, kind: 'reconcile' });
  } catch (cause) {
    console.error('[orders] own webshop catch-up failed:', (cause as Error).message);
  }
}

/**
 * Tell the webshop an order left the building: the one write back into
 * `public.orders`. Guarded on the statuses a shipment may follow, so a
 * cancelled or refunded order is never resurrected as 'shipped'.
 */
export async function pushOwnShipped(orderNumber: string): Promise<void> {
  const db = await adminDb();
  const { error } = await db.from('orders')
    .update({ status: 'shipped' }).eq('order_number', orderNumber).in('status', ['paid', 'processing']);
  if (error) throw new Error(`Webshop bijwerken mislukt: ${error.message}`);
  await db.from('kfc_shop_orders')
    .update({ shop_completed_at: new Date().toISOString() }).eq('shop', OWN_SHOP).eq('number', orderNumber);
}

/** Shipped in the CRM but never written back (the shop was unreachable). Bounded; the rest waits for the next run. */
async function retryOwnWriteback(): Promise<number> {
  const db = await adminDb();
  const pending = await db.from('kfc_shop_orders').select('number')
    .eq('shop', OWN_SHOP).eq('fulfilment', 'shipped').is('shop_completed_at', null).limit(50);
  let pushed = 0;
  for (const row of pending.data ?? []) {
    try { await pushOwnShipped(row.number); pushed++; } catch { /* next run tries again */ }
  }
  return pushed;
}
