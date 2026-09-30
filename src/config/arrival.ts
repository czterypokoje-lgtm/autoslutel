/*
 * The arrival promise, in one place.
 *
 * "30-60 min ter plaatse" is the line that converted best for the kwijt and
 * open-the-door searches, where a person standing next to a car wants to know
 * how long. It goes back in the titles, headings and descriptions of those
 * pages and of the homepage.
 *
 * It is NOT printed for every town. The earlier generation of this copy
 * promised 30-60 minutes on all 62 cities, including Maastricht at about 210 km
 * from the Bussum base, and that was removed for being false. City titles and
 * descriptions therefore use it only for the towns in ARRIVAL_CITY_SLUGS, which
 * sit inside roughly 45 km of Bussum or Utrecht. The other city pages keep the
 * price and show the real arrival window worked out per technician in the hero.
 * Add a slug here only when a van can honestly be there in an hour.
 */
export const ARRIVAL = '30-60 min';
export const ARRIVAL_TITLE = '30-60 Min Ter Plaatse';

export const ARRIVAL_CITY_SLUGS: ReadonlySet<string> = new Set([
  'bussum', 'hilversum', 'naarden', 'gooise-meren', 'huizen', 'baarn', 'soest',
  'amersfoort', 'leusden', 'utrecht', 'zeist', 'houten', 'bunnik', 'de-bilt',
  'maarssen', 'nieuwegein', 'ijsselstein', 'vianen', 'breukelen', 'abcoude',
  'vinkeveen', 'mijdrecht', 'woerden', 'almere', 'amsterdam', 'amstelveen', 'diemen',
]);
