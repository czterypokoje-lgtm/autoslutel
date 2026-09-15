/**
 * What a job costs, before anyone is sent anywhere.
 *
 * The agent must never compose a price. It asks this, and gets back either a
 * number it can say out loud or a refusal it can say out loud — and the refusal
 * is a legitimate answer, not a failure. A wrong price on the phone costs the
 * job twice: once when the technician arrives and once when the customer tells
 * someone.
 *
 * Coverage, counted rather than estimated: 319 make-and-model combinations in
 * the catalogue have a complete key *and* a price. Ford 38, Renault 31, Nissan
 * 26, Hyundai 18, Opel 17, Volkswagen 17, Toyota 16. The everyday Dutch car
 * park is in; the long tail is not, and for the long tail we say so.
 */

import { getProducts, shelfPrice, type CatalogProduct } from './catalog';
import { SCENARIO_INFO, type Scenario } from './scenarios';
import type { Car } from './capability';

/** The categories that are a key someone can be sold, not a part of one. */
const COMPLETE_KEY = ['afstandsbedieningen', 'smart-keys', 'transpondersleutels', 'sleutels-zonder-chip'];

export type QuoteRefusal =
  | 'auto_onbekend' // no article fits this car at all
  | 'geen_prijs' // article exists, no purchase price
  | 'prijs_te_onzeker'; // the make's keys are too far apart to name a number

/**
 * How far apart the fitting articles may be before a make-level price stops
 * being a price and becomes a guess.
 *
 * Measured across the catalogue: Renault spans 1.3×, BMW 1.5×, Volkswagen 2.0×
 * — quotable. Opel spans 7.3× and Toyota 31.8×, because a make's range runs
 * from a €7 transponder key to a €220 smart key. Naming one number there is how
 * a technician arrives at a job that was sold for a third of its cost.
 */
const MAX_SPREAD = 1.8;

export interface Quote {
  ok: true;
  /**
   * How we arrived at the part price. 'model' means an article states this
   * exact model; 'merk' means we priced from the make's range because no
   * article names the model — real for a 2015 Golf, which our catalogue covers
   * only as far as the Golf 6.
   */
  confidence: 'model' | 'merk';
  /** What the customer pays, including VAT. */
  total: number;
  part: number | null;
  labour: number;
  minutes: number;
  scenario: Scenario;
  /** The article we would fit, so the van can be loaded before leaving. */
  article: { code: string | null; slug: string; title: string } | null;
  /** Every article that fits, when the office wants to choose differently. */
  alternatives: { code: string | null; slug: string; title: string; price: number }[];
}

export interface QuoteFailure {
  ok: false;
  reason: QuoteRefusal;
  /** What to say out loud. Never "system error". */
  say: string;
}

const norm = (value: string | null | undefined) =>
  String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * The keys that fit this car.
 *
 * `keyless` narrows to smart keys or away from them, but only when the caller
 * actually answered — an unanswered question must not silently halve the list.
 */
export function keysFor(car: Car, keyless: boolean | null | undefined): CatalogProduct[] {
  const make = norm(car.make);
  const model = norm(car.model);

  return getProducts('all').filter((p) => {
    if (!COMPLETE_KEY.includes(p.category ?? '')) return false;
    if (keyless === true && p.category !== 'smart-keys') return false;
    if (keyless === false && p.category === 'smart-keys') return false;

    return p.fitment.some((f) => {
      if (norm(f.make) !== make) return false;
      if (!f.model) return false;
      const fitModel = norm(f.model);
      if (model && !(model === fitModel || model.startsWith(`${fitModel} `) || fitModel.startsWith(`${model} `)))
        return false;
      if (car.year && f.from && f.from > 1950 && car.year < f.from) return false;
      if (car.year && f.to && f.to < 9000 && car.year > f.to) return false;
      return true;
    });
  });
}

/**
 * A price for this car and this kind of work, or a sentence explaining why not.
 *
 * Three outcomes, in order of how much we know:
 *
 *   an article names this model   quote it, cheapest first
 *   only the make is known        quote the median of that make's keys of this
 *                                 type, but only while they sit within
 *                                 MAX_SPREAD of each other
 *   neither                       refuse, in a sentence the agent can say
 *
 * A refusal is a legitimate answer. It costs one lead; a job accepted and not
 * doable costs the call-out, the customer and the review.
 */
export function quoteFor(car: Car, scenario: Scenario, keyless?: boolean | null): Quote | QuoteFailure {
  const info = SCENARIO_INFO[scenario];

  // Lock work and repairs are labour on the customer's own hardware.
  if (!info.programming) {
    return {
      ok: true,
      confidence: 'model',
      total: info.labour,
      part: null,
      labour: info.labour,
      minutes: info.minutes,
      scenario,
      article: null,
      alternatives: [],
    };
  }

  const priceOf = (p: CatalogProduct) => shelfPrice(p.costPrice);
  const withPrice = (list: CatalogProduct[]) =>
    list
      .map((p) => ({ product: p, price: priceOf(p) }))
      .filter((x): x is { product: CatalogProduct; price: number } => x.price != null)
      .sort((a, b) => a.price - b.price);

  /* First choice: an article that names this model. */
  const exact = withPrice(keysFor(car, keyless));
  if (exact.length) {
    const best = exact[0];
    return {
      ok: true,
      confidence: 'model',
      total: Math.round((best.price + info.labour) * 100) / 100,
      part: best.price,
      labour: info.labour,
      minutes: info.minutes,
      scenario,
      article: { code: best.product.articleCode ?? null, slug: best.product.slug, title: best.product.titleNl },
      alternatives: exact.slice(1, 6).map((x) => ({
        code: x.product.articleCode ?? null,
        slug: x.product.slug,
        title: x.product.titleNl,
        price: x.price,
      })),
    };
  }

  /*
   * Second choice: the make's keys of this type. A 2015 Golf has no article
   * naming it, but a Volkswagen key with a blade and no keyless entry costs
   * what it costs — the price is driven by the scenario and the kind of key far
   * more than by the exact article number.
   */
  const byMake = withPrice(keysFor({ make: car.make }, keyless));
  if (!byMake.length) {
    return {
      ok: false,
      reason: 'auto_onbekend',
      say: 'Deze auto staat niet in ons systeem. Ik laat een collega u terugbellen met een prijs.',
    };
  }

  const spread = byMake.at(-1)!.price / byMake[0].price;
  if (spread > MAX_SPREAD) {
    return {
      ok: false,
      reason: 'prijs_te_onzeker',
      say: 'Voor deze auto hangt de prijs af van de uitvoering. Een collega belt u binnen het uur met een vaste prijs.',
    };
  }

  /*
   * The median, not the cheapest. Without an article naming the model, the
   * cheapest is usually the wrong variant, and a customer told €40 who is then
   * charged €90 is a customer we have lost either way.
   */
  const median = byMake[Math.floor(byMake.length / 2)];

  return {
    ok: true,
    confidence: 'merk',
    total: Math.round((median.price + info.labour) * 100) / 100,
    part: median.price,
    labour: info.labour,
    minutes: info.minutes,
    scenario,
    article: null,
    alternatives: byMake.slice(0, 6).map((x) => ({
      code: x.product.articleCode ?? null,
      slug: x.product.slug,
      title: x.product.titleNl,
      price: x.price,
    })),
  };
}

/**
 * Is this car keyless? Answered from the catalogue where it can be.
 *
 * Used to turn the agent's question into a confirmation rather than an
 * interrogation — and when the caller disagrees with us, the caller is the one
 * looking at the car, so their answer wins.
 */
export function looksKeyless(car: Car): boolean | null {
  const smart = keysFor(car, true).length;
  const plain = keysFor(car, false).length;
  if (!smart && !plain) return null;
  if (smart && !plain) return true;
  if (plain && !smart) return false;
  return null; // both exist — the trim decides, so ask
}

/** Do we know this car at all? The agent's first gate. */
export function knowCar(car: Car): boolean {
  return keysFor(car, null).length > 0;
}
