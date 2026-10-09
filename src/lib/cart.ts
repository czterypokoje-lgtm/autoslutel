/**
 * The basket.
 *
 * It holds slugs and quantities and nothing else that matters. The title,
 * photo and price it also stores are there so the basket can be drawn without
 * a round trip — they are a cache of what the visitor saw, never an input to
 * what they are charged.
 *
 * **The server recomputes every price at checkout from the catalogue.** That
 * is the same rule the voice agent already follows (`/api/agent/book`
 * re-prices server-side so a caller who talks the agent into a number cannot
 * make it binding). A basket lives in the visitor's own browser, so treating
 * its prices as authoritative would mean anyone could buy a smart key for
 * one cent by editing localStorage. `/api/checkout` therefore reads only
 * `slug` and `qty` off the wire.
 *
 * Shared by the client components and by the checkout route, so the line
 * shape is defined once.
 */

export const CART_KEY = 'as24-mandje-v1';

/** Nobody needs 50 of one housing, and a huge qty is an attack on our stock. */
export const MAX_QTY_PER_LINE = 10;

export interface CartLine {
  slug: string;
  qty: number;
  /** Cached for display only. Never trusted for money. */
  title: string;
  price: number;
  image: string | null;
}

/** What `/api/checkout` accepts: the two fields that are not advisory. */
export interface CheckoutLine {
  slug: string;
  qty: number;
}

/* ── storage ──────────────────────────────────────────────────────────── */

/**
 * Reading never throws.
 *
 * localStorage is unavailable in a private window with site data blocked, and
 * the accessor itself can throw rather than returning null. A shop that
 * white-screens because the basket could not be read is worse than a shop
 * with an empty basket.
 */
export function readCart(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLine).map(clamp);
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    /* Full or blocked. The basket stays in memory for this page view. */
  }
}

function isLine(value: unknown): value is CartLine {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.slug === 'string' &&
    v.slug.length > 0 &&
    v.slug.length < 200 &&
    typeof v.qty === 'number' &&
    Number.isFinite(v.qty)
  );
}

function clamp(line: CartLine): CartLine {
  return {
    slug: line.slug,
    qty: Math.min(MAX_QTY_PER_LINE, Math.max(1, Math.floor(line.qty))),
    title: typeof line.title === 'string' ? line.title.slice(0, 300) : '',
    price: typeof line.price === 'number' && Number.isFinite(line.price) ? line.price : 0,
    image: typeof line.image === 'string' ? line.image : null,
  };
}

/* ── operations ───────────────────────────────────────────────────────── */

/** Adding the same article again raises its quantity rather than duplicating it. */
export function addLine(lines: CartLine[], line: CartLine): CartLine[] {
  const existing = lines.find((l) => l.slug === line.slug);
  if (!existing) return [...lines, clamp(line)];
  return lines.map((l) =>
    l.slug === line.slug ? clamp({ ...l, qty: l.qty + line.qty }) : l
  );
}

export function setQty(lines: CartLine[], slug: string, qty: number): CartLine[] {
  if (qty <= 0) return lines.filter((l) => l.slug !== slug);
  return lines.map((l) => (l.slug === slug ? clamp({ ...l, qty }) : l));
}

export function removeLine(lines: CartLine[], slug: string): CartLine[] {
  return lines.filter((l) => l.slug !== slug);
}

export const cartCount = (lines: CartLine[]): number =>
  lines.reduce((sum, l) => sum + l.qty, 0);

/** Display only — the checkout's own total is the one that is charged. */
export const cartSubtotal = (lines: CartLine[]): number =>
  Math.round(lines.reduce((sum, l) => sum + l.price * l.qty, 0) * 100) / 100;
