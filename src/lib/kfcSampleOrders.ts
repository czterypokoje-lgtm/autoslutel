import 'server-only';
import catalog from '@/data/keyforcars-stock.json';
import prices from '@/data/keyforcars-prices.json';

/**
 * Sample orders for the KeyForCars preview.
 *
 * The products, photos and prices are real (the shops' public catalogue and
 * Store API prices, see scripts/kfc-sample-prices.mjs). The orders are
 * invented: how many, which product, which shop. They are generated from a
 * fixed seed per day, so a reload shows the same numbers, yesterday stays
 * yesterday, and today fills up as the clock moves. Nothing here is stored.
 *
 * In the real install this module is replaced by the WooCommerce import; the
 * screens read the same SampleOrder shape.
 */

export const SHOPS = ['keyforcars.nl', 'klapsleutels.nl', 'remkeys.com'] as const;
export type Shop = (typeof SHOPS)[number];
export type OrderStatus = 'processing' | 'completed' | 'on-hold' | 'cancelled' | 'refunded';

export interface SampleLine {
  sku: string;
  name: string;
  image: string;
  quantity: number;
  /** Cents, VAT included, as the shop shows it. */
  unitIncl: number;
}

export interface SampleOrder {
  number: string;
  shop: Shop;
  /** ISO time, UTC. */
  created: string;
  status: OrderStatus;
  country: string;
  lines: SampleLine[];
  shippingIncl: number;
  totalIncl: number;
  /** Lines and shipping without 21% VAT. */
  totalExcl: number;
}

/** Statuses that count as a sale: paid and not undone. */
export const SOLD: readonly OrderStatus[] = ['processing', 'completed'];

const VAT = 1.21;
const DAY = 86_400_000;
const HISTORY_DAYS = 120;

/** Small deterministic PRNG, so a day's orders are the same on every request. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const priceList = prices as Record<string, number>;
const products = catalog
  .filter((article) => article.sku && priceList[article.sku.toUpperCase()])
  .map((article) => ({
    sku: article.sku,
    name: article.name,
    image: article.image,
    price: priceList[article.sku.toUpperCase()],
  }));

/*
 * Popularity: a fixed shuffle, then a steep curve, so a few dozen products
 * sell every week, most sell now and then, and a long tail never sells — the
 * shape real catalogues have, and the reason a "not sold" list is useful.
 */
const ranked = (() => {
  const random = mulberry32(20261118);
  const list = [...products];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
})();
const weights = ranked.map((_, rank) => 1 / (rank + 8) ** 1.25);
const cumulative = weights.reduce<number[]>((acc, w) => {
  acc.push((acc.at(-1) ?? 0) + w);
  return acc;
}, []);
const totalWeight = cumulative.at(-1) ?? 1;

function pickProduct(random: () => number) {
  const target = random() * totalWeight;
  let low = 0;
  let high = cumulative.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (cumulative[mid] < target) low = mid + 1;
    else high = mid;
  }
  // Only the top part of the list ever sells; the rest is the dead tail.
  return ranked[Math.min(low, Math.floor(ranked.length * 0.62))];
}

const SHOP_WEIGHTS: [Shop, number][] = [['keyforcars.nl', 0.46], ['klapsleutels.nl', 0.34], ['remkeys.com', 0.2]];
const NUMBER_BASE: Record<Shop, number> = { 'keyforcars.nl': 48210, 'klapsleutels.nl': 31540, 'remkeys.com': 90870 };
const ABROAD = ['DE', 'BE', 'FR', 'GB', 'AT', 'IT', 'ES', 'PL'];

function pickShop(random: () => number): Shop {
  let r = random();
  for (const [shop, weight] of SHOP_WEIGHTS) {
    if ((r -= weight) <= 0) return shop;
  }
  return 'keyforcars.nl';
}

function ordersForDay(dayIndex: number, dayStart: number, now: number): SampleOrder[] {
  const random = mulberry32(dayIndex * 7919 + 17);
  const weekday = new Date(dayStart).getUTCDay();
  const weekend = weekday === 0 || weekday === 6;
  const count = Math.round(weekend ? 14 + random() * 12 : 28 + random() * 22);
  const ageDays = Math.floor((now - dayStart) / DAY);
  const counters: Record<Shop, number> = { 'keyforcars.nl': 0, 'klapsleutels.nl': 0, 'remkeys.com': 0 };
  const orders: SampleOrder[] = [];

  for (let i = 0; i < count; i++) {
    // Most orders between 08:00 and 23:00 Amsterdam time (roughly 07–22 UTC).
    const minute = Math.floor((7 + random() * 15) * 60);
    const created = dayStart + minute * 60_000;
    const shop = pickShop(random);
    counters[shop]++;

    // Draw everything for this order before deciding to skip it, so an order
    // that appears later today is the same one it will be tomorrow.
    const lineCount = random() < 0.76 ? 1 : random() < 0.8 ? 2 : 3;
    const lines: SampleLine[] = [];
    for (let l = 0; l < lineCount; l++) {
      const product = pickProduct(random);
      const quantity = random() < 0.86 ? 1 : 2;
      if (lines.some((line) => line.sku === product.sku)) continue;
      lines.push({ sku: product.sku, name: product.name, image: product.image, quantity, unitIncl: product.price });
    }
    const abroad = random();
    const country = shop === 'remkeys.com'
      ? (abroad < 0.35 ? 'NL' : ABROAD[Math.floor(random() * ABROAD.length)])
      : (abroad < 0.9 ? 'NL' : 'BE');
    const roll = random();
    if (created > now) continue;

    const shippingIncl = shop === 'remkeys.com' && country !== 'NL' ? 995 : 495;
    const linesIncl = lines.reduce((sum, line) => sum + line.unitIncl * line.quantity, 0);
    const totalIncl = linesIncl + shippingIncl;
    const status: OrderStatus =
      ageDays < 1 ? (roll < 0.06 ? 'on-hold' : 'processing')
      : ageDays < 3 ? (roll < 0.03 ? 'on-hold' : roll < 0.45 ? 'processing' : 'completed')
      : roll < 0.025 ? 'refunded'
      : roll < 0.05 ? 'cancelled'
      : 'completed';

    orders.push({
      // Each shop counts up from its own base; 40 numbers a day leaves room for the busiest day.
      number: String(NUMBER_BASE[shop] + (dayIndex % 1000) * 40 + counters[shop]),
      shop,
      created: new Date(created).toISOString(),
      status,
      country,
      lines,
      shippingIncl,
      totalIncl,
      totalExcl: Math.round(totalIncl / VAT),
    });
  }
  return orders;
}

let cache: { key: number; orders: SampleOrder[] } | undefined;

/** Every sample order of the last 120 days, newest first. */
export function sampleOrders(now = Date.now()): SampleOrder[] {
  const key = Math.floor(now / 60_000); // one generation per minute is plenty
  if (cache?.key === key) return cache.orders;
  const today = Math.floor(now / DAY);
  const orders: SampleOrder[] = [];
  for (let day = today - HISTORY_DAYS + 1; day <= today; day++) {
    orders.push(...ordersForDay(day, day * DAY, now));
  }
  orders.sort((a, b) => b.created.localeCompare(a.created));
  cache = { key, orders };
  return orders;
}

/** Every product with a price, for the "not sold" list. */
export function sampleCatalogue() {
  return products;
}
