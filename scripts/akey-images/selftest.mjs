/**
 * Does the watermark detector actually work?
 *
 *   node scripts/akey-images/selftest.mjs
 *
 * Runs offline, against photos already in public/images/products, so it can be
 * run before any scraping and in CI. It exists because verify.mjs is only
 * worth as much as centreDelta(), and "the detector says everything is clean"
 * is the exact output you would also get from a detector that is broken.
 *
 * Three controls, each of which must land on the right side of the threshold:
 *
 *   false positive  an image against a downscale of ITSELF. Differs only by
 *                   resampling and JPEG noise, so it must score LOW. If this
 *                   is high, verify.mjs will condemn clean photos.
 *   true positive   a clean image against the same image with a large
 *                   translucent box over the middle — a synthetic stand-in for
 *                   A-Key's overlay. Must score HIGH.
 *   sanity          two different products. Must score HIGH; if two unrelated
 *                   photos look identical the comparison is not comparing.
 *
 * Measured on this repository: 1.5 / 21.9 / 27.5 against a threshold of 10.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { centreDelta, DELTA_THRESHOLD, ROOT, log } from './lib.mjs';

const DIR = path.join(ROOT, 'public/images/products');

/** A real 800px A-Key photo to work from. Any will do; we only need pixels. */
function pickSample() {
  if (!existsSync(DIR)) return null;
  const files = readdirSync(DIR).filter((f) => /^akey_.*\.jpg$/i.test(f));
  return files.length ? files : null;
}

async function main() {
  const files = pickSample();
  if (!files) {
    console.error(`No sample photos in ${path.relative(ROOT, DIR)} — cannot self-test.`);
    process.exit(1);
  }

  // Two distinct products, the largest we can find, so the centre crop has
  // real detail in it rather than flat background.
  let base = null;
  let other = null;
  for (const f of files) {
    try {
      const buf = readFileSync(path.join(DIR, f));
      const meta = await sharp(buf).metadata();
      if (meta.width < 600) continue;
      if (!base) base = { f, buf };
      else if (!other) { other = { f, buf }; break; }
    } catch { /* unreadable file; the point here is the detector, not the file */ }
  }
  if (!base || !other) {
    console.error('Need two readable photos of at least 600px to self-test.');
    process.exit(1);
  }

  log(`Self-testing centreDelta() — threshold ${DELTA_THRESHOLD}\n`);
  log(`  clean sample : ${base.f}`);
  log(`  other sample : ${other.f}\n`);

  /* ── 1. false positive ────────────────────────────────────────────── */
  // A 320px rendition of the same photo is exactly what verify.mjs compares
  // against in the real run, so this reproduces the real comparison.
  const reference = await sharp(base.buf).resize(320, 320, { fit: 'fill' }).jpeg({ quality: 88 }).toBuffer();
  const clean = await centreDelta(base.buf, reference);

  /* ── 2. true positive ─────────────────────────────────────────────── */
  // Half-width translucent box over the centre: the shape of A-Key's mark.
  const W = 800;
  const overlay = await sharp({
    create: {
      width: Math.round(W * 0.5),
      height: Math.round(W * 0.5),
      channels: 4,
      background: { r: 128, g: 140, b: 128, alpha: 0.45 },
    },
  })
    .png()
    .toBuffer();
  const marked = await sharp(base.buf)
    .resize(W, W, { fit: 'fill' })
    .composite([{ input: overlay, gravity: 'centre' }])
    .jpeg({ quality: 88 })
    .toBuffer();
  const dirty = await centreDelta(marked, reference);

  /* ── 3. sanity ────────────────────────────────────────────────────── */
  const unrelated = await centreDelta(other.buf, reference);

  const checks = [
    { name: 'clean vs own downscale  (must be BELOW)', score: clean.score, pass: clean.score < DELTA_THRESHOLD },
    { name: 'watermarked vs clean    (must be ABOVE)', score: dirty.score, pass: dirty.score > DELTA_THRESHOLD },
    { name: 'different product       (must be ABOVE)', score: unrelated.score, pass: unrelated.score > DELTA_THRESHOLD },
  ];

  for (const c of checks) {
    log(`  ${c.pass ? 'ok  ' : 'FAIL'}  ${c.name}  Δ${c.score.toFixed(2)}`);
  }

  const margin = dirty.score - clean.score;
  log(`\n  separation: ${margin.toFixed(1)} points between clean and watermarked`);

  if (checks.some((c) => !c.pass)) {
    log('\nFAILED — do not trust verify.mjs until centreDelta() is fixed.');
    process.exit(1);
  }
  /*
   * A threshold that only just works is one bad photo away from being wrong in
   * both directions, so a narrow margin fails too rather than passing quietly.
   */
  if (margin < 5) {
    log('\nFAILED — clean and watermarked are too close to tell apart reliably.');
    process.exit(1);
  }

  log('\nPASSED — the detector separates clean from watermarked.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
