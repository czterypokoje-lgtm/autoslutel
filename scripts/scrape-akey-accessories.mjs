/**
 * The tool-accessory ranges: Autel, OBDSTAR, Xhorse and Zed-FULL.
 *
 *   node scripts/scrape-akey-accessories.mjs
 *   -> src/data/akey-accessories.json
 *   -> public/images/products/<slug>.jpg
 *
 * These four sections are not in the product export at all, and the earlier
 * attempt brought over 31 of the 187 A-Key actually lists — with German
 * titles and no descriptions. This walks every page of each section, opens
 * every product, and takes the name, the article number, the price, the
 * description and the photo.
 *
 * Counted on A-Key on 4 September 2026:
 *   Autel 12 · OBDSTAR 4 · Xhorse 123 (5 pages) · Zed-FULL 48 (2 pages)
 *
 * Listings paginate with an _sN suffix, 30 per page. The walk follows the
 * "Artikel 1 - 30 von 123" counter rather than a fixed page count, so a
 * section that grows is picked up without editing this file.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const BASE = 'https://a-key-gmbh.com';
const OUT = path.join(process.cwd(), 'src/data/akey-accessories.json');
const IMAGE_DIR = path.join(process.cwd(), 'public/images/products');

/** section slug → the subcategory it becomes in our shop. */
const SECTIONS = [
  ['Autel-Zubehoer', 'Autel accessoires', 'Autel'],
  ['OBDSTAR-Zubehoer', 'OBDSTAR accessoires', 'OBDSTAR'],
  ['XHORSE-Zubehoer', 'Xhorse accessoires', 'Xhorse'],
  ['Zed-FULL-Zubehoer', 'Zed-FULL accessoires', 'Zed-FULL'],
];

const PRODUCT_LINK = /<a href="https:\/\/a-key-gmbh\.com\/([^"]+)" class="productbox-images"/g;
const TOTAL = /Artikel \d+ - \d+ von (\d+)/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const UA = { 'User-Agent': 'autosleutel24-catalog/1.0 (reseller catalogue sync)' };

async function get(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/* ── listing ─────────────────────────────────────────────────────────── */

async function readSection(slug) {
  const found = [];
  let total = null;

  for (let page = 1; page <= 12; page++) {
    const url = page === 1 ? `${BASE}/${slug}` : `${BASE}/${slug}_s${page}`;
    let html;
    try {
      html = await get(url);
    } catch {
      break;
    }

    if (total === null) total = Number(html.match(TOTAL)?.[1] ?? 0);

    const before = found.length;
    for (const m of html.matchAll(PRODUCT_LINK)) {
      if (!found.includes(m[1])) found.push(m[1]);
    }

    // An out-of-range page repeats the first one, so stop when nothing is new.
    if (found.length === before) break;
    if (total && found.length >= total) break;
    await sleep(250);
  }

  return { slugs: found, reported: total };
}

/* ── detail page ─────────────────────────────────────────────────────── */

/** The page as trimmed lines, with a label joined to the value under it. */
function linesOf(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&auml;/g, 'ä').replace(/&ouml;/g, 'ö').replace(/&uuml;/g, 'ü')
    .replace(/&Auml;/g, 'Ä').replace(/&Ouml;/g, 'Ö').replace(/&Uuml;/g, 'Ü')
    .replace(/&szlig;/g, 'ß').replace(/&euro;/g, '€')
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<')
    .replace(/[ \t]+/g, ' ');

  const raw = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out = [];
  for (const line of raw) {
    if (out.length && out.at(-1).endsWith(':')) out[out.length - 1] += ` ${line}`;
    else out.push(line);
  }
  return out;
}

const labelled = (lines, label) => {
  const i = lines.findIndex((l) => l.toLowerCase() === label.toLowerCase());
  return i >= 0 && i + 1 < lines.length ? lines[i + 1].trim() : null;
};

const BLOCK_END = /^(Kunden kauften|Frage zum Artikel|Kontaktdaten|Bewertungen|Ähnliche Artikel|Zuletzt angesehen|Diesen Artikel|Newsletter|Auf die Vergleichsliste|Auf Wunschzettel)/i;

/**
 * The article's own text.
 *
 * It sits under a "Beschreibung" heading *below* the price block — not above
 * it. The first version started after "Kategorie" and stopped at the first
 * euro amount, which is the price, so it captured the product name and threw
 * the entire description away: for the OBDSTAR RH850 kit that meant losing
 * what it does, that it needs the MP001 adapter, and that it works with the
 * X300 Classic G3 and the P50.
 *
 * Everything from the heading to the cross-sell block, minus the shop
 * furniture that sits between them.
 */
const NOISE =
  /^(inkl\.|zzgl\.|Versand|Versandkostenfreie|\(Standard\)|,|\*|pro Stk|Sofort verfügbar|Knapper Lagerbestand|Nicht auf Lager|Lieferzeit|\(DE - Ausland|Loading\.\.\.|Consent erteilen|Komponenten werden geladen|In den Warenkorb|Frage zum Artikel|Auf die Vergleichsliste|Auf Wunschzettel|Menge|Stück)/i;

function description(lines, title) {
  const heading = lines.findIndex((l) => /^Beschreibung$/i.test(l));
  const category = lines.findIndex((l) => /^Kategorie$/i.test(l));
  const start = heading >= 0 ? heading + 1 : category >= 0 ? category + 2 : -1;
  if (start < 1) return [];

  const body = [];
  for (const line of lines.slice(start)) {
    if (BLOCK_END.test(line)) break;
    if (NOISE.test(line)) continue;
    if (/^\d[\d.]*,\d\d\s*€/.test(line)) continue; // a price, not prose
    if (line.startsWith('#') || line.includes('display: none')) continue;
    if (/^(Beschreibung|Produktinformationen:?)$/i.test(line)) continue;
    body.push(line);
    if (body.length >= 60) break;
  }

  /*
   * A-Key opens the text with the product name again. Keeping it would put
   * the title twice on our page, once as a heading and once as prose.
   */
  const norm = (v) => v.toLowerCase().replace(/[^a-z0-9]/g, '');
  while (body.length && title && norm(body[0]).includes(norm(title).slice(0, 18))) body.shift();

  return body;
}

/**
 * "238,00 €" -> 238
 *
 * Taken from after the article number, not from the first euro amount on the
 * page: the header carries the basket total, which is "0,00 €" for a visitor
 * — and that is what the first run stored for all 185 products.
 */
function price(lines) {
  const start = lines.findIndex((l) => /^Artikelnummer$/i.test(l));
  const region = start >= 0 ? lines.slice(start) : lines;

  const hit = region.find((l) => /^\d[\d.]*,\d\d\s*€/.test(l) && !/^0,00/.test(l));
  if (!hit) return null;

  const value = Number(hit.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** The product photo, from the og:image tag the page always carries. */
function image(html) {
  const og = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1];
  if (og && !/logo|placeholder|noimage/i.test(og)) return og;
  const first = html.match(/<img[^>]+src="(https:\/\/a-key-gmbh\.com\/images\/product_images\/[^"]+)"/i)?.[1];
  return first ?? null;
}

/* ── run ─────────────────────────────────────────────────────────────── */

mkdirSync(IMAGE_DIR, { recursive: true });

const store = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { products: {} };
store.products ??= {};

let read = 0;
let failed = 0;
let images = 0;
const report = [];

for (const [section, subcategory, brand] of SECTIONS) {
  const { slugs, reported } = await readSection(section);
  report.push({ section, reported, found: slugs.length });
  console.log(`\n${section}: ${slugs.length} of ${reported ?? '?'}`);

  for (const slug of slugs) {
    if (store.products[slug]?.title) continue;

    try {
      const html = await get(`${BASE}/${slug}`);
      const lines = linesOf(html);

      const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
        ?.replace(/<[^>]+>/g, '')
        .replace(/&auml;/g, 'ä').replace(/&ouml;/g, 'ö').replace(/&uuml;/g, 'ü')
        .replace(/&szlig;/g, 'ß').replace(/&amp;/g, '&')
        .trim();

      const imageUrl = image(html);
      let imageFile = null;

      if (imageUrl) {
        const ext = (imageUrl.match(/\.(jpe?g|png|webp|gif)/i)?.[1] ?? 'jpg').toLowerCase();
        const file = `${slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.${ext}`;
        const dest = path.join(IMAGE_DIR, file);
        if (!existsSync(dest)) {
          const res = await fetch(imageUrl, { headers: UA });
          if (res.ok) {
            writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
            images++;
          }
        }
        if (existsSync(dest)) imageFile = `/images/products/${file}`;
      }

      store.products[slug] = {
        slug,
        title,
        section,
        subcategory,
        brand,
        articleNumber: labelled(lines, 'Artikelnummer'),
        akeyCategory: labelled(lines, 'Kategorie'),
        price: price(lines),
        description: description(lines, title),
        image: imageFile,
      };
      read++;
    } catch (error) {
      failed++;
      console.error(`  failed: ${slug} — ${error.message}`);
    }

    if (read % 25 === 0) writeFileSync(OUT, JSON.stringify(store, null, 1));
    await sleep(150);
  }
}

store.scrapedAt = new Date().toISOString();
store.report = report;
writeFileSync(OUT, JSON.stringify(store, null, 1));

const all = Object.values(store.products);
console.log(`\n${all.length} products stored — ${read} new this run, ${failed} failed`);
console.log(`  with a photo:       ${all.filter((p) => p.image).length}`);
console.log(`  with a description: ${all.filter((p) => p.description?.length).length}`);
console.log(`  with a price:       ${all.filter((p) => p.price != null).length}`);
console.log(`  ${images} photos downloaded`);
console.log(`-> ${path.relative(process.cwd(), OUT)}`);
