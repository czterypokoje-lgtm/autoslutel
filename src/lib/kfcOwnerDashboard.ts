import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { fetchAll } from '@/lib/kfcOrders';
import { amsterdamMidnight, articleTotals, salesRows } from '@/lib/kfcInventoryReports';
import { amsterdamToday, labelOf, CHANNELS } from '@/lib/kfcReportColumns';

/*
 * The KeyForCars owner's dashboard (/admin/rapporten/eigenaar): revenue,
 * gross profit and margin for today / this week / this month against the same
 * stretch of last month, stock value and shortages, open purchase orders, open
 * web-shop orders, and the till's cash / PIN split.
 *
 * Revenue and profit come from kfc_sales_lines (migration 0131): goods that
 * left the shop by web-shop shipment, till sale or invoice, on that date.
 * kfc_pos_payments belongs to the till (migration 0129, branch feat/kassa) and
 * is read defensively: when the table is not there yet the split is null and
 * the screen says the till is not in use.
 */

const DAY = 86_400_000;
const shift = (iso: string, days: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + days * DAY).toISOString().slice(0, 10);

export interface Period { revenue: number; cost: number; profit: number; units: number; margin: number | null }
const period = (rows: { revenue_cents: number; cost_cents: number; quantity: number }[]): Period => {
  const revenue = rows.reduce((s, r) => s + r.revenue_cents, 0);
  const cost = rows.reduce((s, r) => s + r.cost_cents, 0);
  return { revenue, cost, profit: revenue - cost, units: rows.reduce((s, r) => s + r.quantity, 0), margin: revenue ? Math.round((revenue - cost) / revenue * 1000) / 10 : null };
};

export async function ownerDashboard() {
  const db = createSupabaseAdminClient();
  const today = amsterdamToday();
  const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
  const monday = shift(today, -weekday);
  const monthStart = today.slice(0, 8) + '01';
  const lastMonthStart = shift(monthStart, -1).slice(0, 8) + '01';
  const lastMonthEnd = shift(monthStart, -1);
  // Same number of days into last month, capped at its last day.
  const lastMonthSameDay = (() => { const d = shift(lastMonthStart, Number(today.slice(8, 10)) - 1); return d > lastMonthEnd ? lastMonthEnd : d; })();
  const chartFrom = shift(today, -29);
  const from = [chartFrom, monthStart, monday, lastMonthStart].sort()[0];

  type Po = { id: string; status: string; supplier: string; expected_on: string | null; kfc_purchase_order_lines: { quantity: number; received: number; unit_cost_cents: number | null }[] };
  type Order = { id: string; number: string; shop: string; created_at: string; total_excl_cents: number };
  type Payment = { method: string; amount_cents: number; created_at: string };

  const [days, topThisMonth, channels, stock, pos, orders, refunds, payments] = await Promise.all([
    salesRows({ from, to: today, group: 'day', category: '', channel: '', q: '' }),
    salesRows({ from: monthStart, to: today, group: 'article', category: '', channel: '', q: '' }),
    salesRows({ from: monthStart, to: today, group: 'channel', category: '', channel: '', q: '' }),
    articleTotals(true),
    db.from('kfc_purchase_orders').select('id, status, supplier, expected_on, kfc_purchase_order_lines(quantity, received, unit_cost_cents)').in('status', ['draft', 'ordered']).limit(2000),
    fetchAll<Order>((a, b) => db.from('kfc_shop_orders').select('id, number, shop, created_at, total_excl_cents')
      .eq('status', 'processing').in('fulfilment', ['open', 'picked']).order('created_at').range(a, b), 1000, 10000),
    db.from('kfc_shop_order_refunds').select('amount_cents, created_at').gte('created_at', amsterdamMidnight(monthStart)),
    db.from('kfc_pos_payments').select('method, amount_cents, created_at').gte('created_at', amsterdamMidnight(from)).limit(20000),
  ]);

  const byDay = new Map(days.map((d) => [d.key, d]));
  const inRange = (a: string, b: string) => days.filter((d) => d.key >= a && d.key <= b);
  const chart = Array.from({ length: 30 }, (_, i) => {
    const day = shift(chartFrom, i);
    const row = byDay.get(day);
    return { day, revenue: row?.revenue_cents ?? 0, profit: row?.profit_cents ?? 0, units: row?.quantity ?? 0 };
  });

  const pos_ = ((pos.data ?? []) as unknown as Po[]);
  const ordered = pos_.filter((p) => p.status === 'ordered');
  const openValue = ordered.reduce((s, p) => s + p.kfc_purchase_order_lines.reduce((t, l) => t + Math.max(l.quantity - l.received, 0) * (l.unit_cost_cents ?? 0), 0), 0);
  const overdue = ordered.filter((p) => p.expected_on && p.expected_on < today);

  // Till: null when the kassa tables are not deployed on this database yet.
  let till: null | Record<'today' | 'week' | 'month', Record<'cash' | 'pin' | 'other', number>> = null;
  if (!payments.error) {
    const empty = () => ({ cash: 0, pin: 0, other: 0 });
    till = { today: empty(), week: empty(), month: empty() };
    const bounds = { today: amsterdamMidnight(today), week: amsterdamMidnight(monday), month: amsterdamMidnight(monthStart) };
    for (const p of (payments.data ?? []) as Payment[]) {
      const method = (['cash', 'pin'].includes(p.method) ? p.method : 'other') as 'cash' | 'pin' | 'other';
      for (const key of ['today', 'week', 'month'] as const) if (p.created_at >= bounds[key]) till[key][method] += p.amount_cents;
    }
  }

  return {
    today, monday, monthStart, lastMonthStart, lastMonthSameDay,
    periods: {
      today: period(inRange(today, today)),
      yesterday: period(inRange(shift(today, -1), shift(today, -1))),
      week: period(inRange(monday, today)),
      month: period(inRange(monthStart, today)),
      lastMonthToDate: period(inRange(lastMonthStart, lastMonthSameDay)),
    },
    chart,
    top: topThisMonth.sort((a, b) => b.revenue_cents - a.revenue_cents).slice(0, 10)
      .map((r) => ({ code: r.key, name: r.label, units: r.quantity, revenue: r.revenue_cents, profit: r.profit_cents, margin: r.margin_pct })),
    channels: channels.map((c) => ({ channel: c.key, label: labelOf(CHANNELS, c.key), revenue: c.revenue_cents, units: c.quantity })).sort((a, b) => b.revenue - a.revenue),
    stock,
    purchasing: { drafts: pos_.filter((p) => p.status === 'draft').length, ordered: ordered.length, openValue, overdue: overdue.length,
      overdueSuppliers: [...new Set(overdue.map((p) => p.supplier))].slice(0, 5) },
    webshop: { open: orders.length, value: orders.reduce((s, o) => s + (o.total_excl_cents ?? 0), 0),
      oldest: orders[0] ? { id: orders[0].id, number: orders[0].number, created_at: orders[0].created_at } : null,
      olderThan2Days: orders.filter((o) => Date.now() - Date.parse(o.created_at) > 2 * DAY).length },
    refundsMonth: (refunds.data ?? []).reduce((s: number, r: { amount_cents: number }) => s + r.amount_cents, 0),
    till,
  };
}
export type OwnerDashboard = Awaited<ReturnType<typeof ownerDashboard>>;
