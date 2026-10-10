import { SITE_CONFIG, isReady } from '@/config/site.config';
import { BIZ_ID, serviceRegionNodes } from '@/utils/schema';

export default function LocalBusinessSchema() {
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'AutomotiveBusiness', 'Locksmith'],
    '@id': BIZ_ID,
    name: SITE_CONFIG.name,
    /*
     * Die Schreibweise ohne Umlaut, nicht der niederländische Name.
     *
     * Hier stand 'Autosleutel24' — der Name der niederländischen Seite. In
     * einer deutschen LocalBusiness-Auszeichnung behauptet das, dieses
     * Unternehmen heiße auch so, und verknüpft die neue Domain mit einer
     * bestehenden Marke, die ihr nicht gehört. Was ein deutscher Kunde
     * tatsächlich tippt, ist der Domainname ohne Umlaut.
     */
    alternateName: 'Autoschluessel24',
    description: SITE_CONFIG.schemaDescription,
    url: SITE_CONFIG.domain,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.domain}/images/logo/autoschluessel24-logo-schluesseldienst.webp`,
      width: 1024,
      height: 304,
    },
    image: `${SITE_CONFIG.domain}/opengraph-image`,
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
    // Die eingebettete Einsatzgebietskarte, nicht eine Nadel am Firmensitz.
    // Fehlt ganz, solange es keine eigene Karte gibt — statt einem deutschen
    // Besucher die Karte des niederländischen Einsatzgebiets zu zeigen.
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
     * Zuerst die Regionen: eine Aussage darüber, wo das Unternehmen arbeitet,
     * die jeder Service-Knoten mitbenutzt. Danach die Städte.
     *
     * Ein Name kann in beiden Listen stehen, und das ist Absicht, keine
     * Dublette: Berlin und Hamburg sind jeweils ein Bundesland UND eine
     * Stadt, und "wir bedienen das Land Berlin" ist eine andere Aussage als
     * "wir bedienen die Stadt Berlin". Die beiden zusammenzuführen, würde die
     * größere stillschweigend fallen lassen. Der @type hält sie auseinander —
     * dafür ist er da.
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
     * Kein aggregateRating.
     *
     * Zwei Gründe, und jeder allein genügt. Erstens hat diese Domain noch
     * keine eigenen Bewertungen (rating und reviewCount stehen auf '0'), und
     * die niederländischen zu übernehmen wäre eine falsche Auszeichnung mit
     * Risiko einer manuellen Maßnahme für die ganze Domain. Zweitens nennt
     * Google eine Bewertung, die ein Unternehmen sich auf seiner eigenen
     * Seite gibt, ausdrücklich "self-serving" und schließt Seiten mit
     * LocalBusiness- oder Organization-Markup von den Sternen aus.
     *
     * Die Sterne im Unternehmensprofil und im Local Pack kommen vom Profil
     * selbst und sind davon unberührt.
     */
    /*
     * sameAs verweist nur auf Profile, die es gibt.
     *
     * Der vierte Eintrag war eine kvk.nl-Suche nach der Handelskammernummer —
     * die niederländische Handelskammer, die über ein deutsches Unternehmen
     * nichts weiß. Das deutsche Gegenstück, das Handelsregister, hat keine
     * stabile öffentliche URL je Unternehmen, auf die man so verweisen
     * könnte; die Registerangaben stehen deshalb im Impressum und nicht hier.
     *
     * Die Filterung hält Platzhalter aus dem Markup: ein sameAs auf '__TBD__'
     * ist ein Fehler in der Rich-Result-Prüfung.
     */
    sameAs: [
      SITE_CONFIG.social.facebook,
      SITE_CONFIG.social.instagram,
      SITE_CONFIG.social.google,
    ].filter(isReady),
    foundingDate: '2020',
    vatID: SITE_CONFIG.ustId,
    legalName: SITE_CONFIG.fullName,
    identifier: {
      '@type': 'PropertyValue',
      name: 'Handelsregister',
      value: SITE_CONFIG.hrb,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
    />
  );
}
