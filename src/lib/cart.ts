'use client';

import { shelfPrice, shippingFor, VAT_RATE } from './catalog';

/**
 * Shopping basket.
 *
 * Client-side only, kept in localStorage. Deliberately stores an id, a
 * quantity and a service choice — never a price. Prices are recomputed from
 * the catalogue on every render so a basket left open for a week cannot pay
 * yesterday's price, and a tampered localStorage cannot change what is
 * charged. The server recalculates again before creating an order.
 */

export const CART_KEY = 'as24_cart_v1';
export const CART_EVENT = 'as24:cart-changed';

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
 * They are one choice rather than a set of tick boxes because they contain
 * each other: our technician cuts and programmes on location, and a key we
 * transfer is cut in the same handling. Ticking two would charge twice for
 * the same work.
 */
export type ServiceOption = 'product_only' | 'cut_only' | 'send_in' | 'mobile_tech';

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
  send_in: 29.95,   // we transfer the electronics and cut the blade
  mobile_tech: 169, // technician comes out, cuts and programmes on location
};

export const SERVICE_LABEL: Record<ServiceOption, string> = {
  product_only: 'Alleen product',
  cut_only: 'Frezen op sleutelcode',
  send_in: 'Opsturen — wij zetten over',
  mobile_tech: 'Monteur aan huis',
};

/** One line on the buy box, under the label. */
export const SERVICE_DESCRIPTION: Record<ServiceOption, string> = {
  product_only: 'U ontvangt het artikel zoals het is.',
  cut_only: 'U geeft uw sleutelcode of kenteken door, wij frezen de baard en sturen hem op.',
  send_in: 'U stuurt uw oude sleutel op, wij zetten de elektronica over en frezen de baard.',
  mobile_tech: 'Wij komen naar uw auto, frezen de sleutel en leren hem in.',
};

/** What we have to ask for before this service can be carried out. */
export const SERVICE_NEEDS: Record<ServiceOption, { kenteken: boolean; oldKey: boolean }> = {
  product_only: { kenteken: false, oldKey: false },
  cut_only: { kenteken: true, oldKey: false },
  send_in: { kenteken: true, oldKey: true },
  mobile_tech: { kenteken: true, oldKey: false },
};

export const SERVICE_OPTIONS: ServiceOption[] = [
  'product_only',
  'cut_only',
  'send_in',
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
};

/** The services this product can be bought with. Always at least the article. */
export function servicesFor(category: string | null | undefined): ServiceOption[] {
  return SERVICES_BY_CATEGORY[category ?? ''] ?? ['product_only'];
}

export interface CartLine {
  slug: string;
  quantity: number;
  service: ServiceOption;
}

export function readCart(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && typeof l.slug === 'string')
      .map((l) => ({
        slug: l.slug,
        quantity: Math.min(20, Math.max(1, Number(l.quantity) || 1)),
        service: SERVICE_OPTIONS.includes(l.service) ? l.service : 'product_only',
      }));
  } catch {
    return [];
  }
}

function persist(lines: CartLine[]): void {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    // Private mode — the basket still works for this page view.
  }
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function addToCart(slug: string, service: ServiceOption = 'product_only'): void {
  const lines = readCart();
  // Same product with a different service is a separate line: one customer may
  // want two shells, one fitted and one to post.
  const existing = lines.find((l) => l.slug === slug && l.service === service);
  if (existing) existing.quantity = Math.min(20, existing.quantity + 1);
  else lines.push({ slug, quantity: 1, service });
  persist(lines);
}

export function setQuantity(slug: string, service: ServiceOption, quantity: number): void {
  const lines = readCart()
    .map((l) => (l.slug === slug && l.service === service ? { ...l, quantity } : l))
    .filter((l) => l.quantity > 0);
  persist(lines);
}

export function removeLine(slug: string, service: ServiceOption): void {
  persist(readCart().filter((l) => !(l.slug === slug && l.service === service)));
}

export function clearCart(): void {
  persist([]);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

/* ── totals ───────────────────────────────────────────────────────────── */

export interface PricedLine extends CartLine {
  title: string;
  unitPrice: number;      // incl. VAT, product only
  serviceSurcharge: number;
  lineTotal: number;      // incl. VAT
  image: string | null;
  requiresProgramming: boolean;
}

export interface CartTotals {
  lines: PricedLine[];
  subtotalInc: number;
  shipping: number;
  totalInc: number;
  totalVat: number;
  totalExVat: number;
}

type Lookup = (slug: string) => {
  titleNl: string;
  costPrice: number | null;
  image: string | null;
  category: string | null;
} | undefined;

const PROGRAMMED_CATEGORIES = new Set([
  'afstandsbedieningen',
  'smart-keys',
  'transponders',
]);

/**
 * Prices the basket. Pure, and used by both the cart page and the order API so
 * the number the customer sees is the number the server charges.
 */
export function priceCart(lines: CartLine[], lookup: Lookup): CartTotals {
  const priced: PricedLine[] = [];

  for (const line of lines) {
    const p = lookup(line.slug);
    if (!p) continue; // product withdrawn since it was added
    const unitPrice = shelfPrice(p.costPrice);
    if (unitPrice == null) continue;

    const surcharge = SERVICE_SURCHARGE[line.service];
    priced.push({
      ...line,
      title: p.titleNl,
      unitPrice,
      serviceSurcharge: surcharge,
      // The service is charged once per line, not per unit: one call-out
      // covers every key in that line.
      lineTotal: Math.round((unitPrice * line.quantity + surcharge) * 100) / 100,
      image: p.image,
      requiresProgramming: PROGRAMMED_CATEGORIES.has(p.category ?? ''),
    });
  }

  const subtotalInc = Math.round(priced.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
  const shipping = priced.length ? shippingFor(subtotalInc) : 0;
  const totalInc = Math.round((subtotalInc + shipping) * 100) / 100;
  const totalExVat = Math.round((totalInc / (1 + VAT_RATE)) * 100) / 100;

  return {
    lines: priced,
    subtotalInc,
    shipping,
    totalInc,
    totalVat: Math.round((totalInc - totalExVat) * 100) / 100,
    totalExVat,
  };
}
