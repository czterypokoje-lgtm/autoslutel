/**
 * Turns the raw supplier export into a structured, filterable catalogue.
 *
 *   node scripts/build-catalog.mjs
 *   src/lib/scraped_products.json  ->  src/lib/catalog.json
 *
 * The raw export has one usable text field per product and a `brand` column
 * that is not a car brand at all but the supplier's collection name — which is
 * why the brand filter on the site was showing audio brands from a template.
 * Everything the UI filters on is derived here, once, at build time, so the
 * pages never parse strings at request time.
 *
 * Two decisions worth knowing about:
 *
 *  - `audience`. Lock picks, decoders and key-programming devices are not
 *    consumer goods: in the Netherlands they sit close to inbrekerswerktuig,
 *    and a locksmith selling car-key programmers to the public undercuts its
 *    own trade. Those products are marked `trade` and are meant to sit behind
 *    a verified-business login, out of the public catalogue and out of any
 *    Merchant Center feed.
 *
 *  - Attribute coverage is deliberately partial. Only ~240 products have a
 *    button count because most of the catalogue is blades, tools and
 *    batteries, which have no buttons. Facets must therefore be contextual:
 *    show a filter only when the current result set actually varies on it.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'src/lib/scraped_products.json');
const OUT = join(root, 'src/lib/catalog.json');

/* ── vocabularies ─────────────────────────────────────────────────────── */

// Longest first, so "Land Rover" wins over a bare "Rover" inside it.
const CAR_MAKES = [
  ['Mercedes-Benz', /\bmercedes(-|\s)?benz\b|\bmercedes\b/i],
  ['Land Rover', /\bland[\s-]?rover\b|\brange[\s-]?rover\b/i],
  ['Alfa Romeo', /\balfa[\s-]?romeo\b/i],
  ['Volkswagen', /\bvolkswagen\b|\bvw\b/i],
  ['Opel', /\bopel\b|\bvauxhall\b/i], // same cars, NL name is Opel
  ['Citroën', /\bcitroe?n\b/i],
  ['BMW', /\bbmw\b/i],
  ['Audi', /\baudi\b/i],
  ['Ford', /\bford\b/i],
  ['Peugeot', /\bpeugeot\b/i],
  ['Renault', /\brenault\b/i],
  ['Toyota', /\btoyota\b/i],
  ['Nissan', /\bnissan\b/i],
  ['Honda', /\bhonda\b/i],
  ['Hyundai', /\bhyundai\b/i],
  ['Kia', /\bkia\b/i],
  ['Volvo', /\bvolvo\b/i],
  ['Seat', /\bseat\b/i],
  ['Škoda', /\bskoda\b|\bškoda\b/i],
  ['Fiat', /\bfiat\b/i],
  ['Mazda', /\bmazda\b/i],
  ['Mitsubishi', /\bmitsubishi\b/i],
  ['Suzuki', /\bsuzuki\b/i],
  ['Jaguar', /\bjaguar\b/i],
  ['Porsche', /\bporsche\b/i],
  ['Mini', /\bmini\b/i],
  ['Dacia', /\bdacia\b/i],
  ['Chevrolet', /\bchevrolet\b|\bdaewoo\b/i],
  ['Jeep', /\bjeep\b/i],
  ['Lexus', /\blexus\b/i],
  ['Subaru', /\bsubaru\b/i],
  ['Tesla', /\btesla\b/i],
  ['Chrysler', /\bchrysler\b/i],
  ['Dodge', /\bdodge\b/i],
  ['Iveco', /\biveco\b/i],
  ['Smart', /\bsmart\s?(fortwo|forfour|car)\b/i],
];

// The company that made the part, as opposed to the car it fits.
const MANUFACTURERS = [
  ['Xhorse', /\bxhorse\b|\bvvdi\b/i],
  ['KeyDIY', /\bkeydiy\b|\bkd-?x?\d/i],
  ['Autel', /\bautel\b|\bikey\w+/i],
  ['Silca', /\bsilca\b/i],
  ['JMA', /\bjma\b/i],
  ['Keyline', /\bkeyline\b/i],
  ['Lishi', /\blishi\b|\bmr\.?\s?li\b/i],
  ['KLOM', /\bklom\b/i],
  ['JMD', /\bjmd\b/i],
  ['USPRO', /\buspro\b/i],
  ['NXP', /\bnxp\b/i],
];

/* ── classification ───────────────────────────────────────────────────── */

/**
 * Trade-only. Deliberately broad: a false positive costs a public listing,
 * a false negative puts a lock pick in a consumer basket.
 */
const TRADE_ONLY = new RegExp(
  [
    'lock ?pick', 'picking', 'decoder', 'bump ?key', 'tension tool', 'slim ?jim',
    'opening tool', 'tryout', 'jiggl', 'programmer', 'programming device',
    'emulator', 'bypass cable', 'key cutting machine', 'diagnostic tool',
    'vvdi', 'xhorse', 'keydiy', 'abrites', 'yanhua', 'autel im', 'course',
    'training', 'lishi', 'mr\\.? ?li', 'klom', 'obdstar', 'immo', 'akl cable',
    'adapter full kit', 'ecu', 'cluster', 'simulator',
  ].join('|'),
  'i'
);

/** Category, then a narrower subcategory. Order matters — first match wins. */
const CATEGORIES = [
  // Tools first — they are gated anyway and their wording is unambiguous.
  ['gereedschap', 'programmeerapparatuur', /programmer|programming device|emulator|bypass cable|diagnostic|vvdi|xhorse|keydiy|abrites|yanhua|autel im|kd-?x/i],
  ['gereedschap', 'sleutelmachine', /cutting machine|key machine/i],
  ['gereedschap', 'opengereedschap', /lock ?pick|picking|decoder|tension|slim ?jim|opening tool|jiggl|klom|lishi|mr\.? ?li/i],
  // Then the consumer types, narrowest first.
  ['smart-keys', 'smart key', /smart ?key|keyless|proximity|prox key/i],
  ['afstandsbedieningen', 'universele afstandsbediening', /universal (remote|key)|\bxk\d|\bxn\d/i],
  ['afstandsbedieningen', 'afstandsbediening', /\bremote\b|afstandsbediening|key ?fob\b|\bfob\b|flip key/i],
  ['behuizingen', 'sleutelbehuizing', /\bshell\b|\bcase\b|housing|behuizing|\bcover\b|casing/i],
  ['transponders', 'transponder', /transponder|\bid4[68]\b|\bhitag\b|\bpcf7\d+/i],
  ['batterijen', 'batterij', /\bbatter|\bcr\d{4}\b/i],
  ['sloten', 'slot & cilinder', /\block\b|\bcylinder\b|ignition|contactslot|barrel|\block set\b/i],
  ['accessoires', 'accessoire', /keyring|sleutelhanger|pouch|faraday|etui|sticker|\bcable\b/i],
  // Blades last: "blade" appears in a great many descriptions as a component,
  // so matching it early swallowed a third of the catalogue.
  ['sleutelbaarden', 'sleutelbaard', /\bblades?\b|sleutelbaard|key blank|\bblank\b/i],
];


const CONDITIONS = [
  ['genuine', /\bgenuine\b|\boriginal\b|\bofficial\b/i],
  ['oem', /\boem\b/i],
  ['aftermarket', /after ?market|\bcompatible\b|\breplacement\b/i],
];

/* ── helpers ──────────────────────────────────────────────────────────── */

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
   .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

const firstMatch = (pairs, hay) => {
  for (const [value, re] of pairs) if (re.test(hay)) return value;
  return null;
};

/** Strips supplier HTML down to plain text so we can search and measure it. */
const plain = (html) =>
  (html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ')
              .replace(/\s+/g, ' ').trim();

/**
 * Pulls "Hyundai i20 2008-2012" style rows out of the description. Partial by
 * nature — roughly 60% of products carry a year range at all — so anything
 * built on this has to tolerate an empty list.
 */
function extractFitment(text) {
  const out = [];
  const re = /\b([A-Z][a-zA-Z-]{2,})\s+([A-Za-z0-9][\w '.-]{0,18}?)\s+((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2})/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const make = firstMatch(CAR_MAKES, m[1]);
    if (!make) continue;
    out.push({ make, model: m[2].trim(), from: +m[3], to: +m[4] });
    if (out.length >= 40) break;
  }
  return out;
}

/* ── build ────────────────────────────────────────────────────────────── */

const raw = JSON.parse(readFileSync(SRC, 'utf8'));
const seen = new Set();
const products = [];
const stats = { trade: 0, public: 0, noCategory: 0, withButtons: 0, withFitment: 0 };

for (const p of raw) {
  const title = (p.title || '').trim();
  if (!title) continue;

  const body = plain(p.description);
  const hay = `${title} ${p.tags || ''} ${body.slice(0, 600)}`;

  let slug = slugify(title);
  if (seen.has(slug)) slug = `${slug}-${p.id}`;
  seen.add(slug);

  // Title first: it names the product. The description mentions components
  // ("includes an uncut blade") that otherwise hijack the classification.
  const [category, subcategory] =
    (CATEGORIES.find(([, , re]) => re.test(title)) ??
     CATEGORIES.find(([, , re]) => re.test(hay)))?.slice(0, 2) ?? [null, null];
  if (!category) stats.noCategory++;

  const audience = TRADE_ONLY.test(hay) ? 'trade' : 'public';
  stats[audience]++;

  const makes = CAR_MAKES.filter(([, re]) => re.test(hay)).map(([name]) => name);

  const buttonsMatch = title.match(/(\d)\s*[- ]?(?:button|knop|btn)\b/i);
  const buttons = buttonsMatch ? +buttonsMatch[1] : null;
  if (buttons) stats.withButtons++;

  const freqMatch = hay.match(/\b(\d{3}(?:\.\d+)?)\s*MHz\b/i);
  const chipMatch = hay.match(/\b(ID\s?\d{2}|PCF\s?\d{4}|Hitag\s?\d?|4D-?\d{2}|46|48)\b/i);

  const fitment = extractFitment(body);
  if (fitment.length) stats.withFitment++;

  const priceRaw = parseFloat(String(p.price ?? '').replace(',', '.'));

  products.push({
    id: String(p.id),
    slug,
    title,
    category,
    subcategory,
    audience,
    makes,
    manufacturer: firstMatch(MANUFACTURERS, hay),
    condition: firstMatch(CONDITIONS, hay) ?? 'aftermarket',
    buttons,
    frequency: freqMatch ? `${freqMatch[1]} MHz` : null,
    chip: chipMatch ? chipMatch[1].replace(/\s+/g, '') : null,
    // Supplier cost, not a shop price. Pricing is applied downstream so the
    // margin, VAT and rounding rules live in one place.
    costPrice: Number.isFinite(priceRaw) ? priceRaw : null,
    image: p.imageLocalPath || null,
    fitment,
    excerpt: body.slice(0, 260),
  });
}

const facetCount = (key) => {
  const c = {};
  for (const p of products) {
    if (p.audience !== 'public') continue;
    const v = p[key];
    for (const x of Array.isArray(v) ? v : [v]) if (x) c[x] = (c[x] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(c).sort((a, b) => b[1] - a[1]));
};

const catalog = {
  generatedAt: new Date().toISOString(),
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
};

writeFileSync(OUT, JSON.stringify(catalog));
console.log(`catalog.json written — ${products.length} products`);
console.log(`  public ${stats.public} · trade ${stats.trade} (gated)`);
console.log(`  uncategorised ${stats.noCategory} · with buttons ${stats.withButtons} · with fitment ${stats.withFitment}`);
console.log('  car makes:', Object.keys(catalog.facets.makes).length);
console.log('  categories:', Object.keys(catalog.facets.category).join(', '));
