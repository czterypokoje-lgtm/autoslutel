import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { findArticlesByScan, StockError } from '@/lib/kfcInventory';
import type { CrmUser } from '@/lib/crmSession';

/*
 * "Retour ontvangen" for webshop orders (migration 0132).
 *
 * A refund from the shop is money (kfc_shop_order_refunds, imported with the
 * order); a return is goods. This module puts the two side by side per order
 * line — shipped, refunded, received back — and books a received return once
 * per idempotency key through kfc_receive_return: new/opened to a location,
 * defect into quarantine and written off. The stock move queues the article for
 * the shop stock push like any other move.
 */

export type ReturnCondition = 'new' | 'opened' | 'defect';
export const CONDITIONS: Record<ReturnCondition, string> = { new: 'Nieuw (verkoopbaar)', opened: 'Geopend', defect: 'Defect (afschrijven)' };

export interface ReturnLineStatus {
  id: string; woo_line_id: number; sku: string; name: string; article_code: string | null;
  shipped: number; refunded: number; returned: number; written_off: number;
  /** received back still possible */ open: number;
  state: 'none' | 'expected' | 'partial' | 'done' | 'unrefunded';
}
export interface RefundSummary { id: string; woo_refund_id: number; amount_cents: number; created_at: string | null; reason: string | null; lines: Record<string, number> /* order line id → qty */ }
export interface ReturnReceipt { id: string; order_line_id: string; quantity: number; condition: ReturnCondition | null; location: string | null; refund_id: string | null; created_at: string; note: string | null }
export interface ReturnPanel { lines: ReturnLineStatus[]; refunds: RefundSummary[]; receipts: ReturnReceipt[]; unassigned_refunds: number }

const db = () => createSupabaseAdminClient();

/** Woo refund line items point at the order line through meta `_refunded_item_id`. */
function refundedQuantities(raw: unknown): Map<number, number> {
  const out = new Map<number, number>();
  const items = (raw as { line_items?: { quantity?: number; meta_data?: { key: string; value: unknown }[] }[] } | null)?.line_items ?? [];
  for (const item of items) {
    const ref = Number(item.meta_data?.find((meta) => meta.key === '_refunded_item_id')?.value);
    const quantity = Math.abs(Number(item.quantity) || 0);
    if (Number.isFinite(ref) && ref > 0 && quantity) out.set(ref, (out.get(ref) ?? 0) + quantity);
  }
  return out;
}

const RPC_MESSAGES: Record<string, [string, number]> = {
  KFC_NOT_SHIPPED: ['Deze regel is nog niet verzonden.', 409],
  KFC_RETURN_EXCEEDS: ['Het aantal is hoger dan het aantal dat nog retour kan.', 409],
  KFC_NO_ORDER_LINE: ['Bestelregel niet gevonden.', 404],
  KFC_LINE_UNMAPPED: ['Deze regel is niet aan een artikel gekoppeld.', 409],
  KFC_BAD_REFUND: ['Die terugbetaling hoort niet bij deze bestelling.', 400],
  KFC_BAD_CONDITION: ['Kies de staat van het artikel.', 400],
  KFC_BAD_QUANTITY: ['Het aantal moet minstens 1 zijn.', 400],
  KFC_LOCATION_REQUIRED: ['Kies een geldige locatie.', 400],
};

/** Per order line: shipped · refunded · received back; plus refunds and receipts. */
export async function returnPanel(orderId: string): Promise<ReturnPanel> {
  const client = db();
  const [lines, refunds, receipts] = await Promise.all([
    client.from('kfc_shop_order_lines').select('id, woo_line_id, sku, name, article_code').eq('order_id', orderId).order('woo_line_id'),
    client.from('kfc_shop_order_refunds').select('id, woo_refund_id, amount_cents, created_at, raw').eq('order_id', orderId).order('created_at'),
    client.from('kfc_shop_returns').select('id, order_line_id, quantity, condition, refund_id, created_at, note, writeoff_move_id, kfc_locations (shelf, box)').eq('order_id', orderId).order('created_at', { ascending: false }),
  ]);
  if (lines.error || refunds.error || receipts.error) throw new StockError('Retourgegevens lezen mislukt.', 500);
  const ids = (lines.data ?? []).map((line) => line.id);
  const moves = ids.length
    ? await client.from('kfc_stock_moves').select('id, order_line_id, delta, reason, created_at, note').in('order_line_id', ids).in('reason', ['sale', 'return'])
    : { data: [] as { id: number; order_line_id: string; delta: number; reason: string; created_at: string; note: string | null }[], error: null };
  if (moves.error) throw new StockError('Voorraadbewegingen lezen mislukt.', 500);

  const byWooLine = new Map((lines.data ?? []).map((line) => [Number(line.woo_line_id), line.id as string]));
  const refundRows: RefundSummary[] = (refunds.data ?? []).map((refund) => {
    const quantities: Record<string, number> = {};
    for (const [wooLine, quantity] of refundedQuantities(refund.raw)) {
      const line = byWooLine.get(wooLine);
      if (line) quantities[line] = (quantities[line] ?? 0) + quantity;
    }
    const reason = (refund.raw as { reason?: string } | null)?.reason?.trim() || null;
    return { id: refund.id, woo_refund_id: Number(refund.woo_refund_id), amount_cents: refund.amount_cents, created_at: refund.created_at, reason, lines: quantities };
  });

  const writtenOff = new Map<string, number>();
  const receiptRows: ReturnReceipt[] = (receipts.data ?? []).map((row) => {
    if (row.writeoff_move_id) writtenOff.set(row.order_line_id, (writtenOff.get(row.order_line_id) ?? 0) + row.quantity);
    const location = row.kfc_locations as unknown as { shelf: string; box: string } | null;
    return { id: row.id, order_line_id: row.order_line_id, quantity: row.quantity, condition: row.condition as ReturnCondition, location: location ? `${location.shelf} / ${location.box}` : null, refund_id: row.refund_id, created_at: row.created_at, note: row.note };
  });
  // Returns booked through kfc_return_line (0113) have a move but no receipt row. Moves
  // booked by kfc_receive_return always carry a "Retour (…)" note, so the rest are those.
  for (const move of moves.data ?? []) {
    if (move.reason !== 'return' || move.note?.startsWith('Retour (')) continue;
    receiptRows.push({ id: `move-${move.id}`, order_line_id: move.order_line_id, quantity: move.delta, condition: null, location: null, refund_id: null, created_at: move.created_at, note: null });
  }
  receiptRows.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const statuses: ReturnLineStatus[] = (lines.data ?? []).map((line) => {
    const own = (moves.data ?? []).filter((move) => move.order_line_id === line.id);
    const shipped = -own.filter((m) => m.reason === 'sale').reduce((sum, m) => sum + m.delta, 0);
    const returned = own.filter((m) => m.reason === 'return').reduce((sum, m) => sum + m.delta, 0);
    const refunded = refundRows.reduce((sum, refund) => sum + (refund.lines[line.id] ?? 0), 0);
    const state: ReturnLineStatus['state'] = refunded === 0
      ? (returned > 0 ? 'unrefunded' : 'none')
      : returned === 0 ? 'expected' : returned < refunded ? 'partial' : returned > refunded ? 'unrefunded' : 'done';
    return {
      id: line.id, woo_line_id: Number(line.woo_line_id), sku: line.sku, name: line.name, article_code: line.article_code,
      shipped, refunded, returned, written_off: writtenOff.get(line.id) ?? 0, open: Math.max(0, shipped - returned), state,
    };
  });
  const unassigned = refundRows.filter((refund) => !Object.keys(refund.lines).length).length;
  return { lines: statuses, refunds: refundRows, receipts: receiptRows, unassigned_refunds: unassigned };
}

/** The lines of this order a scanned code belongs to (code, SKU, EAN or supplier ref). */
export async function scanReturnLine(orderId: string, scan: string): Promise<string[]> {
  const articles = await findArticlesByScan(scan);
  const codes = new Set(articles.map((article) => article.id));
  const key = scan.trim().toUpperCase();
  const { data, error } = await db().from('kfc_shop_order_lines').select('id, sku, article_code').eq('order_id', orderId);
  if (error) throw new StockError('Bestelregels lezen mislukt.', 500);
  return (data ?? []).filter((line) => (line.article_code && codes.has(line.article_code)) || (line.sku && line.sku.toUpperCase() === key)).map((line) => line.id);
}

export interface ReceiveInput { line: string; quantity: number; condition: ReturnCondition; location: string | null; key: string; refund: string | null; scan: string | null; note: string | null }

export async function receiveReturn(input: ReceiveInput, user: CrmUser): Promise<{ id: string; condition: ReturnCondition }> {
  if (input.scan) {
    const { data: line } = await db().from('kfc_shop_order_lines').select('order_id').eq('id', input.line).maybeSingle();
    if (!line) throw new StockError('Bestelregel niet gevonden.', 404);
    if (!(await scanReturnLine(line.order_id, input.scan)).includes(input.line)) {
      throw new StockError('Het gescande artikel hoort niet bij deze regel.', 409);
    }
  }
  const { data, error } = await db().rpc('kfc_receive_return', {
    p_line: input.line, p_quantity: input.quantity, p_condition: input.condition,
    p_location: input.condition === 'defect' ? null : input.location, p_key: ['shop-return', input.line, input.key].join('-'),
    p_created_by: user.id, p_refund: input.refund, p_scan: input.scan, p_note: input.note,
  });
  if (error) {
    for (const [code, [message, status]] of Object.entries(RPC_MESSAGES)) if (error.message.includes(code)) throw new StockError(message, status);
    throw new StockError(`Retour boeken mislukt: ${error.message}`, 500);
  }
  return { id: (data as { id: string }).id, condition: input.condition };
}

/** Locations a return can go to: main-warehouse shelves, plus quarantine for goods that may not be sold. */
export async function receiveLocations() {
  const { data, error } = await db().from('kfc_locations').select('id, shelf, box, kind').eq('warehouse', 'main').is('technician_id', null);
  if (error) throw new StockError('Locaties lezen mislukt.', 500);
  return (data ?? []).map((row) => ({ id: row.id as string, shelf: row.shelf as string, box: row.box as string, quarantine: row.kind === 'quarantine' }))
    .sort((a, b) => Number(a.quarantine) - Number(b.quarantine) || a.shelf.localeCompare(b.shelf) || a.box.localeCompare(b.box));
}

export interface OpenReturn { order_id: string; shop: string; number: string; refunded_at: string | null; amount_cents: number; lines: { sku: string; name: string; refunded: number; returned: number }[]; amount_only: boolean }

/**
 * Refunds of the last `days` whose goods have not (all) come back, newest first.
 * A refund without line items (amount only) is listed so someone looks at it.
 */
export async function openReturns(days = 120): Promise<OpenReturn[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data: refunds, error } = await db().from('kfc_shop_order_refunds').select('order_id, amount_cents, created_at, raw').gte('created_at', since).order('created_at', { ascending: false }).limit(500);
  if (error) throw new StockError('Terugbetalingen lezen mislukt.', 500);
  const orderIds = [...new Set((refunds ?? []).map((r) => r.order_id as string))];
  if (!orderIds.length) return [];
  const out: OpenReturn[] = [];
  for (let i = 0; i < orderIds.length; i += 100) {
    const chunk = orderIds.slice(i, i + 100);
    const [orders, lines] = await Promise.all([
      db().from('kfc_shop_orders').select('id, shop, number').in('id', chunk),
      db().from('kfc_shop_order_lines').select('id, order_id, woo_line_id, sku, name').in('order_id', chunk),
    ]);
    // A failed read must not show as "Niets openstaand".
    if (orders.error || lines.error) throw new StockError('Retouren lezen mislukt.', 500);
    const lineIds = (lines.data ?? []).map((line) => line.id);
    const moves = lineIds.length ? await db().from('kfc_stock_moves').select('order_line_id, delta').in('order_line_id', lineIds).eq('reason', 'return') : { data: [], error: null };
    if (moves.error) throw new StockError('Retourboekingen lezen mislukt.', 500);
    const returned = new Map<string, number>();
    for (const move of moves.data ?? []) returned.set(move.order_line_id, (returned.get(move.order_line_id) ?? 0) + move.delta);
    for (const order of orders.data ?? []) {
      const own = (refunds ?? []).filter((r) => r.order_id === order.id);
      const orderLines = (lines.data ?? []).filter((line) => line.order_id === order.id);
      const refunded = new Map<number, number>();
      for (const refund of own) for (const [wooLine, qty] of refundedQuantities(refund.raw)) refunded.set(wooLine, (refunded.get(wooLine) ?? 0) + qty);
      const rows = orderLines.filter((line) => refunded.has(Number(line.woo_line_id))).map((line) => ({
        sku: line.sku, name: line.name, refunded: refunded.get(Number(line.woo_line_id))!, returned: returned.get(line.id) ?? 0,
      }));
      const amountOnly = !rows.length;
      if (!amountOnly && rows.every((row) => row.returned >= row.refunded)) continue;
      out.push({
        order_id: order.id, shop: order.shop, number: order.number, refunded_at: own[0]?.created_at ?? null,
        amount_cents: own.reduce((sum, r) => sum + r.amount_cents, 0), lines: rows, amount_only: amountOnly,
      });
    }
  }
  return out.sort((a, b) => (b.refunded_at ?? '').localeCompare(a.refunded_at ?? ''));
}

export interface RecentReturn { id: string; order_id: string; shop: string; number: string; sku: string; name: string; quantity: number; condition: ReturnCondition; created_at: string }

export async function recentReturns(limit = 30): Promise<RecentReturn[]> {
  const { data, error } = await db().from('kfc_shop_returns')
    .select('id, order_id, quantity, condition, created_at, kfc_shop_orders (shop, number), kfc_shop_order_lines (sku, name)')
    .order('created_at', { ascending: false }).limit(limit);
  if (error) throw new StockError('Retouren lezen mislukt.', 500);
  return (data ?? []).map((row) => {
    const order = row.kfc_shop_orders as unknown as { shop: string; number: string } | null;
    const line = row.kfc_shop_order_lines as unknown as { sku: string; name: string } | null;
    return { id: row.id, order_id: row.order_id, shop: order?.shop ?? '', number: order?.number ?? '', sku: line?.sku ?? '', name: line?.name ?? '', quantity: row.quantity, condition: row.condition as ReturnCondition, created_at: row.created_at };
  });
}
