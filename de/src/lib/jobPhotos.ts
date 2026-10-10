/**
 * On the Dutch site public/images/merken held two kinds of image under one
 * naming scheme: real job photographs, and social-media flyers with "Merk /
 * Model / Vandaag in Almere / 06 11 75 12 31" baked into the pixels. The
 * flyers read as adverts in a gallery and were being published in the
 * /galerie ImageGallery schema as photographs of completed jobs, so they were
 * filtered out by name.
 *
 * Only the 49 photographs were copied into this German app — the flyers carry
 * a Dutch phone number and Dutch city text in the pixels, which is exactly
 * what must not appear here. So nothing in public/images/marken is a flyer.
 *
 * The function stays because the gallery and the service pages call it, and
 * because the moment someone drops a German social flyer into that folder the
 * filter is the thing that keeps it out of the gallery schema. Add its name
 * here when that happens.
 */
const FLYER_NAMES = new Set<string>([]);

/** True for a flyer in /images/marken. Only meaningful for that folder. */
export function isFlyer(fileOrSrc: string): boolean {
  const name = fileOrSrc.split('/').pop() ?? fileOrSrc;
  return FLYER_NAMES.has(name);
}
