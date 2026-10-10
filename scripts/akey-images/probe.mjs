/**
 * Is there a clean image bigger than 320 px, anywhere on A-Key's server?
 *
 * Everything downstream depends on the answer, so it is established once, by
 * measurement, and written to sources.json. `fetch.mjs` refuses to run without
 * that file — which is the whole point. The previous round of scraping pulled
 * 3,605 watermarked `lg` files because nobody had established what a good
 * source looked like first.
 *
 *   node scripts/akey-images/probe.mjs
 *
 * What it does, per candidate URL pattern: fetch it, decode it, record the
 * dimensions, and compare it against the `md` rendition of the same photo,
 * which we know is clean. A candidate is only interesting if it is BOTH bigger
 * than md AND free of a centred overlay that md does not have.
 */
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { BASE, UA, HERE, get, centreDelta, log, PRODUCTS } from './lib.mjs';

/**
 * Every path worth trying, in the order we would prefer them.
 *
 * `lg` is in the list even though it is known watermarked: it is the control.
 * If the differential check does not flag `lg`, the check itself is broken and
 * every other result in this run is meaningless. A test that cannot fail the
 * known-bad case proves nothing.
 */
const CANDIDATES = [
  // Sizes beyond the four in their srcset. Some Gambio installs generate them.
  { label: 'original', url: (id, slug) => `${BASE}/media/image/product/${id}/original/${slug}.jpg` },
  { label: 'xl', url: (id, slug) => `${BASE}/media/image/product/${id}/xl/${slug}.jpg` },
  { label: 'xxl', url: (id, slug) => `${BASE}/media/image/product/${id}/xxl/${slug}.jpg` },
  { label: 'full', url: (id, slug) => `${BASE}/media/image/product/${id}/full/${slug}.jpg` },

  /*
   * Gambio's classic on-disk layout, which the /media/image/ route is a
   * rewrite over. `original_images` is the uploaded file: if the watermark is
   * applied when renditions are generated — which is how every shop system
   * that offers watermarking does it — then this is the clean full-size
   * original, and it is the answer.
   */
  { label: 'gambio-original', url: (_id, slug) => `${BASE}/images/product_images/original_images/${slug}.jpg` },
  { label: 'gambio-popup', url: (_id, slug) => `${BASE}/images/product_images/popup_images/${slug}.jpg` },
  { label: 'gambio-info', url: (_id, slug) => `${BASE}/images/product_images/info_images/${slug}.jpg` },
  { label: 'gambio-gallery', url: (_id, slug) => `${BASE}/images/product_images/gallery_images/${slug}.jpg` },

  // The control. Known watermarked. Must be flagged, or the detector is broken.
  { label: 'lg (control, expected DIRTY)', url: (id, slug) => `${BASE}/media/image/product/${id}/lg/${slug}.jpg` },
];

/** The rendition we trust. Everything is judged against it. */
const reference = (id, slug) => `${BASE}/media/image/product/${id}/md/${slug}.jpg`;

async function probeOne(product) {
  const { id, slug } = product;
  log(`\n── product ${id} — ${slug}`);

  const refRes = await get(reference(id, slug));
  if (!refRes.ok) {
    log(`   md reference unavailable (HTTP ${refRes.status}) — skipping this product`);
    return [];
  }
  const refMeta = await sharp(refRes.body).metadata();
  log(`   md reference: ${refMeta.width}×${refMeta.height}`);

  const rows = [];
  for (const candidate of CANDIDATES) {
    const url = candidate.url(id, slug);
    const res = await get(url);

    if (!res.ok) {
      rows.push({ label: candidate.label, url, ok: false, status: res.status });
      log(`   ${candidate.label.padEnd(30)} HTTP ${res.status}`);
      continue;
    }

    let meta;
    try {
      meta = await sharp(res.body).metadata();
    } catch {
      rows.push({ label: candidate.label, url, ok: false, status: res.status, error: 'not an image' });
      log(`   ${candidate.label.padEnd(30)} HTTP ${res.status} but not decodable`);
      continue;
    }

    /*
     * The differential. Both images are normalised to the same small size and
     * compared in the middle, where this watermark sits. A clean rendition of
     * the same photo differs from md only by resampling and JPEG noise, which
     * is low single digits. The A-KEY overlay moves it far above that.
     */
    const delta = await centreDelta(res.body, refRes.body);
    const dirty = delta.score > delta.threshold;

    rows.push({
      label: candidate.label,
      url,
      ok: true,
      width: meta.width,
      height: meta.height,
      bytes: res.body.length,
      deltaScore: Number(delta.score.toFixed(2)),
      deltaThreshold: delta.threshold,
      watermarked: dirty,
    });

    log(
      `   ${candidate.label.padEnd(30)} ${String(meta.width).padStart(5)}×${String(meta.height).padEnd(5)}` +
        ` Δ${delta.score.toFixed(1).padStart(6)}  ${dirty ? 'WATERMARKED' : 'clean'}`
    );
  }
  return rows;
}

async function main() {
  log('Probing A-Key for a clean rendition larger than md (320 px).\n');
  log(`Reference = md. Control = lg, which MUST come back watermarked.`);

  const all = [];
  for (const product of PRODUCTS) {
    all.push(...(await probeOne(product)).map((r) => ({ ...r, productId: product.id })));
  }

  /* ── did the control fail? ─────────────────────────────────────────── */

  const controls = all.filter((r) => r.label.startsWith('lg') && r.ok);
  const controlCaught = controls.filter((r) => r.watermarked).length;

  log('\n' + '─'.repeat(72));
  if (!controls.length) {
    log('CONTROL DID NOT RUN — lg was unreachable. Nothing here can be trusted.');
    process.exit(1);
  }
  if (controlCaught === 0) {
    log(`CONTROL FAILED: lg was not flagged on any of ${controls.length} products.`);
    log('The watermark detector is not working, so every "clean" result above is');
    log('meaningless. Fix centreDelta() in lib.mjs before going further.');
    process.exit(1);
  }
  log(`Control OK: lg flagged watermarked on ${controlCaught}/${controls.length} products.`);

  /* ── the verdict ───────────────────────────────────────────────────── */

  const usable = all.filter(
    (r) => r.ok && !r.watermarked && !r.label.startsWith('lg') && r.width > 320
  );

  // Group by pattern: a pattern is only usable if it worked on EVERY product
  // we tried. One lucky hit is a fluke, not a source.
  const byLabel = new Map();
  for (const r of usable) byLabel.set(r.label, (byLabel.get(r.label) ?? 0) + 1);

  const tried = PRODUCTS.length;
  const reliable = [...byLabel.entries()]
    .filter(([, n]) => n === tried)
    .map(([label]) => {
      const sample = usable.find((r) => r.label === label);
      return { label, width: sample.width, pattern: label };
    })
    .sort((a, b) => b.width - a.width);

  mkdirSync(HERE, { recursive: true });

  if (!reliable.length) {
    log('\nNo clean rendition larger than 320 px exists on their public site.');
    log('');
    log('That is a real answer, not a failure of this script. It means:');
    log('  · the biggest clean image available is md, at 320×320;');
    log('  · "full HD without watermark" cannot be scraped from a-key-gmbh.com;');
    log('  · the way to get full-size clean photos is to ASK A-KEY for them.');
    log('    You are an authorised dropshipper — this is one email, and it');
    log('    gives better images than any amount of scraping.');
    log('');
    log('fetch.mjs will still run and will take md, so you at least have clean');
    log('images everywhere instead of a watermark on half the catalogue.');

    writeFileSync(
      path.join(HERE, 'sources.json'),
      JSON.stringify(
        {
          probedAt: new Date().toISOString(),
          best: { label: 'md', width: 320, template: '/media/image/product/{id}/md/{slug}.jpg' },
          cleanLargeSourceExists: false,
          note: 'No clean rendition above 320px found. Ask A-Key for originals.',
          rows: all,
        },
        null,
        2
      ) + '\n'
    );
  } else {
    const best = reliable[0];
    log(`\nBest clean source: ${best.label} at ${best.width} px, on all ${tried} products tried.`);
    writeFileSync(
      path.join(HERE, 'sources.json'),
      JSON.stringify(
        {
          probedAt: new Date().toISOString(),
          best,
          cleanLargeSourceExists: true,
          alternatives: reliable.slice(1),
          rows: all,
        },
        null,
        2
      ) + '\n'
    );
  }

  log(`\nWritten: scripts/akey-images/sources.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
