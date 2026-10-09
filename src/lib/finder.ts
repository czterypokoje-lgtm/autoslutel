import { getProducts, type CatalogProduct } from './catalog';

/**
 * "Ik heb een Golf uit 2012" → the parts that fit it.
 *
 * The honest version of that feature, which is not the obvious one. The
 * obvious one is a make→model→year filter, and on this catalogue it returns an
 * empty shelf for most of the Dutch car park: of 2,108 public articles only
 * 416 name a model and only 214 carry year ranges. Measured, before this file
 * existed: Mercedes C-Klasse 2016 → 0 results. Toyota Yaris 2015 → 1.
 *
 * The reason is not missing data. A key housing for a VW group flip key fits
 * dozens of models and A-Key states the make, not the list — so "no model"
 * means "they did not narrow it", not "it does not fit". Filtering that away
 * throws out the 80% of the catalogue that is genuinely relevant.
 *
 * So each answer the visitor gives does less than a filter normally does:
 *
 *   make   — a real filter. Always leaves a full shelf (40–120 articles for
 *            every major Dutch make).
 *   model  — RANKS. Articles naming this model come first; the rest of the
 *            make stays visible below, labelled as fitting other models of
 *            the same make.
 *   year   — REFINES, and only against articles that state a range. An
 *            article with no years is never excluded by a year, because
 *            A-Key stating no years is not the same as it not fitting.
 *
 * The result is a page that narrows as the visitor answers and never empties.
 */

/* ── what the customer has to do to the part ──────────────────────────── */

/**
 * The shop sells what someone can fit themselves. A key that has to be
 * programmed at the car is not that, however well it is described.
 *
 * This split is the whole positioning of the shop, so it lives in one place
 * and everything reads it from here: the listing, the product page, the cart
 * (which refuses `programming` lines) and the finder's grouping.
 *
 * It is not a judgement about quality — a transponder key is a fine product.
 * It is about what happens after the parcel arrives. A housing arrives and the
 * customer is done. A smart key arrives and nothing works until someone with
 * a programmer stands next to the car, which is the service business we
 * already run. Selling it as a parcel sells a disappointment and a return.
 */
export type FitClass =
  /** Swap it over at the kitchen table. Screwdriver at most. */
  | 'plug-and-play'
  /** Fits, but a blank has to be cut to the lock first. */
  | 'cutting'
  /** Has to be programmed to the car. Not a parcel — a visit. */
  | 'programming'
  /** Locksmith equipment. Never shown to a consumer. */
  | 'trade';

const FIT_BY_CATEGORY: Record<string, FitClass> = {
  behuizingen: 'plug-and-play',
  batterijen: 'plug-and-play',

  sleutelbaarden: 'cutting',
  noodsleutels: 'cutting',
  'sleutels-zonder-chip': 'cutting',

  transpondersleutels: 'programming',
  'smart-keys': 'programming',
  afstandsbedieningen: 'programming',
  'universal-remotes': 'programming',
  motorsleutels: 'programming',
  // A bare transponder chip is the clearest case of all: it is nothing but
  // the thing that has to be programmed.
  transponders: 'programming',
  /*
   * A replacement circuit board is not the plug-and-play part it looks like.
   * It carries the remote's radio and its chip identity, so a car that knew
   * the old board does not know the new one — fitting one and programming
   * one are the same job. Classed with the keys for that reason, not with
   * the housings it physically resembles.
   */
  printplaten: 'programming',

  programmeerapparatuur: 'trade',
  gereedschap: 'trade',
  /*
   * `accessoires` reads like a consumer shelf and is not one. Checked
   * article by article: of 312 public rows, 84 are soldering adapters for
   * key programmers (XDMP/XDNP), 16 are shop supplies in packs of 100 or
   * 200, 191 carry no real name beyond "Accessoire (CODE)", and the
   * remaining 41 are clamps for key-cutting machines, VVDI programmers and
   * OBDSTAR kits. Not one of them is something a car owner buys.
   *
   * It was mapped to plug-and-play first, and the build caught it: the three
   * articles pre-rendered ahead of every housing were a bag of zip-lock
   * pouches and two sets of coloured key caps. Trade, therefore, until
   * someone splits the genuinely consumer rows out in taxonomy.mjs.
   */
  accessoires: 'trade',
};

/**
 * An unmapped category counts as `trade`, i.e. hidden.
 *
 * Deliberately the safe direction. `scripts/taxonomy.mjs` fails the build on
 * an unmapped A-Key shelf, so a new category reaching this file means someone
 * added one of ours on purpose and has not decided what the customer must do
 * with it yet. Until they do, not selling it beats selling it with the wrong
 * promise attached.
 */
export function fitClass(product: Pick<CatalogProduct, 'category'>): FitClass {
  return FIT_BY_CATEGORY[product.category ?? ''] ?? 'trade';
}

/** Sold as a parcel: the customer can finish the job without us. */
export const isSellable = (p: Pick<CatalogProduct, 'category'>): boolean => {
  const fit = fitClass(p);
  return fit === 'plug-and-play' || fit === 'cutting';
};

/** Shown, priced, but routed to a visit instead of a cart. */
export const needsProgramming = (p: Pick<CatalogProduct, 'category'>): boolean =>
  fitClass(p) === 'programming';

/** Everything a consumer may see at all — both of the above, never `trade`. */
export const isConsumerVisible = (p: Pick<CatalogProduct, 'category'>): boolean =>
  fitClass(p) !== 'trade';

/** One line of plain Dutch, for the product page and the listing card. */
export const FIT_LABEL: Record<FitClass, string> = {
  'plug-and-play': 'Zelf te monteren',
  cutting: 'Moet nog gezaagd worden',
  programming: 'Moet bij de auto ingeleerd worden',
  trade: 'Alleen voor vakmensen',
};

/* ── the car the visitor is describing ────────────────────────────────── */

export interface Car {
  make: string;
  model?: string;
  year?: number;
}

/** Normalised compare: A-Key writes "Mercedes-Benz", a visitor types "mercedes". */
const same = (a: string | null | undefined, b: string | null | undefined): boolean =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Does this article name this model?
 *
 * `includes` rather than equality, in both directions, because A-Key writes
 * "Golf V / VI" and "3-serie E90" where a visitor picks "Golf" or "3-serie".
 * Loose matching is right here: this ranks, it does not exclude, so a false
 * positive costs a article shown slightly too high and a false negative costs
 * the visitor the part they came for.
 */
function namesModel(fitment: { make: string; model: string }, car: Car): boolean {
  if (!car.model || !same(fitment.make, car.make)) return false;
  const a = fitment.model.trim().toLowerCase();
  const b = car.model.trim().toLowerCase();
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

/**
 * Does the stated year range contradict the visitor's year?
 *
 * Only a stated range can contradict anything. `from` without `to` is an
 * open-ended range — A-Key writes "ab 2015" for a model still in production —
 * so a later year is inside it, not outside.
 */
function yearContradicts(
  fitment: { from: number; to: number },
  year: number | undefined
): boolean {
  if (!year) return false;
  const from = fitment.from || null;
  const to = fitment.to || null;
  if (!from && !to) return false;
  if (from && year < from) return true;
  if (to && year > to) return true;
  return false;
}

export interface CarMatch {
  product: CatalogProduct;
  /** The article names this exact model (and does not contradict the year). */
  exact: boolean;
  /** The fitment rows that matched, for "volgens de leverancier past dit op …". */
  matched: { make: string; model: string; from: number; to: number }[];
}

export interface CarResults {
  car: Car;
  /** Names the model. The shelf the visitor came for. */
  exact: CarMatch[];
  /** Same make, no model stated by the supplier. Shown, honestly labelled. */
  sameMake: CarMatch[];
  /** Fits, but has to be programmed at the car — a visit, not a parcel. */
  service: CarMatch[];
  /**
   * True when the visitor named a model and NOTHING in the catalogue names it.
   * The page says so plainly instead of pretending the make-wide list is a
   * model answer.
   */
  modelUnknown: boolean;
}

/**
 * Everything we have for this car, in three groups.
 *
 * Ordering inside `exact` and `sameMake` is left to the caller (price, name)
 * so sorting stays one concern; what this decides is which group an article
 * belongs in, which is the part that has to be right.
 */
export function findForCar(car: Car, audience: 'public' | 'all' = 'public'): CarResults {
  const exact: CarMatch[] = [];
  const sameMake: CarMatch[] = [];
  const service: CarMatch[] = [];

  for (const product of getProducts(audience)) {
    if (!isConsumerVisible(product)) continue;

    // A make can be claimed two ways: the article's own make list, or a
    // fitment row. Either counts — `makes` is what A-Key's shelf says, and
    // fitment is what their description says.
    const fitments = (product.fitment ?? []).filter((f) => same(f.make, car.make));
    const claimsMake =
      fitments.length > 0 || (product.makes ?? []).some((m) => same(m, car.make));
    if (!claimsMake) continue;

    const matched = fitments.filter(
      (f) => namesModel(f, car) && !yearContradicts(f, car.year)
    );

    /*
     * A year only rules an article out when the supplier stated a range for
     * THIS model and the year sits outside every one of them. If the article
     * names the model in several rows, one of which covers the year, it fits.
     */
    const modelRows = fitments.filter((f) => namesModel(f, car));
    if (car.year && modelRows.length && !matched.length) continue;

    const match: CarMatch = { product, exact: matched.length > 0, matched };

    if (needsProgramming(product)) service.push(match);
    else if (match.exact) exact.push(match);
    else sameMake.push(match);
  }

  /*
   * "We carry nothing that names your model" is a real answer and the page
   * should give it. Note it reads `exact` only: a model that exists in the
   * programming group but not the parts group has still been recognised, and
   * telling that visitor their model is unknown would be false.
   */
  const modelUnknown =
    Boolean(car.model) && exact.length === 0 && service.every((m) => !m.exact);

  return { car, exact, sameMake, service, modelUnknown };
}

/* ── the pickers ──────────────────────────────────────────────────────── */

export interface MakeOption {
  make: string;
  /** Articles a consumer may see for this make — parts and keys together. */
  count: number;
  /** Of those, how many are sold as a parcel. 0 means service-only. */
  sellable: number;
}

let makeCache: MakeOption[] | null = null;

/**
 * The make list, computed from the catalogue rather than hand-typed.
 *
 * A hand-typed list of "all car makes" promises a shelf for every one of
 * them; this promises a shelf only where there is one. Skoda is the reason
 * the `sellable` count is here and not just `count`: a make can have a
 * respectable total and nothing a customer can actually fit.
 */
export function shopMakes(): MakeOption[] {
  if (makeCache) return makeCache;

  const counts = new Map<string, { count: number; sellable: number }>();

  for (const product of getProducts('public')) {
    if (!isConsumerVisible(product)) continue;

    // Union of both sources, so a make named only in fitment still appears.
    const makes = new Set<string>();
    for (const m of product.makes ?? []) if (m) makes.add(m.trim());
    for (const f of product.fitment ?? []) if (f.make) makes.add(f.make.trim());

    for (const make of makes) {
      const row = counts.get(make) ?? { count: 0, sellable: 0 };
      row.count += 1;
      if (isSellable(product)) row.sellable += 1;
      counts.set(make, row);
    }
  }

  makeCache = [...counts.entries()]
    .map(([make, row]) => ({ make, ...row }))
    .sort((a, b) => b.count - a.count || a.make.localeCompare(b.make, 'nl'));

  return makeCache;
}

export interface ModelOption {
  model: string;
  count: number;
  /** The span the supplier states across all articles naming this model. */
  fromYear: number | null;
  toYear: number | null;
}

const modelCache = new Map<string, ModelOption[]>();

/**
 * The models this make has articles for.
 *
 * Only ~20% of the catalogue names a model, so this list is short — twenty to
 * sixty entries for a big make. That is a feature, not a shortcoming: every
 * entry here is a model we can answer precisely, and the make-wide shelf
 * catches the rest. The picker must therefore always allow "mijn model staat
 * er niet bij", which is the common case and not an error.
 */
export function shopModels(make: string): ModelOption[] {
  const key = make.trim().toLowerCase();
  const cached = modelCache.get(key);
  if (cached) return cached;

  const rows = new Map<string, { count: number; from: number | null; to: number | null }>();

  for (const product of getProducts('public')) {
    if (!isConsumerVisible(product)) continue;

    // One article naming "Golf" twice must not count twice.
    const seen = new Set<string>();
    for (const f of product.fitment ?? []) {
      if (!same(f.make, make) || !f.model) continue;
      const model = f.model.trim();
      if (!model || seen.has(model.toLowerCase())) continue;
      seen.add(model.toLowerCase());

      const row = rows.get(model) ?? { count: 0, from: null, to: null };
      row.count += 1;
      if (f.from) row.from = row.from == null ? f.from : Math.min(row.from, f.from);
      if (f.to) row.to = row.to == null ? f.to : Math.max(row.to, f.to);
      rows.set(model, row);
    }
  }

  const options = [...rows.entries()]
    .map(([model, row]) => ({
      model,
      count: row.count,
      fromYear: row.from,
      toYear: row.to,
    }))
    .sort((a, b) => a.model.localeCompare(b.model, 'nl', { numeric: true }));

  modelCache.set(key, options);
  return options;
}

/**
 * The years worth offering for a make+model.
 *
 * Bounded by what the supplier states, widened by nothing. Where no article
 * states a range, this returns an empty list and the UI leaves the year step
 * out entirely — asking for a year we will then ignore wastes the visitor's
 * only chance to narrow.
 */
export function shopYears(make: string, model?: string): number[] {
  const models = model
    ? shopModels(make).filter((m) => same(m.model, model))
    : shopModels(make);

  let from: number | null = null;
  let to: number | null = null;
  for (const m of models) {
    if (m.fromYear) from = from == null ? m.fromYear : Math.min(from, m.fromYear);
    if (m.toYear) to = to == null ? m.toYear : Math.max(to, m.toYear);
  }
  if (from == null && to == null) return [];

  const thisYear = new Date().getFullYear();
  const start = from ?? 1990;
  // An open-ended range ("ab 2015") runs to today, not to a stated end.
  const end = Math.min(to ?? thisYear, thisYear);
  if (end < start) return [];

  const years: number[] = [];
  for (let y = end; y >= start; y--) years.push(y);
  return years;
}
