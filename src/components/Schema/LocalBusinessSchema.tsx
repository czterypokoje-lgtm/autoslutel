import { SITE_CONFIG } from '@/config/site.config';

export default function LocalBusinessSchema() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'AutomotiveBusiness', 'Locksmith'],
    '@id': `${SITE_CONFIG.domain}/#localbusiness`,
    name: SITE_CONFIG.name,
    alternateName: 'Autosleutel24',
    description: 'Professionele mobiele autosleutelspecialist voor alle merken en modellen. Autosleutel bijmaken, transponder programmeren, smart key bijmaken en auto openen. Werkzaam in Utrecht, Amsterdam, Almere, Amersfoort en heel Nederland.',
    url: SITE_CONFIG.domain,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.domain}/images/logo/autosleutel24-logo-slotenmaker-utrecht.png`,
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
    areaServed: [
      { '@type': 'City', 'name': 'Utrecht', 'sameAs': 'https://en.wikipedia.org/wiki/Utrecht' },
      { '@type': 'City', 'name': 'Amsterdam', 'sameAs': 'https://en.wikipedia.org/wiki/Amsterdam' },
      { '@type': 'City', 'name': 'Almere' },
      { '@type': 'City', 'name': 'Amersfoort' },
      { '@type': 'City', 'name': 'Hilversum' },
      { '@type': 'City', 'name': 'Bussum' },
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
    ],
    priceRange: '€€',
    paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer', 'iDEAL', 'Pin'],
    currenciesAccepted: 'EUR',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: parseFloat(SITE_CONFIG.rating),
      reviewCount: parseInt(SITE_CONFIG.reviewCount, 10),
      bestRating: 5,
      worstRating: 1,
    },
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
