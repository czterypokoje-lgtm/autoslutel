/*
 * Auf dieser Seite gibt es nichts auszuschließen, und das ist Absicht.
 *
 * Die niederländische Fassung dieser Datei hält neun Städte und drei Marken auf
 * noindex, weil sie ausgeliefert wurden, bevor klar war, dass niemand dorthin
 * fährt. Hier entsteht das Problem nicht: CITIES enthält nur Städte mit einem
 * Partner, also gibt es keine Seite, die herausgenommen werden müsste.
 *
 * Die Dateien bleiben mit denselben Namen bestehen, damit der Code, der sie
 * liest (Sitemap, Stadtseite), unverändert bleibt.
 */

export const NOINDEX_CITY_SLUGS: ReadonlySet<string> = new Set([]);
export const NOINDEX_BRAND_SLUGS: ReadonlySet<string> = new Set([]);

export const isNoindexCity = (slug: string) => NOINDEX_CITY_SLUGS.has(slug);
export const isNoindexBrand = (nameSlug: string) =>
  NOINDEX_BRAND_SLUGS.has(nameSlug.toLowerCase());
