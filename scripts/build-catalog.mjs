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
import { translateDescription, readFacts } from './accessory-copy.mjs';
import path from 'path';

const IN = path.join(process.cwd(), 'src/data/akey-products.csv');
const SECTIONS = path.join(process.cwd(), 'src/data/akey-categories.json');
const SPECS = path.join(process.cwd(), 'src/data/akey-specs.json');
const ACCESSORIES = path.join(process.cwd(), 'src/data/akey-accessories.json');

/** Names of the accessories scraped from A-Key's own section pages. */
let accessoryData = { products: {} };
try {
  accessoryData = JSON.parse(readFileSync(ACCESSORIES, 'utf8'));
} catch {
  // reported later, where the accessories are added
}
const OUT = path.join(process.cwd(), 'src/lib/catalog.json');
/*
 * A small companion file: the car makes we actually stock, with counts.
 *
 * The brand menu and the /webshop/merken grid are client components, so they
 * cannot read the catalogue — they each carried a hand-written list instead,
 * and both had drifted into brands nobody sells (Oldsmobile, Plymouth, Hummer)
 * while missing brands we do. Importing catalog.json into the browser bundle
 * to fix that would ship the whole catalogue to every visitor; this file is a
 * few hundred bytes.
 */
const BRANDS_OUT = path.join(process.cwd(), 'src/lib/brands.json');

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

/*
 * Where A-Key themselves put each product, read off their category pages by
 * scripts/scrape-akey-categories.mjs.
 *
 * This is the only source that cannot be argued with: a product is on the PCB
 * page or it is not. The export's own Category column disagrees with it often
 * — complete remote keys filed as circuit boards — and a title only says what
 * the wording happens to mention.
 *
 * A product sits in several sections at once (a Hyundai PCB is on the Hyundai
 * page and on the PCB page), so the type sections are ranked and the most
 * specific one wins. Make sections still contribute the car makes.
 */
let akeySections = { products: {} };
try {
  akeySections = JSON.parse(readFileSync(SECTIONS, 'utf8'));
} catch {
  console.warn('  (no akey-categories.json — run scripts/scrape-akey-categories.mjs)');
}

/*
 * The specification block off each A-Key product page, collected by
 * scripts/scrape-akey-specs.mjs: frequency, transponder, key blade, number of
 * buttons, colour, material.
 *
 * None of it is in the CSV export, and the first three are what decide whether
 * a key fits the car at all. Reading them out of the title only works when the
 * title happens to mention them — for RNR114 it mentions none of the four.
 */
let akeySpecs = {};
try {
  akeySpecs = JSON.parse(readFileSync(SPECS, 'utf8'));
} catch {
  console.warn('  (no akey-specs.json — run scripts/scrape-akey-specs.mjs)');
}

/** Most specific first. A board is a board even when it is also a Hyundai part. */
const SECTION_RANK = [
  'printplaten', 'accessoires', 'gereedschap', 'noodsleutels', 'sleutelbaarden',
  'universal-remotes', 'transponders', 'behuizingen', 'smart-keys',
  'afstandsbedieningen',
];

const ARTICLE_CODE = /\b([A-Z]{2,6}\d{1,4}[A-Z0-9+]*)\b/;

const germanSlug = (title) =>
  (title || '')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
    .replace(/[^A-Za-z0-9]+/g, '-');

const flatten = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const SCRAPED_ACCESSORY_NAMES = new Set(
  Object.values(accessoryData.products ?? {})
    .map((p) => (p.title ? flatten(p.title) : null))
    .filter(Boolean)
);
const codeIn = (value) => value.replace(/[-_]/g, ' ').match(ARTICLE_CODE)?.[1]?.toUpperCase() ?? null;

const sectionsBySlug = new Map();
const sectionsByCode = new Map();
for (const [slug, entry] of Object.entries(akeySections.products ?? {})) {
  sectionsBySlug.set(flatten(slug), entry);
  const code = codeIn(slug);
  if (code && !sectionsByCode.has(code)) sectionsByCode.set(code, entry);
}

const specsBySlug = new Map();
const specsByCode = new Map();
for (const [slug, entry] of Object.entries(akeySpecs)) {
  specsBySlug.set(flatten(slug), entry);
  const code = codeIn(slug);
  if (code && !specsByCode.has(code)) specsByCode.set(code, entry);
}

/** A-Key's published specification for one product, matched the same way. */
function akeySpec(title) {
  return (
    specsBySlug.get(flatten(germanSlug(title))) ??
    (codeIn(title) ? specsByCode.get(codeIn(title)) : null) ??
    null
  );
}

/** A-Key's own answer for one product, or null when they do not list it. */
function akeyPlacement(title) {
  const entry =
    sectionsBySlug.get(flatten(germanSlug(title))) ??
    (codeIn(title) ? sectionsByCode.get(codeIn(title)) : null);
  if (!entry) return null;

  const typed = entry.categories.filter((c) => c.fromType);
  const pool = typed.length > 0 ? typed : entry.categories;
  if (pool.length === 0) return null;

  pool.sort(
    (a, b) => SECTION_RANK.indexOf(a.category) - SECTION_RANK.indexOf(b.category)
  );
  return { category: pool[0].category, subcategory: pool[0].subcategory, makes: entry.makes ?? [] };
}

/*
 * A-Key's own vocabulary, in their order of precedence.
 *
 * Their titles name the article type precisely — "Funkschlüssel PCB",
 * "Funkschlüssel Gehäuse", "Notschlüssel", "Transponderschlüssel" — and that
 * beats the Category column of the export, which puts complete remote keys and
 * rubber button pads in with the circuit boards.
 *
 * Order is what makes it work: "Funkschlüssel Gehäuse" is a housing, not a
 * remote, so housings are tested before remotes; a "Transponderschlüssel" is a
 * key, not a loose chip.
 */
const TITLE_RULES = [
  ['diensten', 'support', /support ?ticket|technischer support|hilfestellung|masterclass|schulung/i],
  ['batterijen', 'batterij', /^(cr\d|lr\d|v\d+ga|v\d+a\b|aaa?a?[\s-]|rayovac|\d+\s+rayovac|accu\b)|knopfzelle|batterie|blister/i],

  // Loose parts before the things they go into.
  /*
   * The four tool-accessory ranges are no longer guessed from CSV titles.
   * That produced 31 entries with German names, 20 of which are the same
   * article as one of the 185 scraped from A-Key's own section pages — the
   * same product twice, under two spellings of the same subcategory. The
   * scraped set is complete and carries prices, photos and descriptions, so
   * it is the only source; see addAccessories() below.
   */
  ['accessoires', 'microtaster & antenne', /microtaster|\bantenne\b|tastenfeld|tastengummi|knoppenfeld|knoppengummi|\bsplinte?\b|\btpms\b/i],
  ['printplaten', 'printplaat', /\bpcb\b|platine|printplaat|leiterplatte|\bboard\b/i],
  ['behuizingen', 'sleutelbehuizing', /geh(ae|ä)use|behuizing|umbauset|umbaukit|schl(ue|ü)sselkopf/i],
  ['noodsleutels', 'noodsleutel', /notschl(ue|ü)ssel|noodsleutel/i],
  ['sleutelbaarden', 'sleutelbaard', /schl(ue|ü)sselblatt|sleutelblad|schl(ue|ü)sselrohling|fahrzeugschl(ue|ü)ssel|b(oe|ö)rkey|^[a-z]{2,4}\d[a-z]?\s+\d{3,4}/i],
  ['transponders', 'transpondersleutel', /transponderschl(ue|ü)ssel|transpondersleutel/i],
  ['transponders', 'transponder', /^transponder\b|\btransponder ?chip\b/i],

  // The universal ranges A-Key lists as their own sections.
  ['universal-remotes', 'KeyDIY universal', /keydiy|key ?diy|\bnb\d{2}\b|\bb\d{2}-\d\b|\btb\d{2}-\d\b|\bfgb\d|\bdz-\d/i],
  ['universal-remotes', 'Xhorse universal', /xhorse|\bvvdi\b|\bx[knsez][a-z]{2}\d/i],
  ['universal-remotes', 'Autel universal', /\bautel\b|\bikey\w+/i],
  ['universal-remotes', 'IEA universal', /\biea universal\b|iea fernbedienung/i],
  ['universal-remotes', 'universele afstandsbediening', /\buniversal\b|style\s*\(flip|\(flip-/i],

  ['accessoires', 'garageopener', /garagen(oe|ö)ffner|garage ?opener/i],
  ['gereedschap', 'handgereedschap', /werkzeug|zubeh(oe|ö)r|spannvorrichtung|spannbacken|stiftentferner|zange|demontage|anschlag x-cut/i],
  ['smart-keys', 'smart key', /smart ?key|keyless ?go|keylessgo/i],
  ['afstandsbedieningen', 'sleutel zonder startonderbreker', /ohne wegfahrsperre|zonder startonderbreker/i],

  // Not car keys: safe, furniture, cylinder and master keys.
  ['overige-sleutels', 'overige sleutel', /tresorschl|stahlschl|m(oe|ö)belschl|zylinderschl|anlage(n)?schl|anlageprofil|hauptschl(ue|ü)ssel|universalschl|chubbschl|fahrradschl|buntbart|vierkant|bahnenschl|bohrmulden|kreuzbart|keilbart|dornschl|^art\.|^\d{3,4}[a-z]?[-\/ ]/i],

];

/*
 * The catch-all, and it runs last for a reason.
 *
 * Nearly every A-Key title starts with "Funkschlüssel" or "Autosleutel",
 * including their smart keys — the title of a keyless Audi key says nothing
 * about being keyless. Ahead of the export's own column this rule swallowed 46
 * of 60 smart keys. The column knows what the title does not.
 */
const GENERIC_TITLE = [
  ['afstandsbedieningen', 'afstandsbediening', /funkschl(ue|ü)ssel|autosleutel|autoschl(ue|ü)ssel|klappschl(ue|ü)ssel|^\d?-?knops|^[a-z]{2,6}\d{2,4}/i],
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

/** A URL slug from a product name: lower case, ASCII, hyphens. */
const slugify = (value) =>
  (value ?? '')
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

/**
 * Three passes, most specific first.
 *
 * 1. A title that names the type outright — "Funkschlüssel PCB", "… Gehäuse",
 *    "Notschlüssel". The export's column puts complete remote keys and rubber
 *    button pads under circuit boards, so an explicit title beats it.
 * 2. The export's own column, which knows things the title does not — that an
 *    ordinary-looking Audi key is a keyless one, for instance.
 * 3. The catch-all, for the rows with neither.
 */
function categorise(row, title) {
  const placed = akeyPlacement(title);
  if (placed) {
    /*
     * A-Key has no smart-key section — a keyless Audi key sits on the Audi
     * page as an ordinary Funkschlüssel. Their top level is kept as it is, but
     * the export does know which keys are keyless, so that survives as the
     * subcategory and stays filterable.
     */
    if (placed.category === 'afstandsbedieningen' && row.Category?.trim() === 'smart-keys') {
      return ['afstandsbedieningen', 'smart key'];
    }
    return [placed.category, placed.subcategory];
  }

  const named = TITLE_RULES.find(([, , re]) => re.test(title));
  if (named) return named.slice(0, 2);

  const given = row.Category?.trim();
  const sub = row.Subcategory?.trim();
  if (given) {
    const promoted = PROMOTE[`${given}|${sub}`] ?? [given, sub || given];

    /*
     * One column the export gets wrong often enough to guard against: it files
     * complete remote keys as circuit boards. A board always says so in its
     * name — Platine, PCB, Board — so a "printplaat" whose title never mentions
     * one is not a board, and falls through to the catch-all below.
     */
    const boardWord = /\bpcb\b|platine|printplaat|leiterplatte|\bboard\b/i.test(title);
    if (promoted[0] !== 'printplaten' || boardWord) return promoted;
  }

  const generic = GENERIC_TITLE.find(([, , re]) => re.test(title));
  return generic ? generic.slice(0, 2) : [null, null];
}

/** Everything the title states, as label/value pairs for the spec table. */
/*
 * The spec table shown on the product page.
 *
 * Order matters: frequency and transponder decide whether the key can work at
 * all, so they come before cosmetics. A customer reads these two off their old
 * key; everything below is confirmation.
 */
const COLOURS = {
  schwarz: 'zwart', silber: 'zilver', grau: 'grijs', weiss: 'wit', weiß: 'wit',
  blau: 'blauw', rot: 'rood', chrom: 'chroom', gold: 'goud', braun: 'bruin',
  gelb: 'geel', grün: 'groen', orange: 'oranje', beige: 'beige',
  transparent: 'transparant', silbergrau: 'zilvergrijs', anthrazit: 'antraciet', 'schwarz/silber': 'zwart/zilver',
  'schwarz/chrom': 'zwart/chroom',
};

/** German material wording, word by word — the values are short and repetitive. */
const MATERIAL_WORDS = {
  hochwertiger: 'hoogwaardig', hochwertig: 'hoogwaardig',
  Kunststoff: 'kunststof', Metall: 'metaal', Gummi: 'rubber',
  Aluminium: 'aluminium', Leder: 'leer', Zink: 'zink', Stahl: 'staal',
  Messing: 'messing', Silikon: 'silicone', Carbon: 'carbon',
  ohne: 'zonder', mit: 'met', Emblem: 'embleem', Logo: 'logo', und: 'en',
};

/*
 * A-Key sometimes writes two fields in one line — "Farbe: schwarz Material:
 * hochwertiger Kunststoff/Metall, ohne Emblem" — and sometimes runs the
 * disclaimer on behind it ("… ohne Emblem Kein Fiat-Originalschlüssel").
 * Everything from the next label onwards belongs to another field.
 */
const NEXT_LABEL = /\s+(?:Material|Farbe|Transponder|Funkeinheit|Anzahl der Tasten|Schlüsselbart|Produkttyp|Kein)\b[\s\S]*$/;

const cutAtLabel = (value) => {
  const trimmed = (value ?? '').replace(NEXT_LABEL, '').replace(/[,;:\s]+$/, '').trim();
  return trimmed || null;
};

/** The material hiding inside a run-on colour value, when there is one. */
const materialInColour = (value) =>
  cutAtLabel((value ?? '').match(/Material\s*:?\s*([\s\S]+)/)?.[1] ?? '');

const dutchColour = (value) => {
  const cut = cutAtLabel(value);
  if (!cut) return null;
  // "schwarz / silber", "schwarz/grau" — translate each part, keep the shape.
  const translated = cut
    .split(/\s*\/\s*/)
    .map((part) => COLOURS[part.trim().toLowerCase()] ?? part.trim())
    .join(' / ');
  return translated || null;
};

/**
 * A-Key's Produkttyp, in Dutch.
 *
 * The value is a short German noun phrase from a fixed vocabulary, so it is
 * translated term by term; anything not in the list is left as it stands
 * rather than guessed at.
 */
const PRODUCT_TYPES = {
  'Funkschlüssel': 'afstandsbediening',
  'Funkschlüssel PCB': 'printplaat afstandsbediening',
  'Funkschlüssel - Smartkey': 'afstandsbediening / smart key',
  'Funkschlüssel / Smartkey': 'afstandsbediening / smart key',
  'Funkschlüssel Smartkey': 'afstandsbediening / smart key',
  'Funkschlüssel / Klappschlüssel': 'afstandsbediening / klapsleutel',
  'Funkfernbedienung': 'afstandsbediening',
  'Funkeinheit': 'zendeenheid',
  'Funkgehäuse': 'behuizing afstandsbediening',
  'Schlüsselgehäuse': 'sleutelbehuizing',
  'Schlüsselgehäuse Smartkeygehäuse': 'sleutelbehuizing voor smart key',
  'Schlüsselgehäuse Smartcardgehäuse': 'behuizing voor sleutelkaart',
  'Schlüsselgehäuse / Smartcard': 'sleutelbehuizing / sleutelkaart',
  'Schlüsselgehäuse Umbausatz': 'sleutelbehuizing ombouwset',
  'Schlüsselgehäuse Umbaukit': 'sleutelbehuizing ombouwset',
  'Schlüsselgehäuse mit Licht': 'sleutelbehuizing met verlichting',
  'Schlüsselgehäuse mit Schlüsselschaft': 'sleutelbehuizing met sleutelbaard',
  'Schlüsselgehäuse (einfaches Clip System)': 'sleutelbehuizing (clipsysteem)',
  'Schlüsselgehäuse UDS': 'sleutelbehuizing UDS',
  'Schlüsselkarte': 'sleutelkaart',
  'Notschlüssel': 'noodsleutel',
  'Transponderschlüssel': 'transpondersleutel',
};

const dutchProductType = (value) => {
  const cut = cutAtLabel(value);
  return cut ? (PRODUCT_TYPES[cut] ?? cut) : null;
};

const dutchMaterial = (value) => {
  const cut = cutAtLabel(value);
  if (!cut) return null;
  const translated = cut.replace(
    /[A-Za-zÄÖÜäöüß]+/g,
    (w) => MATERIAL_WORDS[w] ?? MATERIAL_WORDS[w.toLowerCase()] ?? w
  );
  // "hoch" and "hoogwaardig" on their own are a truncated value, not a material.
  return translated.split(/\s+/).length > 1 ? translated : null;
};

/* ── which cars it fits ───────────────────────────────────────────────────
 *
 * A-Key states this on the product page and nowhere in the export:
 *
 *   geeignet für folgende Fahrzeuge: FIAT NEW DOBLO - FIORINO - GRANDE PUNTO
 *   - MITO - PEUGEOT BIPPER - TEPE - CITROEN NEMO - OPEL COMBO - FORD KA
 *
 * Nine cars across five makes. Keeping only "Fiat" — which is what the shop
 * did — throws away the answer to the one question every visitor arrives
 * with, and hides the key from the four other makes it fits.
 *
 * The list is one string with the make named only when it changes, so it is
 * read left to right: a known make switches the current make, everything else
 * is a model under it.
 * ──────────────────────────────────────────────────────────────────────── */

/** Spellings A-Key uses, mapped to the name the catalogue filters on. */
const MAKE_ALIASES = {
  vw: 'Volkswagen', volkswagen: 'Volkswagen',
  citroen: 'Citroën', 'citroën': 'Citroën',
  skoda: 'Škoda', 'škoda': 'Škoda',
  mercedes: 'Mercedes-Benz', 'mercedes-benz': 'Mercedes-Benz', benz: 'Mercedes-Benz',
  'mercedes benz': 'Mercedes-Benz',
  alfa: 'Alfa Romeo', 'alfa romeo': 'Alfa Romeo',
  landrover: 'Land Rover', 'land rover': 'Land Rover', 'range rover': 'Land Rover',
  vauxhall: 'Opel', opel: 'Opel', holden: 'Opel',
  chevrolet: 'Chevrolet', chevy: 'Chevrolet', gm: 'GM',
  infinity: 'Infiniti', infiniti: 'Infiniti',
  seat: 'Seat', audi: 'Audi', bmw: 'BMW', mini: 'Mini', ford: 'Ford',
  fiat: 'Fiat', iveco: 'Iveco', lancia: 'Lancia', jeep: 'Jeep', dodge: 'Dodge',
  chrysler: 'Chrysler', peugeot: 'Peugeot', renault: 'Renault', dacia: 'Dacia',
  nissan: 'Nissan', toyota: 'Toyota', lexus: 'Lexus', honda: 'Honda',
  acura: 'Honda', hyundai: 'Hyundai', kia: 'Kia', mazda: 'Mazda',
  mitsubishi: 'Mitsubishi', subaru: 'Subaru', suzuki: 'Suzuki', volvo: 'Volvo',
  saab: 'Saab', porsche: 'Porsche', jaguar: 'Jaguar', bentley: 'Bentley',
  maserati: 'Maserati', ferrari: 'Ferrari', smart: 'Smart', rover: 'Rover',
  ssangyong: 'SsangYong', cadillac: 'Cadillac', buick: 'Buick', tesla: 'Tesla',
  isuzu: 'Isuzu', daihatsu: 'Daihatsu', daewoo: 'Daewoo', proton: 'Proton',
  man: 'MAN', scania: 'Scania', daf: 'DAF',
};

/** Words that are not a car: "und andere", "u.a.", "etc.", "usw.". */
const NOT_A_MODEL = /^(und andere|u\.?\s?a\.?|usw\.?|etc\.?|others?|various models?|diverse|weitere|andere|models?|uvm\.?|u\.v\.m\.?)$/i;

const decode = (value) =>
  (value ?? '')
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');

/**
 * "FIAT NEW DOBLO - FIORINO - PEUGEOT BIPPER" -> [{make:'Fiat',model:'New Doblo'},
 * {make:'Fiat',model:'Fiorino'}, {make:'Peugeot',model:'Bipper'}]
 */
/** The set of make names, for telling "Opel" (a menu entry) from "Opel Combo". */
const MAKE_WORDS = new Set(Object.keys(MAKE_ALIASES));

/**
 * The per-line form: `geeignet für Hyundai IX25 2017-2018`.
 *
 * A-Key's left-hand menu prints 150 lines of the same shape carrying nothing
 * but a make, so anything that is only a make is dropped here — what is left
 * is a real model line, often with the years the car was built.
 */
function parseFitmentLines(lines, fallbackMakes) {
  const out = [];

  for (const raw of lines ?? []) {
    let line = decode(raw).trim();
    if (!line || line.length > 160) continue;

    // A label sometimes survives on the line: "z.B. folgende Fahrzeuge: …".
    line = line.replace(/^(?:z\.?\s?B\.?|folgende\s+Fahrzeuge|Fahrzeuge|Modelle)\s*:?\s*/i, '');
    if (line.includes(':')) continue; // still a label line, not a car

    // "Hyundai IX25 2017-2018" — the years belong to every model on the line.
    const years = line.match(/\b((?:19|20)\d{2})\s*(?:[-–—>]|bis|to)\s*((?:19|20)\d{2})?/);
    // "Tucson 2019+" must not become "Tucson +".
    const withoutYears = line
      .replace(/\b(19|20)\d{2}\s*(?:[-–—>+]|bis|to)?\s*((?:19|20)\d{2})?/g, ' ')
      .replace(/[\s+>–—-]+$/, '')
      .trim();

    // One line can name several cars — "Toyota und Lexus", "A4 / A5 / Q5" —
    // and the list parser already knows how to walk that.
    for (const vehicle of parseVehicles(withoutYears, fallbackMakes)) {
      if (!vehicle.model) continue;
      out.push({
        ...vehicle,
        from: years ? Number(years[1]) : 0,
        to: years?.[2] ? Number(years[2]) : 9999,
      });
    }
  }

  return out;
}

function parseVehicles(raw, fallbackMakes) {
  let text = decode(raw).trim();
  if (!text) return [];

  // A stray label sometimes survives the line join.
  text = text.replace(/^(?:folgende\s+)?(?:Fahrzeuge|Modelle)\s*:?\s*/i, '');

  const parts = text
    .split(/\s+-\s+|\s*[,;\/]\s*|\s+u\.a\.|\s+und\s+andere|\s+und\s+|\s*&\s*|\s+en\s+/i)
    .map((p) => p.replace(/[.\s]+$/, '').trim())
    .filter(Boolean);

  const out = [];
  let current = fallbackMakes[0] ?? null;

  for (const part of parts) {
    if (NOT_A_MODEL.test(part)) continue;

    const words = part.split(/\s+/);
    const first = words[0].toLowerCase();
    const firstTwo = words.slice(0, 2).join(' ').toLowerCase();

    let make = null;
    let rest = words;

    if (MAKE_ALIASES[firstTwo]) {
      make = MAKE_ALIASES[firstTwo];
      rest = words.slice(2);
    } else if (MAKE_ALIASES[first]) {
      make = MAKE_ALIASES[first];
      rest = words.slice(1);
    }

    if (make) current = make;

    const model = rest.join(' ').replace(/^[-–\s]+/, '').trim();
    if (!model) {
      // The entry was only a make ("Audi, Skoda, Seat, VW") — that is still
      // worth recording as a make this part fits.
      if (make) out.push({ make, model: null });
      continue;
    }
    if (NOT_A_MODEL.test(model)) continue;
    if (!current) continue;

    out.push({ make: current, model: titleCaseModel(model) });
  }

  // Same model twice (A-Key repeats them across lines) is one entry.
  const seen = new Set();
  return out.filter(({ make, model }) => {
    const key = `${make}|${model ?? ''}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/*
 * A model name is a model name: "Megane II", "Grande Punto", "IX25".
 *
 * A-Key's lines carry other things too — trailing year markers ("Ioniq 2017+",
 * "I30 ->"), and occasionally a whole specification ("Freemont 2+1 Tasten
 * 433MHZ HITAG2 PCF7945A"). Printing those in the fitment list makes the shop
 * look like a scrape of someone else's site, which is what it would be.
 */
/** Marques that are not in our own make list but are still not models. */
const OTHER_BRANDS = new Set([
  'lamborghini', 'bugatti', 'rolls royce', 'aston martin', 'mclaren', 'lotus',
  'genesis', 'polestar', 'byd', 'mg', 'cupra', 'abarth', 'lancia', 'iveco',
  'holden', 'scion', 'saturn', 'pontiac', 'hummer', 'infiniti', 'datsun',
]);

const MODEL_NOISE = /\b(MHZ|HITAG|PCF\d|Tasten|Buttons?|Chip|Transponder|Platine)\b/i;

function cleanModel(model) {
  const trimmed = (model ?? '')
    // trailing "2017+", "-> 2016", "> 06"
    .replace(/\b(19|20)?\d{2,4}\s*[+>–—-]*\s*$/g, '')
    .replace(/[\s+>–—-]+$/g, '')
    .replace(/^[\s+>–—-]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  /*
   * Brackets that lost their contents when the years were stripped:
   * "Tucson (alle )", "Megane 3 (bis )", "SL (129) Bj.". A bracket is kept
   * only when something readable is still inside it.
   */
  const balanced = trimmed
    .replace(/\(\s*(?:alle|bis|ab|von|seit|und)?\s*\)/gi, '')
    .replace(/\s*\bBj\.?\s*$/i, '')
    .replace(/^\s*(?:u\.a\.|z\.b\.)\s*/i, '')
    .replace(/\s*[([{]\s*$/, '')
    .replace(/^\s*[)\]}]\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (/^[^([]*\)/.test(balanced)) return null;

  if (!balanced || balanced.length < 2 || balanced.length > 28) return null;
  // "Audi Lamborghini" is two makes on one line, not an Audi model.
  if (OTHER_BRANDS.has(balanced.toLowerCase())) return null;
  if (!/^[A-Za-zÀ-ÿ]/.test(balanced)) return null;
  if (MODEL_NOISE.test(balanced)) return null;
  return balanced;
}

/** "GRANDE PUNTO" -> "Grande Punto", but "CLK" and "A3" keep their shape. */
function titleCaseModel(model) {
  return model
    .split(/\s+/)
    .map((word) =>
      word.length > 3 && /^[A-ZÄÖÜ]+$/.test(word)
        ? word[0] + word.slice(1).toLowerCase()
        : word
    )
    .join(' ');
}

function specsFor({
  makes, buttons, frequency, chip, blade, articleCode, manufacturer,
  colour, material, models, blank, productType,
}) {
  const specs = [];
  if (articleCode) specs.push(['Artikelcode', articleCode]);
  if (frequency) specs.push(['Frequentie', frequency]);
  if (chip) specs.push(['Transponder', chip]);
  if (blade) specs.push(['Sleutelbaard', blade]);
  if (buttons) specs.push(['Aantal knoppen', String(buttons)]);
  if (productType) specs.push(['Producttype', productType]);
  if (makes.length) specs.push(['Automerk', makes.join(', ')]);
  if (models) specs.push(['Past op modellen', models]);
  if (blank) specs.push(['Sleutelrohling', blank]);
  if (manufacturer) specs.push(['Fabrikant', manufacturer]);
  if (colour) specs.push(['Kleur', colour]);
  if (material) specs.push(['Materiaal', material]);
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

  /*
   * 74 rows in the export are the same articles as the four tool-accessory
   * ranges scraped from A-Key's own section pages — and several carry
   * "CostPrice 1.0", which is not a price. The scraped set has the real
   * price, the photo and the description, so it wins and the row is skipped.
   */
  if (SCRAPED_ACCESSORY_NAMES.has(flatten(title))) {
    stats.accessoryDuplicate = (stats.accessoryDuplicate ?? 0) + 1;
    continue;
  }

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

  const placement = akeyPlacement(title);
  const csvMakes = row.Makes
    ? row.Makes.split(',').map((m) => m.trim()).filter(Boolean)
    : [];
  const makes = csvMakes.length ? csvMakes : (placement?.makes ?? []);
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

  /*
   * A-Key's own specification block, where they publish one. The title is only
   * a fallback: RNR114 is sold as "3-Tasten-Funkschlüssel … Renault - RNR114"
   * and names neither the 433 MHz nor the PCF7947 that decide whether it fits.
   */
  const spec = akeySpec(title) ?? {};

  const articleCode =
    spec.articleNumber ??
    (title.match(/\b([A-Z]{2,6}\d{2,4}[A-Z0-9+]*)\b/) ?? [])[1] ??
    null;

  const buttons =
    Number(spec.buttons) ||
    Number((title.match(/(\d+)\s*[-\s]?(?:knops|tasten|button)/i) ?? [])[1]) ||
    null;

  /** "868Mhz", "434 MHz." and "433 MHz" are all the same shelf. */
  const normaliseFreq = (value) => {
    const hit = String(value ?? '').match(/(\d{3})\s*(?:[.,]\d+)?\s*mhz/i);
    return hit ? `${hit[1]} MHz` : null;
  };
  const frequency =
    normaliseFreq(spec.frequency) ?? normaliseFreq(title);

  /*
   * Transponder. A-Key writes it several ways — "PCF7947", "PCF7941A - HITAG2
   * - ID46", "8A" — so the first recognised part number is the filter value
   * and the full string stays in the spec table.
   */
  const chipRaw = spec.transponder ?? null;
  const chip =
    (chipRaw?.match(/\b(PCF\s?\d{4}[A-Z]*|HITAG\s?[0-9AP]+|MEGAMOS\s?\w*|ID\s?\d{2}[A-Z]?|4D-?\d{2}|8A|4A|47|46)\b/i) ?? [])[1] ??
    (title.match(/\bID\s?(\d[A-Z0-9]*)\b/i) ?? [])[1] ??
    (title.match(/\b(\d[A-Z])\s*chip\b/i) ?? [])[1] ??
    null;

  const blade = spec.blade ?? null;

  /*
   * The battery this key takes, when A-Key says so.
   *
   * The old "vaak samen gekocht" block read a mapping file left over from the
   * previous Shopify catalogue: 1,146 entries keyed on slugs this catalogue
   * does not have, pointing at images on a CDN that no longer answers. So it
   * never appeared — and where it did, it offered a battery nobody had checked
   * against the key.
   *
   * A cell type is only offered when the supplier names it. Guessing CR2032
   * because it is the most common would be right most of the time, and a
   * customer who opens their key to find the wrong cell has been sold a part
   * on our guess.
   */
  const batteryCode =
    (`${title} ${(spec.description ?? []).join(' ')}`.match(/\bCR\s?-?(\d{3,4})\b/i) ?? [])[1] ?? null;
  const battery = batteryCode ? `cr${batteryCode}` : null;


  /*
   * The cars this part fits, from A-Key's own list. `makes` used to be the
   * whole answer — brand only — so a Fiat FIR103E never surfaced for the Opel
   * Combo or the Ford Ka it also fits, and no page ever told the customer
   * which models were meant.
   */
  /*
   * A-Key writes the make field as one string that is sometimes two makes:
   * "Renault / Dacia". Split it, so the fallback is a real make and not a
   * label that ends up printed as one.
   */
  const specMakes = (spec.make ?? '')
    .split(/\s*[\/,&]\s*|\s+und\s+/i)
    .map((m) => MAKE_ALIASES[m.trim().toLowerCase()] ?? (m.trim() || null))
    .filter(Boolean);
  const fallbackMakes = [...specMakes, ...(placement?.makes ?? [])];

  const listed = parseVehicles(spec.vehicles, fallbackMakes);
  const perLine = parseFitmentLines(spec.fitmentLines, fallbackMakes);

  // Both sources, de-duplicated; the per-line form carries the year range.
  const vehicles = [];
  const seenVehicle = new Set();
  for (const v of [...perLine, ...listed]) {
    const model = v.model ? cleanModel(v.model) : null;
    if (v.model && !model) continue; // it was noise, not a car
    const key = `${v.make}|${model ?? ''}`.toLowerCase();
    if (seenVehicle.has(key)) continue;
    seenVehicle.add(key);
    vehicles.push({ from: 0, to: 9999, ...v, model });
  }
  const vehicleMakes = [...new Set(vehicles.map((v) => v.make))];

  /*
   * A make named in the vehicle list counts. The Fiat FIR103E fits a Peugeot
   * Bipper, a Citroën Nemo, an Opel Combo and a Ford Ka; before this it was
   * filed under Fiat alone and was unfindable for the other four.
   */
  for (const make of vehicleMakes) {
    if (make && !makes.includes(make)) makes.push(make);
  }

  const copy = TYPE_COPY[category] ?? { noun: 'onderdeel', what: '', programming: false };

  /*
   * The Dutch title: what it is, which cars, then the supplier's own code.
   * The code goes in last and whole — it is what a customer reads off their old
   * key and types into the search box.
   */
  const titleNl = (category === 'accessoires' || category === 'gereedschap' || category === 'diensten')
    ? title 
    : [
        cap(copy.noun),
        makes.slice(0, 3).join(', ') || null,
        buttons ? `${buttons} knoppen` : null,
        articleCode,
      ].filter(Boolean).join(' · ');

  const sentences = [copy.what];
  const modelNames = vehicles.filter((v) => v.model).map((v) => `${v.make} ${v.model}`);
  if (modelNames.length) {
    sentences.push(
      `Past op ${modelNames.slice(0, 6).join(', ')}${modelNames.length > 6 ? ' en meer' : ''}.`
    );
  } else if (makes.length) {
    sentences.push(`Geschikt voor ${makes.join(', ')}.`);
  }
  if (frequency) sentences.push(`Werkt op ${frequency} — controleer of dit overeenkomt met uw huidige sleutel.`);
  if (chipRaw ?? chip) sentences.push(`Transponder: ${chipRaw ?? chip.toUpperCase()}.`);
  if (blade) sentences.push(`Sleutelbaard ${blade} — vergelijk dit met uw huidige sleutel.`);
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
    chip: chip ? chip.toUpperCase().replace(/\s+/g, '') : null,
    blade,
    /** Slug of the battery this key takes, when the supplier names one. */
    battery,
    costPrice,
    image:
      (row.Main_Image && onDisk(localise(row.Main_Image))
        ? localise(row.Main_Image)
        : images[0]) || '/images/product-placeholder.svg',
    images,
    /*
     * Model-level fitment. A-Key publishes no year ranges, so the range is
     * left open rather than invented — the widget must not tell someone their
     * 2012 car is excluded on a guess.
     */
    fitment: vehicles
      .filter((v) => v.model)
      .map((v) => ({ make: v.make, model: v.model, from: v.from ?? 0, to: v.to ?? 9999 })),
    /** The list exactly as A-Key states it, for the "past op" block. */
    vehiclesRaw: spec.vehicles ? decode(spec.vehicles) : null,
    /** The article A-Key says supersedes this one, when they say so. */
    replacedBy: spec.replacedBy ?? null,
    articleCode,
    specs: specsFor({
      makes,
      buttons,
      frequency,
      // The full supplier string here — "PCF7941A - HITAG2 - ID46" tells a
      // customer more than the single code the filter needs.
      chip: chipRaw ?? (chip ? chip.toUpperCase() : null),
      blade,
      articleCode,
      manufacturer,
      colour: dutchColour(spec.colour),
      // When A-Key put both on one line, the material is inside the colour.
      material: dutchMaterial(spec.material ?? materialInColour(spec.colour)),
      models: cutAtLabel(spec.vehicles),
      blank: cutAtLabel(spec.blank),
      productType: dutchProductType(spec.productType),
    }),
    excerpt: sentences[0] || title,
    descriptionNl,
    directAnswer: sentences[0] || '',
    metaDescriptionNl: `${titleNl}. ${closing}`.slice(0, 155),
  });
}

/* ── the tool-accessory ranges ────────────────────────────────────────────
 *
 * Autel, OBDSTAR, Xhorse and Zed-FULL sell adapters, cables, emulators and
 * licences for their own programmers. A-Key lists 185 of them and none are in
 * the CSV export, so they are scraped separately by
 * scripts/scrape-akey-accessories.mjs.
 *
 * Their names are model codes with a German noun in front — "5 in 1 Kabel
 * EIS/ELV geeignet für Mercedes Benz XDMB13EN". The code is the part a
 * customer searches for and must survive untouched; only the German words
 * around it are translated, and only whole words from a short list. A
 * word-by-word pass over German prose is what produced "Werkzeug zur De- en
 * Montage" in the earlier attempt.
 * ──────────────────────────────────────────────────────────────────────── */

/** Whole German words that appear in these names, and nothing else. */
const ACC_WORDS = {
  'Zubehör': 'accessoire', 'Kabel': 'kabel', 'Adapter': 'adapter',
  'Emulator': 'emulator', 'Modul': 'module', 'Lesemodul': 'leesmodule',
  'Antenne': 'antenne', 'Lizenz': 'licentie', 'Platine': 'printplaat',
  'Werkzeug': 'gereedschap', 'Schlüssel': 'sleutel', 'Gehäuse': 'behuizing',
  'Fernbedienung': 'afstandsbediening', 'Halter': 'houder', 'Halterung': 'houder',
  'Erweiterung': 'uitbreiding', 'Zubehörset': 'accessoireset', 'Tasche': 'tas',
  'Netzteil': 'voeding', 'Ladegerät': 'lader', 'Speicher': 'geheugen',
  'Gerät': 'apparaat', 'Geräte': 'apparaten', 'Sensor': 'sensor',
  'Ersatz': 'vervanging', 'Zange': 'tang', 'Satz': 'set', 'Stück': 'stuks',
  'für': 'voor', 'und': 'en', 'mit': 'met', 'ohne': 'zonder', 'alle': 'alle',
  'geeignet': 'geschikt', 'passend': 'passend', 'oder': 'of', 'zum': 'voor',
  'zur': 'voor', 'von': 'van', 'bis': 'tot', 'neue': 'nieuwe', 'neu': 'nieuw',

  // Counted across the 185 names rather than guessed: "Adapter" (82) and
  // "Kabel" (18) are the same word in Dutch, "für" (53) and "Lötfrei…" (11)
  // are most of the rest, and the tail is one occurrence each.
  'Lötfreier': 'soldeervrije', 'Lötfreies': 'soldeervrij', 'lötfreier': 'soldeervrije',
  'Lötadapter': 'soldeeradapter', 'Lötplatine': 'soldeerprintplaat',
  'Netzadapter': 'voedingsadapter', 'Programmierkabel': 'programmeerkabel',
  'Fernprogrammierkabel': 'programmeerkabel op afstand',
  'Kommunikationskabel': 'communicatiekabel', 'ERNEUERUNGSKABEL': 'vernieuwingskabel',
  'Motorradadapter': 'motoradapter', 'Leistungsadapter': 'vermogensadapter',
  'Öffnungswerkzeug': 'openingsgereedschap', 'Motorsteuergeräte': 'motorregeleenheden',
  'Schlüsselprogrammierzubehör': 'sleutelprogrammeer-accessoire',
  'hinzufügen': 'toevoegen', 'Hinzufügen': 'toevoegen', 'Schlüsseln': 'sleutels',
  'Aktivierung': 'activering', 'unterstützt': 'ondersteunt',
  'Erweitertes': 'uitgebreid', 'Erweiterte': 'uitgebreide',
  'Kompletter': 'complete', 'Komplettes': 'complete', 'Kompletten': 'complete',
  'Komplettset': 'complete set', 'Basic': 'basis',
  'Digitalmultimeter': 'digitale multimeter', 'Überlastschutz': 'overbelastingsbeveiliging',
  'Jahresupdate': 'jaarupdate', 'Schlüsselkopiermaschine': 'sleutelkopieermachine',
  'Schlüsselkopiermaschinen': 'sleutelkopieermachines',
};

const ACC_WORDS_LOWER = Object.fromEntries(
  Object.entries(ACC_WORDS).map(([k, v]) => [k.toLowerCase(), v])
);

const dutchName = (name) =>
  (name ?? '')
    .replace(/[A-Za-zÄÖÜäöüß]+/g, (word) => {
      const hit = ACC_WORDS[word] ?? ACC_WORDS_LOWER[word.toLowerCase()];
      if (!hit) return word;
      // "ADAPTER" stays shouted, "Kabel" stays capitalised.
      if (word === word.toUpperCase() && word.length > 2) return hit.toUpperCase();
      if (word[0] === word[0].toUpperCase()) return hit.charAt(0).toUpperCase() + hit.slice(1);
      return hit;
    })
    .replace(/\s{2,}/g, ' ')
    .trim();

/** The programmers a line mentions — model codes, the same in every language. */
const TOOL_CODES =
  /\b(VVDI2?|VVDI ?MB|VVDI ?BIM|KD-?X2|KD-?MAX|KD-?MATE|MINI ?OBD|IM508|IM608|APB\d+|XP400 ?PRO|XP400|X300|X300 ?DP|X300 ?PRO|DP ?PLUS|K518|ZED-?FULL|MVCI|J2534|MK808|MS906|TPMS)\b/gi;

/** A one-word Dutch type, read off the name. */
function accessoryType(name) {
  const n = (name ?? '').toLowerCase();
  if (/\bkabel|cable\b/.test(n)) return 'kabel';
  if (/\badapter\b/.test(n)) return 'adapter';
  if (/\bemulator\b/.test(n)) return 'emulator';
  if (/\blizenz|licen[cs]e\b/.test(n)) return 'licentie';
  if (/\bmodul|module\b/.test(n)) return 'module';
  if (/\bantenne|antenna\b/.test(n)) return 'antenne';
  if (/\bplatine|pcb\b/.test(n)) return 'printplaat';
  if (/\bset\b/.test(n)) return 'set';
  if (/\bsensor\b/.test(n)) return 'sensor';
  if (/\bzange|werkzeug|tool\b/.test(n)) return 'gereedschap';
  return 'accessoire';
}

function addAccessories() {
  const accessories = accessoryData.products ?? {};
  if (Object.keys(accessories).length === 0) {
    console.warn('  (no akey-accessories.json — run scripts/scrape-akey-accessories.mjs)');
    return 0;
  }

  let added = 0;

  for (const entry of Object.values(accessories)) {
    if (!entry.title || entry.price == null) continue;

    const name = dutchName(entry.title);
    const type = accessoryType(entry.title);
    // Kept as A-Key writes it: "RH850 / V850 Full Adapter Kit" is the code a
    // customer copies, and stripping the spaces made it unsearchable.
    const code = entry.articleNumber?.trim().replace(/\s{2,}/g, ' ') ?? null;

    let slug = slugify(`${entry.brand}-${entry.title}`);
    if (seenSlugs.has(slug)) {
      let n = 2;
      while (seenSlugs.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
    seenSlugs.add(slug);

    const tools = [...new Set((entry.description?.join(' ') + ' ' + entry.title).match(TOOL_CODES) ?? [])]
      .map((t) => t.toUpperCase())
      .slice(0, 4);

    const titleNl = [`${entry.brand} ${type}`, name, code].filter(Boolean).join(' · ');

    /*
     * Dutch copy built from facts, not translated prose: what it is, whose
     * tool it belongs to, which programmers it is named for, and the code the
     * customer will search on.
     */
    /*
     * A-Key's own description, in Dutch where it translates cleanly.
     *
     * The first pass threw this away entirely and left a €272 OBDSTAR kit
     * described as "adapter uit het OBDSTAR-programma" — nothing about the
     * airbag reset, the MP001 it needs, or the X300 and P50 it works with.
     * A line that does not translate cleanly is kept as the manufacturer's
     * own German text rather than shown half-translated.
     */
    const { dutch, german } = translateDescription(entry.description);
    const facts = readFacts(entry.description);

    const sentences = [
      dutch.length
        ? dutch.join(' ')
        : `${cap(type)} uit het ${entry.brand}-programma, voor gebruik met uw eigen sleutelprogrammeerapparatuur.`,
      tools.length && !dutch.length ? `Genoemd voor ${tools.join(', ')}.` : null,
      code ? `Artikelcode ${code}.` : null,
      'Geleverd via onze leverancier A-Key. Levertijd 2 - 3 werkdagen.',
    ].filter(Boolean);

    products.push({
      id: code ?? slug,
      slug,
      supplier: 'A-Key',
      title: entry.title,
      titleNl,
      category: 'accessoires',
      subcategory: entry.subcategory,
      // These are workshop tools. They stay public — A-Key sells them openly
      // and a locksmith buying a VVDI cable is exactly our trade customer.
      audience: 'public',
      makes: [],
      manufacturer: entry.brand,
      condition: 'aftermarket',
      buttons: null,
      frequency: null,
      chip: null,
      blade: null,
      battery: null,
      costPrice: entry.price,
      image: entry.image ?? '/images/product-placeholder.svg',
      images: entry.image ? [entry.image] : [],
      fitment: [],
      vehiclesRaw: null,
      replacedBy: null,
      articleCode: code,
      specs: [
        code ? ['Artikelcode', code] : null,
        ['Merk gereedschap', entry.brand],
        ['Type', cap(type)],
        facts.compatible ? ['Compatibel met', facts.compatible] : null,
        facts.requires ? ['Vereist', facts.requires] : null,
        tools.length ? ['Genoemd voor', tools.join(', ')] : null,
      ].filter(Boolean),
      /** What did not translate cleanly, shown on the page as the supplier's own text. */
      supplierNote: german.length ? german : null,
      excerpt: (dutch[0] ?? sentences[0]).slice(0, 200),
      descriptionNl: sentences.join(' '),
      directAnswer: (dutch[0] ?? sentences[0]).slice(0, 200),
      metaDescriptionNl: `${titleNl}. Origineel ${entry.brand}-accessoire, 2 - 3 werkdagen geleverd.`.slice(0, 155),
    });

    added++;
  }

  return added;
}

const accessoryCount = addAccessories();
if (accessoryCount) console.log(`  + ${accessoryCount} tool accessories (Autel, OBDSTAR, Xhorse, Zed-FULL)`);

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
      chip: facetCount('chip'),
      blade: facetCount('blade'),
    },
    products,
  })
);

const makeCounts = {};
for (const p of products) {
  if (p.audience !== 'public') continue;
  for (const make of p.makes) makeCounts[make] = (makeCounts[make] ?? 0) + 1;
}
writeFileSync(
  BRANDS_OUT,
  JSON.stringify(
    Object.entries(makeCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([make, count]) => ({ make, count })),
    null,
    1
  )
);

const VEHICLE_SPECS_OUT = path.join(process.cwd(), 'src/lib/vehicleSpecs.json');

const vehicleSpecs = {};
for (const p of products) {
  if (!p.fitment || p.fitment.length === 0) continue;
  
  for (const v of p.fitment) {
    if (!v.make || !v.model) continue;
    const key = `${v.make}|${v.model}`.toLowerCase();
    if (!vehicleSpecs[key]) {
      vehicleSpecs[key] = {
        make: v.make,
        model: v.model,
        chips: [],
        blades: [],
        frequencies: []
      };
    }
    
    if (p.chip && !vehicleSpecs[key].chips.includes(p.chip)) {
      vehicleSpecs[key].chips.push(p.chip);
    }
    if (p.blade && !vehicleSpecs[key].blades.includes(p.blade)) {
      vehicleSpecs[key].blades.push(p.blade);
    }
    if (p.frequency && !vehicleSpecs[key].frequencies.includes(p.frequency)) {
      vehicleSpecs[key].frequencies.push(p.frequency);
    }
  }
}

writeFileSync(
  VEHICLE_SPECS_OUT,
  JSON.stringify(vehicleSpecs)
);

const pub = products.filter((p) => p.audience === 'public').length;
console.log(`catalog.json written — ${products.length} A-Key products`);
console.log(`brands.json written — ${Object.keys(makeCounts).length} car makes`);
console.log(`vehicleSpecs.json written — ${Object.keys(vehicleSpecs).length} vehicles mapped`);
console.log(`  public ${pub} · trade ${products.length - pub} (gated)`);
console.log(`  without category ${stats.noCategory} · without make ${stats.noMake} · without image ${stats.noImage}`);
const byCategory = facetCount('category');
for (const [k, v] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(4)}  ${k}`);
}
