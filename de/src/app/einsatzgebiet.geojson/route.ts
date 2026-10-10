import { CITIES } from '@/config/cities';
import { SERVICE_REGIONS } from '@/config/regions';
import { isNoindexCity } from '@/config/thinPages';
import { SITE_CONFIG } from '@/config/site.config';
import { ARRIVAL } from '@/config/arrival';

/*
 * Das Einsatzgebiet als GeoJSON: ein Point je Stadt, mit Region, Seite und
 * Anbieter. Dieselbe Liste, aus der die Karte, die Regionsseiten und die
 * Sitemap gebaut werden — in dem einen Format, das Kartenwerkzeuge,
 * GIS-Software und KI-Crawler lesen, ohne eine Seite zu scrapen. /llms.txt und
 * /staedte verweisen darauf.
 *
 * Die Adresse hieß /werkgebied.geojson. Das ist niederländisch und stand als
 * URL in der Sitemap, im alternates-Block der Städteseite und in /llms.txt —
 * also an drei Stellen, die Maschinen lesen. Umbenannt, weil eine URL Teil des
 * Inhalts ist.
 *
 * Koordinaten sind [Längengrad, Breitengrad], wie GeoJSON es verlangt.
 */
export const dynamic = 'force-static';

export function GET() {
  const served = new Set(SERVICE_REGIONS.map((r) => r.name));
  const features = CITIES.filter((c) => served.has(c.region) && !isNoindexCity(c.slug)).map((c) => ({
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [parseFloat(c.geo.lng), parseFloat(c.geo.lat)] },
    properties: {
      name: c.city,
      region: c.region,
      url: `${SITE_CONFIG.domain}/staedte/${c.slug}`,
      service: 'Autoschlüssel nachmachen, Autoschlüssel verloren, Auto öffnen',
      /* Kein Minutenversprechen — siehe config/arrival.ts. */
      arrival: ARRIVAL,
      provider: SITE_CONFIG.fullName,
      telephone: SITE_CONFIG.phoneTel,
    },
  }));

  return new Response(
    JSON.stringify(
      {
        type: 'FeatureCollection',
        name: `Einsatzgebiet ${SITE_CONFIG.fullName}`,
        features,
      },
      null,
      2
    ),
    { headers: { 'Content-Type': 'application/geo+json; charset=utf-8' } }
  );
}
