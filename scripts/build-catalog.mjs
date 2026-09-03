/**
 * Builds the shop catalogue from the A-Key export.
 *
 *   npm run catalog
 *   src/data/akey-products.csv  ->  src/lib/catalog.json
 *
 * A-Key is the only supplier now, and their export is the only source: it
 * carries the slug, both titles, the category, the car makes, the cost price
 * and the images. Nothing is scraped, merged or guessed from a second feed.
 *
 * What this file still decides:
 *   - the shop's own category names (theirs nest a PCB board under "remotes")
 *   - the 175 rows they left without a category
 *   - the brand behind the part (Xhorse, KeyDIY, Autel, …)
 *   - the Dutch copy and the spec list
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const IN = path.join(process.cwd(), 'src/data/akey-products.csv');
const OUT = path.join(process.cwd(), 'src/lib/catalog.json');

/* ── CSV ──────────────────────────────────────────────────────────────── */

/** RFC 4180: quoted fields, doubled quotes, commas inside quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim() !== ''));
}

/* ── categories ───────────────────────────────────────────────────────── */

/*
 * A-Key nests by what a part goes into; a shop has to sort by what a part is.
 * Their "afstandsbedieningen / printplaat" is a bare circuit board, which is a
 * different purchase from the remote it fits — so it gets its own category,
 * and so do emergency blades and universal keys.
 */
const PROMOTE = {
  'behuizingen|noodsleutel': ['noodsleutels', 'noodsleutel'],
  'afstandsbedieningen|printplaat': ['printplaten', 'printplaat'],
  'afstandsbedieningen|universele afstandsbediening': ['universal-remotes', 'universele afstandsbediening'],
};

/** For the rows A-Key left empty. Order matters — first match wins. */
const FALLBACK = [
  ['diensten', 'support', /support ?ticket|technischer support|hilfestellung|masterclass|schulung/i],
  ['batterijen', 'batterij', /^(cr\d|lr\d|v\d+ga|v\d+a\b|aaa?a?[\s-]|rayovac|\d+\s+rayovac|accu\b)|knopfzelle|batterie|blister/i],
  ['printplaten', 'printplaat', /platine|printplaat|\bpcb\b|knoppenfeld|knoppengummi|tastenfeld|tastengummi|\bboard\b/i],
  ['universal-remotes', 'universele afstandsbediening', /\buniversal\b|style\s*\(flip|\(flip-|\bxk[a-z]{2}\d|\bxn[a-z]{2}\d|\bb\d{2}-\d\b|\bnb\d{2}\b|\btb\d{2}-\d\b/i],
  ['behuizingen', 'sleutelbehuizing', /behuizing|geh(ae|ä)use|schl(ue|ü)sselgeh/i],
  ['gereedschap', 'handgereedschap', /werkzeug|gereedschap|splintstift/i],
  ['smart-keys', 'smart key', /smart ?key|keyless ?go/i],
  ['gereedschap', 'handgereedschap', /spannvorrichtung|spannbacken|stiftentferner|zange|demontage|anschlag x-cut/i],
  ['accessoires', 'onderdeel', /\bsplinte?\b|klappschl(ue|ü)ssel.*st(ue|ü)ck|schraub|feder\b|tpms|schl(ue|ü)sselkopf/i],
  /*
   * Mechanical blanks — Börkey, ABS, AF numbers — with no electronics in them.
   * A-Key sells a lot of these and left them uncategorised.
   */
  ['sleutelbaarden', 'sleutelbaard', /fahrzeugschl(ue|ü)ssel|autoschl(ue|ü)ssel|schl(ue|ü)sselrohling|b(oe|ö)rkey|^[a-z]{2,4}\d[a-z]?\s+\d{3,4}/i],
  /*
   * Not car keys at all: safe, furniture, cylinder and master keys. Grouped so
   * they can be shown or hidden as one decision instead of turning up among
   * the remotes.
   */
  ['overige-sleutels', 'overige sleutel', /tresorschl|stahlschl|m(oe|ö)belschl|zylinderschl|anlage(n)?schl|anlageprofil|hauptschl(ue|ü)ssel|universalschl|chubbschl|fahrradschl|buntbart|vierkant|bahnenschl|bohrmulden|kreuzbart|keilbart|dornschl|^art\.|^\d{3,4}[a-z]?[-\/ ]/i],
  // A key that matched nothing above is still a key.
  ['afstandsbedieningen', 'afstandsbediening', /^autosleutel|^funkschl|^\d?-?knops|^[a-z]{2,6}\d{2,4}/i],
];

/** Not shippable goods, or trade equipment. Kept out of the consumer shop. */
const TRADE_CATEGORIES = new Set(['gereedschap', 'diensten']);

const MANUFACTURERS = [
  ['Xhorse', /\bxhorse\b|\bvvdi\b|\bx[knsez][a-z]{2}\d/i],
  ['KeyDIY', /\bkeydiy\b|\bkey ?diy\b|\bkd-?x?\d|\bnb\d{2}\b|\bb\d{2}-\d\b|\btb\d{2}-\d\b/i],
  ['Lonsdor', /\blonsdor\b/i],
  ['Autel', /\bautel\b|\bikey\w+/i],
  ['Silca', /\bsilca\b/i],
];

/**
 * The Dutch noun and the sentence that explains what this kind of part is.
 * Without an entry a product falls back to "Accessoire", which is how PCB
 * boards ended up titled "Accessoire · Audi · XSMA41EN".
 */
const TYPE_COPY = {
  afstandsbedieningen: { noun: 'autosleutel', what: 'Complete autosleutel met afstandsbediening.', programming: true },
  'smart-keys': { noun: 'smart key', what: 'Keyless-sleutel: de auto herkent hem zonder dat u hem uit uw zak haalt.', programming: true },
  behuizingen: { noun: 'sleutelbehuizing', what: 'Vervangt de versleten of gebarsten kast; de elektronica uit uw eigen sleutel gaat over.', programming: false },
  noodsleutels: { noun: 'noodsleutel', what: 'Mechanische noodsleutel — opent het portier als de batterij of de elektronica het laat afweten.', programming: false },
  printplaten: { noun: 'printplaat', what: 'Losse printplaat voor in een bestaande behuizing.', programming: true },
  transponders: { noun: 'transponderchip', what: 'De chip die de startonderbreker herkent.', programming: true },
  'universal-remotes': { noun: 'universele autosleutel', what: 'Universele sleutel die op uw auto wordt geprogrammeerd; geschikt voor veel merken.', programming: true },
  batterijen: { noun: 'batterij', what: 'Verse batterij voor uw sleutel.', programming: false },
  gereedschap: { noun: 'gereedschap', what: 'Gereedschap voor de vakhandel.', programming: false },
  sleutelbaarden: { noun: 'sleutelbaard', what: 'Ongeslepen sleutelbaard; wij slijpen hem passend op uw slot.', programming: false },
  'overige-sleutels': { noun: 'sleutel', what: 'Sleutel voor woning, meubel of kluis — geen autosleutel.', programming: false },
  accessoires: { noun: 'onderdeel', what: 'Los onderdeel voor reparatie van een sleutel.', programming: false },
  diensten: { noun: 'dienst', what: 'Technische ondersteuning — geen fysiek artikel.', programming: false },
};

/* ── helpers ──────────────────────────────────────────────────────────── */

const firstMatch = (list, value) => list.find(([, re]) => re.test(value))?.[0] ?? null;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function categorise(row, title) {
  const given = row.Category?.trim();
  const sub = row.Subcategory?.trim();

  if (given) {
    const promoted = PROMOTE[`${given}|${sub}`];
    if (promoted) return promoted;
    return [given, sub || given];
  }

  const hit = FALLBACK.find(([, , re]) => re.test(title));
  return hit ? hit.slice(0, 2) : [null, null];
}

/** Everything the title states, as label/value pairs for the spec table. */
function specsFor({ makes, buttons, frequency, chip, articleCode, manufacturer }) {
  const specs = [];
  if (makes.length) specs.push(['Merk', makes.join(', ')]);
  if (manufacturer) specs.push(['Fabrikant', manufacturer]);
  if (buttons) specs.push(['Aantal knoppen', String(buttons)]);
  if (frequency) specs.push(['Frequentie', frequency]);
  if (chip) specs.push(['Transponder', chip]);
  if (articleCode) specs.push(['Artikelcode', articleCode]);
  return specs;
}

/* ── run ──────────────────────────────────────────────────────────────── */

const rows = parseCsv(readFileSync(IN, 'utf8'));
const header = rows[0].map((h) => h.trim());
const records = rows.slice(1).map((r) =>
  Object.fromEntries(header.map((k, i) => [k, (r[i] ?? '').trim()]))
);

const products = [];
const seenSlugs = new Set();
const stats = { noCategory: 0, noMake: 0, noImage: 0 };

for (const row of records) {
  const title = row.Title_DE || row.Title_NL;
  if (!title || !row.Slug) continue;

  const costPrice = Number(String(row.CostPrice).replace(',', '.'));
  if (!Number.isFinite(costPrice) || costPrice <= 0) continue;

  // Slugs come from A-Key and are already unique; guard anyway so a future
  // export cannot silently collapse two articles onto one page.
  let slug = row.Slug;
  if (seenSlugs.has(slug)) {
    let n = 2;
    while (seenSlugs.has(`${slug}-${n}`)) n++;
    slug = `${slug}-${n}`;
  }
  seenSlugs.add(slug);

  const [category, subcategory] = categorise(row, title);
  if (!category) stats.noCategory++;

  const makes = row.Makes
    ? row.Makes.split(',').map((m) => m.trim()).filter(Boolean)
    : [];
  if (!makes.length) stats.noMake++;

  /*
   * The export writes absolute URLs on a host that does not answer; the files
   * themselves are in public/images/products. Serve them from here — an
   * external host is a dependency the shop does not need, and this one is down.
   */
  const localise = (url) =>
    url.replace(/^https?:\/\/[^/]+\/(images\/)/i, '/$1');

  /*
   * A path is only used if the file is actually there. The export lists an
   * image for every product, but not every file has been fetched yet, and a
   * broken image on a product page reads as a broken shop.
   */
  const onDisk = (url) =>
    url.startsWith('/') && existsSync(path.join(process.cwd(), 'public', url));

  const images = (row.All_Images || row.Main_Image || '')
    .split(/[|;,]\s*(?=https?:)/)
    .map((u) => localise(u.trim()))
    .filter((u) => u && onDisk(u));
  if (!images.length) stats.noImage++;

  const manufacturer = firstMatch(MANUFACTURERS, title) ?? 'A-Key';
  const articleCode = (title.match(/\b([A-Z]{2,6}\d{2,4}[A-Z0-9+]*)\b/) ?? [])[1] ?? null;
  const buttons = Number((title.match(/(\d+)\s*[-\s]?(?:knops|tasten|button)/i) ?? [])[1]) || null;
  const freq = (title.match(/(\d{3})\s*mhz/i) ?? [])[1];
  const frequency = freq ? `${freq} MHz` : null;
  const chip =
    (title.match(/\bID\s?(\d[A-Z0-9]*)\b/i) ?? [])[1] ??
    (title.match(/\b(\d[A-Z])\s*chip\b/i) ?? [])[1] ??
    null;

  const copy = TYPE_COPY[category] ?? { noun: 'onderdeel', what: '', programming: false };

  /*
   * The Dutch title: what it is, which cars, then the supplier's own code.
   * The code goes in last and whole — it is what a customer reads off their old
   * key and types into the search box.
   */
  const titleNl = [
    cap(copy.noun),
    makes.slice(0, 3).join(', ') || null,
    buttons ? `${buttons} knoppen` : null,
    articleCode,
  ].filter(Boolean).join(' · ');

  const sentences = [copy.what];
  if (makes.length) sentences.push(`Geschikt voor ${makes.join(', ')}.`);
  if (frequency) sentences.push(`Werkt op ${frequency} — controleer of dit overeenkomt met uw huidige sleutel.`);
  if (chip) sentences.push(`Voorzien van een ${chip.toUpperCase()}-transponder.`);
  if (copy.programming) sentences.push('Wij programmeren hem ter plaatse op uw auto, of u laat hem elders inleren.');

  const descriptionNl = sentences.filter(Boolean).join(' ');
  const closing = copy.programming
    ? 'Besteld bij Autosleutel24 en desgewenst ter plaatse geprogrammeerd.'
    : 'Besteld bij Autosleutel24, snel geleverd.';

  products.push({
    id: row.ID || slug,
    slug,
    supplier: 'A-Key',
    title,
    titleNl,
    category,
    subcategory,
    audience: TRADE_CATEGORIES.has(category) ? 'trade' : 'public',
    makes,
    manufacturer,
    condition: 'aftermarket',
    buttons,
    frequency,
    chip: chip ? chip.toUpperCase() : null,
    costPrice,
    image:
      (row.Main_Image && onDisk(localise(row.Main_Image))
        ? localise(row.Main_Image)
        : images[0]) || '/images/product-placeholder.svg',
    images,
    fitment: [],
    articleCode,
    specs: specsFor({ makes, buttons, frequency, chip: chip?.toUpperCase(), articleCode, manufacturer }),
    excerpt: sentences[0] || title,
    descriptionNl,
    directAnswer: sentences[0] || '',
    metaDescriptionNl: `${titleNl}. ${closing}`.slice(0, 155),
  });
}

/** Facet counts, so a filter never offers an option with no results behind it. */
function facetCount(key) {
  const out = {};
  for (const p of products) {
    const values = key === 'makes' ? p.makes : [p[key]];
    for (const v of values) if (v != null && v !== '') out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}

writeFileSync(
  OUT,
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'A-Key GmbH',
    count: products.length,
    facets: {
      category: facetCount('category'),
      subcategory: facetCount('subcategory'),
      makes: facetCount('makes'),
      manufacturer: facetCount('manufacturer'),
      condition: facetCount('condition'),
      buttons: facetCount('buttons'),
      frequency: facetCount('frequency'),
    },
    products,
  })
);

const pub = products.filter((p) => p.audience === 'public').length;
console.log(`catalog.json written — ${products.length} A-Key products`);
console.log(`  public ${pub} · trade ${products.length - pub} (gated)`);
console.log(`  without category ${stats.noCategory} · without make ${stats.noMake} · without image ${stats.noImage}`);
const byCategory = facetCount('category');
for (const [k, v] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(4)}  ${k}`);
}
