import { SITE_CONFIG } from '@/config/site.config';
import type { Scenario } from './scenarios';

/**
 * The flat, indicative price shown on public lead forms — before a real car
 * is known, this is all a visitor gets. Not the dispatch-pricing engine
 * (src/lib/dispatchPricing.ts) that prices an actual booked job; this is a
 * rough "vanaf €X" figure from two quick yes/no answers, shared so the
 * VehicleWizard and the kenteken form never show two different numbers for
 * the same answer.
 */

export type StartType = 'push' | 'key';
export type WorkingKeyType = 'yes' | 'no';

export interface PublicQuote {
  service: string;
  from: string;
  /** The canonical scenario this maps to, for storing on the lead. */
  scenario: Scenario;
}

export function publicQuoteFor(workingKey: WorkingKeyType | null, startType: StartType | null): PublicQuote | null {
  if (workingKey == null) return null;

  if (workingKey === 'no') {
    return { service: 'Alle sleutels kwijt (noodaanmaak)', from: SITE_CONFIG.prices.allKeysLost, scenario: 'alle_sleutels_kwijt' };
  }
  if (startType === 'push') {
    return { service: 'Smart key / keyless bijmaken', from: SITE_CONFIG.prices.smartKey, scenario: 'bijmaken' };
  }
  if (startType === 'key') {
    return { service: 'Transpondersleutel bijmaken', from: SITE_CONFIG.prices.transponder, scenario: 'bijmaken' };
  }
  return null;
}
