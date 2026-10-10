/**
 * Prove every saved photo is clean, big enough, and actually there.
 *
 *   node scripts/akey-images/verify.mjs
 *   node scripts/akey-images/verify.mjs --sample=200   # spot-check, faster
 *   node scripts/akey-images/verify.mjs --no-sheet     # skip the contact sheet
 *
 * A scraper that prints "done" is worth nothing. This is the part that decides
 * whether the photos are usable, and it is built to FAIL rather than to
 * reassure: every check exits non-zero, names the files, and refuses to round
 * a problem down to a warning.
 *
 * Four checks:
 *
 *   1. watermark   — by differential against the rendition known to be clean
 *   2. resolution  — anything under MIN_WIDTH is named, not counted
 *   3. coverage    — every scraped product must have at least one image
 *   4. decodable   — every file is opened; a truncated download is caught
 *
 * Plus a contact sheet: a grid of every photo at thumbnail size. Open it and a
 * watermark across 200 products is obvious in one glance. That last step is
 * deliberately human — no automated detector should be the final word on how
 * your shop looks to a customer.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import {
  BASE,
  HERE,
  IMAGE_DIR,
  MIN_WIDTH,
  ROOT,
  centreDelta,
  get,
  log,
} from './lib.mjs';

const args = process.argv.slice(2);
const sample = Number(args.find((a) => a.startsWith('--sample='))?.split('=')[1]) || Infinity;
const noSheet = args.includes('--no-sheet');

const MANIFEST = path.join(HERE, 'manifest.json');
if (!existsSync(MANIFEST)) {
  console.error('No manifest.json. Run `node scripts/akey-images/fetch.mjs` first.');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

/** The rendition we trust, for the differential. Always md — never the one we saved. */
const referenceUrl = (id, slug) => `${BASE}/media/image/product/${id}/md/${slug}.jpg`;

async function main() {
  const rows = [];
  for (const product of manifest.products) {
    for (const image of product.images) {
      if (!image.file) continue;
      rows.push({ productId: product.productId, url: product.url, ...image });
    }
  }

  const checked = rows.slice(0, sample);
  log(`Verifying ${checked.length} of ${rows.length} images across ${manifest.products.length} products.\n`);

  const failures = { watermarked: [], tooSmall: [], broken: [], missing: [] };
  const deltas = [];

  /* ── 1–2–4: per image ───────────────────────────────────────────────── */

  let n = 0;
  for (const row of checked) {
    const abs = path.join(ROOT, row.file);
    n++;
    if (n % 50 === 0) log(`  ${n}/${checked.length}…`);

    if (!existsSync(abs)) {
      failures.missing.push({ ...row, why: 'manifest lists it, disk does not have it' });
      continue;
    }

    let buf;
    let meta;
    try {
      buf = readFileSync(abs);
      meta = await sharp(buf).metadata();
      // metadata() can succeed on a truncated file; decoding cannot.
      await sharp(buf).raw().toBuffer();
    } catch (error) {
      failures.broken.push({ ...row, why: String(error).slice(0, 120) });
      continue;
    }

    if (!meta.width || meta.width < MIN_WIDTH) {
      failures.tooSmall.push({ ...row, width: meta.width ?? 0 });
      continue;
    }

    /*
     * The watermark check. Fetch md for the same photo and compare centres.
     *
     * If md itself is unreachable we do NOT pass the image — we record it as
     * unverified. "Could not check" and "checked and clean" are different
     * answers and conflating them is how a bad photo reaches a product page.
     */
    const ref = await get(referenceUrl(row.productId, row.slug));
    if (!ref.ok) {
      failures.broken.push({ ...row, why: `reference md unavailable (HTTP ${ref.status}) — UNVERIFIED` });
      continue;
    }

    const delta = await centreDelta(buf, ref.body);
    deltas.push({ file: row.file, score: Number(delta.score.toFixed(2)) });

    if (delta.score > delta.threshold) {
      failures.watermarked.push({
        ...row,
        delta: Number(delta.score.toFixed(2)),
        threshold: delta.threshold,
      });
    }
  }

  /* ── 3: coverage ────────────────────────────────────────────────────── */

  for (const product of manifest.products) {
    const got = product.images.filter((i) => i.file).length;
    if (got === 0) failures.missing.push({ url: product.url, productId: product.productId, why: 'no image at all' });
  }

  /* ── the contact sheet ──────────────────────────────────────────────── */

  if (!noSheet && checked.length) {
    await contactSheets(checked);
  }

  /* ── report ─────────────────────────────────────────────────────────── */

  const report = {
    verifiedAt: new Date().toISOString(),
    source: manifest.source,
    imagesChecked: checked.length,
    imagesTotal: rows.length,
    products: manifest.products.length,
    failures,
    deltaSummary: summarise(deltas),
  };
  writeFileSync(path.join(HERE, 'verify-report.json'), JSON.stringify(report, null, 2) + '\n');

  log('\n' + '─'.repeat(72));
  log(`watermarked : ${failures.watermarked.length}`);
  log(`too small   : ${failures.tooSmall.length}`);
  log(`broken/unverified : ${failures.broken.length}`);
  log(`missing     : ${failures.missing.length}`);
  if (deltas.length) {
    const s = report.deltaSummary;
    log(`\ndelta vs md — median ${s.median}, p95 ${s.p95}, max ${s.max} (threshold ${10})`);
  }

  const show = (label, list) => {
    if (!list.length) return;
    log(`\n${label}:`);
    for (const f of list.slice(0, 15)) {
      log(`  ${f.file ?? f.url}  ${f.delta ? `Δ${f.delta}` : ''}${f.width ? `${f.width}px` : ''}${f.why ? ` — ${f.why}` : ''}`);
    }
    if (list.length > 15) log(`  …and ${list.length - 15} more (see verify-report.json)`);
  };
  show('WATERMARKED', failures.watermarked);
  show('TOO SMALL', failures.tooSmall);
  show('BROKEN / UNVERIFIED', failures.broken);
  show('MISSING', failures.missing);

  log(`\nWritten: scripts/akey-images/verify-report.json`);
  if (!noSheet) log(`Open the contact sheet(s) and look. That is the check that matters.`);

  const bad =
    failures.watermarked.length + failures.tooSmall.length + failures.broken.length + failures.missing.length;
  if (bad) {
    log(`\nFAILED — ${bad} image(s) are not usable.`);
    process.exit(1);
  }
  log(`\nPASSED — every image checked is clean, decodable and at least ${MIN_WIDTH}px.`);
}

/** Median / p95 / max of the deltas, so the threshold can be judged, not trusted. */
function summarise(deltas) {
  if (!deltas.length) return null;
  const v = deltas.map((d) => d.score).sort((a, b) => a - b);
  const at = (q) => v[Math.min(v.length - 1, Math.floor(v.length * q))];
  return { count: v.length, median: at(0.5), p95: at(0.95), max: v[v.length - 1] };
}

/**
 * Grids of 10×10 thumbnails, 150px each, so a 1,000-image run is ten sheets
 * rather than one unopenable file.
 */
async function contactSheets(rows, { cell = 150, cols = 10, perSheet = 100 } = {}) {
  log('\nBuilding contact sheet(s)…');
  let sheet = 0;

  for (let start = 0; start < rows.length; start += perSheet) {
    const batch = rows.slice(start, start + perSheet);
    const tiles = [];

    for (const [i, row] of batch.entries()) {
      const abs = path.join(ROOT, row.file);
      if (!existsSync(abs)) continue;
      try {
        const buf = await sharp(abs)
          .resize(cell, cell, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
          .jpeg({ quality: 80 })
          .toBuffer();
        tiles.push({ input: buf, left: (i % cols) * cell, top: Math.floor(i / cols) * cell });
      } catch {
        /* a file that will not thumbnail is already reported as broken */
      }
    }
    if (!tiles.length) continue;

    const rowsNeeded = Math.ceil(tiles.length / cols);
    const out = path.join(HERE, `contact-sheet-${String(++sheet).padStart(2, '0')}.jpg`);
    await sharp({
      create: {
        width: cols * cell,
        height: rowsNeeded * cell,
        channels: 3,
        background: { r: 245, g: 245, b: 245 },
      },
    })
      .composite(tiles)
      .jpeg({ quality: 85 })
      .toFile(out);
    log(`  ${path.relative(ROOT, out)} — ${tiles.length} images`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
