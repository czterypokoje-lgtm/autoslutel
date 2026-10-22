/**
 * A phone photo straight off the camera is routinely 3–12MB, and nothing in
 * this app ever shows one larger than a modest thumbnail or gallery image.
 * Shrinking and re-encoding it in the browser before a single byte leaves the
 * device — often over a van's weak 4G — is the difference between a couple
 * of seconds and a stalled upload. WebP over JPEG at the same visual quality
 * runs meaningfully smaller, which is most of the point.
 *
 * HEIC (the default on iPhone) gets re-encoded along the way for free, which
 * every browser can then actually display — `createImageBitmap` decodes it,
 * `canvas.toBlob` never has to.
 *
 * Best-effort: if the browser can't decode this particular file client-side,
 * the original upload still goes through unchanged.
 */
export async function toWebp(file: File, maxDimension = 1600, quality = 0.82): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob) return file;

  return new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' });
}

/**
 * The same conversion, but repeated until the result fits in `budget` bytes.
 *
 * One pass at 1600px is enough for an ordinary phone photo and is all that
 * toWebp promises. It is not enough for a 48-megapixel one, and the file that
 * comes back from a single pass can still be over the upload limit — at which
 * point the upload fails at Vercel's body limit, before any handler of ours
 * can say why. Rather than letting that happen, step the image down until it
 * fits.
 *
 * Returns whatever it managed, even if that is still too large — including the
 * untouched original when the browser could not decode the file at all, which
 * is the normal case for HEIC outside Safari. The caller checks the size and
 * is the one that tells the customer; this function's job is to try.
 */
export async function shrinkToFit(file: File, budget: number): Promise<File> {
  if (file.size <= budget) {
    const converted = await toWebp(file).catch(() => file);
    if (converted.size <= budget) return converted;
    file = converted;
  }

  /* Each step is a real reduction rather than a nudge: a pass that saves ten
     percent costs a decode and an encode on a phone and still does not fit. */
  const steps: Array<[number, number]> = [
    [1600, 0.82],
    [1280, 0.75],
    [1024, 0.7],
    [800, 0.65],
  ];

  let best = file;
  for (const [dimension, quality] of steps) {
    const attempt = await toWebp(file, dimension, quality).catch(() => null);
    // Undecodable (HEIC on most browsers): no later step will fare better.
    if (!attempt || attempt === file) break;
    if (attempt.size < best.size) best = attempt;
    if (attempt.size <= budget) return attempt;
  }

  return best;
}
