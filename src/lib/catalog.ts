import catalogJson from './catalog.json';

/**
 * Typed access to the catalogue built by scripts/build-catalog.mjs.
 *
 * Filtering happens here rather than in the components so that the facet
 * counts and the result set can never disagree — they are computed from the
 * same pass over the same data.
 */

export type Audience = 'public' | 'trade';

export interface Fitment {
  make: string;
  model: string;
  from: number;
  to: number;
}

export interface CatalogProduct {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  subcategory: string | null;
  audience: Audience;
  makes: string[];
  manufacturer: string | null;
  condition: string;
  buttons: number | null;
  frequency: string | null;
  chip: string | null;
  costPrice: number | null;
  image: string | null;
  fitment: Fitment[];
  excerpt: string;
}

const catalog = catalogJson as unknown as {
  generatedAt: string;
  count: number;
  products: CatalogProduct[];
};

/**
 * Trade-only lines (lock picks, decoders, key programmers) never appear in the
 * public catalogue. Callers must opt in explicitly, and only behind a verified
 * business login — see the audience note in scripts/build-catalog.mjs.
 */
export function getProducts(audience: Audience = 'public'): CatalogProduct[] {
  return catalog.products.filter((p) => p.audience === audience);
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return catalog.products.find((p) => p.slug === slug);
}

/* ── pricing ──────────────────────────────────────────────────────────── */

/**
 * The raw feed carries the supplier's cost, not our shelf price. Margin, VAT
 * and rounding are applied in one place so a price can never be shown that the
 * checkout would not charge.
 *
 * MIN_PRICE exists because a €0.79 blade cannot be posted for less than the
 * postage; anything below it is sold as part of a bundle, not on its own.
 */
export const VAT_RATE = 0.21;
export const MARGIN = 1.65;
export const MIN_PRICE = 7.95;

export function shelfPrice(costPrice: number | null): number | null {
  if (costPrice == null || !Number.isFinite(costPrice)) return null;
  const withMargin = costPrice * MARGIN * (1 + VAT_RATE);
  const rounded = Math.max(MIN_PRICE, Math.ceil(withMargin) - 0.05);
  return Math.round(rounded * 100) / 100;
}

export function formatPrice(value: number | null): string {
  if (value == null) return 'op aanvraag';
  return `€${value.toFixed(2).replace('.', ',')}`;
}

/* ── filtering ────────────────────────────────────────────────────────── */

export interface Filters {
  category?: string;
  subcategory?: string;
  make?: string;
  manufacturer?: string;
  condition?: string;
  buttons?: number;
  frequency?: string;
  maxPrice?: number;
  /** Free-text, matched against title and fitment. */
  q?: string;
}

function matches(p: CatalogProduct, f: Filters): boolean {
  if (f.category && p.category !== f.category) return false;
  if (f.subcategory && p.subcategory !== f.subcategory) return false;
  if (f.make && !p.makes.includes(f.make)) return false;
  if (f.manufacturer && p.manufacturer !== f.manufacturer) return false;
  if (f.condition && p.condition !== f.condition) return false;
  if (f.buttons && p.buttons !== f.buttons) return false;
  if (f.frequency && p.frequency !== f.frequency) return false;
  if (f.maxPrice != null) {
    const price = shelfPrice(p.costPrice);
    if (price == null || price > f.maxPrice) return false;
  }
  if (f.q) {
    const needle = f.q.toLowerCase();
    const hay = `${p.title} ${p.fitment.map((x) => `${x.make} ${x.model}`).join(' ')}`.toLowerCase();
    if (!hay.includes(needle)) return false;
  }
  return true;
}

export function filterProducts(
  products: CatalogProduct[],
  filters: Filters
): CatalogProduct[] {
  return products.filter((p) => matches(p, filters));
}

export type FacetKey =
  | 'category' | 'subcategory' | 'make'
  | 'manufacturer' | 'condition' | 'buttons' | 'frequency';

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

const LABELS: Record<string, string> = {
  afstandsbedieningen: 'Afstandsbedieningen',
  'smart-keys': 'Smart keys / keyless',
  sleutelbaarden: 'Sleutelbaarden',
  behuizingen: 'Sleutelbehuizingen',
  transponders: 'Transponders',
  batterijen: 'Batterijen',
  sloten: 'Sloten & cilinders',
  accessoires: 'Accessoires',
  gereedschap: 'Gereedschap',
  genuine: 'Origineel',
  oem: 'OEM',
  aftermarket: 'Aftermarket',
};

export const facetLabel = (key: FacetKey, value: string): string => {
  if (key === 'buttons') return `${value} knoppen`;
  return LABELS[value] ?? value;
};

/** Reads the value(s) a product contributes to a given facet. */
function valuesFor(p: CatalogProduct, key: FacetKey): (string | number | null)[] {
  if (key === 'make') return p.makes;
  if (key === 'category') return [p.category];
  if (key === 'subcategory') return [p.subcategory];
  return [p[key] as string | number | null];
}

/**
 * Counts each facet against the result set that *excludes that facet's own
 * selection*. Without this, choosing "3 knoppen" would leave the buttons list
 * showing only "3 knoppen (112)" and the visitor could never widen it again.
 */
export function buildFacets(
  products: CatalogProduct[],
  filters: Filters,
  keys: FacetKey[]
): Record<string, FacetOption[]> {
  const out: Record<string, FacetOption[]> = {};

  for (const key of keys) {
    const others: Filters = { ...filters };
    delete others[key === 'make' ? 'make' : (key as keyof Filters)];

    const counts = new Map<string, number>();
    for (const p of products) {
      if (!matches(p, others)) continue;
      for (const v of valuesFor(p, key)) {
        if (v == null || v === '') continue;
        const s = String(v);
        counts.set(s, (counts.get(s) ?? 0) + 1);
      }
    }

    const options = [...counts.entries()]
      .map(([value, count]) => ({ value, label: facetLabel(key, value), count }))
      .sort((a, b) =>
        key === 'buttons' ? Number(a.value) - Number(b.value) : b.count - a.count
      );

    // A facet with fewer than two options tells the visitor nothing and only
    // adds height. Attribute coverage here is uneven by nature — most of the
    // catalogue has no button count — so this check does real work.
    if (options.length > 1) out[key] = options;
  }

  return out;
}

export function priceRange(products: CatalogProduct[]): [number, number] {
  const prices = products
    .map((p) => shelfPrice(p.costPrice))
    .filter((v): v is number => v != null);
  if (!prices.length) return [0, 0];
  return [Math.min(...prices), Math.max(...prices)];
}
