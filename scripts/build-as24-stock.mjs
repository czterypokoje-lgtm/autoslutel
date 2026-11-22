/**
 * Builds the Autosleutel24 article master for the stock ledger:
 *
 *   node scripts/build-as24-stock.mjs
 *
 * Writes src/data/autosleutel24-stock.json in exactly the shape of
 * keyforcars-stock.json (id, name, sku, image, category, sources) and
 * src/data/autosleutel24-prices.json (sale price in cents, by SKU), from the
 * key catalogue in src/lib/catalog.json — so the same ledger, label printer
 * and product finder work on this install. Run `npm run catalog` first; this
 * script only reads what that one wrote.
 *
 * Three things this file decides, because the catalogue does not carry them:
 *
 * - The article code (`id`). It is the ledger's primary key, so it must not
 *   move when a product is added or removed from the feed: it is derived from
 *   the slug, not from the position in the file. Shape mirrors KeyForCars's
 *   (AS24-1-<n> for a shop listing, AS24-3-<n> for a workshop article made on
 *   the spot) so one regex per install validates both.
 * - The SKU. The supplier's own article code, upper-cased and reduced to the
 *   characters a Code 39 label and a barcode scanner can carry, made unique
 *   with a -2/-3 suffix for the eight codes the feed uses twice. The original
 *   stays visible in the product profile ("Artikelnummer").
 * - The sale price. The feed carries the supplier's cost, not our shelf price,
 *   so the margin rule in src/lib/catalog.ts decides it — the same function
 *   the shop prices with. A price the office corrected by hand lives in
 *   Postgres (src/lib/shopCatalog.ts) and is NOT reflected here; the ledger
 *   uses this only as the value of stock on the shelf.
 */
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = join(root, 'src', 'lib', 'catalog.json');
/** The public shop is a separate codebase; this is the shape its product pages use. */
const PRODUCT_URL = (slug) => `https://www.autosleutel24.nl/producten/${slug}`;

/**
 * shelfPrice lives in src/lib/catalog.ts and must not be copied: the margin
 * tiers, the VAT rate and the .95 rounding have to agree with the shop to the
 * cent. Plain node refuses that module only because of its one JSON import,
 * which has no `with { type: 'json' }` attribute, so load a copy of the module
 * with that single line stubbed out. If this throws, the import line changed —
 * fix it here rather than duplicating the formula.
 */
async function loadShelfPrice() {
  const source = readFileSync(join(root, 'src', 'lib', 'catalog.ts'), 'utf8');
  const stubbed = source.replace(/^import catalogJson from '\.\/catalog\.json';$/m, 'const catalogJson = { products: [] };');
  if (stubbed === source) throw new Error('src/lib/catalog.ts no longer starts with the catalog.json import; adjust loadShelfPrice().');
  const folder = mkdtempSync(join(tmpdir(), 'as24-catalog-'));
  const file = join(folder, 'catalog.mts');
  try {
    writeFileSync(file, stubbed);
    const { shelfPrice } = await import(pathToFileURL(file).href);
    if (typeof shelfPrice !== 'function') throw new Error('catalog.ts no longer exports shelfPrice.');
    return shelfPrice;
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

/** Stable, numeric and independent of the feed's order: the slug decides it. */
const articleNumber = (slug) => parseInt(createHash('sha1').update(slug).digest('hex').slice(0, 8), 16);

/** What a Code 39 label and the ledger's code validation both accept. */
const sanitiseSku = (code) =>
  code.trim().normalize('NFKD').replace(/[̀-ͯ]/g, '').toUpperCase()
    .replace(/[^A-Z0-9.\-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

const shelfPrice = await loadShelfPrice();
const products = JSON.parse(readFileSync(CATALOG, 'utf8')).products;
// Both audiences: the warehouse holds the trade lines too. Sorted so a rebuild
// assigns the same -2 suffixes in the same order.
const sorted = [...products].sort((a, b) => a.slug.localeCompare(b.slug));

const used = new Map();
const ids = new Set();
const articles = [];
const prices = {};

for (const product of sorted) {
  const id = `AS24-1-${articleNumber(product.slug)}`;
  if (ids.has(id)) throw new Error(`Article code collision on ${id} (${product.slug}); change articleNumber().`);
  ids.add(id);

  const base = sanitiseSku(product.articleCode || product.id || product.slug) || sanitiseSku(product.slug);
  const seen = (used.get(base) ?? 0) + 1;
  used.set(base, seen);
  const sku = seen === 1 ? base : `${base}-${seen}`;

  articles.push({
    id,
    name: product.titleNl || product.title,
    sku,
    image: product.image ?? '',
    // The car make is what the warehouse sorts keys by; house keys and tools
    // have none, so their catalogue section stands in (it feeds the same
    // grouping patterns in src/app/admin/voorraad/inventoryCategories.ts).
    category: product.makes?.[0] || product.manufacturer || product.category || '',
    sources: [{ shop: 'autosleutel24.nl', url: PRODUCT_URL(product.slug) }],
  });

  const price = shelfPrice(product.costPrice);
  if (price != null) prices[sku] = Math.round(price * 100);
}

/*
 * Two things the app relies on and nothing else would catch:
 * the cards must carry exactly the fields keyforcars-stock.json carries (the
 * ledger, the label printer and the API read one StockArticle shape), and the
 * product-page URL must still lead back to its catalogue row, because that is
 * the join catalogProfiles() uses to build the product profiles.
 */
const shape = (card) => Object.keys(card).sort().join(',');
const reference = shape(JSON.parse(readFileSync(join(root, 'src', 'data', 'keyforcars-stock.json'), 'utf8'))[0]);
const odd = articles.find((card) => shape(card) !== reference);
if (odd) throw new Error(`Card ${odd.id} does not match keyforcars-stock.json's fields (${reference}).`);
const slugs = new Set(products.map((product) => product.slug));
const orphan = articles.find((card) => !slugs.has(card.sources[0].url.split('/').pop()));
if (orphan) throw new Error(`Card ${orphan.id} has a product URL that leads to no catalogue row.`);

const out = (name, data) => {
  const file = join(root, 'src', 'data', name);
  writeFileSync(file, `${JSON.stringify(data)}\n`);
  return file;
};
out('autosleutel24-stock.json', articles);
out('autosleutel24-prices.json', prices);
console.log(`autosleutel24-stock.json: ${articles.length} articles; autosleutel24-prices.json: ${Object.keys(prices).length} prices.`);
console.log(`Example: ${articles[0].id} / ${articles[0].sku} / ${articles[0].name}`);
