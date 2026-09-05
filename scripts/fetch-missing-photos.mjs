/**
 * Downloads the photos the catalogue is still missing.
 *
 *   node scripts/fetch-missing-photos.mjs
 *
 * Same naming as the rest of the set — akey_<n>_<md5(url).slice(0,8)>_<i>.jpg
 * — so scripts/build-catalog.mjs picks them up without any mapping file.
 *
 * The 320px variant, not the 800px one: A-Key prints their logo across the
 * middle of every large image and leaves the medium one clean. A watermarked
 * photo of a part is worse than a small one — it advertises the supplier on
 * our own product page.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

const RAW = path.join(process.cwd(), 'src/data/akey-catalog-raw.json');
const CATALOG = path.join(process.cwd(), 'src/lib/catalog.json');
const DIR = path.join(process.cwd(), 'public/images/products');
const UA = 'autosleutel24-catalog/2.0 (reseller catalogue sync)';

/* The catalogue lower-cases slugs for the URLs; the scrape keeps A-Key's own
   casing, so the two are matched case-insensitively. */
const rawBySlug = JSON.parse(readFileSync(RAW, 'utf8')).products;
const raw = Object.fromEntries(Object.entries(rawBySlug).map(([k, v]) => [k.toLowerCase(), v]));
const catalog = JSON.parse(readFileSync(CATALOG, 'utf8')).products;

const hashOf = (url) => createHash('md5').update(url).digest('hex').slice(0, 8);

/* Carry on from the highest sequence number already on disk. */
let sequence = Math.max(
  0,
  ...readdirSync(DIR)
    .map((f) => Number(f.match(/^akey_(\d+)_/)?.[1]))
    .filter(Number.isFinite)
);

const missing = catalog.filter((p) => !p.image && raw[p.slug.toLowerCase()]?.images?.length);
console.log(`${missing.length} articles without a photo, ${catalog.filter((p) => !p.image).length} in total\n`);

let saved = 0;
let failed = 0;

for (const entry of missing) {
  const product = raw[entry.slug.toLowerCase()];
  const hash = hashOf(product.url);
  sequence++;

  for (const [i, url] of product.images.slice(0, 4).entries()) {
    // Their medium variant carries no watermark; the large one does.
    const clean = url.replace('/lg/', '/md/');
    const file = path.join(DIR, `akey_${sequence}_${hash}_${i}.jpg`);
    if (existsSync(file)) continue;

    try {
      const res = await fetch(clean, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      saved++;
    } catch (error) {
      failed++;
      if (failed <= 5) console.error(`  ${entry.slug} — ${error.message}`);
    }
  }
}

console.log(`\n${saved} photos saved, ${failed} failed`);
console.log('Run scripts/build-catalog.mjs again to attach them.');
