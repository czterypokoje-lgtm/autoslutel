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
