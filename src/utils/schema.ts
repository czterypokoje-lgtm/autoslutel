import { SITE_CONFIG } from '@/config/site.config';
import { CITIES } from '@/config/cities';

/**
 * Returns a standardized Locksmith (LocalBusiness) schema object.
 * This guarantees consistent NAP data and a full areaServed list
 * across all pages (City, Service, and Brand pages).
 *
 * Callers that override `geo` must override `address` with it: a page that
 * pairs one city's coordinates with another city's addressLocality describes
 * a business in two places at once. The city pages did exactly that — every
 * one of them shipped its own geo beside "Bussum" — until the partner lookup
 * gave them a real locality to name.
 *
 * Deliberately carries NO aggregateRating. This schema is embedded on ~800
 * city/brand/model/service pages, where a rating would assert a per-page or
 * per-city score that does not exist. The single aggregateRating for the
 * business lives in LocalBusinessSchema on the homepage, and must always
 * match the live Google Business Profile.
 */
export function getBaseLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Locksmith',
    name: SITE_CONFIG.fullName,
    url: SITE_CONFIG.domain,
    telephone: SITE_CONFIG.phoneTel,
    image: `${SITE_CONFIG.domain}/og-image.png`,
    /* streetAddress and postalCode are omitted when empty rather than shipped
       as "". SITE_CONFIG.address has no street or postal code — this is a
       mobile business with no walk-in counter — and an empty string is a
       claim that the field exists and is blank, which is worse than silence.
       LocalBusinessSchema.tsx has always guarded these; this builder did not,
       so every city, brand and service page carried two empty fields.

       addressLocality is omitted for the same reason, by instruction: there
       is no counter in Bussum or anywhere else, and naming a town as the
       address of a business that drives to the customer says something that
       is not true of it. areaServed is what states where the work happens. */
    address: {
      '@type': 'PostalAddress',
      ...(SITE_CONFIG.address.street ? { streetAddress: SITE_CONFIG.address.street } : {}),
      ...(SITE_CONFIG.address.postal ? { postalCode: SITE_CONFIG.address.postal } : {}),
      addressRegion: SITE_CONFIG.address.region,
      addressCountry: SITE_CONFIG.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE_CONFIG.geo.lat,
      longitude: SITE_CONFIG.geo.lng,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    areaServed: CITIES.map((c) => ({
      '@type': 'City',
      name: c.city,
    })),
  };
}

