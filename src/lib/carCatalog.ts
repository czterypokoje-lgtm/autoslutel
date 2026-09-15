import { getProducts } from './catalog';

/** Mirrors quote.ts's COMPLETE_KEY — the categories that are actually a key. */
const COMPLETE_KEY = ['afstandsbedieningen', 'smart-keys', 'transpondersleutels', 'sleutels-zonder-chip'];

export interface CatalogModel {
  model: string;
  fromYear: number | null;
  toYear: number | null;
  /** A smart/button-start key exists in our catalogue for this model. */
  keyless: boolean;
  /** A bladed/turn-key exists in our catalogue for this model. */
  nonKeyless: boolean;
}

export interface CatalogMake {
  make: string;
  models: CatalogModel[];
}

let cache: CatalogMake[] | null = null;

/**
 * Every make and model our own catalogue actually names, with the year span
 * we carry parts for and whether that's a smart key, a bladed key, or both.
 *
 * This is the picker's data source rather than a hand-typed list: a
 * technician choosing "Toyota" should see the Toyota models we can put a key
 * on, not a generic car database that includes cars our tools do not cover.
 * Computed once per server instance — the catalogue is a build-time JSON
 * import, not something that changes between requests.
 */
export function catalogTree(): CatalogMake[] {
  if (cache) return cache;

  const byMake = new Map<string, Map<string, CatalogModel>>();

  for (const product of getProducts('all')) {
    if (!COMPLETE_KEY.includes(product.category ?? '')) continue;
    const isKeyless = product.category === 'smart-keys';

    for (const f of product.fitment) {
      const make = f.make?.trim();
      const model = f.model?.trim();
      if (!make || !model) continue;

      let models = byMake.get(make);
      if (!models) {
        models = new Map<string, CatalogModel>();
        byMake.set(make, models);
      }

      const from = f.from > 1950 ? f.from : null;
      const to = f.to < 9000 ? f.to : null;

      const existing = models.get(model);
      if (!existing) {
        models.set(model, {
          model,
          fromYear: from,
          toYear: to,
          keyless: isKeyless,
          nonKeyless: !isKeyless,
        });
        continue;
      }

      if (from !== null) existing.fromYear = existing.fromYear === null ? from : Math.min(existing.fromYear, from);
      if (to !== null) existing.toYear = existing.toYear === null ? to : Math.max(existing.toYear, to);
      if (isKeyless) existing.keyless = true;
      else existing.nonKeyless = true;
    }
  }

  cache = [...byMake.entries()]
    .map(([make, models]) => ({
      make,
      models: [...models.values()].sort((a, b) => a.model.localeCompare(b.model, 'nl')),
    }))
    .sort((a, b) => a.make.localeCompare(b.make, 'nl'));

  return cache;
}
