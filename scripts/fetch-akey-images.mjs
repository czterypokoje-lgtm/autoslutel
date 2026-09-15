/**
 * Downloads the product photos the A-Key export refers to but that are not yet
 * on disk.
 *
 *   node scripts/fetch-akey-images.mjs
 *
 * The export names each file (akey_<id>_<hash>.jpg) but ships only the name;
 * the bytes come from A-Key's own media server, matched by product title
 * against a-key-products.json. Files already present are skipped, so this is
 * safe to re-run after a new export.
 */

import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import path from 'path';

const OUT_DIR = path.join(process.cwd(), 'public/images/products');
const catalog = JSON.parse(readFileSync(path.join(process.cwd(), 'src/lib/catalog.json'), 'utf8'));
const raw = JSON.parse(readFileSync(path.join(process.cwd(), 'a-key-products.json'), 'utf8'));
const rawList = Array.isArray(raw) ? raw : Object.values(raw)[0];

const csv = readFileSync(path.join(process.cwd(), 'src/data/akey-products.csv'), 'utf8');

/** slug -> the filename the catalogue expects, taken from the export. */
const wanted = new Map();
for (const line of csv.split(/\r?\n/).slice(1)) {
  const m = line.match(/^(\d+),([a-z0-9-]+),.*?(https?:\/\/[^",]*\/images\/products\/([^",]+))/i);
  if (m) wanted.set(m[2], m[4]);
}

const byTitle = new Map(rawList.map((p) => [(p.title || '').toLowerCase().trim(), p]));

const todo = [];
for (const p of catalog.products) {
  const filename = wanted.get(p.slug);
  if (!filename) continue;
  if (existsSync(path.join(OUT_DIR, filename))) continue;

  const source = byTitle.get((p.title || '').toLowerCase().trim());
  const url = source?.images?.[0];
  if (url) todo.push({ filename, url, title: p.title });
}

console.log(`${todo.length} photos to fetch`);
mkdirSync(OUT_DIR, { recursive: true });

let ok = 0;
let failed = 0;

for (const [i, item] of todo.entries()) {
  try {
    const res = await fetch(item.url, {
      headers: { 'User-Agent': 'autosleutel24-catalog/1.0 (reseller image sync)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) throw new Error('suspiciously small');
    writeFileSync(path.join(OUT_DIR, item.filename), buf);
    ok++;
  } catch (error) {
    failed++;
    if (failed <= 5) console.error(`  failed: ${item.title.slice(0, 50)} — ${error.message}`);
  }

  if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${todo.length} …`);
  // Their server, their bandwidth: a small pause rather than 500 at once.
  await new Promise((r) => setTimeout(r, 120));
}

console.log(`done — ${ok} downloaded, ${failed} failed`);
