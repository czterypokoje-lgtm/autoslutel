/*
 * Pages that should stay reachable but not compete for index space.
 *
 * Search Console, 13 Jul - 30 Sep 2026, and the sitemap crawl of 30 Sep:
 *
 *  - The nine cities below lie beyond the 75 km serving radius in
 *    SITE_CONFIG (Breda, Dordrecht, Eindhoven, Helmond, Roermond, Venlo,
 *    Sittard-Geleen, Heerlen, Maastricht) and none of them earned a single
 *    impression. A page for a town the van does not drive to is the textbook
 *    doorway page, and it dilutes the cities that do earn clicks.
 *  - The five districts are near-copies of their parent city page and drew no
 *    impressions of their own. Amsterdam Noord is NOT here: it answers a real
 *    query ("autosleutel bijmaken amsterdam noord", 175 impressions, pos 12.6).
 *  - Brands: the twelve the brand audit marked "Cut" (Oldsmobile, Buick, Cadillac, Chrysler, Cobra,
 *    Ferrari, GMC, Holden, Lada, Lincoln, McLaren, Proton) were deleted and redirect to /merken. The
 *    fourteen marked "Hold 60 days" (Infiniti, Isuzu, Chery, Dacia, Daewoo, DAF, Dodge, Iveco,
 *    Jaguar, Lancia, Saab, SsangYong, Subaru, Suzuki) stay indexed so the hold can be judged on
 *    real impressions. Only the three left below are noindex.
 *
 * `noindex, follow` rather than a redirect or a deletion: visitors and internal
 * links keep working, the dispatch and CRM code that reads CITIES and BRANDS is
 * untouched, and reversing the decision later is deleting one line here.
 * They also leave the sitemap, which should list only pages worth indexing.
 */

export const NOINDEX_CITY_SLUGS: ReadonlySet<string> = new Set([
  // beyond the serving radius
  // Noord-Brabant and Limburg are outside the provinces served (Zuid-Holland, Utrecht, Noord-Holland,
  // Gelderland, Flevoland). Dordrecht is Zuid-Holland and is indexed.
  'breda', 'eindhoven', 'helmond', 'roermond',
  'venlo', 'sittard-geleen', 'heerlen', 'maastricht',
  // districts that duplicate their parent city
  'utrecht-centrum', 'utrecht-zuid', 'amsterdam-centrum', 'amsterdam-zuid', 'amsterdam-oost',
]);

export const NOINDEX_BRAND_SLUGS: ReadonlySet<string> = new Set([
  // Not in the brand audit's cut or hold lists, and no impressions: stays out of the index for now.
  'daihatsu', 'rolls-royce', 'bentley',
]);

export const isNoindexCity = (slug: string) => NOINDEX_CITY_SLUGS.has(slug);
export const isNoindexBrand = (nameSlug: string) => NOINDEX_BRAND_SLUGS.has(nameSlug.toLowerCase());
