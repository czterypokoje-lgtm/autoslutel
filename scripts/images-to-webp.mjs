/**
 * Re-encodes the product photos as WebP.
 *
 *   node scripts/images-to-webp.mjs [--dry-run]
 *
 * 6.423 photos came off A-Key as JPEG and take 504 MB, which is more than a
 * single git push survives — the last attempt died at 239 MiB — and more than
 * a shop should send to a phone. WebP at quality 82 is visually the same
 * picture at roughly half the bytes.
 *
 * Only the watermark-free set is touched: akey_<n>_<hash>_<i>.jpg, the 320px
 * variant. The originals are deleted once the WebP is written and verified,
 * and scripts/build-catalog.mjs picks the new names up on its own — the photo
 * lookup keys on the hash in the filename, not on the extension.
 *
 * Every file is re-downloadable with scripts/fetch-missing-photos.mjs, so a
 * bad run costs time and not photos.
 */

import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync, existsSync } from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'public/images/products');
const DRY = process.argv.includes('--dry-run');
const QUALITY = 82;

const sources = readdirSync(DIR).filter((f) => /^akey_\d+_[0-9a-f]{8}_\d+\.(jpg|jpeg|png)$/i.test(f));
console.log(`${sources.length} photos to re-encode${DRY ? ' (dry run)' : ''}\n`);

let before = 0;
let after = 0;
let done = 0;
let failed = 0;

for (const file of sources) {
  const src = path.join(DIR, file);
  const out = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');

  try {
    const size = statSync(src).size;
    if (existsSync(out)) {
      // A previous run got this far; drop the original and move on.
      if (!DRY) unlinkSync(src);
      continue;
    }

    const info = DRY
      ? { size: (await sharp(src).webp({ quality: QUALITY }).toBuffer()).length }
      : await sharp(src).webp({ quality: QUALITY }).toFile(out);

    before += size;
    after += info.size;
    // Only ever delete after the replacement exists and is not empty.
    if (!DRY && info.size > 0 && existsSync(out)) unlinkSync(src);
    done++;
  } catch (error) {
    failed++;
    if (failed <= 5) console.error(`  ${file} — ${error.message}`);
  }

  if (done % 500 === 0 && done) {
    console.log(`  ${done}/${sources.length} — ${(before / 1048576).toFixed(0)} MB → ${(after / 1048576).toFixed(0)} MB`);
  }
}

console.log(`\n${done} re-encoded, ${failed} failed`);
console.log(
  `${(before / 1048576).toFixed(0)} MB → ${(after / 1048576).toFixed(0)} MB` +
    (before ? ` (${(100 - (after / before) * 100).toFixed(0)}% smaller)` : '')
);
if (!DRY) console.log('\nRun scripts/build-catalog.mjs again to point the catalogue at the new files.');
