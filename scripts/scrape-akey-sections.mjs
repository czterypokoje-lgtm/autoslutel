/**
 * Which of A-Key's shelves each article actually stands on.
 *
 *   node scripts/scrape-akey-sections.mjs
 *   -> src/data/akey-sections.json
 *
 * A product page's breadcrumb names one shelf. An article can stand on
 * several: a circuit board for an Audi is listed both under "Boards für
 * Funkschlüssel (PCB)" and under "geeignet für Audi", and which of the two
 * the breadcrumb shows is not something we control. Counting their own
 * category pages showed the gap — their PCB shelf holds 32 articles, and the
 * breadcrumbs alone found 22 of them.
 *
 * So this reads the shelves themselves. The URLs come from the breadcrumbs
 * already scraped, so it can never crawl a category that no product is on,
 * and it needs no hand-kept list of section slugs.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const BASE = 'https://a-key-gmbh.com';
const RAW = path.join(process.cwd(), 'src/data/akey-catalog-raw.json');
const OUT = path.join(process.cwd(), 'src/data/akey-sections.json');
const UA = 'autosleutel24-catalog/2.0 (reseller catalogue sync; +https://www.autosleutel24.nl)';

if (!existsSync(RAW)) {
  console.error('Run scripts/scrape-akey-catalog.mjs first.');
  process.exit(1);
}

const raw = JSON.parse(readFileSync(RAW, 'utf8'));

/** Every category URL their breadcrumbs point at, with the name they give it. */
const sections = new Map();
for (const product of Object.values(raw.products)) {
  for (const crumb of product.breadcrumb ?? []) {
    if (crumb.href?.startsWith(BASE) && crumb.href !== `${BASE}/`) {
      sections.set(crumb.href, crumb.name);
    }
  }
}

console.log(`${sections.size} shelves to read\n`);

const PRODUCT_LINK = /<a href="https:\/\/a-key-gmbh\.com\/([^"]+)" class="productbox-images"/g;
/** "Artikel 1 - 30 von 123" — how many they say the shelf holds. */
const TOTAL = /Artikel\s+\d+\s*-\s*\d+\s+von\s+(\d+)/i;

/** Listings paginate with an _sN suffix, 30 to a page. */
async function readSection(url) {
  const slugs = new Set();
  let stated = null;

  for (let page = 1; page <= 60; page++) {
    const pageUrl = page === 1 ? url : `${url}_s${page}`;
    const res = await fetch(pageUrl, { headers: { 'User-Agent': UA } });
    if (!res.ok) break;
    const html = await res.text();

    if (page === 1) stated = Number(html.match(TOTAL)?.[1]) || null;

    const before = slugs.size;
    for (const [, slug] of html.matchAll(PRODUCT_LINK)) slugs.add(slug);
    // A page that adds nothing is past the end — their paginator serves the
    // last page again rather than a 404.
    if (slugs.size === before) break;
  }

  return { slugs: [...slugs], stated };
}

const store = { scrapedAt: new Date().toISOString(), sections: {} };
let n = 0;

for (const [url, name] of sections) {
  const { slugs, stated } = await readSection(url);
  store.sections[url.replace(`${BASE}/`, '')] = { name, url, stated, slugs };
  n++;
  const short = stated != null && slugs.length < stated ? `  (their count: ${stated})` : '';
  console.log(`  ${String(n).padStart(3)}/${sections.size}  ${slugs.length.toString().padStart(4)}  ${name}${short}`);
}

writeFileSync(OUT, `${JSON.stringify(store, null, 1)}\n`);

const total = Object.values(store.sections).reduce((a, s) => a + s.slugs.length, 0);
console.log(`\n${Object.keys(store.sections).length} shelves, ${total} placements -> ${path.relative(process.cwd(), OUT)}`);
