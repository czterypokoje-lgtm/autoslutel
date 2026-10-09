import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SCENARIO_INFO, type Scenario } from './scenarios';

/**
 * Every technician's price list, in one place, for the office.
 *
 * mijn-vak is where a technician maintains their own rates and
 * monteurs/[id] shows one person's. Neither answers the question the office
 * actually has, which is "what does a Golf cost me, and from whom" — that is
 * a comparison across people, and it was not possible without opening two
 * tabs and reading 186 rows by eye.
 *
 * Shared by the screen and the Excel download so the file can never disagree
 * with the page it came from.
 */

export interface RateRow {
  id: string;
  technician: string;
  technicianId: string;
  make: string;
  model: string | null;
  scenario: Scenario;
  scenarioLabel: string;
  fromYear: number | null;
  toYear: number | null;
  keyless: boolean | null;
  excluded: boolean;
  price: number | null;
}

export interface RateFilters {
  q?: string;
  technicianId?: string;
  scenario?: string;
}

const norm = (value: string | null | undefined) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export async function readTechnicianRates(
  supabase: SupabaseClient,
  filters: RateFilters
): Promise<{ rows: RateRow[]; technicians: { id: string; name: string }[]; error?: string }> {
  const [coverage, technicians] = await Promise.all([
    supabase
      .from('technician_coverage')
      .select('id, technician_id, make, model, scenario, from_year, to_year, keyless, excluded, price')
      .order('make')
      .order('model'),
    supabase.from('technicians').select('id, name').order('name'),
  ]);

  if (coverage.error) return { rows: [], technicians: [], error: coverage.error.message };

  const names = new Map((technicians.data ?? []).map((t) => [t.id as string, t.name as string]));

  let rows: RateRow[] = (coverage.data ?? []).map((row) => ({
    id: row.id as string,
    technicianId: row.technician_id as string,
    technician: names.get(row.technician_id as string) ?? 'Onbekend',
    make: row.make as string,
    model: row.model as string | null,
    scenario: row.scenario as Scenario,
    scenarioLabel: SCENARIO_INFO[row.scenario as Scenario]?.label ?? String(row.scenario),
    fromYear: row.from_year as number | null,
    toYear: row.to_year as number | null,
    keyless: row.keyless as boolean | null,
    excluded: Boolean(row.excluded),
    price: row.price === null ? null : Number(row.price),
  }));

  /* Free text over make, model and the person — one box, because the office
     searching this is thinking "golf" or "mukremin", not choosing a field. */
  const q = norm(filters.q);
  if (q) {
    rows = rows.filter((row) =>
      `${norm(row.make)} ${norm(row.model)} ${norm(row.technician)}`.includes(q)
    );
  }
  if (filters.technicianId) rows = rows.filter((row) => row.technicianId === filters.technicianId);
  if (filters.scenario) rows = rows.filter((row) => row.scenario === filters.scenario);

  /*
   * Grouped by car, cheapest first inside each group: the comparison is the
   * whole point, and a list sorted by technician hides it. Unpriced rows sink
   * to the bottom of their group — they are coverage, not an offer.
   */
  rows.sort((a, b) => {
    const car = `${a.make} ${a.model ?? ''}`.localeCompare(`${b.make} ${b.model ?? ''}`);
    if (car !== 0) return car;
    if (a.scenario !== b.scenario) return a.scenario.localeCompare(b.scenario);
    /* Year band before price: it is part of what makes a row a different
       offer, so two bands must not interleave into one apparent group. */
    const years = `${a.fromYear ?? ''}-${a.toYear ?? ''}`.localeCompare(`${b.fromYear ?? ''}-${b.toYear ?? ''}`);
    if (years !== 0) return years;
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });

  return { rows, technicians: (technicians.data ?? []) as { id: string; name: string }[] };
}

/** "2005–2014", "vanaf 2012", "t/m 2018", or a dash. */
export const yearLabel = (from: number | null, to: number | null): string =>
  from && to ? `${from}–${to}` : from ? `vanaf ${from}` : to ? `t/m ${to}` : '—';
