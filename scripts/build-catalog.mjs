/**
 * The catalogue the shop reads.
 *
 *   node scripts/scrape-akey-catalog.mjs     every product page, once
 *   node scripts/scrape-akey-sections.mjs    which shelves each one stands on
 *   node scripts/classify-akey.mjs           what each one is
 *   node scripts/build-catalog.mjs           -> src/lib/catalog.json
 *
 * This step does no deciding. The category was settled in classify-akey.mjs
 * against A-Key's own filing, and the Dutch copy is composed in
 * product-copy.mjs from the facts on their page. What is left here is
 * assembly: price, photo, specification table, and the three companion files
 * the shop's menu and brand pages read.
 *
 * The rule the whole chain is built on: a field is either something A-Key
 * states or it is null. Nothing is inferred to fill a gap, because a filled
 * gap reads exactly like a fact to the customer who acts on it.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import { CATEGORIES } from './taxonomy.mjs';
import {
  fitmentOf,
  crossReferences,
  cuttingTools,
  dutchTitle,
  descriptionHtml,
  directAnswer,
  metaDescription,
  spellMake,
  tidyFrequency,
  tidyChip,
  buttonCount,
  buttonLabel,
  tidyBlade,
  tidyArticleNumber,
} from './product-copy.mjs';
import { translateDescription } from './accessory-copy.mjs';

const RAW = path.join(process.cwd(), 'src/data/akey-catalog-raw.json');
const CLASSIFIED = path.join(process.cwd(), 'src/data/akey-classified.json');
const ACCESSFOBS = path.join(process.cwd(), 'src/data/accessfobs-key-cases.json');
const IMAGE_DIR = path.join(process.cwd(), 'public/images/products');

const OUT = path.join(process.cwd(), 'src/lib/catalog.json');
const BRANDS_OUT = path.join(process.cwd(), 'src/lib/brands.json');
const NAV_OUT = path.join(process.cwd(), 'src/lib/navCounts.json');
const VEHICLES_OUT = path.join(process.cwd(), 'src/lib/vehicleSpecs.json');

for (const file of [RAW, CLASSIFIED]) {
  if (!existsSync(file)) {
    console.error(`Missing ${path.relative(process.cwd(), file)} — see the header of this file for the order.`);
    process.exit(1);
  }
}

const raw = JSON.parse(readFileSync(RAW, 'utf8')).products;
const classification = JSON.parse(readFileSync(CLASSIFIED, 'utf8'));

/* ── photos ──────────────────────────────────────────────────────────────
 *
 * The files on disk are named akey_<n>_<hash>[_<i>].jpg, where the hash is the
 * first eight characters of the md5 of the product page URL. The number in
 * front is a download sequence and changes between runs, so the hash is the
 * only stable key — matching on it is what lets a re-scrape keep every photo
 * already downloaded.
 *
 * Two sets are on disk. The suffixed ones (_0, _1) came from A-Key's 320px
 * variant, which carries no watermark; the unsuffixed ones are the 800px
 * variant with their logo printed across the middle of the product. The clean
 * ones win, at the resolution that costs.
 * ─────────────────────────────────────────────────────────────────────── */

import { createHash } from 'crypto';

const urlHash = (url) => createHash('md5').update(url).digest('hex').slice(0, 8);

const photosByHash = new Map();
for (const file of readdirSync(IMAGE_DIR)) {
  const hit = file.match(/^akey_\d+_([0-9a-f]{8})(?:_(\d+))?\.(?:jpg|jpeg|png|webp)$/i);
  if (!hit) continue;
  const [, hash, index] = hit;
  if (!photosByHash.has(hash)) photosByHash.set(hash, { clean: [], watermarked: [] });
  const entry = photosByHash.get(hash);
  if (index === undefined) entry.watermarked.push(file);
  else entry.clean.push({ index: Number(index), file });
}

function photosFor(product) {
  const entry = photosByHash.get(urlHash(product.url));
  if (!entry) return [];
  if (entry.clean.length) {
    return entry.clean
      .sort((a, b) => a.index - b.index)
      .map((p) => `/images/products/${p.file}`);
  }
  return entry.watermarked.map((f) => `/images/products/${f}`);
}

/* ── pricing ─────────────────────────────────────────────────────────── */

/**
 * A-Key's price is what we pay. The shelf price is set in src/lib/catalog.ts
 * from this number, so it is stored raw and converted in one place only.
 *
 * A cost of exactly 1.00 is their placeholder for "ask us", not a price:
 * 157 articles carried it, and every one of them would have gone on the shelf
 * at €2,95 for a part that costs us more than that.
 */
const costOf = (price) => (price == null || price === 1 ? null : price);

/* ── the specification table ─────────────────────────────────────────── */

const SPEC_LABELS = [
  ['Frequentie', (p) => tidyFrequency(p.frequency)],
  ['Transponder', (p) => tidyChip(p.transponder)],
  ['Aantal knoppen', (p) => buttonLabel(p.buttons)],
  ['Sleutelbaard', (p) => tidyBlade(p.blade)],
  ['Sleutelrohling', (p) => p.blank],
  ['Printplaat', (p) => p.boardNumber],
  ['Kleur', (p) => translateColour(p.colour)],
  ['Materiaal', (p) => translateMaterial(p.material)],
  ['Artikelnummer', (p) => tidyArticleNumber(p.articleNumber)],
];

const COLOURS = {
  schwarz: 'zwart', weiss: 'wit', weiß: 'wit', silber: 'zilver', grau: 'grijs',
  blau: 'blauw', rot: 'rood', gelb: 'geel', grün: 'groen', braun: 'bruin',
  chrom: 'chroom', gold: 'goud', orange: 'oranje', transparent: 'transparant',
};

const translateColour = (value) => {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  return COLOURS[key] ?? value;
};

const translateMaterial = (value) => {
  if (!value) return null;
  return value
    .replace(/hochwertiger?\s+Kunststoff/i, 'hoogwaardig kunststof')
    .replace(/\bKunststoff\b/i, 'kunststof')
    .replace(/\bMetall\b/i, 'metaal')
    .replace(/\bMessing\b/i, 'messing')
    .replace(/\bZink(druckguss)?\b/i, 'zink')
    .replace(/\bStahl\b/i, 'staal')
    .replace(/ohne Emblem/i, 'zonder embleem')
    .replace(/mit Emblem/i, 'met embleem');
};

const specsFor = (p) =>
  SPEC_LABELS.map(([label, read]) => [label, read(p)]).filter(([, value]) => value);

/* ── which manufacturer made it ──────────────────────────────────────── */

const MANUFACTURERS = [
  ['Xhorse', /\bxhorse\b|\bvvdi\b|\bx[knsez][a-z]{2}\d/i],
  ['KeyDIY', /\bkeydiy\b|\bkey ?diy\b|\bkd-?x?\d|\bnb\d{2}\b/i],
  ['Lonsdor', /\blonsdor\b/i],
  ['Autel', /\bautel\b|\bikey\w+/i],
  ['OBDSTAR', /\bobdstar\b/i],
  ['Zed-FULL', /\bzed-?full\b/i],
  ['Silca', /\bsilca\b/i],
  ['Keyline', /\bkeyline\b/i],
  ['JMA', /\bjma\b/i],
  ['Börkey', /\bb[öo]e?rkey\b/i],
  ['KESA', /\bkesa\b/i],
  ['A-Key', /\ba[\s-]?key\b/i],
];

const manufacturerOf = (text) => MANUFACTURERS.find(([, re]) => re.test(text))?.[0] ?? null;

/* ── audience ────────────────────────────────────────────────────────── */

/**
 * Opening tools are sold to the trade, not to whoever finds the page.
 *
 * Not the whole gereedschap category, as before: a screwdriver set is not a
 * lock pick, and hiding it behind a business login sold nothing to anybody.
 * The subcategory the classifier assigned is precise enough to gate on.
 */
const TRADE_SUBCATEGORIES = new Set(['opengereedschap']);
const TRADE_TITLE = /\b(pick|dietrich|aufsperr|lockpick|schlagschl[üu]ssel|bump)/i;

/* ── one article ─────────────────────────────────────────────────────── */

const products = [];
const skipped = { noCategory: 0, noPhoto: 0, noPrice: 0 };

for (const [slug, filed] of Object.entries(classification.filed)) {
  const product = raw[slug];
  if (!product) continue;

  const images = photosFor(product);
  if (!images.length) skipped.noPhoto++;

  const statedMake = product.make ? spellMake(product.make) : filed.makes[0] ?? null;
  const fitment = fitmentOf(product, statedMake);
  const xrefs = crossReferences(product.description ?? []);
  const tools = cuttingTools(product.description ?? []);

  /* Every make the article is stated to fit: the classifier's, plus every
     make named in a fitment line. */
  const makes = [...new Set([...filed.makes, ...fitment.map((f) => f.make)])];

  const text = `${product.title} ${(product.description ?? []).join(' ')}`;
  const { german } = translateDescription(product.description ?? []);

  const cost = costOf(product.price);
  if (cost == null) skipped.noPrice++;

  const batteryCode = text.match(/\bCR\s?-?(\d{3,4})\b/i)?.[1] ?? null;

  products.push({
    id: tidyArticleNumber(product.articleNumber) ?? slug,
    slug: slug.toLowerCase(),
    title: product.title,
    category: filed.category,
    subcategory: filed.subcategory,
    audience:
      TRADE_SUBCATEGORIES.has(filed.subcategory) || TRADE_TITLE.test(product.title) ? 'trade' : 'public',
    makes,
    manufacturer: manufacturerOf(text),
    condition: 'aftermarket',
    buttons: buttonCount(product.buttons),
    frequency: tidyFrequency(product.frequency),
    chip: tidyChip(product.transponder),
    blade: tidyBlade(product.blade),
    battery: batteryCode ? `cr${batteryCode}` : null,
    costPrice: cost,
    image: images[0] ?? null,
    images,
    fitment: fitment.filter((f) => f.model).map((f) => ({ make: f.make, model: f.model, from: f.from, to: f.to })),
    excerpt: (product.description ?? []).join(' ').slice(0, 400),

    titleNl: dutchTitle(product, filed, fitment),
    descriptionNl: descriptionHtml(product, filed, { fitment, xrefs, tools }),
    directAnswer: directAnswer(product, filed, fitment),
    metaDescriptionNl: metaDescription(product, filed, fitment, cost),

    specs: specsFor(product),
    vehiclesRaw: product.vehicles ?? null,
    replacedBy: product.replacedBy ?? null,
    supplierNote: german.length ? german.slice(0, 6) : null,
    articleCode: tidyArticleNumber(product.articleNumber),
    /** Article numbers the same part is sold under elsewhere in the trade. */
    crossReferences: xrefs.length ? xrefs : null,
    /** Set by the classifier when a filing deserves a human glance. */
    needsCheck: filed.needsCheck ?? null,
    /** In stock at our supplier at the time of the last sync. */
    inStock: product.availability !== 'OutOfStock',
  });
}

/* ── the AccessFobs housings ─────────────────────────────────────────── */

if (existsSync(ACCESSFOBS)) {
  const data = JSON.parse(readFileSync(ACCESSFOBS, 'utf8'));
  for (const item of data.products) {
    const slug = `accessfobs-${String(item.id)}`;
    products.push({
      id: slug,
      slug,
      title: item.title,
      category: 'behuizingen',
      subcategory: 'AccessFobs behuizing',
      audience: 'public',
      makes: item.makes ?? [],
      manufacturer: 'AccessFobs',
      condition: 'aftermarket',
      buttons: item.buttons ?? null,
      frequency: null,
      chip: null,
      blade: item.blade ?? null,
      battery: null,
      /* Their prices are in pounds and we have no buying price, so these are
         listed but not priced — see the note in the report below. */
      costPrice: null,
      image: item.image ?? null,
      images: item.image ? [item.image] : [],
      /* Through the same filter as A-Key's: the AccessFobs scrape read some
         sentences as models ("Flip key head and transponder chip for"). */
      fitment: (item.vehicles ?? []).filter((v) => v.make && v.model && v.model.length <= 32 && !/\bfor\b|\band\b/i.test(v.model)),
      excerpt: (item.notes ?? []).join(' ').slice(0, 400),
      titleNl: item.title,
      descriptionNl: `<p>Vervangende sleutelbehuizing. U zet uw eigen elektronica en sleutelbaard erin — de auto hoeft daarna niet opnieuw geprogrammeerd te worden.</p>${
        (item.vehicles ?? []).length
          ? `<h4>Past op</h4><ul>${item.vehicles
              .map((v) => `<li>${v.make} ${v.model}</li>`)
              .join('')}</ul>`
          : ''
      }`,
      directAnswer: `Sleutelbehuizing${item.makes?.length ? ` voor ${item.makes[0]}` : ''}.`,
      metaDescriptionNl: `Sleutelbehuizing${item.makes?.length ? ` voor ${item.makes.join(', ')}` : ''}. Zelf ombouwen of door onze monteur laten doen.`,
      specs: [
        item.blade ? ['Sleutelbaard', item.blade] : null,
        item.buttons ? ['Aantal knoppen', String(item.buttons)] : null,
      ].filter(Boolean),
      vehiclesRaw: null,
      replacedBy: null,
      supplierNote: null,
      articleCode: null,
      crossReferences: null,
      needsCheck: 'inkoopprijs ontbreekt — nog niet te koop',
      inStock: true,
    });
  }
}

/* ── the companion files ─────────────────────────────────────────────── */

const publicProducts = products.filter((p) => p.audience === 'public');

const brandCounts = new Map();
for (const p of publicProducts) {
  for (const make of p.makes) brandCounts.set(make, (brandCounts.get(make) ?? 0) + 1);
}
const brands = [...brandCounts]
  .map(([make, count]) => ({ make, count }))
  .sort((a, b) => b.count - a.count || a.make.localeCompare(b.make));

const facetCount = (key) => {
  const counts = {};
  for (const p of publicProducts) {
    const value = p[key];
    if (value) counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
};

/**
 * Every model we stock something for, with the chips, blades and frequencies
 * that turn up on it.
 *
 * The fitment widget shows those three next to the model a visitor picks, so
 * they can check them against the key in their hand before ordering.
 */
const vehicles = {};
for (const p of publicProducts) {
  for (const f of p.fitment) {
    const key = `${f.make} ${f.model}`;
    vehicles[key] ??= {
      make: f.make, model: f.model, from: f.from, to: f.to,
      chips: [], blades: [], frequencies: [], count: 0, categories: {},
    };
    const entry = vehicles[key];
    entry.count++;
    entry.categories[p.category] = (entry.categories[p.category] ?? 0) + 1;
    entry.from = Math.min(entry.from || 9999, f.from || 9999) || 0;
    entry.to = Math.max(entry.to, f.to);
    for (const [field, value] of [['chips', p.chip], ['blades', p.blade], ['frequencies', p.frequency]]) {
      if (value && !entry[field].includes(value)) entry[field].push(value);
    }
  }
}

writeFileSync(
  OUT,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      count: products.length,
      facets: { category: facetCount('category'), subcategory: facetCount('subcategory') },
      products,
    },
    null,
    1
  )}\n`
);
writeFileSync(BRANDS_OUT, `${JSON.stringify(brands, null, 1)}\n`);
writeFileSync(
  NAV_OUT,
  `${JSON.stringify({ categories: facetCount('category'), subcategories: facetCount('subcategory') }, null, 1)}\n`
);
writeFileSync(VEHICLES_OUT, `${JSON.stringify(vehicles, null, 1)}\n`);

/* ── report ──────────────────────────────────────────────────────────── */

const byCategory = facetCount('category');

console.log(`catalog.json — ${products.length} articles\n`);
for (const [category, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(5)}  ${CATEGORIES[category]?.label ?? category}`);
}

console.log(`\n  public ${publicProducts.length} · trade ${products.length - publicProducts.length} (gated)`);
console.log(`  with a photo      ${products.filter((p) => p.image).length}`);
console.log(`  with a price      ${products.filter((p) => p.costPrice != null).length}`);
console.log(`  with a make       ${products.filter((p) => p.makes.length).length}`);
console.log(`  with models       ${products.filter((p) => p.fitment.length).length}`);
console.log(`  with a spec table ${products.filter((p) => p.specs.length).length}`);
console.log(`  flagged for check ${products.filter((p) => p.needsCheck).length}`);
console.log(`\n  ${brands.length} makes · ${Object.keys(vehicles).length} models`);
console.log(`  ${classification.review.length} articles held back for review (see akey-classified.json)`);
