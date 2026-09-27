import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SCENARIO_INFO, type Scenario } from './scenarios';

/**
 * The numbers behind Winst & verbruik, in one place.
 *
 * The screen and the Excel download both read from here rather than each
 * doing their own arithmetic. Two copies of a sum is how a spreadsheet ends up
 * disagreeing with the page it came from, and then nobody trusts either — the
 * same shape of bug this whole exercise was cleaning up.
 */

export interface JobRow {
  id: string;
  final_price: number | null;
  cost_materials: number | null;
  cost_travel: number | null;
  cost_payment_fee: number | null;
  cost_other: number | null;
  cost_technician: number | null;
  gross_margin: number | null;
  travel_km: number | null;
  city: string | null;
  car_make: string | null;
  scenario: string | null;
  technician_id: string | null;
  scheduled_date: string | null;
  completed_at: string | null;
  started_at: string | null;
}

export interface MaterialRow {
  job_id: string;
  description: string | null;
  quantity: number | null;
  unit_cost: number | null;
}

export interface Bucket {
  label: string;
  count: number;
  value: number;
}

const JOB_COLUMNS =
  'id, final_price, cost_materials, cost_travel, cost_payment_fee, cost_other, cost_technician, gross_margin, travel_km, city, car_make, scenario, technician_id, scheduled_date, completed_at, started_at';

export const num = (value: unknown): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/**
 * The day a job counts towards.
 *
 * `completed_at` is filled on under half of finished jobs, so falling back to
 * the planned date is not a shortcut — it is the only way most of the work
 * lands in a period at all.
 */
export const dayOf = (job: JobRow): string =>
  (job.completed_at ?? job.scheduled_date ?? '').slice(0, 10);

function group<T>(rows: T[], key: (row: T) => string, value: (row: T) => number): Bucket[] {
  const totals = new Map<string, Bucket>();
  for (const row of rows) {
    const label = key(row);
    const entry = totals.get(label) ?? { label, count: 0, value: 0 };
    entry.count += 1;
    entry.value += value(row);
    totals.set(label, entry);
  }
  return [...totals.values()].sort((a, b) => b.value - a.value);
}

export interface Winst {
  from: string;
  to: string;
  jobs: JobRow[];
  materials: MaterialRow[];
  revenue: number;
  parts: number;
  fuel: number;
  other: number;
  margin: number;
  workdays: number;
  /** Null until enough jobs carry believable timings — see below. */
  perHour: number | null;
  timedCount: number;
  byCity: Bucket[];
  byMake: Bucket[];
  byScenario: Bucket[];
  byTechnician: Bucket[];
  byProduct: Bucket[];
  productUnits: Map<string, number>;
  byMonth: Bucket[];
  gaps: { price: number; city: number; fuel: number; parts: number; times: number };
}

/** Everything the screen and the spreadsheet need, for one period. */
export async function readWinst(
  supabase: SupabaseClient,
  from: string,
  to: string
): Promise<Winst | { error: string }> {
  const [jobResult, materialResult, techResult] = await Promise.all([
    supabase.from('jobs').select(JOB_COLUMNS).eq('status', 'afgerond'),
    supabase.from('job_materials').select('job_id, description, quantity, unit_cost'),
    supabase.from('technicians').select('id, name'),
  ]);

  if (jobResult.error) return { error: jobResult.error.message };

  /*
   * Filtered here rather than in the query: the date that matters is
   * `completed_at ?? scheduled_date`, which takes an or() across two ranges to
   * express in PostgREST. At this volume the readable version wins.
   */
  const jobs = ((jobResult.data ?? []) as JobRow[]).filter((job) => {
    const day = dayOf(job);
    return day >= from && day <= to;
  });
  const ids = new Set(jobs.map((job) => job.id));
  const materials = ((materialResult.data ?? []) as MaterialRow[]).filter((line) =>
    ids.has(line.job_id)
  );
  const technicianName = new Map((techResult.data ?? []).map((t) => [t.id, t.name]));

  const revenue = jobs.reduce((t, j) => t + num(j.final_price), 0);
  const parts = jobs.reduce((t, j) => t + num(j.cost_materials), 0);
  const fuel = jobs.reduce((t, j) => t + num(j.cost_travel), 0);
  const other = jobs.reduce(
    (t, j) => t + num(j.cost_payment_fee) + num(j.cost_other) + num(j.cost_technician),
    0
  );
  const margin = jobs.reduce((t, j) => t + num(j.gross_margin), 0);
  const workdays = new Set(jobs.map(dayOf).filter(Boolean)).size;

  /*
   * €/uur, only where it is real.
   *
   * Both timestamps must exist and the duration has to be believable — a job
   * left in `bezig` overnight yields a €3/hour outlier that drags the mean
   * somewhere useless. Under ten measured jobs there is no number at all: an
   * average over two is noise wearing a euro sign, and a figure like that gets
   * decided on.
   */
  const timed = jobs.filter((job) => {
    if (!job.started_at || !job.completed_at) return false;
    const hours = (Date.parse(job.completed_at) - Date.parse(job.started_at)) / 3_600_000;
    return hours >= 1 / 6 && hours <= 8;
  });
  const timedHours = timed.reduce(
    (t, j) => t + (Date.parse(j.completed_at!) - Date.parse(j.started_at!)) / 3_600_000,
    0
  );
  const timedRevenue = timed.reduce((t, j) => t + num(j.final_price), 0);

  const productUnits = new Map<string, number>();
  for (const line of materials) {
    const label = String(line.description ?? '').trim() || 'onbekend';
    productUnits.set(label, num(productUnits.get(label)) + num(line.quantity));
  }

  return {
    from,
    to,
    jobs,
    materials,
    revenue,
    parts,
    fuel,
    other,
    margin,
    workdays,
    perHour: timed.length >= 10 && timedHours > 0 ? timedRevenue / timedHours : null,
    timedCount: timed.length,
    byCity: group(jobs, (j) => j.city?.trim() || 'onbekend', (j) => num(j.gross_margin)),
    byMake: group(jobs, (j) => j.car_make?.trim() || 'onbekend', (j) => num(j.gross_margin)),
    byScenario: group(
      jobs,
      (j) => (j.scenario ? (SCENARIO_INFO[j.scenario as Scenario]?.label ?? j.scenario) : 'onbekend'),
      (j) => num(j.gross_margin)
    ),
    byTechnician: group(
      jobs,
      (j) => (j.technician_id ? (technicianName.get(j.technician_id) ?? 'onbekend') : 'onbekend'),
      (j) => num(j.gross_margin)
    ),
    /* "Product" is the parts actually consumed, not the webshop catalogue. */
    byProduct: group(
      materials,
      (line) => String(line.description ?? '').trim() || 'onbekend',
      (line) => num(line.quantity) * num(line.unit_cost)
    ),
    productUnits,
    byMonth: group(jobs, (j) => dayOf(j).slice(0, 7), (j) => num(j.gross_margin)).sort((a, b) =>
      a.label.localeCompare(b.label)
    ),
    gaps: {
      price: jobs.filter((j) => j.final_price === null).length,
      city: jobs.filter((j) => !j.city?.trim()).length,
      fuel: jobs.filter((j) => j.travel_km === null).length,
      parts: jobs.filter((j) => !materials.some((m) => m.job_id === j.id)).length,
      times: jobs.length - timed.length,
    },
  };
}
