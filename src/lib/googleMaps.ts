/**
 * Utility for interacting with Google Maps Platform.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DriveTimeResult {
  durationSeconds: number;
  distanceMeters: number;
}

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

/**
 * Google is called from inside a live phone call — /api/agent/book runs while
 * someone is on the line waiting to be told a time. An unbounded fetch that
 * hangs there is worse than no drive time at all, and every caller here already
 * treats null as "fall back to the postcode proxy".
 */
const TIMEOUT_MS = 3000;

/** Distance Matrix caps a request at 25 origins; more comes back as an error. */
const MAX_ORIGINS = 25;

async function getJson(url: URL): Promise<any | null> {
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Maps request failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Geocode a Dutch postcode and city into coordinates.
 */
export async function geocodeAddress(postcode: string, city: string): Promise<Coordinates | null> {
  if (!API_KEY) {
    console.warn('Missing GOOGLE_MAPS_API_KEY, skipping geocode');
    return null;
  }

  const address = `${postcode} ${city}, Netherlands`;
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', API_KEY);

  const data = await getJson(url);
  if (data?.status === 'OK' && data.results?.length > 0) {
    const location = data.results[0].geometry.location;
    return { lat: location.lat, lng: location.lng };
  }
  return null;
}

/**
 * Get drive time from a single origin to a single destination.
 */
export async function getDriveTime(
  origin: Coordinates,
  destination: Coordinates
): Promise<DriveTimeResult | null> {
  if (!API_KEY) {
    console.warn('Missing GOOGLE_MAPS_API_KEY, skipping distance matrix');
    return null;
  }

  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  url.searchParams.set('origins', `${origin.lat},${origin.lng}`);
  url.searchParams.set('destinations', `${destination.lat},${destination.lng}`);
  url.searchParams.set('key', API_KEY);

  const data = await getJson(url);
  const element = data?.rows?.[0]?.elements?.[0];
  if (data?.status === 'OK' && element?.status === 'OK') {
    return { durationSeconds: element.duration.value, distanceMeters: element.distance.value };
  }
  return null;
}

/**
 * Get drive times from multiple origins to a single destination.
 * Returns an array of results matching the order of origins.
 */
export async function getDriveTimes(
  origins: Coordinates[],
  destination: Coordinates
): Promise<(DriveTimeResult | null)[]> {
  if (!API_KEY || origins.length === 0) {
    return origins.map(() => null);
  }

  /*
   * In chunks of 25. Sending more in one request returns
   * MAX_ELEMENTS_EXCEEDED, and the old code read that as "no drive times at
   * all" — so the whole scoring silently fell back to postcodes the moment the
   * platform had a 26th technician, which is exactly when it stops being
   * obvious.
   */
  const out: (DriveTimeResult | null)[] = [];

  for (let start = 0; start < origins.length; start += MAX_ORIGINS) {
    const chunk = origins.slice(start, start + MAX_ORIGINS);
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.set('origins', chunk.map((o) => `${o.lat},${o.lng}`).join('|'));
    url.searchParams.set('destinations', `${destination.lat},${destination.lng}`);
    url.searchParams.set('key', API_KEY);

    const data = await getJson(url);
    if (data?.status !== 'OK' || !Array.isArray(data.rows)) {
      out.push(...chunk.map(() => null));
      continue;
    }

    for (let i = 0; i < chunk.length; i++) {
      const element = data.rows[i]?.elements?.[0];
      out.push(
        element?.status === 'OK'
          ? { durationSeconds: element.duration.value, distanceMeters: element.distance.value }
          : null
      );
    }
  }

  return out;
}
