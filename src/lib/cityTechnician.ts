/*
 * Which technician does a city page show?
 *
 * Until this existed, the answer was "Berkan, always" — hardcoded into
 * src/app/steden/[citySlug]/page.tsx and rendered on all 62 city pages,
 * including Maastricht, which is about 210 km from the Bussum base. The
 * photo, the name and the "binnen 30-60 min" promise were the same on every
 * one of them. That is a lie to a Maastricht customer before it is an SEO
 * problem, and it is the single reason the city pages read as 62 copies of
 * one page.
 *
 * The data to answer it properly was already here, split across two halves
 * that never touched: technicians.werkgebied holds Dutch postcode ranges and
 * coversPostcode() matches them, while the public city list had no postcode
 * at all. City.postcode (src/config/cities.ts) closed that gap; this file
 * uses it.
 */
import { coversPostcode } from './crmJobs.ts';

/**
 * What a city page needs to name a technician. Structural rather than the
 * full `technicians` row: this runs at build time in a public page, and the
 * less of that table it knows about the less can leak into rendered HTML.
 */
export interface PublicTechnician {
  id: string;
  name: string;
  active: boolean;
  werkgebied: string[] | null;
  base_lat: number | null;
  base_lng: number | null;
  base_city: string | null;
  photo_url: string | null;
  certifications: string[] | null;
  gbp_url: string | null;
}

/*
 * ── Calibration knobs ────────────────────────────────────────────────────
 *
 * A straight line between two points is not a drive. These three numbers
 * turn one into an estimate of the other, and all three are wrong in a way
 * that only real job data can correct — a van in Amsterdam at 17:00 and a
 * van on the A2 at 03:00 do not average the same speed.
 *
 * They are named and exported precisely so they can be tuned against
 * jobs.completed_at once there is enough of it, rather than being buried as
 * magic numbers in an expression. Google Distance Matrix (src/lib/googleMaps)
 * already gives real drive times for live dispatch; it is not used here
 * because city pages are statically generated and 62 build-time API calls to
 * price a marketing sentence is not a trade worth making.
 */
export const ROAD_FACTOR = 1.35;
export const AVG_SPEED_KMH = 65;
export const DISPATCH_OVERHEAD_MIN = 10;

/** Great-circle distance in km. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (d: number) => d * (Math.PI / 180);
  const R = 6371;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface CityMatch {
  technician: PublicTechnician;
  /** Straight-line km from the technician's base to the city. Null when the technician has no base coordinates. */
  distanceKm: number | null;
  /**
   * True when this technician's werkgebied actually covers the city's
   * postcode. False means nobody covers it and this is the nearest body —
   * the page must not imply otherwise.
   */
  covered: boolean;
}

/**
 * The technician to show for a city.
 *
 * Prefers someone whose werkgebied covers the city's postcode, nearest first.
 * Falls back to the geographically nearest active technician — chosen
 * deliberately over "the first in the list", which is how a Limburg page ends
 * up showing someone in Bussum.
 *
 * Returns null only when there are no active technicians at all.
 */
export function findCityTechnician(
  city: { postcode: string; geo: { lat: string; lng: string } },
  technicians: PublicTechnician[],
): CityMatch | null {
  /*
   * Publishable means placeable: this person either declares a werkgebied we
   * can test against a postcode, or has a base we can measure a distance
   * from. Someone with neither cannot be claimed to serve anywhere.
   *
   * This guard is not theoretical. At the time it was written the CRM held 66
   * active technicians, 56 of them named "[TEST] …" (34 of those German
   * DE-* rows), and not one had a werkgebied or a base coordinate. Without
   * this filter every candidate tied at unknown distance and the sort simply
   * returned the first row — putting "[TEST] NL-01" on all 62 city pages, with
   * a German test row one ordering away from the same fate.
   *
   * Incomplete data must produce no claim, never an arbitrary one.
   */
  const active = technicians.filter(
    (t) => t.active && ((t.werkgebied ?? []).length > 0 || (t.base_lat !== null && t.base_lng !== null)),
  );
  if (active.length === 0) return null;

  const cityLat = parseFloat(city.geo.lat);
  const cityLng = parseFloat(city.geo.lng);

  const withDistance = active.map((technician) => ({
    technician,
    distanceKm:
      technician.base_lat !== null && technician.base_lng !== null
        ? haversineKm(cityLat, cityLng, Number(technician.base_lat), Number(technician.base_lng))
        : null,
    covered: (technician.werkgebied ?? []).some((range) => coversPostcode(range, city.postcode)),
  }));

  /* A technician with no base coordinates sorts last: unknown distance is not
     the same as short, and picking one would put an unplaceable name on the
     page ahead of someone we can actually locate. */
  const nearestFirst = (a: CityMatch, b: CityMatch) =>
    (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);

  const covering = withDistance.filter((m) => m.covered).sort(nearestFirst);
  if (covering.length > 0) return covering[0];

  return withDistance.sort(nearestFirst)[0];
}

/**
 * An arrival window we can stand behind, as a Dutch string ("35-50 min").
 *
 * Deliberately a range and deliberately rounded to five minutes: a single
 * number reads as a promise, and this is an estimate built from a straight
 * line. Returns null when the distance is unknown — the caller should then
 * say nothing about timing rather than fall back to a comfortable default,
 * which is exactly how "binnen 30-60 min" ended up on the Maastricht page.
 */
export function arrivalWindow(distanceKm: number | null): string | null {
  if (distanceKm === null || !Number.isFinite(distanceKm)) return null;

  const minutes = (distanceKm * ROAD_FACTOR) / AVG_SPEED_KMH * 60 + DISPATCH_OVERHEAD_MIN;
  const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

  const low = round5(minutes);
  const high = round5(minutes * 1.4);
  return high > low ? `${low}-${high} min` : `${low} min`;
}
