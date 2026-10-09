import { SITE, isReady } from '@/config/site';
import { STAEDTE } from '@/config/staedte';

/**
 * Strukturierte Daten.
 *
 * Ein Unternehmen, ein Knoten. Die vollständige Beschreibung steht einmal im
 * Root-Layout unter BIZ_ID; jeder andere Block verweist nur mit `@id` darauf,
 * statt das Unternehmen erneut zu beschreiben. Sonst zählt ein Crawler so
 * viele Betriebe, wie es Seiten gibt, jeden mit leicht anderer Adresse.
 *
 * Eigene Datei, eigene ID: diese Seite ist nicht derselbe Knoten wie
 * autosleutel24.nl. Dieselbe `@id` auf zwei Domains zu verwenden hieße zu
 * behaupten, es sei ein Betrieb mit zwei Adressen in zwei Ländern.
 */

export const BIZ_ID = `${SITE.domain}/#localbusiness`;
export const businessRef = { '@id': BIZ_ID } as const;

/** Die Bundesländer, in denen ein Partner steht — ohne Dopplungen. */
function areaServed() {
  const laender = [...new Set(STAEDTE.map((s) => s.land))];
  return [
    /*
     * Berlin und Hamburg sind Stadt und Bundesland zugleich, und beides zu
     * nennen ist richtig: "wir arbeiten im Land Berlin" und "wir arbeiten in
     * der Stadt Berlin" sind dieselbe Fläche, aber nicht dieselbe Aussage für
     * einen Crawler, der nach einer Stadt fragt.
     */
    ...laender.map((name) => ({ '@type': 'AdministrativeArea', name })),
    ...STAEDTE.map((s) => ({ '@type': 'City', name: s.stadt })),
  ];
}

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'AutomotiveBusiness', 'Locksmith'],
    '@id': BIZ_ID,
    name: SITE.name,
    description:
      'Mobiler Autoschlüssel-Service für alle Marken. Autoschlüssel nachmachen, Transponder programmieren, Keyless-Go-Schlüssel anlernen und Fahrzeuge schadenfrei öffnen — der Partner kommt zu Ihrem Fahrzeug in Berlin, Hamburg, München und Frankfurt am Main.',
    url: SITE.domain,
    ...(isReady(SITE.phoneTel) ? { telephone: SITE.phoneTel } : {}),
    ...(isReady(SITE.email) ? { email: SITE.email } : {}),
    /*
     * Die Adresse wird nur ausgegeben, wenn sie echt ist. Ein PostalAddress
     * mit Platzhaltern ist schlechter als keiner: er behauptet einen Sitz, den
     * es nicht gibt, an einer Stelle, die Google mit dem
     * Unternehmensprofil vergleicht.
     */
    ...(isReady(SITE.legal.street)
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: SITE.legal.street,
            postalCode: SITE.legal.postcode,
            addressLocality: SITE.legal.city,
            addressCountry: 'DE',
          },
        }
      : {}),
    areaServed: areaServed(),
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
    priceRange: '€€',
    paymentAccepted: [...SITE.paymentAccepted],
    currenciesAccepted: 'EUR',
    /*
     * Kein aggregateRating.
     *
     * Erstens hat diese Seite noch keine eigenen Bewertungen, und die
     * niederländischen gehören ihr nicht. Zweitens sagt Google für
     * LocalBusiness ausdrücklich, dass selbst ausgezeichnete Sterne nicht
     * angezeigt werden — die Auszeichnung würde also nichts bringen und nur
     * etwas behaupten.
     */
    ...(isReady(SITE.legal.vatId) ? { vatID: SITE.legal.vatId } : {}),
  };
}

/** Eine Leistung, die auf das Unternehmen oben verweist statt es zu wiederholen. */
export function serviceSchema(opts: {
  name: string;
  description: string;
  url: string;
  /** Bruttopreis als Zahl, oder null solange keiner hinterlegt ist. */
  abPreis?: string | null;
  /** Nur diese Stadt, oder alle. */
  stadt?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    serviceType: 'Autoschlüssel-Service',
    provider: { '@type': 'Locksmith', '@id': BIZ_ID, name: SITE.name, url: SITE.domain },
    areaServed: opts.stadt
      ? { '@type': 'City', name: opts.stadt }
      : areaServed(),
    /*
     * Ein Angebot nur mit echtem Preis. "ab 0 €" oder ein offer ohne price ist
     * in Deutschland nicht nur nutzlos, sondern bei Preisangaben heikel.
     */
    ...(opts.abPreis
      ? {
          offers: {
            '@type': 'Offer',
            price: opts.abPreis,
            priceCurrency: 'EUR',
            /* Brutto: so wird er auf der Seite auch genannt. */
            valueAddedTaxIncluded: true,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };
}

export function faqSchema(items: { frage: string; antwort: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.frage,
      acceptedAnswer: { '@type': 'Answer', text: i.antwort },
    })),
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Startseite', item: SITE.domain },
      ...trail.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: t.name,
        item: `${SITE.domain}${t.path}`,
      })),
    ],
  };
}

/** Schema-Blöcke in einen einzigen <script>-Tag, wie Google es empfiehlt. */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
