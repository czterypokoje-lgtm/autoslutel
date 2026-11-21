import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { fetchAll } from '@/lib/kfcOrders';

/* Reports on the new sources: margin from sale moves, stock value at cost, receivables aging, dead stock. */

export interface MarginRow { month: string; shop: string; revenue_cents: number; cost_cents: number; priced_revenue_cents: number; units: number; missing_cost_rows: number; refunds_cents: number; returned_cost_cents: number }

const monthFormat = new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', timeZone: 'Europe/Amsterdam' });
type Refund = { id: string; order_id: string; amount_cents: number; created_at: string | null; raw: unknown };

function refundSubtotal(refund: Refund): number | null {
  const raw = refund.raw as { line_items?: { total?: string; total_tax?: string }[] } | null;
  if (!Array.isArray(raw?.line_items) || !raw.line_items.length) return null;
  let subtotal = 0, tax = 0;
  for (const item of raw.line_items) {
    if (!item || ![item.total, item.total_tax].every((value) => typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value))) return null;
    subtotal += Math.round(Number(item.total) * 100);
    tax += Math.round(Number(item.total_tax) * 100);
  }
  return Math.abs(subtotal + tax) === refund.amount_cents ? Math.abs(subtotal) : null;
}

export async function reports() {
  const db = createSupabaseAdminClient();
  const since = new Date(Date.now() - 365 * 864e5).toISOString();
  type Sale = { delta: number; unit_cost_cents: number | null; created_at: string; order_line_id: string; reason: string };
  type Line = { id: string; order_id: string; sku: string; name: string; total_excl_cents: number | null };
  const [moves, lines, orders, levels, balances, articles, recent, refunds] = await Promise.all([
    fetchAll<Sale>((a, b) => db.from('kfc_stock_moves').select('delta, unit_cost_cents, created_at, order_line_id, reason').in('reason', ['sale', 'return']).not('order_line_id', 'is', null).gte('created_at', since).order('id').range(a, b)),
    fetchAll<Line>((a, b) => db.from('kfc_shop_order_lines').select('id, order_id, sku, name, total_excl_cents').order('id').range(a, b)),
    fetchAll<{ id: string; shop: string; number: string }>((a, b) => db.from('kfc_shop_orders').select('id, shop, number').order('id').range(a, b)),
    fetchAll<Record<string, unknown>>((a, b) => db.from('kfc_stock_levels').select('article_code, quantity, kfc_articles (purchase_price_cents, name, sku), kfc_locations (kind)').order('article_code').range(a, b)),
    db.from('kfc_customer_balance').select('open_cents, overdue_cents, not_due, d1_30, d31_60, d61_90, d90p'),
    db.from('kfc_articles').select('code', { count: 'exact', head: true }),
    fetchAll<{ article_code: string }>((a, b) => db.from('kfc_stock_moves').select('article_code').eq('reason', 'sale').gte('created_at', new Date(Date.now() - 90 * 864e5).toISOString()).order('id').range(a, b)),
    fetchAll<Refund>((a, b) => db.from('kfc_shop_order_refunds').select('id, order_id, amount_cents, created_at, raw')
      .or(`created_at.is.null,created_at.gte.${since}`).order('id').range(a, b)),
  ]);
  const orderOf = new Map(orders.map((order) => [order.id, order]));
  const lineOf = new Map(lines.map((l) => [l.id, l]));
  const margin = new Map<string, MarginRow>();
  const sales: { month: string; date: string; shop: string; orderId: string; number?: string; sku: string; name: string; units: number; revenue: number; cost: number | null }[] = [];
  function bucket(date: string, shop: string) {
    const month = monthFormat.format(new Date(date));
    const key = `${month}|${shop}`;
    const existing = margin.get(key);
    if (existing) return existing;
    const row = { month, shop, revenue_cents: 0, cost_cents: 0, priced_revenue_cents: 0, units: 0, missing_cost_rows: 0, refunds_cents: 0, returned_cost_cents: 0 };
    margin.set(key, row);
    return row;
  }
  for (const row of moves) {
    const line = lineOf.get(row.order_line_id);
    if (!line) continue;
    const order = orderOf.get(line.order_id);
    const m = bucket(row.created_at, order?.shop ?? '?');
    if (row.reason === 'return') {
      m.returned_cost_cents += (row.unit_cost_cents ?? 0) * row.delta;
      continue;
    }
    const revenue = line.total_excl_cents ?? 0;
    m.revenue_cents += revenue; m.units += Math.abs(row.delta);
    const cost = row.unit_cost_cents === null ? null : row.unit_cost_cents * Math.abs(row.delta);
    if (cost === null) m.missing_cost_rows++;
    else { m.cost_cents += cost; m.priced_revenue_cents += revenue; }
    sales.push({ month: m.month, date: row.created_at, shop: m.shop, orderId: line.order_id, number: order?.number,
      sku: line.sku, name: line.name, units: Math.abs(row.delta), revenue, cost });
  }
  const refundDetails = refunds.map((refund) => {
    const subtotal = refundSubtotal(refund);
    const order = orderOf.get(refund.order_id);
    const shop = order?.shop ?? '?';
    if (refund.created_at && subtotal !== null) bucket(refund.created_at, shop).refunds_cents += subtotal;
    return { id: refund.id, orderId: refund.order_id, number: order?.number, shop, date: refund.created_at, amount: refund.amount_cents, subtotal };
  }).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const sold = new Set(recent.map((r) => r.article_code));
  const perArticle = new Map<string, { quantity: number; price: number | null; name: string; sku: string }>();
  for (const row of levels as unknown as { article_code: string; quantity: number; kfc_articles: { purchase_price_cents: number | null; name: string; sku: string } | null; kfc_locations: { kind: string } | null }[]) {
    if (row.kfc_locations?.kind !== 'shelf' || row.quantity <= 0) continue;
    const a = perArticle.get(row.article_code) ?? { quantity: 0, price: row.kfc_articles?.purchase_price_cents ?? null, name: row.kfc_articles?.name ?? row.article_code, sku: row.kfc_articles?.sku ?? '' };
    a.quantity += row.quantity; perArticle.set(row.article_code, a);
  }
  let value = 0, unpriced = 0, deadUnits = 0; const dead: { code: string; sku: string; name: string; quantity: number }[] = [];
  for (const [code, a] of perArticle) {
    if (a.price === null) unpriced++; else value += a.quantity * a.price;
    if (!sold.has(code)) { deadUnits += a.quantity; dead.push({ code, sku: a.sku, name: a.name, quantity: a.quantity }); }
  }
  const aging = (balances.data ?? []).reduce((s, b) => ({ open: s.open + b.open_cents, overdue: s.overdue + b.overdue_cents, not_due: s.not_due + b.not_due, d1_30: s.d1_30 + b.d1_30, d31_60: s.d31_60 + b.d31_60, d61_90: s.d61_90 + b.d61_90, d90p: s.d90p + b.d90p }), { open: 0, overdue: 0, not_due: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90p: 0 });
  return {
    refundDetails, sales,
    margin: [...margin.values()].sort((a, b) => b.month.localeCompare(a.month) || a.shop.localeCompare(b.shop)),
    stock: { value_cents: value, articles_with_stock: perArticle.size, unpriced, catalogue: articles.count ?? 0, dead: dead.sort((a, b) => b.quantity - a.quantity).slice(0, 25), dead_units: deadUnits },
    aging,
  };
}
