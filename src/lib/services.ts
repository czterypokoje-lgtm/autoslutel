/**
 * The services, and what each one needs from the customer.
 *
 * Deliberately in a module of its own, with no 'use client' directive.
 *
 * They live next to the basket by rights, but src/lib/cart.ts is a client
 * module, and everything a server route imports from a client module comes
 * back as a client *reference* rather than the value — so
 * `SERVICE_OPTIONS.includes(...)` in the checkout route threw
 * "w.includes is not a function" and every order failed with a 500. Both
 * sides import this file directly and get the real objects.
 */

/**
 * What we do to the part before the customer gets it.
 *
 * A bare key is rarely what someone needs. Three things stand between the
 * article on the shelf and a key that opens a car, and each is work we do:
 *
 *   frezen      the blade is cut to the customer's key code or kenteken
 *   overzetten  the electronics move out of their old key into the new one
 *   programmeren the transponder is taught to the car — on the car itself
 *
 * In the buy box cutting and transfer are two tick boxes (two separate jobs);
 * underneath each basket line still carries one option, with 'cut_and_send'
 * for both. The technician does everything on location, so that one stays on
 * its own.
 */
export type ServiceOption = 'product_only' | 'cut_only' | 'send_in' | 'cut_and_send' | 'mobile_tech';

/**
 * Charged once per basket line, not per unit: one call-out or one parcel
 * covers every key on that line.
 *
 * PRICES TO CONFIRM WITH THE OFFICE. `send_in` and `mobile_tech` were already
 * in use; `cut_only` is new and set below what the transfer costs, because it
 * is the same postage with less work in the middle.
 */
export const SERVICE_SURCHARGE: Record<ServiceOption, number> = {
  product_only: 0,
  cut_only: 19.95,  // we cut the blade to a key code or kenteken and post it
  send_in: 29.95,   // the customer posts the old key, we move its electronics into the new one
  cut_and_send: 49.9, // both: two separate jobs, so both prices
  mobile_tech: 169, // technician comes out, cuts and programmes on location
};

export const SERVICE_LABEL: Record<ServiceOption, string> = {
  product_only: 'Alleen product',
  cut_only: 'Frezen op sleutelcode',
  send_in: 'Elektronica overzetten',
  cut_and_send: 'Frezen + elektronica overzetten',
  mobile_tech: 'Monteur aan huis',
};

/** One line on the buy box, under the label. */
export const SERVICE_DESCRIPTION: Record<ServiceOption, string> = {
  product_only: 'U ontvangt het artikel zoals het is.',
  cut_only: 'U geeft uw sleutelcode of kenteken door, wij frezen de baard en sturen hem op.',
  send_in: 'U stuurt uw oude sleutel op, wij zetten de elektronica over in de nieuwe.',
  cut_and_send: 'Wij zetten de elektronica over én frezen de baard op uw sleutelcode.',
  mobile_tech: 'Wij komen naar uw auto, frezen de sleutel en leren hem in.',
};

/** What we have to ask for before this service can be carried out. */
export const SERVICE_NEEDS: Record<ServiceOption, { kenteken: boolean; oldKey: boolean }> = {
  product_only: { kenteken: false, oldKey: false },
  cut_only: { kenteken: true, oldKey: false },
  send_in: { kenteken: true, oldKey: true },
  cut_and_send: { kenteken: true, oldKey: true },
  mobile_tech: { kenteken: true, oldKey: false },
};

export const SERVICE_OPTIONS: ServiceOption[] = [
  'product_only',
  'cut_only',
  'send_in',
  'cut_and_send',
  'mobile_tech',
];

/**
 * Which services are on offer for which kind of article.
 *
 * Offering all four everywhere would be worse than offering none: there is
 * nothing to transfer into a battery, nothing to programme on a blade, and a
 * customer who pays €169 for a technician to fit a rubber button pad has been
 * sold something we should not have listed.
 */
const SERVICES_BY_CATEGORY: Record<string, ServiceOption[]> = {
  afstandsbedieningen: ['product_only', 'cut_only', 'send_in', 'mobile_tech'],
  'smart-keys': ['product_only', 'send_in', 'mobile_tech'],
  behuizingen: ['product_only', 'cut_only', 'send_in'],
  printplaten: ['product_only', 'send_in', 'mobile_tech'],
  transponders: ['product_only', 'mobile_tech'],
  'universal-remotes': ['product_only', 'mobile_tech'],
  noodsleutels: ['product_only', 'cut_only'],
  sleutelbaarden: ['product_only', 'cut_only'],
  'overige-sleutels': ['product_only', 'cut_only', 'send_in', 'mobile_tech'],
  /* The categories the 2026 catalogue rebuild introduced. */
  transpondersleutels: ['product_only', 'cut_only', 'send_in', 'mobile_tech'],
  'sleutels-zonder-chip': ['product_only', 'cut_only'],
  motorsleutels: ['product_only', 'cut_only'],
  // A house or cabinet key is cut, never programmed, and there is nothing in
  // it to transfer.
  woningsleutels: ['product_only', 'cut_only'],
};

/** The services this product can be bought with. Always at least the article. */
/** Cutting and transfer are per key; a technician call-out is one visit. */
export const serviceTotal = (s: ServiceOption, quantity: number) =>
  s === 'mobile_tech' ? SERVICE_SURCHARGE[s] : SERVICE_SURCHARGE[s] * quantity;

export function servicesFor(category: string | null | undefined): ServiceOption[] {
  const list = SERVICES_BY_CATEGORY[category ?? ''] ?? ['product_only'];
  // Cutting and transfer are two separate jobs; where both exist, both together can be ordered.
  return list.includes('cut_only') && list.includes('send_in') ? [...list, 'cut_and_send'] : list;
}
