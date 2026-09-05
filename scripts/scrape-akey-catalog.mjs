/**
 * Every A-Key product page, read once, completely.
 *
 *   node scripts/scrape-akey-catalog.mjs
 *   -> src/data/akey-catalog-raw.json
 *
 * This replaces three earlier scrapes that each read part of a page and each
 * guessed at the rest. The guessing is what put a Mercedes key under Dodge and
 * a circuit board in with the transponders, so this one guesses at nothing.
 *
 * Two things on every page make that possible, and neither was being used:
 *
 *   1. A JSON-LD BreadcrumbList — A-Key's own filing of the product:
 *        Startseite > Autoschlüssel > Autoschlüssel ohne Wegfahrsperre
 *      A category read out of the vendor's own structured data cannot be
 *      wrong the way a keyword in a title can.
 *
 *   2. A JSON-LD Product — name, article number, description, price,
 *      availability, and every photo, exactly as they publish it.
 *
 * The URL list comes from their sitemap rather than from crawling category
 * pages: category pages paginate, drop products, and list the same product on
 * six pages, and a product in no category was invisible to the old crawl. The
 * sitemap is the shop's own answer to "what do you sell".
 *
 * Re-running only fetches what is missing, so an interrupted run costs
 * nothing. Pass --refresh to read everything again.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { gunzipSync } from 'zlib';
import path from 'path';

const BASE = 'https://a-key-gmbh.com';
const SITEMAP = `${BASE}/export/sitemap_0.xml.gz`;
const OUT = path.join(process.cwd(), 'src/data/akey-catalog-raw.json');
const UA = 'autosleutel24-catalog/2.0 (reseller catalogue sync; +https://www.autosleutel24.nl)';

const REFRESH = process.argv.includes('--refresh');
/** Four at a time. Their shop is a JTL install on one box; do not hammer it. */
const CONCURRENCY = 4;

/* ── text ────────────────────────────────────────────────────────────── */

const ENTITIES = {
  auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü',
  szlig: 'ß', euro: '€', nbsp: ' ', amp: '&', quot: '"', apos: "'",
  lt: '<', gt: '>', frac12: '½', frac14: '¼', deg: '°', ndash: '–', mdash: '—',
};

/** A-Key double-encodes: "&amp;uuml;" reaches us as text. Decode until stable. */
function decode(text) {
  let out = String(text ?? '');
  for (let pass = 0; pass < 3; pass++) {
    const before = out;
    out = out
      .replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (m, name) => ENTITIES[name] ?? m)
      .replace(/&#(\d+);/g, (m, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (m, code) => String.fromCharCode(parseInt(code, 16)));
    if (out === before) break;
  }
  return out;
}

const tidy = (text) => decode(text).replace(/\s+/g, ' ').trim();

/** A dash is A-Key's way of writing "not applicable", not a value. */
const usable = (value) => {
  const text = tidy(value);
  return text && !/^[-–—.]+$/.test(text) && text.length <= 160 ? text : null;
};

function linesOf(html) {
  const text = decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, '\n')
  ).replace(/[ \t]+/g, ' ');

  const raw = text.split('\n').map((l) => l.trim()).filter(Boolean);
  // A label in its own tag ("Produkttyp:" / "Funkschlüssel") arrives as two
  // lines; join them back so one regex reads both page layouts.
  const out = [];
  for (const line of raw) {
    if (out.length && out.at(-1).endsWith(':')) out[out.length - 1] += ` ${line}`;
    else out.push(line);
  }
  return out;
}

function field(lines, label) {
  const re = new RegExp(`^${label}\\s*:\\s*(.+)$`, 'i');
  for (const line of lines) {
    const hit = line.match(re);
    if (hit) return usable(hit[1]);
  }
  return null;
}

/** `Artikelnummer` on its own line, the value on the next. */
function labelled(lines, label) {
  const i = lines.findIndex((l) => l.toLowerCase() === label.toLowerCase());
  return i >= 0 && i + 1 < lines.length ? usable(lines[i + 1]) : null;
}

/* ── the product's own text ──────────────────────────────────────────── */

const BLOCK_END =
  /^(Kunden kauften|Kunden, die|Frage zum Artikel|Kontaktdaten|Bewertungen|Ähnliche Artikel|Zuletzt angesehen|Diesen Artikel|Newsletter|Auch diese Kategorien|Kategorien|Produktinformationen|Hersteller$|Zahlungsarten|Versandarten)/i;

/**
 * The article's own text.
 *
 * "Beschreibung" is the heading above it, and where the page has one that is
 * where the text is — below the price, not above it. Anchoring on the
 * "Kategorie" line instead, as an earlier version did, returned the one line
 * between the category and the price and stopped there, which threw away the
 * line that matters most:
 *
 *   2 Tasten-Funkschlüssel kompatibel für Toyota TOYR120L
 *   geeignet für Toyota Cruiser 2015 - 2019      <- the car it fits
 *   Board Nr.: F43FF
 *
 * On the pages with no such heading — the key blanks, mostly — the fallback
 * is the old anchor: "Artikelnummer / <nr> / Kategorie / <category>" is
 * printed directly above the text on every page they publish.
 */
function productBlock(lines) {
  const heading = lines.findIndex((l) => /^Beschreibung$/i.test(l));
  const marker = lines.findIndex((l) => /^Kategorie$/i.test(l));
  const start = heading >= 0 ? heading + 1 : marker >= 0 ? marker + 2 : -1;
  if (start < 1) return [];

  const body = [];
  for (const line of lines.slice(start)) {
    if (BLOCK_END.test(line)) break;
    // Only the fallback anchor runs into the price; below a "Beschreibung"
    // heading a euro amount is part of the text.
    if (heading < 0 && /^\d+[.,]\d\d\s*€/.test(line)) break;
    if (line.startsWith('#') || line.includes('display: none')) continue;
    if (/^(Beschreibung|Produktinformationen:?)$/i.test(line)) continue;
    body.push(line);
    if (body.length >= 80) break;
  }
  return body;
}

const VEHICLE_LINE =
  /^(?:geeignet|passend)\s+f[üu]r\s*(?:folgende\s+)?(?:Fahrzeuge|Modelle|z\.?\s?B\.?)\s*:?\s*(.+)$/i;
const FIT_LINE = /^(?:geeignet|passend)\s+f[üu]r\s+(.{3,200})$/i;

function vehicleList(lines) {
  for (const line of lines) {
    const hit = line.match(VEHICLE_LINE);
    if (!hit) continue;
    const value = hit[1].trim();
    if (/^Fahrzeugmarke/i.test(value)) continue;
    if (value.length > 2) return value;
  }
  return null;
}

/**
 * The "geeignet für …" lines.
 *
 * Run over the product's own text, never the whole page: A-Key's left-hand
 * menu is fifty lines of exactly the same shape ("geeignet für Opel", 
 * "geeignet für Dodge"), identical on all 3,752 pages. Reading those as
 * fitment is what put a Mercedes key on the Dodge page — every product looked
 * like it fitted every make.
 */
function fitmentLines(lines) {
  const found = [];
  for (const line of lines) {
    const hit = line.match(FIT_LINE);
    if (!hit) continue;
    const value = tidy(hit[1]);
    if (/^Fahrzeugmarke/i.test(value)) continue;
    if (!found.includes(value)) found.push(value);
  }
  return found;
}

/* ── structured data ─────────────────────────────────────────────────── */

function jsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  const out = [];
  for (const [, body] of blocks) {
    try {
      out.push(JSON.parse(body));
    } catch {
      // One malformed block must not cost us the other two.
    }
  }
  return out;
}

/** ["Autoschlüssel", "Autoschlüssel ohne Wegfahrsperre"] — no home, no self. */
function breadcrumb(blocks) {
  const list = blocks.find((b) => b['@type'] === 'BreadcrumbList');
  if (!list) return [];
  return (list.itemListElement ?? [])
    .map((entry) => ({
      name: tidy(entry.item?.name ?? entry.name ?? ''),
      href: entry.item?.['@id'] ?? '',
    }))
    .filter((c) => c.name && !/^Startseite$/i.test(c.name))
    // The last crumb is the product itself.
    .slice(0, -1);
}

/* ── one page ────────────────────────────────────────────────────────── */

const FREQ = /\b(3\d\d|4\d\d|8\d\d|9\d\d)(?:[.,]\d+)?\s*MHz\b/i;
const CHIP =
  /\b(PCF\s?\d{4}[A-Z]*|HITAG\s?[0-9AP]+|MEGAMOS\s?\w*|TIRIS|4D-?\d{2}|ID\s?\d{2}[A-Z]?|8A|4A|47|46)\b/i;
const REPLACED_BY =
  /\(?\s*Kann durch\s+([A-Z0-9][A-Z0-9 .\/+-]{1,24}?)\s+ersetzt werden\s*\)?/i;
/** "Board Nr.: F43FF" — which circuit board is inside this key. */
const BOARD_NUMBER = /Board\s*-?\s*Nr\.?\s*:?\s*([A-Z0-9][A-Z0-9 .\/-]{1,20})/i;

/**
 * A listing page carries the same markup as a product page, sort dropdown and
 * all, and its "Artikelnummer" line is followed by the sort options rather
 * than by an article number. 189 of their 3,752 sitemap URLs are listings.
 */
const SORT_OPTIONS = new Set([
  'Erscheinungsdatum', 'Artikelnummer', 'Preis', 'Name', 'Beliebtheit',
  'Bestseller', 'Lagerbestand', 'Gewicht', 'Bewertung',
]);

/**
 * The price out of the HTML, for the pages that carry no Product block.
 *
 * `itemprop="price" content="1.07"` — the first one is the article's own; the
 * ones after it belong to the cross-sell strip further down the page. The
 * visible euro amount cannot be used: the first one on every page is the
 * basket total in the header, which is why an earlier run priced 185 articles
 * at € 0,00.
 */
const htmlPrice = (html) => {
  const hit = html.match(/itemprop="price"\s+content="([0-9]+(?:\.[0-9]+)?)"/i);
  const value = hit ? Number(hit[1]) : NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
};

/** The gallery, from the image paths JTL writes: .../product/<id>/lg/<name>.jpg */
const htmlImages = (html) => [
  ...new Set(
    [...html.matchAll(/(?:https:\/\/a-key-gmbh\.com)?\/?(media\/image\/product\/\d+\/lg\/[^"' )]+)/g)].map(
      (m) => `${BASE}/${m[1]}`
    )
  ),
];

async function readProduct(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const blocks = jsonLd(html);
  const product = blocks.find((b) => b['@type'] === 'Product');
  const lines = linesOf(html);
  const prose = productBlock(lines);
  const proseText = prose.join(' ');

  const offer = product?.offers ?? {};
  const price = Number(offer.price);
  // Roughly one page in six carries no Product block at all.
  const fallbackPrice = htmlPrice(html);

  return {
    url,
    slug: url.replace(`${BASE}/`, ''),

    /* ── what A-Key states outright ── */
    title: tidy(product?.name ?? lines.find(Boolean) ?? ''),
    // The number printed on the page first: it is the one a customer quotes.
    // Their sku field is sometimes a fragment of it ("D" for V4920B MONO/D).
    articleNumber: (() => {
      const value = labelled(lines, 'Artikelnummer') ?? usable(product?.sku ?? product?.mpn ?? '');
      return value && SORT_OPTIONS.has(value) ? null : value;
    })(),
    mpn: usable(product?.mpn ?? ''),
    /** Empty on almost every product — but where it exists it is a real one. */
    gtin: usable(product?.gtin13 ?? product?.gtin ?? '') || null,
    price: (Number.isFinite(price) && price > 0 ? price : null) ?? fallbackPrice,
    availability: String(offer.availability ?? '').replace('http://schema.org/', '') || null,
    stockLabel: usable(
      lines.find((l) => /^(Sofort verfügbar|Auf Lager|Nicht auf Lager|Ausverkauft|Lieferzeit)/i.test(l)) ?? ''
    ),

    /* ── A-Key's own filing: the whole point of this rewrite ── */
    breadcrumb: breadcrumb(blocks),
    /** The "Kategorie" line printed beside the article number. */
    categoryField: labelled(lines, 'Kategorie'),

    /* ── the specification block ── */
    productType: field(lines, 'Produkttyp'),
    blade: field(lines, 'Schlüsselbart'),
    blank: field(lines, 'Schlüsselrohling'),
    buttons: field(lines, 'Anzahl der Tasten'),
    frequency: field(lines, 'Funkeinheit') ?? usable(proseText.match(FREQ)?.[0] ?? ''),
    transponder: field(lines, 'Transponder') ?? usable(proseText.match(CHIP)?.[0] ?? ''),
    colour: field(lines, 'Farbe'),
    material: field(lines, 'Material'),
    make: usable(
      lines.map((l) => l.match(/f[üu]r\s+Fahrzeugmarke\s*:\s*([^\n]{2,40})/i)?.[1]).find(Boolean) ?? ''
    ),

    /* ── which cars ── */
    vehicles: vehicleList(prose) ?? vehicleList(lines),
    fitmentLines: fitmentLines(prose),

    /* ── prose ── */
    description: prose.length ? prose : null,
    ldDescription: product?.description ? tidy(product.description) : null,
    replacedBy: usable(proseText.match(REPLACED_BY)?.[1] ?? ''),
    boardNumber: usable(proseText.match(BOARD_NUMBER)?.[1] ?? ''),
    /** Their words, not ours: "Sofort verfügbar", "Knapper Lagerbestand". */
    deliveryTime: (() => {
      const stated = lines.find((l) => /^\d\s*-\s*\d\s*Werktage/i.test(l));
      if (stated) return usable(stated);
      const label = lines.findIndex((l) => /^Lieferzeit:?$/i.test(l));
      return label >= 0 ? usable(lines[label + 1]) : null;
    })(),

    /* ── photos, as they publish them ── */
    images: (() => {
      const stated = (Array.isArray(product?.image) ? product.image : [product?.image])
        .filter(Boolean)
        .map((i) => String(i));
      const gallery = htmlImages(html);
      // The stated image first — it is the one they lead with — then the rest
      // of the gallery, which the Product block never lists in full.
      return [...new Set([...stated, ...gallery])];
    })(),

    /** Which fields were read out of a sentence rather than a labelled field. */
    inferred: [
      !field(lines, 'Funkeinheit') && proseText.match(FREQ) ? 'frequency' : null,
      !field(lines, 'Transponder') && proseText.match(CHIP) ? 'transponder' : null,
    ].filter(Boolean),

    /**
     * Whether this URL is an article at all. Their sitemap lists the category
     * pages too, and those parse as a product whose price is the first tile's
     * and whose article number is a sort option.
     */
    isProduct: Boolean(
      (usable(product?.sku ?? '') && !SORT_OPTIONS.has(usable(product?.sku ?? ''))) ||
        (labelled(lines, 'Artikelnummer') && !SORT_OPTIONS.has(labelled(lines, 'Artikelnummer')))
    ),

    readAt: new Date().toISOString(),
  };
}

/* ── run ─────────────────────────────────────────────────────────────── */

console.log('sitemap …');
const gz = Buffer.from(await (await fetch(SITEMAP, { headers: { 'User-Agent': UA } })).arrayBuffer());
const urls = [...gunzipSync(gz).toString('utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1])
  .filter((u) => u !== `${BASE}/` && !u.includes('?'));

console.log(`${urls.length} product pages listed`);

const store = !REFRESH && existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { products: {} };
store.products ??= {};

/** --limit=25 reads a sample, for checking a change to the parser. */
const limit = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1]) || Infinity;
const todo = urls
  .filter((u) => !store.products[u.replace(`${BASE}/`, '')])
  .slice(0, limit === Infinity ? undefined : limit);
const already = urls.length - urls.filter((u) => !store.products[u.replace(`${BASE}/`, '')]).length;
console.log(`${already} already read, ${todo.length} to fetch\n`);

let done = 0;
let failed = 0;
const errors = [];

async function worker(queue) {
  while (queue.length) {
    const url = queue.pop();
    try {
      const product = await readProduct(url);
      store.products[product.slug] = product;
    } catch (error) {
      failed++;
      errors.push(`${url} — ${error.message}`);
    }
    done++;
    if (done % 100 === 0) {
      console.log(`  ${done}/${todo.length} — ${failed} failed`);
      writeFileSync(OUT, JSON.stringify(store, null, 1));
    }
  }
}

const queue = [...todo];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

store.scrapedAt = new Date().toISOString();
store.count = Object.keys(store.products).length;
writeFileSync(OUT, JSON.stringify(store, null, 1));

const all = Object.values(store.products);
console.log(`\n${store.count} products in ${path.relative(process.cwd(), OUT)}`);
console.log(`  with a breadcrumb   ${all.filter((p) => p.breadcrumb.length).length}`);
console.log(`  with a price        ${all.filter((p) => p.price != null).length}`);
console.log(`  with a description  ${all.filter((p) => p.description?.length).length}`);
console.log(`  with a product type ${all.filter((p) => p.productType).length}`);
console.log(`  with an article nr  ${all.filter((p) => p.articleNumber).length}`);
console.log(`  articles (not listings) ${all.filter((p) => p.isProduct).length}`);
if (errors.length) {
  console.log(`\n${errors.length} failed:`);
  errors.slice(0, 10).forEach((e) => console.log(`  ${e}`));
}
