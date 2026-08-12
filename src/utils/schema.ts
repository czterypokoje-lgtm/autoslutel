import { SITE_CONFIG } from '@/config/site.config';
import { CITIES } from '@/config/cities';

/**
 * Returns a standardized Locksmith (LocalBusiness) schema object.
 * This guarantees consistent NAP data (Utrecht) and a full areaServed list
 * across all pages (City, Service, and Brand pages).
 */
export function getBaseLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Locksmith',
    name: SITE_CONFIG.fullName,
    url: SITE_CONFIG.domain,
    telephone: SITE_CONFIG.phoneTel,
    image: `${SITE_CONFIG.domain}/og-image.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.city,
      postalCode: SITE_CONFIG.address.postal,
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
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: parseFloat(SITE_CONFIG.rating),
      reviewCount: parseInt(SITE_CONFIG.reviewCount, 10),
      bestRating: 5,
    },
  };
}
