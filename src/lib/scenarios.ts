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
