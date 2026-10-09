import { SITE_CONFIG } from '@/config/site.config';
import { BIZ_ID, serviceRegionNodes } from '@/utils/schema';

export default function LocalBusinessSchema() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'AutomotiveBusiness', 'Locksmith'],
    '@id': BIZ_ID,
    name: SITE_CONFIG.name,
    alternateName: 'Autosleutel24',
    description: SITE_CONFIG.schemaDescription,
    url: SITE_CONFIG.domain,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.domain}/images/logo/autosleutel24-logo-slotenmaker-utrecht.webp`,
      width: 1024,
      height: 304,
    },
    image: `${SITE_CONFIG.domain}/og-image.png`,
    telephone: SITE_CONFIG.phoneTel,
    email: SITE_CONFIG.email,
    address: {
      '@type': 'PostalAddress',
      ...(SITE_CONFIG.address.street ? { streetAddress: SITE_CONFIG.address.street } : {}),
      addressRegion: SITE_CONFIG.address.region,
      ...(SITE_CONFIG.address.postal ? { postalCode: SITE_CONFIG.address.postal } : {}),
      addressCountry: SITE_CONFIG.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: parseFloat(SITE_CONFIG.geo.lat),
      longitude: parseFloat(SITE_CONFIG.geo.lng),
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SITE_CONFIG.phoneTel,
      contactType: 'customer service',
      areaServed: SITE_CONFIG.country,
      availableLanguage: SITE_CONFIG.availableLanguage,
    },
    // The service-area map the site embeds, not a pin on the head office.
    // Omitted entirely on a site that has no map of its own rather than
    // pointing a German visitor at a map of the Dutch service area.
    ...(SITE_CONFIG.serviceAreaMapUrl ? { hasMap: SITE_CONFIG.serviceAreaMapUrl } : {}),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    /*
     * The regions first: one statement of where the business works, shared
     * with every Service node. Then the cities.
     *
     * A name can appear in both lists, and that is deliberate rather than a
     * duplicate to clean up. Utrecht is a province and a city, Berlin and
     * Hamburg are a Bundesland and a city, and "we serve the province of
     * Utrecht" is a different claim from "we serve the city of Utrecht" —
     * collapsing them would quietly drop the larger one. The @type tells them
     * apart, which is what it is for.
     */
    areaServed: [
      ...serviceRegionNodes(),
      ...SITE_CONFIG.areaServedCities.map((c) => ({
        '@type': 'City',
        name: c.name,
        ...(c.sameAs ? { sameAs: c.sameAs } : {}),
      })),
    ],
    priceRange: '€€',
    paymentAccepted: SITE_CONFIG.paymentAccepted,
    currenciesAccepted: 'EUR',
    /*
     * No aggregateRating.
     *
     * The reviews are real, but they live on our Google Business Profile, not
     * on this page. Google calls that self-serving — a business rating itself
     * on its own site — and states plainly that pages using LocalBusiness or
     * Organization markup are "ineligible for the star review feature". So
     * these stars were never being shown; the markup only asserted something
     * Google's own guidance says not to assert, on a domain that can do
     * without the attention.
     *
     * The 5.0 in Google Maps and the local pack comes from the Business
     * Profile itself and is untouched by this.
     */
    sameAs: [
      SITE_CONFIG.social.facebook,
      SITE_CONFIG.social.instagram,
      SITE_CONFIG.social.google,
      `https://www.kvk.nl/zoeken/?source=all&q=${SITE_CONFIG.kvk}`,
    ],
    foundingDate: '2020',
    vatID: SITE_CONFIG.btw,
    legalName: SITE_CONFIG.fullName,
    identifier: {
      '@type': 'PropertyValue',
      name: 'KVK',
      value: SITE_CONFIG.kvk,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
    />
  );
}
