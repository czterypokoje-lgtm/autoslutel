/**
 * public/images/merken holds two kinds of image under the same naming scheme:
 * 42 real job photographs, and 83 social-media flyers — a small photo next to
 * a navy/orange panel with "Merk / Model / Vandaag in Almere / 06 11 75 12 31"
 * baked into the pixels. The flyers read as adverts in a gallery, their city
 * text often contradicts the filename, and they were being published in the
 * /galerij ImageGallery schema as photographs of completed jobs.
 *
 * Sorted by eye from a contact sheet on 2026-10-01. Every hash-named file and
 * every non-Utrecht city file is a flyer; five Utrecht-named files are too.
 * The files are left on disk (they are still the social posts) — this only
 * keeps them out of galleries and schema.
 */
const FLYER_NAME = /-[0-9a-f]{6}\.webp$|-(amsterdam|arnhem|den-haag|rotterdam|eindhoven)-\d+\.webp$/;

const FLYERS_NAMED_UTRECHT = new Set([
  'land-rover-autosleutel-bijmaken-utrecht-1.webp',
  'mazda-autosleutel-bijmaken-utrecht-2.webp',
  'mini-autosleutel-bijmaken-utrecht-1.webp',
  'renault-autosleutel-bijmaken-utrecht-3.webp',
  'skoda-autosleutel-bijmaken-utrecht-1.webp',
]);

/** True for a flyer in /images/merken. Only meaningful for that folder. */
export function isFlyer(fileOrSrc: string): boolean {
  const name = fileOrSrc.split('/').pop() ?? fileOrSrc;
  return FLYER_NAME.test(name) || FLYERS_NAMED_UTRECHT.has(name);
}
