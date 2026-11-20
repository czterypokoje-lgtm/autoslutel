/**
 * Shapes and formatters for the Autosleutel24 klanten list in the Studio
 * look. The row is exactly what klanten/page.tsx already selects from
 * crm_customers — nothing extra is read, nothing is renamed.
 */

export interface CustomerRow {
  phone_e164: string;
  name: string | null;
  email: string | null;
  first_seen: string;
  last_seen: string;
  lead_count: number;
  sold_count: number;
  total_value: number | string;
  consent_marketing: boolean | null;
  postcode: string | null;
}

export const ALL = 'Alle';

export const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export const DATE = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' });

/** Did they ever buy? The only distinction the old list drew, as a filter. */
export type BuyerFilter = 'Kochten iets' | 'Alleen aanvragen';
export const buyerOptions: BuyerFilter[] = ['Kochten iets', 'Alleen aanvragen'];
export const buyerOf = (row: CustomerRow): BuyerFilter => (row.sold_count > 0 ? 'Kochten iets' : 'Alleen aanvragen');

export type ConsentFilter = 'Toestemming' | 'Geen toestemming';
export const consentOptions: ConsentFilter[] = ['Toestemming', 'Geen toestemming'];
export const consentOf = (row: CustomerRow): ConsentFilter => (row.consent_marketing ? 'Toestemming' : 'Geen toestemming');
