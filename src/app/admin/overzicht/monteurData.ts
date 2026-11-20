import { createSupabaseServerClient } from '@/lib/supabase/server';
import { addDays, isoDate, weekStart } from '@/lib/crmJobs';
import { earnedOn, priceOf, computeAvailable } from '@/lib/technicianBalance';
import { stockStatus } from '@/lib/stockStatus';
import { SCENARIO_INFO, type Scenario } from '@/lib/scenarios';
import type { Period } from './dashboardData';
import type { CrmUser } from '@/lib/crmSession';

/**
 * What a technician's home screen reads and works out, lifted out of
 * MonteurOverview unchanged so the old screen and its Studio twin cannot
 * drift apart. Every query is still scoped to their own technician row.
 */

/**
 * What every technician puts in each month, earned back from that month's
 * jobs (1st to end of month). Not stored per person yet: when amounts start
 * to differ, this becomes a column on technicians.
 */
export const START_INVESTMENT = 500;

export interface DoneJob {
  id: string;
  final_price: number | string | null;
  quoted_price: number | string | null;
  commission_pct: number | string | null;
  scheduled_date: string | null;
  completed_at: string | null;
  city: string | null;
  car_make: string | null;
  car_model: string | null;
  scenario: string | null;
  service_type: string | null;
}

/** The day a finished job counts on: when it was finished, else when it was planned. */
export const dayOf = (j: DoneJob) => (j.completed_at ? isoDate(new Date(j.completed_at)) : (j.scheduled_date ?? '').slice(0, 10));

export const serviceOf = (j: DoneJob) =>
  j.service_type || (j.scenario ? (SCENARIO_INFO[j.scenario as Scenario]?.label ?? j.scenario) : 'Klus');

function ranges(period: Period, today: string) {
  if (period === 'vandaag') return { cur: [today, today], prev: [addDays(today, -1), addDays(today, -1)] };
  if (period === 'week') {
    const mon = weekStart(today);
    const n = Math.round((Date.parse(today) - Date.parse(mon)) / 86_400_000);
    return { cur: [mon, today], prev: [addDays(mon, -7), addDays(mon, n - 7)] };
  }
  const first = `${today.slice(0, 7)}-01`;
  const prevFirst = addDays(first, -1).slice(0, 7) + '-01';
  const prevEnd = addDays(prevFirst, Number(today.slice(8)) - 1);
  const lastOfPrev = addDays(first, -1);
  return { cur: [first, today], prev: [prevFirst, prevEnd < lastOfPrev ? prevEnd : lastOfPrev] };
}

export type MonteurData = Awaited<ReturnType<typeof readMonteur>>;

export async function readMonteur(user: CrmUser, period: Period) {
  const supabase = await createSupabaseServerClient();

  const { data: tech } = await supabase
    .from('technicians')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!tech) return null;

  const now = new Date();
  const today = isoDate(now);
  const mon = weekStart(today);

  const [{ data: todayJobs }, { data: weekJobs }, { data: doneJobs }, { data: payouts }, { count: offerCount }, { data: stock }] =
    await Promise.all([
      supabase
        .from('jobs')
        .select('id, status, slot_start, slot_end, city, postcode, service_type, car_make, car_model, car_year, keyless')
        .eq('technician_id', tech.id)
        .eq('scheduled_date', today)
        .order('slot_start', { ascending: true }),
      supabase
        .from('jobs')
        .select('id')
        .eq('technician_id', tech.id)
        .gte('scheduled_date', mon)
        .lte('scheduled_date', addDays(mon, 6))
        .neq('status', 'geannuleerd'),
      supabase
        .from('jobs')
        .select('id, final_price, quoted_price, commission_pct, scheduled_date, completed_at, city, car_make, car_model, scenario, service_type')
        .eq('technician_id', tech.id)
        .eq('status', 'afgerond'),
      supabase.from('payout_requests').select('amount, status').eq('technician_id', tech.id),
      supabase
        .from('job_offers')
        .select('id', { count: 'exact', head: true })
        .eq('technician_id', tech.id)
        .is('responded_at', null)
        .gt('expires_at', now.toISOString()),
      supabase.from('stock_items').select('quantity, min_quantity').eq('technician_id', tech.id),
    ]);

  const jobsToday = todayJobs ?? [];
  const upcoming = jobsToday.filter((j) => j.status === 'gepland' || j.status === 'onderweg' || j.status === 'bezig');
  const next = upcoming[0] ?? null;
  const finishedToday = jobsToday.filter((j) => j.status === 'afgerond');

  const done = ((doneJobs ?? []) as DoneJob[]).sort((a, b) => dayOf(b).localeCompare(dayOf(a)));
  const available = computeAvailable(done, payouts ?? []);
  const pendingPayout = (payouts ?? []).filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const outOfStock = (stock ?? []).filter((s) => stockStatus(s) === 'out').length;
  const lowStock = (stock ?? []).filter((s) => stockStatus(s) === 'low').length;
  const weekCount = (weekJobs ?? []).length;

  /* ── investment: this calendar month only, from the 1st ── */
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthJobs = done.filter((j) => dayOf(j) >= monthStart && dayOf(j) <= today);
  const earnedMonth = monthJobs.reduce((s, j) => s + earnedOn(j), 0);
  const monthName = new Intl.DateTimeFormat('nl-NL', { month: 'long', timeZone: 'Europe/Amsterdam' }).format(now);

  /* ── this period vs the one before ── */
  const { cur, prev } = ranges(period, today);
  const inR = (r: string[]) => done.filter((j) => dayOf(j) >= r[0] && dayOf(j) <= r[1]);
  const curJobs = inR(cur);
  const prevJobs = inR(prev);
  const sum = (list: DoneJob[], f: (j: DoneJob) => number) => list.reduce((s, j) => s + f(j), 0);
  const k = {
    jobs: [curJobs.length, prevJobs.length],
    revenue: [sum(curJobs, priceOf), sum(prevJobs, priceOf)],
    earned: [sum(curJobs, earnedOn), sum(prevJobs, earnedOn)],
  };
  const avgCur = curJobs.length ? k.earned[0] / curJobs.length : 0;
  const avgPrev = prevJobs.length ? k.earned[1] / prevJobs.length : 0;

  /* ── per day, for the chart ── */
  const days = period === 'maand' ? 30 : 14;
  const series = Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1);
    const list = done.filter((j) => dayOf(j) === day);
    return { day, revenue: sum(list, priceOf), margin: sum(list, earnedOn), leads: list.length };
  });

  const address = next ? [next.postcode, next.city].filter(Boolean).join(' ') : '';
  const car = next ? [next.car_make, next.car_model, next.car_year].filter(Boolean).join(' ') : '';

  return {
    tech,
    jobsToday,
    upcoming,
    next,
    finishedToday,
    done,
    available,
    pendingPayout,
    outOfStock,
    lowStock,
    weekCount,
    monthJobs,
    earnedMonth,
    monthName,
    offerCount,
    k,
    avgCur,
    avgPrev,
    days,
    series,
    address,
    car,
  };
}
