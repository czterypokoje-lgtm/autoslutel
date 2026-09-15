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

/*
 * The service definitions live in ./services, which has no 'use client'
 * directive — the checkout route and the CRM are server code and need the
 * real values, not client references. Re-exported here so basket code can
 * keep importing everything from one place.
 */
export type { ServiceOption } from './services';
export {
  SERVICE_SURCHARGE,
  SERVICE_LABEL,
  SERVICE_DESCRIPTION,
  SERVICE_NEEDS,
  SERVICE_OPTIONS,
  servicesFor,
} from './services';

import { SERVICE_OPTIONS, SERVICE_SURCHARGE } from './services';
import type { ServiceOption } from './services';

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
  'transpondersleutels',
  'printplaten',
  'universal-remotes',
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
