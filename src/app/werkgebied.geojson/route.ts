import { CITIES } from '@/config/cities';
import { SERVICE_REGIONS } from '@/config/regions';
import { isNoindexCity } from '@/config/thinPages';
import { SITE_CONFIG } from '@/config/site.config';
import { ARRIVAL } from '@/config/arrival';

/*
 * The service area as GeoJSON: one Point per town, with its province, its page and
 * the arrival promise. It is the same list the map, the province pages and the sitemap
 * are built from, in the one format mapping tools, GIS software and AI crawlers read
 * without scraping a page. /llms.txt and /steden point to it.
 *
 * Coordinates are [longitude, latitude], as GeoJSON requires.
 */
export const dynamic = 'force-static';

export function GET() {
  const served = new Set(SERVICE_REGIONS.map((r) => r.name));
  const features = CITIES.filter((c) => served.has(c.region) && !isNoindexCity(c.slug)).map((c) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [parseFloat(c.geo.lng), parseFloat(c.geo.lat)] },
    properties: {
      name: c.city,
      province: c.region,
      url: `${SITE_CONFIG.domain}/steden/${c.slug}`,
      service: 'Autosleutel bijmaken, autosleutel kwijt, auto openen',
      arrival: `Binnen ${ARRIVAL} ter plaatse`,
      provider: SITE_CONFIG.fullName,
      telephone: SITE_CONFIG.phoneTel,
    },
  }));

  return new Response(
    JSON.stringify(
      {
        type: 'FeatureCollection',
        name: `Werkgebied ${SITE_CONFIG.fullName}`,
        features,
      },
      null,
      2
    ),
    { headers: { 'Content-Type': 'application/geo+json; charset=utf-8' } }
  );
}
