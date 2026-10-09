import { getProducts } from './catalog';

/**
 * What kind of thing a stock item is.
 *
 * The parts catalogue has nineteen categories, which is the right grain for a
 * webshop and far too fine for a van: nobody stands at the back doors
 * wondering whether a noodsleutel and a motorsleutel belong in different
 * boxes. These nine are the groups a monteur actually sorts by.
 */
export type StockGroup =
  | 'sleutels'
  | 'behuizingen'
  | 'sleutelbaarden'
  | 'elektronica'
  | 'batterijen'
  | 'gereedschap'
  | 'sloten'
  | 'accessoires'
  | 'woningsleutels'
  | 'overig';

export const STOCK_GROUPS: { id: StockGroup; label: string; icon: string }[] = [
  { id: 'sleutels', label: 'Sleutels', icon: '🔑' },
  { id: 'behuizingen', label: 'Behuizingen', icon: '🐚' },
  { id: 'sleutelbaarden', label: 'Sleutelbaarden', icon: '🗝️' },
  { id: 'elektronica', label: 'Elektronica', icon: '🔌' },
  { id: 'batterijen', label: 'Batterijen', icon: '🔋' },
  { id: 'gereedschap', label: 'Gereedschap', icon: '🛠️' },
  { id: 'sloten', label: 'Sloten', icon: '🔒' },
  { id: 'accessoires', label: 'Accessoires', icon: '📦' },
  { id: 'woningsleutels', label: 'Woningsleutels', icon: '🏠' },
  { id: 'overig', label: 'Overig', icon: '❔' },
];

export const GROUP_INFO: Record<StockGroup, { label: string; icon: string }> = Object.fromEntries(
  STOCK_GROUPS.map((g) => [g.id, { label: g.label, icon: g.icon }])
) as Record<StockGroup, { label: string; icon: string }>;

/** Catalogue category → the group it belongs in. */
const FROM_CATEGORY: Record<string, StockGroup> = {
  'smart-keys': 'sleutels',
  afstandsbedieningen: 'sleutels',
  transpondersleutels: 'sleutels',
  'sleutels-zonder-chip': 'sleutels',
  noodsleutels: 'sleutels',
  motorsleutels: 'sleutels',
  'universal-remotes': 'sleutels',
  behuizingen: 'behuizingen',
  sleutelbaarden: 'sleutelbaarden',
  'frezen-en-tasters': 'sleutelbaarden',
  printplaten: 'elektronica',
  transponders: 'elektronica',
  batterijen: 'batterijen',
  gereedschap: 'gereedschap',
  sleutelmachines: 'gereedschap',
  programmeerapparatuur: 'gereedschap',
  sloten: 'sloten',
  accessoires: 'accessoires',
  woningsleutels: 'woningsleutels',
};

/*
 * Read once. The catalogue is a build-time import, so this map cannot change
 * between requests, and rebuilding it per stock row would walk a few thousand
 * products for every line on the page.
 */
let slugToGroup: Map<string, StockGroup> | null = null;
let codeToGroup: Map<string, StockGroup> | null = null;

function buildIndexes(): void {
  if (slugToGroup && codeToGroup) return;
  const bySlug = new Map<string, StockGroup>();
  const byCode = new Map<string, StockGroup>();
  for (const product of getProducts('all')) {
    const group = FROM_CATEGORY[product.category ?? ''];
    if (!group) continue;
    bySlug.set(product.slug, group);
    if (product.articleCode) byCode.set(product.articleCode.toLowerCase(), group);
  }
  slugToGroup = bySlug;
  codeToGroup = byCode;
}

function slugIndex(): Map<string, StockGroup> {
  buildIndexes();
  return slugToGroup!;
}

/*
 * Article code → group.
 *
 * The same physical part exists twice in stock_items: once in a monteur's van
 * and once in the office bin, and only one of the two usually carries a
 * catalogue slug. Deriving the slugless one from its description put the same
 * item in two different groups — "SKK2000 Kenkapjes" read as accessoires from
 * the catalogue and as behuizingen from the word "kenkapje". Every
 * description starts with the supplier's article code, so matching on that
 * lands both rows in the same place.
 */
function codeIndex(): Map<string, StockGroup> {
  buildIndexes();
  return codeToGroup!;
}

/** The leading token of a description, which is the supplier's article code. */
function leadingCode(description: string): string | null {
  const first = description.trim().split(/\s+/)[0];
  return first && /^[A-Z0-9][A-Z0-9-]{2,}$/i.test(first) ? first.toLowerCase() : null;
}

/**
 * Keyword fallback, for a row typed by hand or imported from a supplier
 * invoice with no catalogue slug attached.
 *
 * Ordered deliberately: "smart key" and "transpondersleutel" both contain
 * "sleutel", and a printplaat is electronics even though it arrives in a key.
 * The first match wins, so the specific terms are listed before the general
 * ones.
 */
const KEYWORDS: [RegExp, StockGroup][] = [
  [/printplaat|pcb|chip|transponder(?!sleutel)/i, 'elektronica'],
  [/batterij|cr\d{4}/i, 'batterijen'],
  [/behuizing|kenkapje|cover|casing|schil/i, 'behuizingen'],
  [/sleutelbaard|baard|blade|frees|taster/i, 'sleutelbaarden'],
  [/adapter|programmeer|machine|tang|gereedschap|tool|apparaat/i, 'gereedschap'],
  [/slot|cilinder|lock/i, 'sloten'],
  [/woningsleutel|huissleutel/i, 'woningsleutels'],
  [/smart\s*key|afstandsbediening|remote|sleutel/i, 'sleutels'],
];

/**
 * The group for one stock row.
 *
 * An explicit `category` on the row always wins — the office can correct
 * anything this gets wrong, and a correction must not be re-guessed away on
 * the next page load. Otherwise the catalogue decides, and only if the row
 * has no slug does it fall back to reading the description.
 */
export function stockGroupOf(item: {
  category?: string | null;
  product_slug?: string | null;
  description?: string | null;
}): StockGroup {
  const override = item.category?.trim().toLowerCase();
  if (override && override in GROUP_INFO) return override as StockGroup;

  if (item.product_slug) {
    const fromCatalogue = slugIndex().get(item.product_slug);
    if (fromCatalogue) return fromCatalogue;
  }

  const text = item.description ?? '';

  // The article code before the description text, so a row without a slug
  // still resolves to the same group as its twin that has one.
  const code = leadingCode(text);
  if (code) {
    const fromCode = codeIndex().get(code);
    if (fromCode) return fromCode;
  }

  for (const [pattern, group] of KEYWORDS) {
    if (pattern.test(text)) return group;
  }
  return 'overig';
}
