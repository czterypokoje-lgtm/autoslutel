import { SITE_CONFIG, isBtwConfigured } from '@/config/site.config';
import { BIZ_ID, serviceRegionNodes } from '@/utils/schema';
import { MY_MAPS_VIEWER_URL } from '@/config/myMaps';

export default function LocalBusinessSchema() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    /*
     * No 'Locksmith' (25 Oct 2026). Google does not allow locksmith ads in the
     * Netherlands, the Business Profile's category is "Key duplication
     * service", and the ads that run are car-key ads. The site should describe
     * the same business the profile and the ads do.
     */
    '@type': ['LocalBusiness', 'AutomotiveBusiness'],
    '@id': BIZ_ID,
    name: SITE_CONFIG.name,
    alternateName: 'Autosleutel24',
    description: 'Professionele mobiele autosleutelspecialist voor alle merken en modellen. Autosleutel bijmaken, transponder programmeren, smart key bijmaken en auto openen. Binnen 30-60 min ter plaatse in Utrecht, Noord-Holland, Zuid-Holland, Gelderland en Flevoland, 24/7.',
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
      areaServed: 'NL',
      availableLanguage: ['nl', 'en'],
    },
    // The service-area map the site embeds, not a pin on the head office.
    hasMap: MY_MAPS_VIEWER_URL,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    /*
     * Kept in sync with the real Google Business Profile service area, plus
     * a handful of extra cities the office serves but hasn't added to GBP
     * yet (Houten, Maarssen, Leusden, IJsselstein, Vianen, Woerden, Alphen
     * aan den Rijn) — those stay rather than understating real coverage;
     * the office is adding them to GBP separately.
     */
    areaServed: [
      // The provinces first: one statement of where the business works, shared with every Service node.
      ...serviceRegionNodes(),
      { '@type': 'City', 'name': 'Utrecht', 'sameAs': 'https://en.wikipedia.org/wiki/Utrecht' },
      { '@type': 'City', 'name': 'Amsterdam', 'sameAs': 'https://en.wikipedia.org/wiki/Amsterdam' },
      { '@type': 'City', 'name': 'Almere' },
      { '@type': 'City', 'name': 'Amersfoort' },
      { '@type': 'City', 'name': 'Hilversum' },
      { '@type': 'City', 'name': 'Nieuwegein' },
      { '@type': 'City', 'name': 'Houten' },
      { '@type': 'City', 'name': 'Zeist' },
      { '@type': 'City', 'name': 'Maarssen' },
      { '@type': 'City', 'name': 'Amstelveen' },
      { '@type': 'City', 'name': 'Diemen' },
      { '@type': 'City', 'name': 'Naarden' },
      { '@type': 'City', 'name': 'Weesp' },
      { '@type': 'City', 'name': 'Leusden' },
      { '@type': 'City', 'name': 'Baarn' },
      { '@type': 'City', 'name': 'Soest' },
      { '@type': 'City', 'name': 'IJsselstein' },
      { '@type': 'City', 'name': 'Vianen' },
      { '@type': 'City', 'name': 'Woerden' },
      { '@type': 'City', 'name': 'Alphen aan den Rijn' },
      { '@type': 'City', 'name': 'Bussum' },
      { '@type': 'City', 'name': 'Huizen' },
      { '@type': 'City', 'name': 'Zeewolde' },
      { '@type': 'City', 'name': 'Bilthoven' },
      { '@type': 'City', 'name': 'Amsterdam-Zuid' },
      { '@type': 'City', 'name': 'Alkmaar' },
      // Gelderland, matching the Business Profile service area.
      { '@type': 'City', 'name': 'Arnhem', 'sameAs': 'https://en.wikipedia.org/wiki/Arnhem' },
      { '@type': 'City', 'name': 'Apeldoorn', 'sameAs': 'https://en.wikipedia.org/wiki/Apeldoorn' },
      // Den Haag and its region are back (25 Oct 2026): the owner gets good jobs
      // there and re-enabled it in Ads. Rotterdam stays out -- too far to drive.
      { '@type': 'City', 'name': 'Den Haag', 'sameAs': 'https://en.wikipedia.org/wiki/The_Hague' },
      { '@type': 'City', 'name': 'Zoetermeer' },
      { '@type': 'City', 'name': 'Delft' },
      { '@type': 'City', 'name': 'Rijswijk' },
    ],
    priceRange: '€€',
    paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer', 'iDEAL', 'Pin'],
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
    ...(isBtwConfigured() && { vatID: SITE_CONFIG.btw }),
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
