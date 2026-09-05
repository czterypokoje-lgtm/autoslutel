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
  /** Key blade profile, e.g. VA2 / VA6 — A-Key's "Schlüsselbart". */
  blade: string | null;
  /** Slug of the battery this key takes, when the supplier names one. */
  battery?: string | null;
  costPrice: number | null;
  image: string | null;
  images: string[];
  fitment: Fitment[];
  /** Original supplier text, kept for reference and search only. */
  excerpt: string;

  /* Dutch copy generated in scripts/build-catalog.mjs from the fields above.
     The supplier's own text is English and identical to the text on their
     site; Google picks one source for duplicate copy and it is rarely the
     newer shop. */
  titleNl: string;
  descriptionNl: string;
  /** Self-contained answer for featured snippets and LLM citation. */
  directAnswer: string;
  metaDescriptionNl: string;

  /** Label/value pairs derived from the supplier data: chip, frequency, … */
  specs?: [string, string][];
  /** The fitment list exactly as the supplier states it, for display. */
  vehiclesRaw?: string | null;
  /** The article the supplier says supersedes this one. */
  replacedBy?: string | null;
  /**
   * Lines of the supplier's own description that did not translate cleanly.
   * Shown as their German original rather than half in Dutch.
   */
  supplierNote?: string[] | null;
  /**
   * The description in sections: an intro, the vehicles grouped by make, and
   * the chips. One paragraph of eleven lines is not something anyone reads.
   */
  content?: {
    intro: string[];
    vehicles: { make: string; note: string | null; models: string[] }[];
    chips: string[];
  } | null;
  /** The supplier's own article code, when their export carries one. */
  articleCode?: string | null;
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
export function getProducts(audience: Audience | 'all' = 'public'): CatalogProduct[] {
  return audience === 'all' ? catalog.products : catalog.products.filter((p) => p.audience === audience);
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

/**
 * Margin is tiered, not flat.
 *
 * A flat multiplier fails at both ends. On a €0.79 blade it leaves almost no
 * absolute margin, and a hard price floor to compensate made us five times
 * dearer than the market: auto-sleutel.nl lists blades "zo laag als €1,55".
 * On a €249 smart key the same multiplier produced €496, which nobody pays.
 *
 * Cheap parts carry a high multiplier because the money is in the order, not
 * the line; expensive parts carry a thin one because the absolute margin is
 * already there.
 *
 * These numbers are a starting point, not a recommendation — they depend on
 * your supplier terms and exchange rate. Change them here and every price on
 * the site, in the schema and in the Merchant Center feed follows.
 */
export const MARGIN_TIERS: { upTo: number; multiplier: number }[] = [
  { upTo: 5, multiplier: 3.0 },
  { upTo: 20, multiplier: 2.2 },
  { upTo: 50, multiplier: 1.8 },
  { upTo: 150, multiplier: 1.55 },
  { upTo: Infinity, multiplier: 1.35 },
];

/** Nothing is listed below this; anything cheaper is bundle-only. */
export const MIN_PRICE = 2.95;

/**
 * Shipping. The market reference charges €3 and ships free from €25 — worth
 * knowing, because a higher threshold or a higher rate is a visible
 * disadvantage on a €10 basket.
 */
export const SHIPPING_COST = 5.0;
export const FREE_SHIPPING_FROM = 25.0;

export function shippingFor(basketTotal: number): number {
  return basketTotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
}

export function shelfPrice(costPrice: number | null): number | null {
  if (costPrice == null || !Number.isFinite(costPrice)) return null;
  const tier = MARGIN_TIERS.find((t) => costPrice < t.upTo) ?? MARGIN_TIERS.at(-1)!;
  const gross = costPrice * tier.multiplier * (1 + VAT_RATE);
  // Land on a .95 ending, which is what every competitor in this category uses.
  const rounded = Math.floor(gross) + 0.95;
  return Math.max(MIN_PRICE, Math.round(rounded * 100) / 100);
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
  /*
   * Frequency and transponder are the two answers that decide whether a key
   * can work at all. A customer who has read them off their old key wants to
   * narrow to them directly, not scroll a category.
   */
  chip?: string;
  blade?: string;
  maxPrice?: number;
  /** Free-text, matched against title and fitment. */
  q?: string;
}

function matches(p: CatalogProduct, f: Filters): boolean {
  if (f.category && p.category?.toLowerCase() !== f.category.toLowerCase()) return false;
  if (f.subcategory && p.subcategory?.toLowerCase() !== f.subcategory.toLowerCase()) return false;
  if (f.make && !p.makes.some(m => m.toLowerCase() === f.make!.toLowerCase())) return false;
  if (f.manufacturer && p.manufacturer?.toLowerCase() !== f.manufacturer.toLowerCase()) return false;
  if (f.condition && p.condition?.toLowerCase() !== f.condition.toLowerCase()) return false;
  if (f.buttons && p.buttons !== f.buttons) return false;
  if (f.frequency && p.frequency?.toLowerCase() !== f.frequency.toLowerCase()) return false;
  if (f.chip && p.chip?.toLowerCase() !== f.chip.toLowerCase()) return false;
  if (f.blade && p.blade?.toLowerCase() !== f.blade.toLowerCase()) return false;
  if (f.maxPrice != null) {
    const price = shelfPrice(p.costPrice);
    if (price == null || price > f.maxPrice) return false;
  }
  if (f.q) {
    const needle = f.q.toLowerCase();
    const hay = `${p.titleNl} ${p.title} ${p.articleCode ?? ''} ${p.fitment
      .map((x) => `${x.make} ${x.model}`)
      .join(' ')}`.toLowerCase();
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
  | 'manufacturer' | 'condition' | 'buttons' | 'frequency' | 'chip' | 'blade';

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

const LABELS: Record<string, string> = {
  'sleutel zonder startonderbreker': 'Sleutel zonder startonderbreker',
  'transpondersleutel': 'Transpondersleutel',
  'microtaster & antenne': 'Microtaster & antenne',
  'KeyDIY universal': 'KeyDIY universeel',
  'Xhorse universal': 'Xhorse universeel',
  'Autel universal': 'Autel universeel',
  'IEA universal': 'IEA universeel',
  printplaten: 'Printplaten (PCB)',
  noodsleutels: 'Noodsleutels',
  'universal-remotes': 'Universele sleutels',
  diensten: 'Diensten',
  'overige-sleutels': 'Overige sleutels',
  motorsleutels: 'Motorsleutels',
  afstandsbedieningen: 'Afstandsbedieningen',
  'smart-keys': 'Smart keys / keyless',
  sleutelbaarden: 'Sleutelbaarden',
  behuizingen: 'Sleutelbehuizingen',
  transponders: 'Transponders',
  batterijen: 'Batterijen',
  sloten: 'Sloten & cilinders',
  woningsleutels: 'Woning- & bedrijfssleutels',
  'sleutels-zonder-chip': 'Sleutels zonder startonderbreker',
  transpondersleutels: 'Transpondersleutels',
  programmeerapparatuur: 'Programmeerapparatuur',
  'frezen-en-tasters': 'Frezen & tasters',
  sleutelmachines: 'Sleutelmachines',
  accessoires: 'Accessoires',
  gereedschap: 'Gereedschap',
  genuine: 'Origineel',
  oem: 'OEM',
  aftermarket: 'Aftermarket',
};

export const facetLabel = (key: FacetKey, value: string): string => {
  if (key === 'buttons') return `${value} knoppen`;
  if (key === 'chip' || key === 'blade') return value;
  // Subcategories are stored as the plain Dutch word ("cilindersleutel") so
  // the catalogue stays readable; a filter label starts with a capital.
  return LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
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
