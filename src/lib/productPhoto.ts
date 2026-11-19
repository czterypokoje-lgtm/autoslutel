import 'server-only';
import watermarkFlags from '../data/watermark-flags.json';

/**
 * A product photo we are allowed to show.
 *
 * Many of the catalogue images are A-Key's own product shots and carry their
 * logo. scripts/flag-watermarked-photos.mjs checked 3868 of them pixel by
 * pixel — hue in HSV, because the mark blended onto dark plastic reads as a
 * desaturated blue-grey rather than green and plain RGB missed it entirely —
 * and wrote the result to src/data/watermark-flags.json in September. Nothing
 * had read that file since.
 *
 * Measured against the current catalogue: 330 images carry the mark, across
 * 283 products, and not one of those products has a clean photo elsewhere in
 * its gallery. So this does not swap to a better shot — there isn't one. It
 * returns null and the screen shows its "geen foto" placeholder, which is
 * honest: we have no picture of that part we may use.
 *
 * An image with no flag is treated as clean. 1291 of them were never checked
 * because they did not come from A-Key, and hiding those would blank a
 * thousand photos to solve a problem they do not have.
 */

const flags = watermarkFlags as Record<string, boolean>;

/** The flag file is keyed on the bare filename, in whatever extension it had. */
const basename = (url: string): string => url.split('/').pop() ?? url;

export function isWatermarked(url: string | null | undefined): boolean {
  if (!url) return false;
  return flags[basename(url)] === true;
}

export interface PhotoSource {
  image?: string | null;
  images?: string[] | null;
}

/**
 * The first showable photo, or null when every one of them is marked.
 *
 * Prefers the product's own main image so the catalogue keeps looking like
 * itself; falls through the gallery only when that one is marked.
 */
export function cleanPhoto(product: PhotoSource): string | null {
  if (product.image && !isWatermarked(product.image)) return product.image;
  for (const image of product.images ?? []) {
    if (image && !isWatermarked(image)) return image;
  }
  return null;
}
