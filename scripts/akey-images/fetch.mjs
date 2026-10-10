/**
 * The scraper. Keys and housings, every photo, best available rendition.
 *
 *   node scripts/akey-images/fetch.mjs            # both categories
 *   node scripts/akey-images/fetch.mjs --only=behuizingen
 *   node scripts/akey-images/fetch.mjs --limit=20 # a dry run worth doing first
 *
 * It refuses to start until probe.mjs has written sources.json. That is the
 * guard against repeating the mistake already in this repository: the last
 * round pulled 3,605 watermarked `lg` files because nobody established what a
 * good source looked like before downloading 8,000 images. The rendition this
 * uses is whatever probe measured as the largest CLEAN one — never a constant
 * typed in here.
 *
 * Resumable. A file already on disk is never re-fetched, so a re-run after an
 * interruption costs one HEAD-less check per image and nothing else.
 */
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import {
  BASE,
  HERE,
  IMAGE_DIR,
  CATEGORIES,
  MIN_WIDTH,
  get,
  getText,
  log,
  ensureDir,
} from './lib.mjs';

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith('--only='))?.split('=')[1];
const limit = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1]) || Infinity;

/* ── the source, as measured ──────────────────────────────────────────── */

const SOURCES = path.join(HERE, 'sources.json');
if (!existsSync(SOURCES)) {
  console.error('No sources.json. Run `node scripts/akey-images/probe.mjs` first.');
  console.error('Without it this script would have to guess a rendition, and the');
  console.error('last guess put a watermark on half the catalogue.');
  process.exit(1);
}
const sources = JSON.parse(readFileSync(SOURCES, 'utf8'));
const BEST = sources.best;

log(`Source: ${BEST.label} at ${BEST.width}px — ${BEST.template}`);
if (!sources.cleanLargeSourceExists) {
  log('');
  log('NOTE: probe found no clean rendition above 320px. This run will fetch md,');
  log('which is clean but small. For full-size clean photos, ask A-Key directly.');
  log('');
}

/** Build a URL for one image from the measured template. */
const sourceUrl = (id, slug) =>
  BASE + BEST.template.replace('{id}', String(id)).replace('{slug}', slug);

/* ── walking the categories ───────────────────────────────────────────── */

/**
 * Every product URL under a category, following its pagination.
 *
 * The sub-categories ("geeignet für Audi", "geeignet für BMW", …) do not need
 * walking separately: the parent category lists every product across all of
 * them, and the per-make pages are filtered views of the same set. Walking
 * both would fetch each product twice and prove nothing.
 */
async function productUrls(categoryUrl) {
  const found = new Set();

  for (let page = 1; page <= 200; page++) {
    const url = page === 1 ? categoryUrl : `${categoryUrl}?page=${page}`;
    const res = await getText(url);
    if (!res.ok) {
      log(`  page ${page}: HTTP ${res.status} — stopping`);
      break;
    }

    /*
     * Product links carry a numeric id in the media path on the same card, but
     * the anchor itself is a slug URL. Collect the anchors; the id comes from
     * the product page's own image markup, which is authoritative.
     */
    const before = found.size;
    for (const m of res.text.matchAll(/href="(https:\/\/a-key-gmbh\.com\/[^"?#]+)"/g)) {
      const href = m[1];
      // Category and static pages have no product image; products do. The
      // cheap filter is to skip the known non-product paths.
      if (/\/(Kontakt|AGB|Impressum|Datenschutz|Widerruf|Versand|Zahlung|Suche|warenkorb|login|register)/i.test(href)) continue;
      if (href === categoryUrl || href === BASE || href === `${BASE}/`) continue;
      found.add(href);
    }

    const added = found.size - before;
    log(`  page ${page}: ${added} new (${found.size} total)`);
    // A page that adds nothing is past the end of the list.
    if (added === 0) break;
  }

  return [...found];
}

/* ── one product ──────────────────────────────────────────────────────── */

/**
 * The product's id, slug and full gallery, read from its own page.
 *
 * Both come out of the media paths, which are the one place the numeric id
 * appears. `~2`, `~3` suffixes are the gallery: A-Key names additional photos
 * of one product that way.
 */
function galleryOf(html) {
  const seen = new Map();
  for (const m of html.matchAll(
    /media\/image\/product\/(\d+)\/(?:xs|sm|md|lg)\/([^"'\s)]+?)\.jpg/g
  )) {
    const [, id, slug] = m;
    // One entry per distinct slug — the same photo appears at several sizes.
    if (!seen.has(slug)) seen.set(slug, { id: Number(id), slug });
  }
  return [...seen.values()];
}

async function fetchProduct(productUrl, manifest) {
  const page = await getText(productUrl);
  if (!page.ok) return { url: productUrl, ok: false, status: page.status, images: [] };

  const gallery = galleryOf(page.text);
  if (!gallery.length) return { url: productUrl, ok: true, images: [], note: 'no product images' };

  /*
   * All photos in one product page belong to that product, but the page also
   * renders cross-sell tiles ("Kunden kauften auch") with other products'
   * images. Those carry a different numeric id. Keep only the id that appears
   * most — that is this product's own.
   */
  const counts = new Map();
  for (const g of gallery) counts.set(g.id, (counts.get(g.id) ?? 0) + 1);
  const ownId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const own = gallery.filter((g) => g.id === ownId);

  const dir = ensureDir(path.join(IMAGE_DIR, String(ownId)));
  const saved = [];

  for (const [i, shot] of own.entries()) {
    const file = path.join(dir, `${i}.jpg`);
    const rel = path.relative(path.join(IMAGE_DIR, '..', '..', '..'), file);

    if (existsSync(file)) {
      saved.push({ index: i, slug: shot.slug, file: rel, skipped: true });
      continue;
    }

    const res = await get(sourceUrl(ownId, shot.slug));
    if (!res.ok) {
      saved.push({ index: i, slug: shot.slug, error: `HTTP ${res.status}` });
      continue;
    }

    // Decode before writing. A truncated body that still looks like bytes is
    // the failure mode that survives all the way to a broken product page.
    let meta;
    try {
      meta = await sharp(res.body).metadata();
    } catch {
      saved.push({ index: i, slug: shot.slug, error: 'not decodable' });
      continue;
    }
    if (!meta.width || meta.width < MIN_WIDTH) {
      saved.push({ index: i, slug: shot.slug, error: `only ${meta.width}px` });
      continue;
    }

    writeFileSync(file, res.body);
    saved.push({ index: i, slug: shot.slug, file: rel, width: meta.width, height: meta.height });
  }

  const entry = { url: productUrl, productId: ownId, ok: true, images: saved };
  manifest.products.push(entry);
  return entry;
}

/* ── main ─────────────────────────────────────────────────────────────── */

async function main() {
  ensureDir(IMAGE_DIR);

  const manifest = {
    startedAt: new Date().toISOString(),
    source: BEST,
    categories: [],
    products: [],
  };

  const todo = CATEGORIES.filter((c) => !only || c.key === only);
  if (!todo.length) {
    console.error(`--only=${only} matched no category. Known: ${CATEGORIES.map((c) => c.key).join(', ')}`);
    process.exit(1);
  }

  for (const category of todo) {
    log(`\n═══ ${category.key} — ${category.url}`);
    const urls = (await productUrls(category.url)).slice(0, limit);
    log(`  ${urls.length} product URLs\n`);
    manifest.categories.push({ ...category, productCount: urls.length });

    let done = 0;
    let images = 0;
    let failed = 0;

    for (const url of urls) {
      const result = await fetchProduct(url, manifest);
      done++;
      const got = (result.images ?? []).filter((i) => i.file).length;
      images += got;
      if (!result.ok || (result.images ?? []).some((i) => i.error)) failed++;

      if (done % 25 === 0 || done === urls.length) {
        log(`  ${done}/${urls.length} products · ${images} images · ${failed} with a problem`);
      }
    }
  }

  manifest.finishedAt = new Date().toISOString();
  mkdirSync(HERE, { recursive: true });
  writeFileSync(path.join(HERE, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  const total = manifest.products.reduce((n, p) => n + p.images.filter((i) => i.file).length, 0);
  log(`\n${manifest.products.length} products · ${total} images on disk`);
  log(`Written: scripts/akey-images/manifest.json`);
  log(`\nNow run: node scripts/akey-images/verify.mjs`);
  log('Nothing here is trustworthy until that passes.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
