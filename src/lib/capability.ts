/**
 * Who can do which car.
 *
 * This is the question the whole platform turns on. A voice agent cannot
 * promise a slot without it, dispatch cannot choose without it, and a partner
 * cannot send us work without it. Until now it lived in one person's head,
 * which does not survive a second technician or a night shift.
 *
 * Coverage is *declared*, not derived. The catalogue holds car lists for only
 * 34 tool articles — 131 cars, and one OBDSTAR kit accounts for 49 of them — so
 * tool ownership seeds a technician's list and sanity-checks it, but the
 * technician is the authority on what they can actually do.
 *
 * The matching below is deliberately conservative: an unknown car is a no. A
 * job we decline costs one lead; a job we accept and cannot do costs the
 * call-out, the customer, and the review.
 */

import type { Scenario } from './scenarios';
import { getProducts } from './catalog';

export interface CoverageRow {
  technician_id: string;
  make: string;
  model: string | null;
  scenario: Scenario;
  from_year: number | null;
  to_year: number | null;
  excluded: boolean;
  /** null = the technician covers both a smart key and a bladed key here. */
  keyless: boolean | null;
}

export interface Car {
  make: string;
  model?: string | null;
  year?: number | null;
}

const norm = (value: string | null | undefined) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Does a coverage row's model field cover this car's model?
 *
 * Loose in one direction only: a row for "Golf" covers a "Golf Sportsvan",
 * because a technician who declares Golf means the family. A row for "Golf
 * Sportsvan" does not cover a plain "Golf" — that would be us widening a claim
 * the technician did not make.
 */
function modelMatches(rowModel: string | null, carModel: string | null | undefined): boolean {
  if (!rowModel) return true; // the row covers the whole make
  const row = norm(rowModel);
  const car = norm(carModel);
  if (!car) return false; // caller did not say; do not assume the specific row
  return car === row || car.startsWith(`${row} `);
}

function yearMatches(row: CoverageRow, year: number | null | undefined): boolean {
  if (row.from_year == null && row.to_year == null) return true;
  if (year == null) return true; // no year stated: do not exclude on it
  if (row.from_year != null && year < row.from_year) return false;
  if (row.to_year != null && year > row.to_year) return false;
  return true;
}

/**
 * A bladed key and a smart key are different work — different blanks,
 * usually a different tool. `null` on the row means the technician declared
 * both; `null` on the request means the car's key type is not known, and an
 * unknown must not exclude a row any more than an unstated year does.
 */
function keylessMatches(row: CoverageRow, keyless: boolean | null | undefined): boolean {
  if (row.keyless == null) return true;
  if (keyless == null) return true;
  return row.keyless === keyless;
}

/** A model-specific row outranks a make-wide one, whichever way it points. */
const specificity = (row: CoverageRow) => (row.model ? 2 : 1);

/**
 * Whether these coverage rows say yes to this car and scenario.
 *
 * The most specific matching row wins, so "all Volkswagen, except the Touareg"
 * is two rows rather than a list of every Volkswagen that is not a Touareg.
 */
export function coversCar(
  rows: CoverageRow[],
  car: Car,
  scenario: Scenario,
  keyless?: boolean | null
): boolean {
  const make = norm(car.make);
  const matches = rows.filter(
    (row) =>
      row.scenario === scenario &&
      norm(row.make) === make &&
      modelMatches(row.model, car.model) &&
      yearMatches(row, car.year) &&
      keylessMatches(row, keyless)
  );

  if (!matches.length) return false;

  const strongest = Math.max(...matches.map(specificity));
  const deciding = matches.filter((row) => specificity(row) === strongest);
  // A single exclusion at the deciding level is a no: the technician said no
  // to this car specifically, and that beats a general yes.
  return deciding.some((row) => !row.excluded) && !deciding.some((row) => row.excluded);
}

/** Group flat coverage rows by technician, ready for coversCar. */
export function byTechnician(rows: CoverageRow[]): Map<string, CoverageRow[]> {
  const out = new Map<string, CoverageRow[]>();
  for (const row of rows) {
    const list = out.get(row.technician_id) ?? [];
    list.push(row);
    out.set(row.technician_id, list);
  }
  return out;
}

/** The technicians whose declared coverage says yes to this job. */
export function whoCanDo(rows: CoverageRow[], car: Car, scenario: Scenario, keyless?: boolean | null): string[] {
  return [...byTechnician(rows)]
    .filter(([, list]) => coversCar(list, car, scenario, keyless))
    .map(([id]) => id);
}

/* ── seeding from the tools we sell ──────────────────────────────────── */

export interface ToolSuggestion {
  make: string;
  model: string;
  from: number | null;
  to: number | null;
}

/**
 * The cars an article in our own catalogue says it covers.
 *
 * Used to offer a technician a starting list rather than an empty form: they
 * tick the tool they own, we propose the cars, they correct it. The OBDSTAR
 * C1022 kit alone names 49, with the year each one starts.
 */
export function carsCoveredByTool(articleCode: string): ToolSuggestion[] {
  const product = getProducts('all').find(
    (p) => p.articleCode && p.articleCode.toLowerCase() === articleCode.toLowerCase()
  );
  if (!product) return [];

  return product.fitment
    .filter((f) => f.model)
    .map((f) => ({
      make: f.make,
      model: f.model as string,
      from: f.from && f.from > 1950 ? f.from : null,
      to: f.to && f.to < 9000 ? f.to : null,
    }));
}

/** Every article we sell that names cars — the pick list for the tool form. */
export function toolsWithCoverage(): { code: string; title: string; cars: number }[] {
  const WORKSHOP = ['programmeerapparatuur', 'accessoires', 'sleutelmachines', 'gereedschap'];
  return getProducts('all')
    .filter((p) => WORKSHOP.includes(p.category ?? '') && p.fitment.some((f) => f.model))
    .map((p) => ({
      code: p.articleCode ?? p.slug,
      title: p.titleNl,
      cars: p.fitment.filter((f) => f.model).length,
    }))
    .sort((a, b) => b.cars - a.cars);
}
