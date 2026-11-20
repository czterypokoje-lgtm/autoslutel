import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { fetchAll } from '@/lib/kfcOrders';

/* Reports on the new sources: margin from sale moves, stock value at cost, receivables aging, dead stock. */

export interface MarginRow { month: string; shop: string; revenue_cents: number; cost_cents: number; priced_revenue_cents: number; units: number }

export async function reports() {
  const db = createSupabaseAdminClient();
  const since = new Date(Date.now() - 365 * 864e5).toISOString();
  type Sale = { delta: number; unit_cost_cents: number | null; created_at: string; order_line_id: string };
  type Line = { id: string; order_id: string; total_excl_cents: number | null };
  const [sales, lines, orders, levels, balances, articles, recent] = await Promise.all([
    fetchAll<Sale>((a, b) => db.from('kfc_stock_moves').select('delta, unit_cost_cents, created_at, order_line_id').eq('reason', 'sale').not('order_line_id', 'is', null).gte('created_at', since).order('id').range(a, b)),
    fetchAll<Line>((a, b) => db.from('kfc_shop_order_lines').select('id, order_id, total_excl_cents').order('id').range(a, b)),
    fetchAll<{ id: string; shop: string }>((a, b) => db.from('kfc_shop_orders').select('id, shop').order('id').range(a, b)),
    fetchAll<Record<string, unknown>>((a, b) => db.from('kfc_stock_levels').select('article_code, quantity, kfc_articles (purchase_price_cents, name, sku), kfc_locations (kind)').order('article_code').range(a, b)),
    db.from('kfc_customer_balance').select('open_cents, overdue_cents, not_due, d1_30, d31_60, d61_90, d90p'),
    db.from('kfc_articles').select('code', { count: 'exact', head: true }),
    fetchAll<{ article_code: string }>((a, b) => db.from('kfc_stock_moves').select('article_code').eq('reason', 'sale').gte('created_at', new Date(Date.now() - 90 * 864e5).toISOString()).order('id').range(a, b)),
  ]);
  const shopOf = new Map(orders.map((o) => [o.id, o.shop]));
  const lineOf = new Map(lines.map((l) => [l.id, l]));
  const margin = new Map<string, MarginRow>();
  for (const row of sales) {
    const line = lineOf.get(row.order_line_id); if (!line) continue;
    const shop = shopOf.get(line.order_id) ?? '?';
    const key = `${row.created_at.slice(0, 7)}|${shop}`;
    const m = margin.get(key) ?? { month: row.created_at.slice(0, 7), shop, revenue_cents: 0, cost_cents: 0, priced_revenue_cents: 0, units: 0 };
    const revenue = line.total_excl_cents ?? 0;
    m.revenue_cents += revenue; m.units += Math.abs(row.delta);
    if (row.unit_cost_cents !== null) { m.cost_cents += row.unit_cost_cents * Math.abs(row.delta); m.priced_revenue_cents += revenue; }
    margin.set(key, m);
  }
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
    margin: [...margin.values()].sort((a, b) => b.month.localeCompare(a.month) || a.shop.localeCompare(b.shop)),
    stock: { value_cents: value, articles_with_stock: perArticle.size, unpriced, catalogue: articles.count ?? 0, dead: dead.sort((a, b) => b.quantity - a.quantity).slice(0, 25), dead_units: deadUnits },
    aging,
  };
}
