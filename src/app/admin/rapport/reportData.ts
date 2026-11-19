import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { addDays, isoDate, weekStart } from '@/lib/crmJobs';
import { SCENARIO_INFO, isScenario } from '@/lib/scenarios';
import { sourceLabel } from '../overzicht/dashboardData';

/**
 * The performance report: one period (week, month, quarter, year), the same
 * period before it, the trend inside it, and every technician's share.
 *
 * Revenue is what the customer paid (final_price, else quoted_price) on
 * finished jobs, counted on completed_at, else the planned date — the same
 * rule as Winst & verbruik and the dashboard, so the numbers agree.
 * Profit is gross_margin. Our commission is commission_amount, else
 * price × commission_pct (25 % when no rate was agreed).
 */

export type Span = 'week' | 'maand' | 'kwartaal' | 'jaar';
export const SPAN_LABEL: Record<Span, string> = { week: 'Week', maand: 'Maand', kwartaal: 'Kwartaal', jaar: 'Jaar' };

export function parseSpan(v: string | undefined): Span {
  return v === 'week' || v === 'kwartaal' || v === 'jaar' ? v : 'maand';
}

export interface Range {
  from: string;
  to: string;
}

const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MONTHS_LONG = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

/** The period containing `anchor`, and the one before it. */
export function periodOf(span: Span, anchor: string): { cur: Range; prev: Range; label: string; prevAnchor: string; nextAnchor: string } {
  const y = Number(anchor.slice(0, 4));
  const m = Number(anchor.slice(5, 7)) - 1;
  const iso = (yy: number, mm: number, dd: number) => isoDate(new Date(Date.UTC(yy, mm, dd, 12)));
  if (span === 'week') {
    const mon = weekStart(anchor);
    const cur = { from: mon, to: addDays(mon, 6) };
    const prev = { from: addDays(mon, -7), to: addDays(mon, -1) };
    const d = (s: string) => `${Number(s.slice(8))} ${MONTHS[Number(s.slice(5, 7)) - 1]}`;
    return { cur, prev, label: `Week ${isoWeek(mon)} · ${d(cur.from)} – ${d(cur.to)}`, prevAnchor: prev.from, nextAnchor: addDays(mon, 7) };
  }
  if (span === 'maand') {
    const cur = { from: iso(y, m, 1), to: iso(y, m + 1, 0) };
    const prev = { from: iso(y, m - 1, 1), to: iso(y, m, 0) };
    return { cur, prev, label: `${MONTHS_LONG[m]} ${y}`, prevAnchor: prev.from, nextAnchor: iso(y, m + 1, 1) };
  }
  if (span === 'kwartaal') {
    const q = Math.floor(m / 3) * 3;
    const cur = { from: iso(y, q, 1), to: iso(y, q + 3, 0) };
    const prev = { from: iso(y, q - 3, 1), to: iso(y, q, 0) };
    return { cur, prev, label: `Q${q / 3 + 1} ${y}`, prevAnchor: prev.from, nextAnchor: iso(y, q + 3, 1) };
  }
  const cur = { from: iso(y, 0, 1), to: iso(y, 11, 31) };
  const prev = { from: iso(y - 1, 0, 1), to: iso(y - 1, 11, 31) };
  return { cur, prev, label: String(y), prevAnchor: prev.from, nextAnchor: iso(y + 1, 0, 1) };
}

function isoWeek(iso: string): number {
  const d = new Date(`${iso}T12:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - jan4.getTime()) / 86_400_000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
}

interface Job {
  id: string;
  status: string;
  technician_id: string | null;
  scheduled_date: string | null;
  completed_at: string | null;
  final_price: number | string | null;
  quoted_price: number | string | null;
  gross_margin: number | string | null;
  commission_amount: number | string | null;
  commission_pct: number | string | null;
  scenario: string | null;
  service_type: string | null;
  car_make: string | null;
  city: string | null;
}

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const priceOf = (j: Job) => num(j.final_price ?? j.quoted_price);
const commissionOf = (j: Job) =>
  j.commission_amount !== null && j.commission_amount !== undefined
    ? num(j.commission_amount)
    : (priceOf(j) * num(j.commission_pct ?? 25)) / 100;
const dayOf = (j: Job) => (j.completed_at ? isoDate(new Date(j.completed_at)) : (j.scheduled_date ?? '').slice(0, 10));
const inRange = (d: string, r: Range) => d >= r.from && d <= r.to;

export interface Totals {
  revenue: number;
  margin: number;
  commission: number;
  jobs: number;
  cancelled: number;
  leads: number;
  sold: number;
  adSpend: number | null;
  expenses: number;
}

export interface TechRow {
  id: string;
  name: string;
  color: string | null;
  jobs: number;
  revenue: number;
  margin: number;
  commission: number;
  earned: number;
  cancelled: number;
  offered: number;
  accepted: number;
  prevRevenue: number;
}

export interface Bucket {
  label: string;
  jobs: number;
  revenue: number;
  margin: number;
}

export interface Bar {
  day: string;
  label: string;
  revenue: number;
  margin: number;
  leads: number;
}

export interface Report {
  span: Span;
  label: string;
  range: Range;
  prevAnchor: string;
  nextAnchor: string;
  isCurrent: boolean;
  cur: Totals;
  prev: Totals;
  series: Bar[];
  technicians: TechRow[];
  unassigned: { jobs: number; revenue: number };
  byService: Bucket[];
  byMake: Bucket[];
  byCity: Bucket[];
  bySource: { label: string; leads: number; sold: number }[];
}

function group(jobs: Job[], key: (j: Job) => string): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const j of jobs) {
    const k = key(j) || 'onbekend';
    const b = map.get(k) ?? { label: k, jobs: 0, revenue: 0, margin: 0 };
    b.jobs += 1;
    b.revenue += priceOf(j);
    b.margin += num(j.gross_margin);
    map.set(k, b);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export async function readReport(supabase: SupabaseClient, span: Span, anchor: string): Promise<Report> {
  const today = isoDate(new Date());
  const { cur, prev, label, prevAnchor, nextAnchor } = periodOf(span, anchor);
  const lookFrom = addDays(prev.from, -2);

  const [{ data: jobsData }, { data: techData }, { data: leadsData }, { data: offersData }, { data: costsData }, { data: expData }] =
    await Promise.all([
      supabase
        .from('jobs')
        .select('id, status, technician_id, scheduled_date, completed_at, final_price, quoted_price, gross_margin, commission_amount, commission_pct, scenario, service_type, car_make, city')
        .in('status', ['afgerond', 'geannuleerd'])
        .gte('scheduled_date', lookFrom)
        .lte('scheduled_date', addDays(cur.to, 2))
        .range(0, 9999),
      supabase.from('technicians').select('id, name, color, active').order('name'),
      supabase
        .from('leads')
        .select('id, source, status, created_at')
        .gte('created_at', `${prev.from}T00:00:00`)
        .lte('created_at', `${cur.to}T23:59:59`)
        .range(0, 9999),
      supabase
        .from('job_offers')
        .select('technician_id, response, offered_at')
        .gte('offered_at', `${cur.from}T00:00:00`)
        .lte('offered_at', `${cur.to}T23:59:59`)
        .range(0, 9999),
      supabase.from('crm_marketing_costs').select('date, spend').gte('date', prev.from).lte('date', cur.to),
      supabase.from('expenses').select('amount, date_incurred, status').gte('date_incurred', prev.from).lte('date_incurred', cur.to),
    ]);

  const jobs = (jobsData ?? []) as Job[];
  const doneIn = (r: Range) => jobs.filter((j) => j.status === 'afgerond' && inRange(dayOf(j), r));
  const cancelledIn = (r: Range) => jobs.filter((j) => j.status === 'geannuleerd' && inRange((j.scheduled_date ?? '').slice(0, 10), r));
  const leads = leadsData ?? [];
  const leadsIn = (r: Range) => leads.filter((l) => inRange(isoDate(new Date(l.created_at as string)), r));
  const costs = costsData ?? [];
  const hasAds = costs.length > 0;
  const expenses = (expData ?? []).filter((e) => e.status !== 'rejected');

  const totals = (r: Range): Totals => {
    const d = doneIn(r);
    const l = leadsIn(r);
    return {
      revenue: d.reduce((t, j) => t + priceOf(j), 0),
      margin: d.reduce((t, j) => t + num(j.gross_margin), 0),
      commission: d.reduce((t, j) => t + commissionOf(j), 0),
      jobs: d.length,
      cancelled: cancelledIn(r).length,
      leads: l.length,
      sold: l.filter((x) => x.status === 'sold').length,
      adSpend: hasAds ? costs.filter((c) => inRange(String(c.date), r)).reduce((t, c) => t + num(c.spend), 0) : null,
      expenses: expenses.filter((e) => inRange(String(e.date_incurred), r)).reduce((t, e) => t + num(e.amount), 0),
    };
  };

  const curJobs = doneIn(cur);
  const prevJobs = doneIn(prev);

  /* ── trend: days for week/month, weeks for a quarter, months for a year ── */
  const series: Bar[] = [];
  const pushBucket = (r: Range, lab: string) => {
    const d = doneIn(r);
    series.push({
      day: r.from,
      label: lab,
      revenue: d.reduce((t, j) => t + priceOf(j), 0),
      margin: d.reduce((t, j) => t + num(j.gross_margin), 0),
      leads: d.length,
    });
  };
  if (span === 'week' || span === 'maand') {
    for (let d = cur.from; d <= cur.to; d = addDays(d, 1)) pushBucket({ from: d, to: d }, `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`);
  } else if (span === 'kwartaal') {
    for (let w = weekStart(cur.from); w <= cur.to; w = addDays(w, 7)) pushBucket({ from: w < cur.from ? cur.from : w, to: addDays(w, 6) > cur.to ? cur.to : addDays(w, 6) }, `wk ${isoWeek(w)}`);
  } else {
    const y = Number(cur.from.slice(0, 4));
    for (let m = 0; m < 12; m++) {
      const from = isoDate(new Date(Date.UTC(y, m, 1, 12)));
      const to = isoDate(new Date(Date.UTC(y, m + 1, 0, 12)));
      pushBucket({ from, to }, MONTHS[m]);
    }
  }

  /* ── per technician ── */
  const offers = offersData ?? [];
  const techs = (techData ?? []) as { id: string; name: string; color: string | null; active: boolean }[];
  const technicians: TechRow[] = techs
    .map((t) => {
      const mine = curJobs.filter((j) => j.technician_id === t.id);
      const revenue = mine.reduce((s, j) => s + priceOf(j), 0);
      const commission = mine.reduce((s, j) => s + commissionOf(j), 0);
      const myOffers = offers.filter((o) => o.technician_id === t.id);
      return {
        id: t.id,
        name: t.name,
        color: t.color,
        jobs: mine.length,
        revenue,
        margin: mine.reduce((s, j) => s + num(j.gross_margin), 0),
        commission,
        earned: revenue - commission,
        cancelled: cancelledIn(cur).filter((j) => j.technician_id === t.id).length,
        offered: myOffers.length,
        accepted: myOffers.filter((o) => o.response === 'accepted').length,
        prevRevenue: prevJobs.filter((j) => j.technician_id === t.id).reduce((s, j) => s + priceOf(j), 0),
        active: t.active,
      };
    })
    .filter((t) => t.active || t.jobs > 0 || t.prevRevenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .map(({ active: _active, ...rest }) => rest);

  const unassignedJobs = curJobs.filter((j) => !j.technician_id);

  /* ── where it came from ── */
  const sources = new Map<string, { label: string; leads: number; sold: number }>();
  for (const l of leadsIn(cur)) {
    const lab = sourceLabel(l.source as string | null);
    const row = sources.get(lab) ?? { label: lab, leads: 0, sold: 0 };
    row.leads += 1;
    if (l.status === 'sold') row.sold += 1;
    sources.set(lab, row);
  }

  return {
    span,
    label,
    range: cur,
    prevAnchor,
    nextAnchor,
    isCurrent: inRange(today, cur),
    cur: totals(cur),
    prev: totals(prev),
    series,
    technicians,
    unassigned: { jobs: unassignedJobs.length, revenue: unassignedJobs.reduce((t, j) => t + priceOf(j), 0) },
    byService: group(curJobs, (j) => (isScenario(j.scenario) ? SCENARIO_INFO[j.scenario].label : (j.service_type ?? 'onbekend'))).slice(0, 8),
    byMake: group(curJobs, (j) => j.car_make?.trim() ?? '').slice(0, 8),
    byCity: group(curJobs, (j) => j.city?.trim() ?? '').slice(0, 8),
    bySource: [...sources.values()].sort((a, b) => b.leads - a.leads),
  };
}
