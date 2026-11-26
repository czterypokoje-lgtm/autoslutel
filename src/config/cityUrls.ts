/*
 * Where a city page lives.
 *
 * Every competitor ranking for "autosleutel bijmaken <stad>" puts both words
 * in the URL -- autosleutelbijmaken.nl/autosleutel-bijmaken-utrecht,
 * mobiele-autosleutelmaker.nl/autosleutel-bijmaken-utrecht,
 * autosleuteloplocatie.nl/autosleutel-bijmaken/utrecht -- and 39 of the 68
 * competitor city pages in the Maps scrape sit at root depth. Ours is
 * /steden/utrecht, where the SERP breadcrumb reads "steden > utrecht" and
 * neither query word appears.
 *
 * Moving all 62 at once means one dip across every city at the same time, so
 * this is a pilot. The four below are the cities that already rank on page
 * one and earn next to nothing -- utrecht 8.1 on 493 impressions for three
 * clicks, amstelveen 8.9 on 165 for none, almere 6.9 on 117 for none,
 * amsterdam 9.7 on 330 for none. They are where a URL change can be measured
 * and where there is almost nothing to lose.
 *
 * The hyphen, not a nested /autosleutel-bijmaken/<stad> path: four of the six
 * pages outranking us for this query family use the hyphenated form at root
 * depth and only one nests it. Next cannot express `autosleutel-bijmaken-[stad]`
 * as a dynamic segment, so each pilot city is its own small route file. That is
 * fine for four and is the reason to keep the pilot small -- rolling this out
 * to all 75 means generating the folders, not adding a line here.
 *
 * Judge it on those four in Search Console after three to four weeks. If the
 * click-through rate moves, empty this set into every slug; if it does not,
 * delete the set and the redirect and nothing else has to be undone.
 */
export const CITY_URL_PILOT: ReadonlySet<string> = new Set([
  'utrecht',
  'amsterdam',
  'amstelveen',
  'almere',
]);

/** The canonical path for a city page. The single source for links, canonicals, schema and the sitemap. */
export const cityPath = (slug: string): string =>
  CITY_URL_PILOT.has(slug) ? `/autosleutel-bijmaken-${slug}` : `/steden/${slug}`;

export const isPilotCity = (slug: string) => CITY_URL_PILOT.has(slug);
