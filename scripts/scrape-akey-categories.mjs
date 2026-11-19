/**
 * Reads A-Key's own category pages and records which products sit in which.
 *
 *   node scripts/scrape-akey-categories.mjs
 *   -> src/data/akey-categories.json
 *
 * Why this exists: the product export ships one category per product, and it is
 * frequently the wrong one — complete remote keys filed under circuit boards,
 * rubber button pads under boards. A-Key's shop has the answer on the page
 * itself, and a product there belongs to several categories at once: a Hyundai
 * PCB is on the Hyundai page *and* the PCB page.
 *
 * Their make pages carry the type in the URL: /geeignet-fuer-Audi lists remote
 * keys, /geeignet-fuer-AUDI_1 lists housings for the same make.
 *
 * Listings paginate with an _s1 / _s2 suffix on the category slug, 30 per page.
 */

import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const BASE = 'https://a-key-gmbh.com';
const OUT = path.join(process.cwd(), 'src/data/akey-categories.json');

/** The type sections, with the shop category each one maps to. */
const TYPE_SECTIONS = [
  ['Boards-fuer-Funkschluessel-PCB', 'printplaten', 'printplaat'],
  ['Funkschluessel-Gehaeuse', 'behuizingen', 'sleutelbehuizing'],
  ['Notschluessel', 'noodsleutels', 'noodsleutel'],
  ['Transponderschluessel', 'transponders', 'transpondersleutel'],
  ['Transponder', 'transponders', 'transponder'],
  ['Autoschluesselblatt-Spitze', 'sleutelbaarden', 'sleutelbaard'],
  ['Autoschluessel-ohne-Wegfahrsperre', 'afstandsbedieningen', 'sleutel zonder startonderbreker'],
  ['Autoschluessel-Funkschluessel', 'afstandsbedieningen', 'afstandsbediening'],
  ['KEYDIY-universal-fernbedienung', 'universal-remotes', 'KeyDIY universal'],
  ['XHORSE-Universal', 'universal-remotes', 'Xhorse universal'],
  ['AUTEL-Universal', 'universal-remotes', 'Autel universal'],
  ['IEA-Universal-Fernbedienung', 'universal-remotes', 'IEA universal'],
  ['Garagenoeffner', 'accessoires', 'garageopener'],
  ['Microtaster-Antenne', 'accessoires', 'microtaster & antenne'],
  ['Zubehoer-Werkzeug', 'gereedschap', 'handgereedschap'],
];

/*
 * Make sections. The plain slug is the remote-key range; the _1 twin is the
 * housing range for the same make — that suffix is the only thing telling the
 * two apart, and it is why a housing kept being sold as a complete key.
 */
const MAKE_SECTIONS = [
  ['Alfa-Romeo', 'Alfa Romeo'], ['Audi', 'Audi'], ['Bentley', 'Bentley'], ['BMW', 'BMW'],
  ['Buick', 'Buick'], ['Chrysler', 'Chrysler'], ['Citroen', 'Citroën'], ['Dacia', 'Dacia'],
  ['Dodge', 'Dodge'], ['Fiat', 'Fiat'], ['Ford', 'Ford'], ['GM', 'GM'], ['Honda', 'Honda'],
  ['Hyundai', 'Hyundai'], ['Jaguar', 'Jaguar'], ['Jeep', 'Jeep'], ['Kia', 'Kia'],
  ['Land-Rover', 'Land Rover'], ['Lexus_1', 'Lexus'], ['Maserati', 'Maserati'],
  ['Mazda', 'Mazda'], ['Mercedes-Benz', 'Mercedes-Benz'], ['Mini', 'Mini'],
  ['Mitsubishi', 'Mitsubishi'], ['Nissan', 'Nissan'], ['Opel', 'Opel'], ['Peugeot', 'Peugeot'],
  ['Porsche', 'Porsche'], ['Renault', 'Renault'], ['Saab', 'Saab'], ['Seat', 'Seat'],
  ['Skoda', 'Škoda'], ['Smart', 'Smart'], ['Subaru', 'Subaru'], ['Suzuki', 'Suzuki'],
  ['Toyota', 'Toyota'], ['Volkswagen', 'Volkswagen'], ['Volvo', 'Volvo'],
];

/** The housing pages use upper case and an _1 suffix, with their own exceptions. */
const HOUSING_SECTIONS = [
  ['ALFA-ROMEO_1', 'Alfa Romeo'], ['AUDI_1', 'Audi'], ['BMW_1', 'BMW'],
  ['CADILLAC_1', 'Cadillac'], ['CHEVROLET_1', 'Chevrolet'], ['CHRYSLER_1', 'Chrysler'],
  ['CITROEN_1', 'Citroën'], ['DACIA_1', 'Dacia'], ['Ferrari_1', 'Ferrari'],
  ['FIAT_1', 'Fiat'], ['FORD_1', 'Ford'], ['HONDA_1', 'Honda'], ['HYUNDAI_1', 'Hyundai'],
  ['JAGUAR_1', 'Jaguar'], ['JEEP_1', 'Jeep'], ['KIA_1', 'Kia'],
  ['LAND-ROVER_1', 'Land Rover'], ['LEXUS', 'Lexus'], ['MAZDA_1', 'Mazda'],
  ['MERCEDES-BENZ_1', 'Mercedes-Benz'], ['MINI_1', 'Mini'], ['MITSUBISHI_1', 'Mitsubishi'],
  ['NISSAN_1', 'Nissan'], ['OPEL_1', 'Opel'], ['PEUGEOT_1', 'Peugeot'],
  ['PORSCHE_1', 'Porsche'], ['RENAULT_1', 'Renault'], ['ROVER', 'Rover'],
  ['SAAB_1', 'Saab'], ['SEAT_1', 'Seat'], ['SKODA_1', 'Škoda'], ['SMART_1', 'Smart'],
  ['SSANGYONG', 'SsangYong'], ['SUZUKI_1', 'Suzuki'], ['TOYOTA_1', 'Toyota'],
  ['VOLKSWAGEN_1', 'Volkswagen'], ['VOLVO_1', 'Volvo'],
];

const PRODUCT_LINK = /<a href="https:\/\/a-key-gmbh\.com\/([^"]+)" class="productbox-images"/g;
const TOTAL = /Artikel \d+ - \d+ von (\d+)/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(slug, page) {
  const url = page === 1 ? `${BASE}/${slug}` : `${BASE}/${slug}_s${page}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'autosleutel24-catalog/1.0 (reseller category sync)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** Every product slug in a section, following the _sN pages to the end. */
async function readSection(slug) {
  const found = new Set();
  let total = null;

  for (let page = 1; page <= 40; page++) {
    let html;
    try {
      html = await fetchPage(slug, page);
    } catch (error) {
      if (page === 1) throw error;
      break;
    }

    if (total === null) total = Number(html.match(TOTAL)?.[1] ?? 0);

    const before = found.size;
    for (const m of html.matchAll(PRODUCT_LINK)) found.add(m[1]);

    // The listing repeats the first page for an out-of-range number, so stop
    // as soon as a page adds nothing.
    if (found.size === before) break;
    if (total && found.size >= total) break;

    await sleep(250);
  }

  return { slugs: [...found], reported: total };
}

const sections = [
  ...TYPE_SECTIONS.map(([slug, category, subcategory]) => ({ slug, category, subcategory, make: null })),
  ...MAKE_SECTIONS.map(([slug, make]) => ({
    slug: `geeignet-fuer-${slug}`,
    category: 'afstandsbedieningen',
    subcategory: 'afstandsbediening',
    make,
  })),
  ...HOUSING_SECTIONS.map(([slug, make]) => ({
    slug: `geeignet-fuer-${slug}`,
    category: 'behuizingen',
    subcategory: 'sleutelbehuizing',
    make,
  })),
];

const bySlug = {};
const report = [];

for (const [i, section] of sections.entries()) {
  try {
    const { slugs, reported } = await readSection(section.slug);
    report.push({ section: section.slug, reported, found: slugs.length });

    for (const productSlug of slugs) {
      const entry = (bySlug[productSlug] ??= { categories: [], makes: [] });
      // A type section is a stronger claim than a make section: the make pages
      // list remotes and housings for that make, the type pages say what a
      // thing is.
      entry.categories.push({
        category: section.category,
        subcategory: section.subcategory,
        fromType: section.make === null,
      });
      if (section.make && !entry.makes.includes(section.make)) entry.makes.push(section.make);
    }

    console.log(
      `  ${String(slugs.length).padStart(4)}/${String(reported ?? '?').padEnd(4)} ${section.slug}`
    );
  } catch (error) {
    console.error(`  ---- ${section.slug}: ${error.message}`);
    report.push({ section: section.slug, error: error.message });
  }

  if (i % 10 === 9) await sleep(600);
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ scrapedAt: new Date().toISOString(), report, products: bySlug }, null, 1));

console.log(`\n${Object.keys(bySlug).length} distinct products across ${sections.length} sections`);
console.log(`-> ${path.relative(process.cwd(), OUT)}`);
