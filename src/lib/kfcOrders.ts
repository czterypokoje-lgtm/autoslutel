import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { LABEL_BATCH_MAX } from '@/lib/kfcLabels';
import { StockError } from '@/lib/kfcInventory';
import { pushCompleted, isWooShop } from '@/lib/kfcWoo';
import { OWN_SHOP, pushOwnShipped } from '@/lib/kfcOwnShop';
import type { CrmUser } from '@/lib/crmSession';
import { sampleOrders, type SampleOrder, type OrderStatus } from '@/lib/kfcSampleOrders';

/*
 * Shop orders for the screens: the list, the detail, the pick list, and the
 * two actions the warehouse takes (pick, ship). Reads kfc_shop_orders; the
 * dashboard gets them in the SampleOrder shape it already renders.
 */

export type LineState = 'open' | 'short' | 'reserved' | 'picked' | 'shipped' | 'cancelled';
export type Fulfilment = 'open' | 'picked' | 'shipped' | 'cancelled' | 'external';
export interface ShopLine { id: string; sku: string; article_code: string | null; name: string; quantity: number; reserved: number; picked: number; state: LineState; unit_incl_cents: number | null; shelf?: string | null; box?: string | null; available?: number; incoming?: number }
export interface ShopOrder {
  id: string; shop: string; woo_order_id: number; number: string; status: string; fulfilment: Fulfilment;
  created_at: string; paid_at: string | null; shipped_at: string | null; shop_completed_at: string | null; country: string | null;
  total_incl_cents: number; total_excl_cents: number; shipping_incl_cents: number; lines: ShopLine[];
  ship_name?: string | null; ship_company?: string | null; ship_street?: string | null; ship_postcode?: string | null; ship_city?: string | null; ship_phone?: string | null; ship_email?: string | null;
  carrier?: string | null; tracking_code?: string | null; label_url?: string | null; label_created_at?: string | null;
}

const db = () => createSupabaseAdminClient();

/** PostgREST returns at most 1,000 rows per call; page through for larger reads. */
export async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>, pageSize = 1000, max = 50000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw new StockError(`Lezen mislukt: ${error.message}`, 500);
    out.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return out;
}

const ORDER_COLUMNS = 'id, shop, woo_order_id, number, status, fulfilment, created_at, paid_at, shipped_at, shop_completed_at, country, total_incl_cents, total_excl_cents, shipping_incl_cents, ship_name, ship_company, ship_street, ship_postcode, ship_city, ship_phone, ship_email, carrier, tracking_code, label_url, label_created_at';
const LINE_COLUMNS = 'id, sku, article_code, name, quantity, reserved, picked, state, unit_incl_cents';

// Existence checks read one row instead of counting the table: an exact count
// over the jsonb filter scanned every order on each dashboard and orders view.
export async function shopOrdersExist(): Promise<boolean> {
  const { data } = await db().from('kfc_shop_orders').select('id').limit(1);
  return (data?.length ?? 0) > 0;
}

export async function sampleShopOrdersExist(): Promise<boolean> {
  const { data } = await db().from('kfc_shop_orders').select('id').contains('raw', { source: 'sample' }).limit(1);
  return (data?.length ?? 0) > 0;
}

export async function listShopOrders(filter: { shop?: string; status?: string; fulfilment?: Fulfilment; q?: string; page: number; limit: number }) {
  let query = db().from('kfc_shop_orders').select(`${ORDER_COLUMNS}, kfc_shop_order_lines (${LINE_COLUMNS})`, { count: 'exact' })
    .order('created_at', { ascending: false }).range((filter.page - 1) * filter.limit, filter.page * filter.limit - 1);
  if (filter.shop) query = query.eq('shop', filter.shop);
  if (filter.status) query = query.eq('status', filter.status);
  if (filter.fulfilment) query = query.eq('fulfilment', filter.fulfilment);
  if (filter.q) query = query.ilike('number', `%${filter.q.replace(/[%_]/g, '')}%`);
  const { data, error, count } = await query;
  if (error) throw new StockError(`Bestellingen lezen mislukt: ${error.message}`, 500);
  return { orders: (data ?? []).map(toOrder), total: count ?? 0 };
}

function toOrder(row: Record<string, unknown>): ShopOrder {
  const lines = ((row.kfc_shop_order_lines as ShopLine[] | null) ?? []).sort((a, b) => a.name.localeCompare(b.name));
  const { kfc_shop_order_lines: _lines, ...rest } = row as Record<string, unknown> & { kfc_shop_order_lines?: unknown };
  void _lines;
  return { ...(rest as Omit<ShopOrder, 'lines'>), lines };
}

/** Detail with, per line, the best shelf to pick from and the article's availability. */
export async function getShopOrder(id: string): Promise<ShopOrder | null> {
  // A stale or mistyped link is "not found", not a database error.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const { data, error } = await db().from('kfc_shop_orders').select(`${ORDER_COLUMNS}, kfc_shop_order_lines (${LINE_COLUMNS})`).eq('id', id).maybeSingle();
  if (error) throw new StockError(`Bestelling lezen mislukt: ${error.message}`, 500);
  if (!data) return null;
  const order = toOrder(data);
  await decorate(order.lines);
  return order;
}

export { LABEL_BATCH_MAX };

export async function shopReturnHistory(lines: ShopLine[]) {
  const ids = lines.filter((line) => line.state === 'shipped').map((line) => line.id);
  const quantities = new Map<string, number>();
  const moves = ids.length ? await fetchAll<{ id: number; order_line_id: string; delta: number; reason: 'sale' | 'return'; created_at: string }>((from, to) =>
    db().from('kfc_stock_moves').select('id, order_line_id, delta, reason, created_at').in('order_line_id', ids)
      .in('reason', ['sale', 'return']).order('created_at', { ascending: false }).order('id').range(from, to)) : [];
  for (const move of moves) {
    quantities.set(move.order_line_id, (quantities.get(move.order_line_id) ?? 0) - move.delta);
  }
  return { quantities, returns: moves.filter((move) => move.reason === 'return') };
}

/** Several orders at once, for the bulk label sheet. Keeps the order of `ids`. */
export async function getShopOrdersByIds(ids: string[]): Promise<ShopOrder[]> {
  if (!ids.length) return [];
  if (ids.length > LABEL_BATCH_MAX) throw new StockError(`Maximaal ${LABEL_BATCH_MAX} bestellingen per keer.`, 400);
  const { data, error } = await db().from('kfc_shop_orders').select(`${ORDER_COLUMNS}, kfc_shop_order_lines (${LINE_COLUMNS})`).in('id', ids);
  if (error) throw new StockError(`Bestellingen lezen mislukt: ${error.message}`, 500);
  const byId = new Map((data ?? []).map((row) => [String((row as { id: string }).id), toOrder(row)]));
  const orders = ids.map((id) => byId.get(id)).filter((o): o is ShopOrder => !!o);
  await decorate(orders.flatMap((o) => o.lines));
  return orders;
}

async function decorate(lines: ShopLine[]) {
  const codes = [...new Set(lines.map((l) => l.article_code).filter((c): c is string => !!c))];
  if (!codes.length) return;
  const [levels, positions] = await Promise.all([
    db().from('kfc_stock_levels').select('article_code, quantity, kfc_locations!inner (shelf, box, kind)').in('article_code', codes).is('kfc_locations.technician_id', null).order('quantity', { ascending: false }),
    db().from('kfc_webshop_position').select('article_code, available, incoming').in('article_code', codes),
  ]);
  const shelfOf = new Map<string, { shelf: string; box: string }>();
  for (const row of levels.data ?? []) {
    const loc = row.kfc_locations as unknown as { shelf: string; box: string; kind: string } | null;
    if (loc?.kind === 'shelf' && !shelfOf.has(row.article_code)) shelfOf.set(row.article_code, loc);
  }
  const pos = new Map((positions.data ?? []).map((p) => [p.article_code, p]));
  for (const line of lines) {
    if (!line.article_code) continue;
    line.shelf = shelfOf.get(line.article_code)?.shelf ?? null;
    line.box = shelfOf.get(line.article_code)?.box ?? null;
    line.available = pos.get(line.article_code)?.available ?? 0;
    line.incoming = pos.get(line.article_code)?.incoming ?? 0;
  }
}

/** Paid, not yet shipped, oldest first: what the warehouse works through. */
export async function pickList(sampleOnly = false): Promise<ShopOrder[]> {
  const query = db().from('kfc_shop_orders').select(`${ORDER_COLUMNS}, kfc_shop_order_lines (${LINE_COLUMNS})`)
    .eq('status', 'processing').in('fulfilment', ['open', 'picked']).order('created_at').limit(500);
  const { data, error } = await (sampleOnly ? query.eq('raw->>source', 'sample') : query);
  if (error) throw new StockError(`Picklijst lezen mislukt: ${error.message}`, 500);
  const orders = (data ?? []).map(toOrder);
  await decorate(orders.flatMap((o) => o.lines));
  return orders;
}

/** Pick: one RPC that locks the order and writes line plus fulfilment in one transaction. Returns the order id, for the re-read. */
export async function markPicked(lineId: string, picked: boolean): Promise<string> {
  const { data, error } = await db().rpc('kfc_pick_line', { p_line: lineId, p_picked: picked });
  if (error) {
    if (error.message.includes('KFC_NO_LINE')) throw new StockError('Regel niet gevonden.', 404);
    if (error.message.includes('KFC_LINE_STATE')) throw new StockError('Deze regel kan niet gepickt worden.', 409);
    // 42883 is Postgres, PGRST202 is PostgREST not knowing the function yet.
    if (error.code === '42883' || error.code === 'PGRST202') throw new StockError('Picken werkt nog niet. Voer supabase/migrations/0099_kfc_pick_rpc.sql uit.', 500);
    throw new StockError(`Picken opslaan mislukt: ${error.message}`, 500);
  }
  return data as string;
}

/** Ship: one RPC for the stock side, then best-effort write-back to the shop. */
export async function shipOrder(id: string, key: string, user: CrmUser): Promise<{ writeback: 'done' | 'pending' }> {
  const { error } = await db().rpc('kfc_ship_order', { p_order: id, p_key: key, p_created_by: user.id });
  if (error) {
    if (error.message.includes('KFC_CENTRAL_STOCK_REQUIRED')) throw new StockError('Onvoldoende voorraad in het centrale magazijn.', 409);
    if (error.message.includes('KFC_NOT_PAID')) throw new StockError('Deze bestelling is niet betaald (status is niet processing).', 409);
    if (error.message.includes('KFC_STOCK_RESERVED_FOR_JOB')) throw new StockError('Voorraad is gereserveerd voor een klus.', 409);
    if (error.message.includes('KFC_NO_ORDER')) throw new StockError('Bestelling niet gevonden.', 404);
    throw new StockError(`Verzenden mislukt: ${error.message}`, 500);
  }
  const order = await db().from('kfc_shop_orders').select('shop, woo_order_id, number').eq('id', id).single();
  try {
    // Our own webshop sits in this same database: the write-back is a status update on public.orders.
    if (order.data?.shop === OWN_SHOP) await pushOwnShipped(order.data.number);
    else if (order.data && isWooShop(order.data.shop)) await pushCompleted(order.data.shop, order.data.woo_order_id);
    return { writeback: 'done' };
  } catch {
    return { writeback: 'pending' }; // the nightly reconcile retries
  }
}

/** The dashboard's shape: the last `days` days of orders, as SampleOrder. */
/**
 * Orders for the dashboard: only the columns it reads, and only the window it
 * needs (the period, the period before it, and 90 days for "not sold"). The
 * first page also returns the total, so the remaining pages load in parallel
 * instead of one round trip after another.
 */
export async function ordersForDashboard(days = 120): Promise<SampleOrder[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const columns = 'number, shop, created_at, status, country, total_incl_cents, total_excl_cents, shipping_incl_cents, kfc_shop_order_lines (sku, name, quantity, unit_incl_cents)';
  const page = 1000;
  const query = (from: number, count = false) => db().from('kfc_shop_orders').select(columns, count ? { count: 'exact' } : undefined)
    .gte('created_at', since).order('created_at', { ascending: false }).order('id').range(from, from + page - 1);
  const first = await query(0, true);
  if (first.error) throw new StockError(`Lezen mislukt: ${first.error.message}`, 500);
  const total = Math.min(first.count ?? 0, 50000);
  const rest = await Promise.all(Array.from({ length: Math.max(0, Math.ceil(total / page) - 1) }, (_, i) => query((i + 1) * page)));
  const failed = rest.find((result) => result.error);
  if (failed?.error) throw new StockError(`Lezen mislukt: ${failed.error.message}`, 500);
  type Row = { number: string; shop: string; created_at: string; status: string; country: string | null; total_incl_cents: number; total_excl_cents: number; shipping_incl_cents: number; kfc_shop_order_lines: { sku: string; name: string; quantity: number; unit_incl_cents: number | null }[] | null };
  const rows = [first, ...rest].flatMap((result) => (result.data ?? []) as unknown as Row[]);
  return rows.map((order) => ({
    number: order.number, shop: order.shop as SampleOrder['shop'], created: order.created_at,
    status: (['processing', 'completed', 'on-hold', 'cancelled', 'refunded'].includes(order.status) ? order.status : 'cancelled') as OrderStatus,
    country: order.country ?? '', shippingIncl: order.shipping_incl_cents, totalIncl: order.total_incl_cents, totalExcl: order.total_excl_cents,
    lines: (order.kfc_shop_order_lines ?? []).sort((a, b) => a.name.localeCompare(b.name))
      .map((line) => ({ sku: line.sku, name: line.name, image: '', quantity: line.quantity, unitIncl: line.unit_incl_cents ?? 0 })),
  }));
}

/**
 * Demo mode before the shops are connected: the generated sample orders go
 * into the real tables (woo_order_id 900000000+, raw.source = 'sample') and
 * the 40 best-selling articles get 12 units on shelf A-01 / B1, so
 * reservations, the pick list, shipping, dashboard and reports all run on
 * real rows. clearSampleData removes every order, move and level again.
 */
export async function loadSampleData(user: CrmUser): Promise<{ orders: number; lines: number; stocked: number }> {
  const all = sampleOrders();
  const skus = [...new Set(all.flatMap((o) => o.lines.map((l) => l.sku.toUpperCase())))];
  const articles = new Map<string, string>();
  for (let i = 0; i < skus.length; i += 500) {
    const { data } = await db().from('kfc_articles').select('code, sku').in('sku', skus.slice(i, i + 500));
    for (const a of data ?? []) articles.set(a.sku.toUpperCase(), a.code);
  }
  const shopIndex: Record<string, number> = { 'keyforcars.nl': 1, 'klapsleutels.nl': 2, 'remkeys.com': 3 };
  const rows = all.map((o) => ({
    shop: o.shop, woo_order_id: 900000000 + shopIndex[o.shop] * 1000000 + Number(o.number), number: o.number, status: o.status,
    created_at: o.created, modified_at: o.created, paid_at: o.status === 'processing' || o.status === 'completed' ? o.created : null,
    country: o.country, total_incl_cents: o.totalIncl, total_excl_cents: o.totalExcl, shipping_incl_cents: o.shippingIncl, tax_cents: o.totalIncl - o.totalExcl,
    fulfilment: o.status === 'completed' ? 'external' : o.status === 'processing' ? 'open' : 'cancelled', raw: { source: 'sample' },
    ...sampleAddress(o.number, o.country),
  }));
  let orders = 0, lines = 0;
  for (let i = 0; i < rows.length; i += 300) {
    const { data, error } = await db().from('kfc_shop_orders').upsert(rows.slice(i, i + 300), { onConflict: 'shop,woo_order_id' }).select('id, shop, number');
    if (error) throw new StockError(`Voorbeeldbestellingen laden mislukt: ${error.message}`, 500);
    const idOf = new Map((data ?? []).map((r) => [`${r.shop}/${r.number}`, r.id]));
    const lineRows = all.slice(i, i + 300).flatMap((o) => o.lines.map((l, index) => ({
      order_id: idOf.get(`${o.shop}/${o.number}`), woo_line_id: index + 1, sku: l.sku, article_code: articles.get(l.sku.toUpperCase()) ?? null, name: l.name.slice(0, 200),
      quantity: l.quantity, unit_incl_cents: l.unitIncl, total_excl_cents: Math.round((l.unitIncl * l.quantity) / 1.21),
    }))).filter((l) => l.order_id);
    for (let j = 0; j < lineRows.length; j += 150) {
      const result = await db().from('kfc_shop_order_lines').upsert(lineRows.slice(j, j + 150), { onConflict: 'order_id,woo_line_id' });
      if (result.error) throw new StockError(`Voorbeeldregels laden mislukt: ${result.error.message}`, 500);
      lines += Math.min(150, lineRows.length - j);
    }
    orders += data?.length ?? 0;
  }
  // Shelf stock for the 40 best sellers, so the allocator has something to reserve.
  const sold = new Map<string, number>();
  for (const o of all) for (const l of o.lines) { const code = articles.get(l.sku.toUpperCase()); if (code) sold.set(code, (sold.get(code) ?? 0) + l.quantity); }
  const top = [...sold.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([code]) => code);
  const loc = await db().from('kfc_locations').upsert({ warehouse: 'main', shelf: 'A-01', box: 'B1' }, { onConflict: 'warehouse,shelf,box' }).select('id').single();
  if (loc.error) throw new StockError(`Locatie aanmaken mislukt: ${loc.error.message}`, 500);
  let stocked = 0;
  for (const code of top) {
    const { error } = await db().rpc('kfc_count_bin', { p_article: code, p_location: loc.data.id, p_counted: 12, p_minimum: 3, p_key: `sample-count-${code}`, p_created_by: user.id, p_note: 'Voorbeeldvoorraad' });
    if (!error) stocked++;
  }
  return { orders, lines, stocked };
}

/** Wipes orders, reservations, moves and levels. Only for the demo period, before the shops are connected. */
export async function clearSampleData(): Promise<void> {
  for (const [table, col] of [['kfc_shop_order_refunds', 'id'], ['kfc_shop_order_lines', 'id'], ['kfc_shop_orders', 'id'], ['kfc_reservations', 'id'], ['kfc_stock_moves', 'id'], ['kfc_stock_levels', 'article_code'], ['kfc_import_runs', 'id']] as const) {
    const { error } = await db().from(table).delete().not(col, 'is', null);
    if (error) throw new StockError(`Wissen mislukt (${table}): ${error.message}`, 500);
  }
}

/** Clearly fictional recipients for the demo period, deterministic per order number. */
function sampleAddress(number: string, country: string) {
  const n = Number(number) || 0;
  const names = ['J. de Vries', 'M. Jansen', 'S. Bakker', 'L. Visser', 'K. Smit', 'A. Meijer', 'P. de Boer', 'R. Mulder', 'T. Bos', 'E. Vos'];
  const streets = ['Dorpsstraat', 'Kerkweg', 'Stationsplein', 'Industrieweg', 'Molenlaan', 'Hoofdstraat', 'Beukenlaan', 'Havenkade'];
  const cities: Record<string, string[]> = { NL: ['Utrecht', 'Eindhoven', 'Zwolle', 'Breda', 'Almere'], BE: ['Antwerpen', 'Gent', 'Leuven'], DE: ['Köln', 'Essen', 'Münster'], FR: ['Lille', 'Lyon'], AT: ['Graz', 'Linz'], PL: ['Poznań', 'Wrocław'] };
  const city = (cities[country] ?? ['Utrecht'])[n % (cities[country] ?? ['Utrecht']).length];
  return {
    ship_name: names[n % names.length], ship_company: n % 4 === 0 ? 'Autobedrijf Voorbeeld' : null,
    ship_street: `${streets[n % streets.length]} ${(n % 180) + 1}`, ship_postcode: country === 'NL' ? `${1000 + (n % 8999)} ${String.fromCharCode(65 + (n % 26))}${String.fromCharCode(65 + ((n >> 3) % 26))}` : String(10000 + (n % 89999)),
    ship_city: city, ship_phone: `+31 6 ${String(10000000 + (n % 89999999))}`, ship_email: `voorbeeld${n % 97}@example.invalid`,
  };
}
