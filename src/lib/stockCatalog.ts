import autosleutel24 from '@/data/autosleutel24-stock.json';
import type { StockArticle } from '@/lib/keyforcarsStock';
import type { CatalogProduct } from '@/lib/catalog';
import type { ProductProfileData, VehicleFit } from '@/lib/productProfiles';

/**
 * The article master the stock ledger works from.
 *
 * The ledger itself (migrations 0089–0099, src/lib/kfcInventory.ts, the screens
 * under /admin/voorraad) reads its catalogue from here: derived from the key
 * catalogue the shop sells from (src/data/autosleutel24-stock.json, built by
 * scripts/build-as24-stock.mjs). Anything reading the catalogue, the prices or
 * the product profiles goes through this module.
 */
export const stockCatalog: StockArticle[] = autosleutel24;

/**
 * The internal article code, which is also what a shelf label falls back to
 * when the SKU cannot be printed as Code 39. Segment 1 is a shop listing,
 * 3 a workshop article made on the spot.
 */
export const ARTICLE_CODE = /^AS24-[123]-[0-9]+$/;

/** Prefix for a workshop article made on the spot: <prefix><n>. */
export const WORKSHOP_PREFIX = 'AS24-3-';

/** A SKU that exists, for the "try an example" button in the product finder. */
export const EXAMPLE_SKU = 'TOYR110K';

/** The slug of an article's own product page: the join back to the catalogue. */
const slugOf = (article: StockArticle) => article.sources[0]?.url.replace(/\/+$/, '').split('/').pop() ?? '';

/**
 * Catalogue sections whose products the warehouse treats as a particular kind
 * of thing. Only 'Behuizing' changes what a label and the facts table show
 * (a housing's chip and blade are what it *takes*, not what it is).
 */
const KIND: Record<string, string> = {
  behuizingen: 'Behuizing',
  transponders: 'Transponderchip',
  transpondersleutels: 'Transpondersleutel',
  'smart-keys': 'Sleutel / afstandsbediening',
  afstandsbedieningen: 'Sleutel / afstandsbediening',
  'universal-remotes': 'Sleutel / afstandsbediening',
};

/**
 * The catalogue's own fitments carry 0 and 9999 for "every year". A profile
 * means null by that, and a year-qualified search ("golf 2005") deliberately
 * does not match a fitment that names no years at all.
 */
const year = (value: number, low: number, high: number) => (value >= low && value <= high ? value : null);

function fitsOf(product: CatalogProduct): VehicleFit[] {
  return product.fitment.map((fit) => {
    const from = year(fit.from, 1950, 2100);
    const to = year(fit.to, 1950, 2100);
    const years = from ? ` ${from}–${to ?? ''}` : ' (alle bouwjaren)';
    return { text: `${fit.make} ${fit.model}${years}`.trim(), vehicle: `${fit.make} ${fit.model}`.trim(), from, to };
  });
}

/**
 * Autosleutel24's product profiles, built from the catalogue rows the article
 * master was built from. The SKU comes from the article master so a label, a
 * scan and a profile URL all agree — src/data/autosleutel24-stock.json is the
 * only place SKUs are decided.
 */
export function catalogProfiles(products: CatalogProduct[]): ProductProfileData[] {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  return stockCatalog.flatMap((article) => {
    const product = bySlug.get(slugOf(article));
    if (!product) return [];
    return [{
      sku: article.sku,
      name: product.title,
      nameNl: product.titleNl || product.title,
      image: product.image ?? '',
      imageLarge: product.images?.[0] ?? product.image ?? '',
      brand: product.manufacturer ?? '',
      facts: {
        kind: (product.category && KIND[product.category]) || '',
        chips: product.chip ? [product.chip] : [],
        frequency: product.frequency ? [product.frequency] : [],
        blade: product.blade ? [product.blade] : [],
        buttons: product.buttons != null ? String(product.buttons) : '',
      },
      specs: product.specs ?? [],
      fits: fitsOf(product),
      links: article.sources,
      ean: [],
    }];
  });
}
