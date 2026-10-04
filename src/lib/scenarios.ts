/**
 * The four kinds of on-site work.
 *
 * These are not degrees of one job. A spare key is twenty minutes and most
 * technicians can do it; all keys lost needs a stronger tool, often a PIN read,
 * and takes hours. Quoting one price for both loses money on half the jobs and
 * loses the customer on the other half.
 *
 * The `question` on each is what a caller is actually asked. Nobody on a phone
 * knows whether their car has an 8A chip; everybody knows whether they still
 * have a key that works.
 *
 * No 'use client' here on purpose — the agent API routes import this, and a
 * server route that imports a client module receives client references instead
 * of values. That mistake once 500'd every checkout on this site.
 */

export const SCENARIOS = ['bijmaken', 'alle_sleutels_kwijt', 'reparatie', 'slot'] as const;

export type Scenario = (typeof SCENARIOS)[number];

export interface ScenarioInfo {
  label: string;
  /** One line, in the words a customer would use. */
  blurb: string;
  /** Roughly how long, for sizing a slot before we have real measurements. */
  minutes: number;
  /** Labour, excluding the part. Ours to set; the agent only ever reads it. */
  labour: number;
  /** Does this scenario need the car to be programmed at all? */
  programming: boolean;
}

export const SCENARIO_INFO: Record<Scenario, ScenarioInfo> = {
  bijmaken: {
    label: 'Sleutel bijmaken',
    blurb: 'U heeft nog een werkende sleutel en wilt er een tweede bij.',
    minutes: 45,
    labour: 95,
    programming: true,
  },
  alle_sleutels_kwijt: {
    label: 'Alle sleutels kwijt',
    blurb: 'U heeft geen enkele werkende sleutel meer.',
    minutes: 150,
    labour: 245,
    programming: true,
  },
  reparatie: {
    label: 'Sleutel repareren',
    blurb: 'De sleutel werkt, maar de behuizing, de knoppen of het baardje niet.',
    minutes: 30,
    labour: 55,
    programming: false,
  },
  slot: {
    label: 'Slot of cilinder',
    blurb: 'Het slot zelf is stuk, of de sleutel draait niet meer.',
    minutes: 60,
    labour: 125,
    programming: false,
  },
};

export const isScenario = (value: unknown): value is Scenario =>
  typeof value === 'string' && (SCENARIOS as readonly string[]).includes(value);

/**
 * The question that decides the scenario, for the agent's script.
 *
 * Asked in this order because the first answer removes most of the branches:
 * someone with a working key is never an all-keys-lost job, whatever else they
 * say.
 */
export const INTAKE_QUESTIONS = [
  { key: 'make', ask: 'Wat voor auto is het — welk merk?' },
  { key: 'model', ask: 'En welk model?' },
  { key: 'year', ask: 'Weet u ongeveer het bouwjaar?' },
  {
    key: 'working_key',
    ask: 'Heeft u nog een sleutel die het doet?',
    why: 'Splits bijmaken van alle sleutels kwijt — het grootste verschil in prijs en tijd.',
  },
  {
    key: 'keyless',
    ask: 'Moet u de sleutel in het contact steken, of start de auto met een knop?',
    why: 'Bevestigt smart key en lost meteen de uitvoering op.',
  },
  { key: 'postcode', ask: 'Wat is de postcode waar de auto staat?' },
] as const;

/**
 * The scenario behind a service name the office typed or picked.
 *
 * The four labels in SERVICE_OPTIONS (jobs/nieuw/CarPicker.tsx) are the four
 * scenario labels verbatim, so the office has been choosing the scenario all
 * along — it just landed in `service_type` as text and never became the enum
 * that pricing, coverage and dispatch all read. The result was 0 of 20 open
 * jobs carrying a scenario, and every technician being asked for a price they
 * had already published in mijn-vak.
 *
 * Only an exact label match counts. "Auto openen zonder sleutel" is a real
 * service with no scenario of its own, and guessing one for it would quote a
 * customer from the wrong row of somebody's price list.
 */
export function scenarioFromLabel(label: string | null | undefined): Scenario | null {
  const wanted = String(label ?? '').trim().toLowerCase();
  if (!wanted) return null;
  for (const [key, info] of Object.entries(SCENARIO_INFO)) {
    if (info.label.toLowerCase() === wanted) return key as Scenario;
  }

  /*
   * Free text from the website and from older jobs: "Reservesleutel
   * bijmaken", "Alle sleutel Kwijt", "Smart key / keyless bijmaken". The
   * wording varies, the meaning does not.
   *
   * Only where one reading is possible. "Contactslot reparatie" is both a
   * lock and a repair, and a wrong scenario here does not produce a wrong
   * label — it produces a wrong price quoted to a customer out of somebody's
   * price list. Ambiguous stays null, and the office sets it by hand.
   */
  const lost = /\bkwijt\b|\ball keys lost\b/.test(wanted);
  const copy = /bijmaken|reserve|extra sleutel/.test(wanted);
  const lock = /cilinder|contactslot|\bslot\b/.test(wanted);
  const repair = /reparatie|repareren|\brepair\b/.test(wanted);

  if (lost && !copy) return 'alle_sleutels_kwijt';
  if (copy && !lost && !lock) return 'bijmaken';
  if (lock && !repair && !copy && !lost) return 'slot';
  if (repair && !lock && !copy && !lost) return 'reparatie';
  return null;
}
