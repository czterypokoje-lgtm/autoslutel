import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { LABEL_BATCH_MAX } from '@/lib/kfcLabels';
import { StockError, fetchAll } from '@/lib/kfcInventory';
import { OWN_SHOP, pushOwnShipped } from '@/lib/kfcOwnShop';
import type { CrmUser } from '@/lib/crmSession';

/*
 * Shop orders for the screens: the list, the detail, the pick list, and the
 * two actions the warehouse takes (pick, ship). Reads kfc_shop_orders.
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

/** The paging helper now lives next to StockError in kfcInventory; re-exported for the modules that import it from here. */
export { fetchAll };

const ORDER_COLUMNS = 'id, shop, woo_order_id, number, status, fulfilment, created_at, paid_at, shipped_at, shop_completed_at, country, total_incl_cents, total_excl_cents, shipping_incl_cents, ship_name, ship_company, ship_street, ship_postcode, ship_city, ship_phone, ship_email, carrier, tracking_code, label_url, label_created_at';
const LINE_COLUMNS = 'id, sku, article_code, name, quantity, reserved, picked, state, unit_incl_cents';

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
export async function pickList(): Promise<ShopOrder[]> {
  const { data, error } = await db().from('kfc_shop_orders').select(`${ORDER_COLUMNS}, kfc_shop_order_lines (${LINE_COLUMNS})`)
    .eq('status', 'processing').in('fulfilment', ['open', 'picked']).order('created_at').limit(500);
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
    // 0138: the database refuses an order with a line that is not fully reserved and picked.
    if (error.message.includes('KFC_NOT_PICKED')) throw new StockError(SHIP_NOT_PICKED, 409);
    if (error.message.includes('KFC_CENTRAL_STOCK_REQUIRED')) throw new StockError('Onvoldoende voorraad in het centrale magazijn.', 409);
    if (error.message.includes('KFC_NOT_PAID')) throw new StockError('Deze bestelling is niet betaald (status is niet processing).', 409);
    if (error.message.includes('KFC_STOCK_RESERVED_FOR_JOB')) throw new StockError('Voorraad is gereserveerd voor een klus.', 409);
    if (error.message.includes('KFC_NO_ORDER')) throw new StockError('Bestelling niet gevonden.', 404);
    throw new StockError(`Verzenden mislukt: ${error.message}`, 500);
  }
  // The stock side is committed; from here on only the shop's status is at stake.
  // Anything we cannot confirm is 'pending', so the nightly reconcile retries it.
  const order = await db().from('kfc_shop_orders').select('shop, number').eq('id', id).single();
  if (order.error || !order.data) {
    console.error(`shipOrder ${id}: order not readable for the shop write-back`, order.error);
    return { writeback: 'pending' };
  }
  try {
    // Our own webshop sits in this same database: the write-back is a status update on public.orders.
    if (order.data.shop === OWN_SHOP) await pushOwnShipped(order.data.number);
    return { writeback: 'done' };
  } catch (writeback) {
    console.error(`shipOrder ${id}: shop write-back for ${order.data.shop} #${order.data.number} failed`, writeback);
    return { writeback: 'pending' };
  }
}

/**
 * What the warehouse sees when the database refuses to ship (KFC_NOT_PICKED).
 * OrderParts.tsx (a client component, so it cannot import this server-only
 * module) keeps the same text to recognise it and refresh a stale screen.
 */
const SHIP_NOT_PICKED = 'Nog niet alles is gepickt. Pick eerst alle regels.';
