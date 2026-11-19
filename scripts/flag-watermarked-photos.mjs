/**
 * Which downloaded A-Key photos actually carry their watermark, checked
 * pixel by pixel rather than trusted from the filename.
 *
 *   node scripts/flag-watermarked-photos.mjs
 *   -> src/data/watermark-flags.json
 *
 * build-catalog.mjs's own "clean" vs "watermarked" split (the `_<i>` filename
 * suffix) turned out not to track reality: many "clean"-suffixed files still
 * carry the logo, and a product's gallery of 2-7 photos routinely mixes both
 * — some genuinely clean, some not, regardless of suffix. 679 products have
 * exactly that mix.
 *
 * Two things went wrong before this version worked, both caught by actually
 * opening the flagged/unflagged files and looking, not just trusting the
 * number:
 *
 *   - Checking only a fixed region of a centred product shot missed the mark
 *     entirely on angled or cropped photos, where it sits somewhere else in
 *     frame. Fixed by scanning the whole image instead.
 *   - Plain RGB "is green the highest channel" only detects the mark
 *     reliably over a light background — blended onto dark plastic (the
 *     common case) it reads as a dark, desaturated blue-grey, not green, and
 *     was missed completely. Fixed by checking hue in HSV space, which holds
 *     up regardless of how dark the pixel is.
 *
 * A genuinely green product (PCB boards, some rubber trim) can still trip a
 * pure hue check, but a whole green PCB reads at roughly 0.15-0.30 of the
 * frame — 6-10x the mark's own footprint (~0.02-0.04, confirmed across
 * several real examples) — so an upper bound on the fraction excludes those
 * without giving up sensitivity to the actual watermark.
 *
 * This only ever decides "which of THIS product's own already-downloaded
 * photos is the clean one" — never whether to borrow a photo from a
 * different product — so a rare false positive costs one redundant photo
 * kept, not the wrong part shown.
 */

import sharp from 'sharp';
import { readdirSync, writeFileSync } from 'fs';
import path from 'path';

const IMAGE_DIR = path.join(process.cwd(), 'public/images/products');
const OUT = path.join(process.cwd(), 'src/data/watermark-flags.json');

const SIZE = 400;
const HUE_MIN = 0.22; // green, in the 0-1 hue wheel (~80°)
const HUE_MAX = 0.45; // through teal (~160°)
const SAT_FLOOR = 0.08; // ignore near-grey noise
const BAND_LOW = 0.008; // below this, nothing green enough to be the mark
const BAND_HIGH = 0.12; // above this, it is the product's own colour (PCBs), not a logo

function rgbToHsvFraction(data, width, height, channels) {
  let greenish = 0;
  const total = width * height;
  for (let i = 0; i < total; i++) {
    const o = i * channels;
    const r = data[o] / 255;
    const g = data[o + 1] / 255;
    const b = data[o + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    if (delta === 0) continue;
    const s = max === 0 ? 0 : delta / max;
    if (s < SAT_FLOOR) continue;

    let h;
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = (h / 6 + 1) % 1;

    if (h > HUE_MIN && h < HUE_MAX) greenish++;
  }
  return greenish / total;
}

async function hasWatermark(file) {
  try {
    const { data, info } = await sharp(file)
      .resize(SIZE, SIZE, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const fraction = rgbToHsvFraction(data, info.width, info.height, info.channels);
    return fraction > BAND_LOW && fraction < BAND_HIGH;
  } catch {
    return false; // an unreadable file is not this script's problem to flag
  }
}

const files = readdirSync(IMAGE_DIR).filter((f) => /^akey_\d+_[0-9a-f]{8}(?:_\d+)?\.(jpe?g|png|webp)$/i.test(f));
console.log(`${files.length} A-Key photos to check`);

const flags = {};
let done = 0;
for (const file of files) {
  flags[file] = await hasWatermark(path.join(IMAGE_DIR, file));
  done++;
  if (done % 500 === 0) console.log(`  ${done}/${files.length}`);
}

writeFileSync(OUT, `${JSON.stringify(flags)}\n`);
const flagged = Object.values(flags).filter(Boolean).length;
console.log(`\n${flagged}/${files.length} flagged watermarked`);
console.log(`-> ${path.relative(process.cwd(), OUT)}`);
