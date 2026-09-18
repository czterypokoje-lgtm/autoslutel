import { SITE_CONFIG } from '@/config/site.config';

export default function LocalBusinessSchema() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'AutomotiveBusiness', 'Locksmith'],
    '@id': `${SITE_CONFIG.domain}/#localbusiness`,
    name: SITE_CONFIG.name,
    alternateName: 'Autosleutel24',
    description: 'Professionele mobiele autosleutelspecialist voor alle merken en modellen. Autosleutel bijmaken, transponder programmeren, smart key bijmaken en auto openen. Werkzaam in Midden-Nederland en de Randstad.',
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
      addressLocality: SITE_CONFIG.address.city,
      addressRegion: SITE_CONFIG.address.region,
      ...(SITE_CONFIG.address.postal ? { postalCode: SITE_CONFIG.address.postal } : {}),
      addressCountry: SITE_CONFIG.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: parseFloat(SITE_CONFIG.geo.lat),
      longitude: parseFloat(SITE_CONFIG.geo.lng),
    },
    hasMap: `https://maps.google.com/?q=${SITE_CONFIG.geo.lat},${SITE_CONFIG.geo.lng}`,
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
      { '@type': 'City', 'name': 'Den Haag', 'sameAs': 'https://en.wikipedia.org/wiki/The_Hague' },
      { '@type': 'City', 'name': 'Amsterdam-Zuid' },
      // Real technician coverage, not just the Bussum-radius reach: the
      // office confirmed staff actually stationed in these two on top of
      // Den Haag and Amsterdam above.
      { '@type': 'City', 'name': 'Rotterdam', 'sameAs': 'https://en.wikipedia.org/wiki/Rotterdam' },
      { '@type': 'City', 'name': 'Alkmaar' },
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
