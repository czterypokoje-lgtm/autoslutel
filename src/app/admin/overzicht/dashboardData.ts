import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { addDays, isoDate, weekStart } from '@/lib/crmJobs';
import { dayOf, num, type JobRow as WinstJob } from '@/lib/winst';
import { stockStatus } from '@/lib/stockStatus';

/**
 * Every number on the office dashboard, worked out in one place.
 *
 * The page only lays these out. Revenue and profit use the same fields and
 * the same "which day does a job count on" rule as Winst & verbruik
 * (lib/winst.ts), so the dashboard and that report never disagree.
 */

export type Period = 'vandaag' | 'week' | 'maand';

export const PERIOD_LABEL: Record<Period, string> = {
  vandaag: 'Vandaag',
  week: 'Deze week',
  maand: 'Deze maand',
};

export function parsePeriod(value: string | undefined): Period {
  return value === 'vandaag' || value === 'maand' ? value : 'week';
}

interface Range {
  from: string;
  to: string;
}

/** This period so far, and the same stretch of the period before it. */
function ranges(period: Period, today: string): { cur: Range; prev: Range } {
  if (period === 'vandaag') {
    const y = addDays(today, -1);
    return { cur: { from: today, to: today }, prev: { from: y, to: y } };
  }
  if (period === 'week') {
    const mon = weekStart(today);
    const elapsed = Math.round((Date.parse(today) - Date.parse(mon)) / 86_400_000);
    const prevMon = addDays(mon, -7);
    return { cur: { from: mon, to: today }, prev: { from: prevMon, to: addDays(prevMon, elapsed) } };
  }
  const first = `${today.slice(0, 7)}-01`;
  const prevFirst = addDays(first, -1).slice(0, 7) + '-01';
  const dayOfMonth = Number(today.slice(8, 10));
  const prevEnd = addDays(prevFirst, dayOfMonth - 1);
  // Never run past the end of last month (e.g. 31 March vs February).
  const lastOfPrev = addDays(first, -1);
  return { cur: { from: first, to: today }, prev: { from: prevFirst, to: prevEnd < lastOfPrev ? prevEnd : lastOfPrev } };
}

const inRange = (day: string, r: Range) => day >= r.from && day <= r.to;

export interface Kpi {
  value: number | null;
  prev: number | null;
}

export interface TechnicianDay {
  id: string;
  name: string;
  color: string | null;
  todayTotal: number;
  todayDone: number;
  todayBusy: boolean;
  weekJobs: number;
  weekRevenue: number;
  weekMargin: number;
}

export interface TodayJob {
  id: string;
  slot: string;
  car: string;
  place: string;
  status: string;
  technician: string | null;
}

export interface SpareKeyChance {
  jobId: string;
  name: string | null;
  phone: string;
  car: string;
  date: string;
}

export interface FollowUp {
  id: string;
  name: string | null;
  car: string;
  quoted: number | null;
  status: string;
  createdAt: string;
}

export interface SourceRow {
  source: string;
  leads: number;
  sold: number;
}

export interface Dashboard {
  period: Period;
  range: Range;
  revenue: Kpi;
  margin: Kpi;
  jobsDone: Kpi;
  avgTicket: Kpi;
  leads: Kpi;
  conversion: Kpi;
  adSpend: Kpi;
  costPerJob: Kpi;
  expenses: Kpi;
  net: Kpi;
  todo: {
    newLeads: number;
    unassigned: number;
    ordersToPlan: number;
    payouts: number;
    payoutTotal: number;
    expensesToApprove: number;
    lowStock: number;
  };
  technicians: TechnicianDay[];
  today: TodayJob[];
  spareKeys: SpareKeyChance[];
  spareKeyPrice: number | null;
  followUps: FollowUp[];
  sources: SourceRow[];
  hasAdData: boolean;
}

interface Job extends WinstJob {
  status: string;
  quoted_price: number | null;
  slot_start: string | null;
  slot_end: string | null;
  car_model: string | null;
  customer_name: string | null;
  customer_phone: string | null;
}

interface Lead {
  id: string;
  name: string | null;
  brand: string | null;
  model: string | null;
  status: string;
  source: string | null;
  created_at: string;
  first_contact_at: string | null;
  quoted_price: number | null;
  sale_price: number | null;
}

const JOB_COLUMNS =
  'id, status, final_price, quoted_price, cost_materials, cost_travel, cost_payment_fee, cost_other, cost_technician, gross_margin, travel_km, city, car_make, car_model, scenario, technician_id, scheduled_date, completed_at, started_at, slot_start, slot_end, customer_name, customer_phone';

const SOURCE_LABEL: Record<string, string> = {
  hero_form: 'Website (hoofdformulier)',
  hero_wizard: 'Website (wizard)',
  city_form: 'Website (stadspagina)',
  contact_form: 'Contactformulier',
  kenteken_form: 'Kentekenformulier',
  phone: 'Telefoon',
  agent: 'AI-agent',
  whatsapp: 'WhatsApp',
  unknown: 'Onbekend',
};

export const sourceLabel = (s: string | null) => SOURCE_LABEL[s ?? 'unknown'] ?? s ?? 'Onbekend';

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);
const slot = (a: string | null, b: string | null) => (a ? `${a.slice(0, 5)}${b ? `–${b.slice(0, 5)}` : ''}` : '—');

export async function readDashboard(supabase: SupabaseClient, period: Period): Promise<Dashboard> {
  const today = isoDate(new Date());
  const { cur, prev } = ranges(period, today);
  const mon = weekStart(today);
  /* Enough history for both the current and previous period, plus the week. */
  const earliest = [prev.from, mon].sort()[0];
  const yearAgo = addDays(today, -365);
  const twoWeeksAgo = new Date(Date.now() - 14 * 86_400_000).toISOString();

  const [
    { data: jobsData },
    { data: todayData },
    { data: spareData },
    { data: leadsData },
    { data: openLeadsData },
    { data: techData },
    { data: costsData },
    { data: expensesData },
    { count: ordersToPlan },
    { data: payoutData },
    { data: stockData },
    { count: unassignedCount },
  ] = await Promise.all([
    supabase.from('jobs').select(JOB_COLUMNS).eq('status', 'afgerond').gte('scheduled_date', addDays(earliest, -7)),
    supabase.from('jobs').select(JOB_COLUMNS).eq('scheduled_date', today).neq('status', 'geannuleerd').order('slot_start'),
    supabase
      .from('jobs')
      .select('id, scenario, final_price, car_make, car_model, customer_name, customer_phone, scheduled_date, completed_at')
      .eq('status', 'afgerond')
      .in('scenario', ['alle_sleutels_kwijt', 'bijmaken'])
      .gte('scheduled_date', yearAgo),
    supabase
      .from('leads')
      .select('id, name, brand, model, status, source, created_at, first_contact_at, quoted_price, sale_price')
      .gte('created_at', `${prev.from < cur.from ? prev.from : cur.from}T00:00:00`),
    supabase
      .from('leads')
      .select('id, name, brand, model, status, source, created_at, first_contact_at, quoted_price, sale_price')
      .in('status', ['new', 'qualified', 'contacted'])
      .gte('created_at', twoWeeksAgo)
      .order('created_at', { ascending: true }),
    supabase.from('technicians').select('id, name, color, active').eq('active', true).order('name'),
    supabase.from('crm_marketing_costs').select('date, spend, clicks').gte('date', earliest),
    supabase.from('expenses').select('amount, date_incurred, status').gte('date_incurred', earliest),
    supabase.from('crm_orders_to_plan').select('id', { count: 'exact', head: true }),
    supabase.from('payout_requests').select('amount').eq('status', 'pending'),
    supabase.from('stock_items').select('quantity, min_quantity'),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .is('technician_id', null)
      .eq('status', 'gepland')
      .gte('scheduled_date', today),
  ]);

  const jobs = (jobsData ?? []) as Job[];
  const done = (r: Range) => jobs.filter((j) => inRange(dayOf(j), r));
  const curJobs = done(cur);
  const prevJobs = done(prev);
  const sum = (list: Job[], f: (j: Job) => number) => list.reduce((t, j) => t + f(j), 0);
  const revenueOf = (list: Job[]) => sum(list, (j) => num(j.final_price ?? j.quoted_price));
  const marginOf = (list: Job[]) => sum(list, (j) => num(j.gross_margin));

  const leads = (leadsData ?? []) as Lead[];
  const leadsIn = (r: Range) => leads.filter((l) => inRange(isoDate(new Date(l.created_at)), r));
  const curLeads = leadsIn(cur);
  const prevLeads = leadsIn(prev);
  const soldOf = (list: Lead[]) => list.filter((l) => l.status === 'sold').length;

  const costs = costsData ?? [];
  const hasAdData = costs.length > 0;
  const spendIn = (r: Range) =>
    costs.filter((c) => inRange(String(c.date), r)).reduce((t, c) => t + num(c.spend), 0);

  const expenses = (expensesData ?? []).filter((e) => e.status !== 'rejected');
  const expensesIn = (r: Range) =>
    expenses.filter((e) => inRange(String(e.date_incurred), r)).reduce((t, e) => t + num(e.amount), 0);

  const kpi = (curV: number | null, prevV: number | null): Kpi => ({ value: curV, prev: prevV });
  const revC = revenueOf(curJobs);
  const revP = revenueOf(prevJobs);
  const marC = marginOf(curJobs);
  const marP = marginOf(prevJobs);
  const adC = hasAdData ? spendIn(cur) : null;
  const adP = hasAdData ? spendIn(prev) : null;
  const exC = expensesIn(cur);
  const exP = expensesIn(prev);

  /* ── technicians: today and this week ── */
  const todayJobs = (todayData ?? []) as Job[];
  const week: Range = { from: mon, to: addDays(mon, 6) };
  const weekJobs = jobs.filter((j) => inRange(dayOf(j), week));
  const technicians: TechnicianDay[] = (techData ?? []).map((t) => {
    const mine = todayJobs.filter((j) => j.technician_id === t.id);
    const mineWeek = weekJobs.filter((j) => j.technician_id === t.id);
    return {
      id: t.id as string,
      name: t.name as string,
      color: (t.color as string) ?? null,
      todayTotal: mine.length,
      todayDone: mine.filter((j) => j.status === 'afgerond').length,
      todayBusy: mine.some((j) => j.status === 'onderweg' || j.status === 'bezig'),
      weekJobs: mineWeek.length,
      weekRevenue: revenueOf(mineWeek),
      weekMargin: marginOf(mineWeek),
    };
  });
  const techName = new Map(technicians.map((t) => [t.id, t.name]));

  const today_: TodayJob[] = todayJobs.map((j) => ({
    id: j.id,
    slot: slot(j.slot_start, j.slot_end),
    car: [j.car_make, j.car_model].filter(Boolean).join(' ') || 'Auto onbekend',
    place: j.city ?? '',
    status: j.status,
    technician: j.technician_id ? (techName.get(j.technician_id) ?? null) : null,
  }));

  /*
   * ── Spare key ("tweede sleutel") chances ──
   *
   * A customer who had ALL keys lost now drives with exactly one key. That is
   * the warmest sale this business has: same car, a happy customer, no
   * diagnosis needed. Listed until the same phone number books a "bijmaken".
   */
  const spare = spareData ?? [];
  const phoneKey = (p: string | null) => (p ?? '').replace(/\D/g, '').slice(-9);
  const lastBijmaken = new Map<string, string>();
  for (const j of spare) {
    if (j.scenario !== 'bijmaken' || !j.customer_phone) continue;
    const k = phoneKey(j.customer_phone);
    const d = String(j.scheduled_date ?? '');
    if (d > (lastBijmaken.get(k) ?? '')) lastBijmaken.set(k, d);
  }
  const spareKeys: SpareKeyChance[] = spare
    .filter((j) => j.scenario === 'alle_sleutels_kwijt' && j.customer_phone)
    .filter((j) => (lastBijmaken.get(phoneKey(j.customer_phone)) ?? '') < String(j.scheduled_date ?? ''))
    .sort((a, b) => String(b.scheduled_date).localeCompare(String(a.scheduled_date)))
    .map((j) => ({
      jobId: j.id as string,
      name: (j.customer_name as string) ?? null,
      phone: j.customer_phone as string,
      car: [j.car_make, j.car_model].filter(Boolean).join(' ') || 'uw auto',
      date: String(j.scheduled_date ?? ''),
    }));
  const bijmakenPrices = spare.filter((j) => j.scenario === 'bijmaken').map((j) => num(j.final_price)).filter((v) => v > 0);
  const spareKeyPrice = bijmakenPrices.length
    ? Math.round(bijmakenPrices.reduce((a, b) => a + b, 0) / bijmakenPrices.length)
    : null;

  /* ── follow-ups: leads that were spoken to but not yet sold ── */
  const openLeads = (openLeadsData ?? []) as Lead[];
  const followUps: FollowUp[] = openLeads
    .filter((l) => l.status !== 'new')
    .slice(0, 8)
    .map((l) => ({
      id: l.id,
      name: l.name,
      car: [l.brand, l.model].filter(Boolean).join(' ') || 'Auto onbekend',
      quoted: l.quoted_price ?? null,
      status: l.status,
      createdAt: l.created_at,
    }));

  /* ── where this period's leads came from, and how many were sold ── */
  const bySource = new Map<string, SourceRow>();
  for (const l of curLeads) {
    const key = l.source ?? 'unknown';
    const row = bySource.get(key) ?? { source: key, leads: 0, sold: 0 };
    row.leads += 1;
    if (l.status === 'sold') row.sold += 1;
    bySource.set(key, row);
  }

  const stock = stockData ?? [];
  const payouts = payoutData ?? [];

  return {
    period,
    range: cur,
    revenue: kpi(revC, revP),
    margin: kpi(marC, marP),
    jobsDone: kpi(curJobs.length, prevJobs.length),
    avgTicket: kpi(curJobs.length ? revC / curJobs.length : null, prevJobs.length ? revP / prevJobs.length : null),
    leads: kpi(curLeads.length, prevLeads.length),
    conversion: kpi(pct(soldOf(curLeads), curLeads.length), pct(soldOf(prevLeads), prevLeads.length)),
    adSpend: kpi(adC, adP),
    costPerJob: kpi(
      adC !== null && curJobs.length ? adC / curJobs.length : null,
      adP !== null && prevJobs.length ? adP / prevJobs.length : null
    ),
    expenses: kpi(exC, exP),
    net: kpi(marC - (adC ?? 0) - exC, marP - (adP ?? 0) - exP),
    todo: {
      newLeads: openLeads.filter((l) => l.status === 'new' && !l.first_contact_at).length,
      unassigned: unassignedCount ?? 0,
      ordersToPlan: ordersToPlan ?? 0,
      payouts: payouts.length,
      payoutTotal: payouts.reduce((t, p) => t + num(p.amount), 0),
      expensesToApprove: (expensesData ?? []).filter((e) => e.status === 'pending').length,
      lowStock: stock.filter((s) => stockStatus(s) !== 'ok').length,
    },
    technicians,
    today: today_,
    spareKeys,
    spareKeyPrice,
    followUps,
    sources: [...bySource.values()].sort((a, b) => b.leads - a.leads),
    hasAdData,
  };
}
