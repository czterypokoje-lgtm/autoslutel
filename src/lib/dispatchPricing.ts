/**
 * What the office charges for a dispatch job — maintained directly in
 * Tarieven, independent of the webshop's parts catalogue. Same matching rules
 * as technician_coverage (capability.ts): the most specific row wins.
 */

import { modelMatches, yearMatches, keylessMatches, specificity } from './capability';
import type { Car } from './capability';
import type { Scenario } from './scenarios';

export interface PriceRow {
  make: string;
  model: string | null;
  scenario: Scenario;
  from_year: number | null;
  to_year: number | null;
  keyless: boolean | null;
  price: number;
}

const norm = (value: string | null | undefined) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export interface PriceResult {
  price: number;
  confidence: 'model' | 'merk';
}

export function priceFor(
  rows: PriceRow[],
  car: Car,
  scenario: Scenario,
  keyless?: boolean | null
): PriceResult | null {
  const make = norm(car.make);
  const matches = rows.filter(
    (row) =>
      row.scenario === scenario &&
      norm(row.make) === make &&
      modelMatches(row.model, car.model) &&
      yearMatches(row, car.year) &&
      keylessMatches(row, keyless)
  );
  if (!matches.length) return null;

  const strongest = Math.max(...matches.map(specificity));
  const deciding = matches.filter((row) => specificity(row) === strongest);
  // Multiple rows can still tie at the same specificity (e.g. a keyless-specific
  // and a keyless-agnostic row for the same model) — the narrower keyless match wins.
  const row = deciding.find((r) => r.keyless != null) ?? deciding[0];

  /*
   * `strongest === 2` here was a leftover from when specificity() returned
   * small integers. It now returns 0/146/1000/1146 — the model term alone is
   * worth 1000 — so the test was never true and every quote came back 'merk',
   * including exact model-and-year matches, all the way out to the voice
   * agent. The model term is the thing being asked about, so read it.
   */
  return { price: row.price, confidence: row.model ? 'model' : 'merk' };
}
