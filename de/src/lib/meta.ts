/**
 * Meta description helper.
 *
 * Google renders roughly 155–160 characters on desktop and less on mobile.
 * 162 of 308 pages were running past that, up to 249 characters, and the part
 * being cut was almost always the call to action at the end.
 *
 * `clampMeta` is a safety net: it trims at a word boundary so a template that
 * grows later can never ship a mid-word truncation. Templates should still be
 * written short and benefit-first — for this category that means the price and
 * the arrival time, not the brand name.
 */

export const META_DESC_MAX = 155;

export function clampMeta(text: string, max: number = META_DESC_MAX): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  // Fall back to a hard cut only if there is no space at all in range.
  const trimmed = (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();

  // Do not leave dangling punctuation before the ellipsis.
  return `${trimmed.replace(/[,;:\-–—.]$/, '')}…`;
}
