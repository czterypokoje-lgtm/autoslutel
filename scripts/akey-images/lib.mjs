/**
 * Shared bits for the A-Key image toolchain.
 *
 * The important thing in here is centreDelta(): the watermark detector. It is
 * deliberately NOT a template match against the A-KEY logo. A detector that
 * looks for one specific mark passes everything the day they change the mark,
 * and the failure is silent — you find out when a customer tells you.
 *
 * Instead it compares a candidate image against the rendition we have
 * established is clean (md, 320 px). Any systematic difference in the middle
 * of the frame is a mark, whatever it looks like. That makes the check
 * future-proof and, more importantly, falsifiable: probe.mjs runs it against
 * the known-watermarked lg and refuses to continue if it comes back clean.
 */
import { mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

export const BASE = 'https://a-key-gmbh.com';

/**
 * A real browser string.
 *
 * Not to disguise anything — we are an authorised reseller fetching product
 * photos we are entitled to use. Some shop systems simply serve a different
 * (or no) image to an unrecognised agent, and a blank user-agent is the
 * fastest way to get rate-limited by a WAF.
 */
export const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..', '..');

/** Where the photos land. One directory per product, so a gallery stays together. */
export const IMAGE_DIR = path.join(ROOT, 'public/images/akey');

export const log = (...args) => console.log(...args);

/** Be a good guest: one request at a time, with a gap. */
export const POLITE_DELAY_MS = 350;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * A fetch that returns a Buffer and never throws on an HTTP error.
 *
 * Retries only what is worth retrying. A 404 means the pattern does not exist
 * and retrying it four times just slows the probe down; a 429 or a 5xx is the
 * server asking us to come back later, and that is worth honouring.
 */
export async function get(url, { retries = 3, timeoutMs = 20000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'image/avif,image/webp,image/*,*/*;q=0.8' },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.status === 404 || res.status === 403) {
        return { ok: false, status: res.status, body: null };
      }
      if (!res.ok) {
        if (attempt >= retries) return { ok: false, status: res.status, body: null };
        // 2s, 4s, 8s — and honour Retry-After when they send one.
        const after = Number(res.headers.get('retry-after'));
        await sleep(Number.isFinite(after) && after > 0 ? after * 1000 : 2000 * 2 ** attempt);
        continue;
      }

      const body = Buffer.from(await res.arrayBuffer());
      await sleep(POLITE_DELAY_MS);
      return { ok: true, status: res.status, body };
    } catch (error) {
      if (attempt >= retries) return { ok: false, status: 0, body: null, error: String(error) };
      await sleep(2000 * 2 ** attempt);
    }
  }
}

/** Same as get(), for HTML. */
export async function getText(url, opts) {
  const res = await get(url, opts);
  return res.ok ? { ok: true, text: res.body.toString('utf8') } : { ok: false, status: res.status };
}

/* ── the watermark detector ───────────────────────────────────────────── */

/**
 * How far the middle of `candidate` departs from the middle of `reference`.
 *
 * Both are normalised to one small greyscale size first, so a 800×800 and a
 * 320×320 of the same photo become directly comparable. Then only the centre
 * is compared — the inner 60% — because that is where this watermark sits and
 * because cropping out the edges removes the one thing that legitimately
 * differs between renditions: the resampling of fine detail near a border.
 *
 * Returns a mean absolute difference per pixel, 0–255.
 *
 *   two renditions of the same clean photo   ~2–6   (resampling + JPEG noise)
 *   a large semi-transparent overlay         ~15+
 *
 * The threshold sits at 10, between the two, and is returned alongside the
 * score so a caller can show its working rather than just a boolean.
 */
export const DELTA_THRESHOLD = 10;

export async function centreDelta(candidateBuf, referenceBuf, { size = 256 } = {}) {
  const norm = async (buf) => {
    const full = await sharp(buf)
      .resize(size, size, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer();
    return full;
  };

  const [a, b] = await Promise.all([norm(candidateBuf), norm(referenceBuf)]);

  // The inner 60%: x,y from 20% to 80% of the normalised square.
  const lo = Math.floor(size * 0.2);
  const hi = Math.floor(size * 0.8);

  let sum = 0;
  let n = 0;
  for (let y = lo; y < hi; y++) {
    const row = y * size;
    for (let x = lo; x < hi; x++) {
      sum += Math.abs(a[row + x] - b[row + x]);
      n++;
    }
  }

  return { score: n ? sum / n : 0, threshold: DELTA_THRESHOLD };
}

/* ── products used by probe.mjs ───────────────────────────────────────── */

/**
 * A handful of real products to probe against, taken from the page saved at
 * akey_product.html. Several, not one: a pattern that happens to work for a
 * single product is a fluke, and probe.mjs only accepts a source that worked
 * on every one of them.
 */
export const PRODUCTS = [
  { id: 13887, slug: 'funkschluessel-kompatibel-fuer-volkswagen-vvr124a' },
  { id: 5457, slug: 'funkschluessel-kompatibel-fuer-fiat-fir103e' },
  { id: 11766, slug: 'fbs3-kit-geeignet-fuer-mercedes-benz' },
];

/** The two category trees in scope. */
export const CATEGORIES = [
  { key: 'autosleutels', url: `${BASE}/Autoschluessel-Funkschluessel` },
  { key: 'behuizingen', url: `${BASE}/Funkschluessel-Gehaeuse` },
];

/** Nothing below this is worth putting on a product page. */
export const MIN_WIDTH = 300;

export function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}
