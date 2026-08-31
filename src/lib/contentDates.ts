/**
 * Real per-URL modification dates for the sitemap.
 *
 * `sitemap.ts` used to stamp `new Date()` on all 851 URLs, so every build told
 * Google that the entire site had just changed. A lastmod that moves for every
 * page on every deploy carries no information, and Google learns to ignore it —
 * including on the pages you genuinely did update.
 *
 * Dates are recorded per content group and only bumped when that group's
 * content actually changes. Keep them in the past; a future date is ignored.
 */

/** Bump when the shared page templates change in a way that alters the content. */
export const TEMPLATE_REVISED = '2026-08-31';

/** Per-section content revisions. Update the date when you edit that section. */
export const SECTION_REVISED: Record<string, string> = {
  home: '2026-08-31',
  diensten: '2026-08-31',
  steden: '2026-08-31',
  merken: '2026-08-26',
  blog: '2026-08-26',
  prijzen: '2026-08-26',
  kennisbank: '2026-08-26',
  legal: '2026-08-31', // privacybeleid, cookiebeleid
  static: '2026-08-20', // over-ons, galerij, beoordelingen, contact, faq
};

/**
 * Individual overrides, for pages edited on their own. A slug listed here wins
 * over its section date.
 */
export const PAGE_REVISED: Record<string, string> = {
  '/cookiebeleid': '2026-08-31',
  '/privacybeleid': '2026-08-31',
  '/steden/rotterdam': '2026-08-31',
  '/contact': '2026-08-31',
};

/** Resolves the lastmod for a path, falling back to its section then the template date. */
export function lastModifiedFor(path: string, section: keyof typeof SECTION_REVISED | string): Date {
  const iso =
    PAGE_REVISED[path] ??
    SECTION_REVISED[section] ??
    TEMPLATE_REVISED;
  return new Date(`${iso}T00:00:00.000Z`);
}
