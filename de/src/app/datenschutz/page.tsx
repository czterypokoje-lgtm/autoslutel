import type { Metadata } from 'next';
import { breadcrumbSchema } from '@/utils/schema';
import { SITE_CONFIG, isReady } from '@/config/site.config';

/**
 * Datenschutzerklärung — DSGVO.
 *
 * NICHT die übersetzte niederländische Fassung. Vier Angaben wären durch eine
 * Übersetzung falsch geworden:
 *
 *  - Aufbewahrungsfrist. Die niederländische Seite nennt 7 Jahre für
 *    Rechnungsdaten, weil das die niederländische Frist ist. In Deutschland
 *    sind es 10 Jahre nach § 147 AO und § 257 HGB.
 *  - Aufsichtsbehörde. Dort die Autoriteit Persoonsgegevens; hier die
 *    Landesdatenschutzbehörde des Bundeslandes, in dem das Unternehmen seinen
 *    Sitz hat — welche das ist, steht fest, sobald die Adresse in
 *    site.config.ts steht. Bis dahin verweist der Text auf die Liste des
 *    BfDI, statt die falsche Behörde zu nennen.
 *  - Rechtsgrundlagen. "AVG" wird zu DSGVO, und die Artikel werden benannt:
 *    Art. 6 Abs. 1 lit. b (Vertrag), lit. c (gesetzliche Pflicht), lit. a
 *    (Einwilligung für Statistik und Marketing).
 *  - Betroffenenrechte. Die DSGVO-Artikel 15 bis 21 und das Beschwerderecht
 *    nach Art. 77.
 *
 * Außerdem: die niederländische Fassung zählt hier GA4, Clarity und Google Ads
 * auf. In dieser App stehen alle Messwerkzeuge auf null (siehe
 * site.config.ts analytics) — es wird also nichts geladen, und der Text sagt
 * das, statt eine Verarbeitung zu beschreiben, die nicht stattfindet. Sobald
 * ein Konto eingetragen ist, muss dieser Abschnitt mitwachsen.
 *
 * Anwaltlich nicht geprüft. Vor dem Start durchsehen lassen.
 */

export const metadata: Metadata = {
  title: {
    absolute: `Datenschutzerklärung | ${SITE_CONFIG.name}`,
  },
  description: `Datenschutzerklärung von ${SITE_CONFIG.fullName}: welche personenbezogenen Daten wir verarbeiten, auf welcher Rechtsgrundlage, wie lange wir sie speichern und welche Rechte Sie nach der DSGVO haben.`,
  alternates: { canonical: `${SITE_CONFIG.domain}/datenschutz` },
};

/** Lädt diese Seite irgendein Messwerkzeug? Heute: nein. */
const ANALYTICS_ACTIVE = Boolean(
  SITE_CONFIG.analytics.ga4Id ||
    SITE_CONFIG.analytics.gtmId ||
    SITE_CONFIG.analytics.googleAdsId ||
    SITE_CONFIG.analytics.bingUetId
);

export default function DatenschutzPage() {
  const sections: { title: string; content: string }[] = [
    {
      title: '1. Verantwortlicher',
      content:
        `Verantwortlich für die Verarbeitung personenbezogener Daten im Sinne der DSGVO ist ${SITE_CONFIG.fullName}` +
        (isReady(SITE_CONFIG.address.street)
          ? `, ${SITE_CONFIG.address.street}, ${SITE_CONFIG.address.postal} ${SITE_CONFIG.address.city}`
          : '') +
        `. E-Mail: ${SITE_CONFIG.email}` +
        (isReady(SITE_CONFIG.phone) ? ` · Telefon: ${SITE_CONFIG.phone}` : '') +
        '. Die vollständigen Angaben stehen im Impressum.',
    },
    {
      title: '2. Welche Daten wir verarbeiten',
      content:
        'Für einen Auftrag: Name, Telefonnummer, E-Mail-Adresse, der Standort des Fahrzeugs sowie Fahrzeugdaten (Marke, Modell, Baujahr, Schlüsselart, auf Wunsch Kennzeichen oder FIN) und die Rechnungsdaten. Zum Nachweis der Berechtigung sehen unsere Partner vor Ort Ihren Personalausweis und die Zulassungsbescheinigung Teil I ein — wir speichern davon keine Kopie, sondern nur, dass die Prüfung erfolgt ist. Besondere Kategorien personenbezogener Daten nach Art. 9 DSGVO verarbeiten wir nicht.',
    },
    {
      title: '3. Rechtsgrundlagen und Zwecke',
      content:
        'Die Durchführung des Auftrags und die Abrechnung stützen sich auf Art. 6 Abs. 1 lit. b DSGVO (Vertrag). Die Aufbewahrung von Rechnungen stützt sich auf Art. 6 Abs. 1 lit. c DSGVO in Verbindung mit § 147 AO und § 257 HGB (gesetzliche Pflicht). Die Prüfung Ihrer Berechtigung vor dem Öffnen eines Fahrzeugs stützt sich auf Art. 6 Abs. 1 lit. f DSGVO — unser berechtigtes Interesse daran, kein fremdes Fahrzeug zu öffnen. Statistik- und Marketing-Cookies würden ausschließlich auf Ihre Einwilligung gestützt, Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG.',
    },
    {
      title: '4. Weitergabe an unsere Partnerbetriebe',
      content:
        `${SITE_CONFIG.fullName} ist ein Netzwerk selbstständiger Fachbetriebe. Damit jemand zu Ihrem Fahrzeug fahren kann, geben wir die dafür nötigen Daten an den Partnerbetrieb Ihrer Stadt weiter: Name, Telefonnummer, Standort und Fahrzeugdaten. Mehr nicht. Diese Weitergabe ist für die Durchführung des Auftrags erforderlich, Art. 6 Abs. 1 lit. b DSGVO. Welcher Betrieb das in Ihrem Fall ist, nennen wir Ihnen auf Wunsch jederzeit.`,
    },
    {
      title: '5. Speicherdauer',
      content:
        'Rechnungs- und Buchhaltungsdaten: 10 Jahre, nach § 147 AO und § 257 HGB. Übrige Kundendaten: höchstens 2 Jahre nach dem letzten Kontakt, danach werden sie gelöscht. Eine Anfrage, aus der kein Auftrag wird, löschen wir nach 6 Monaten.',
    },
    {
      title: '6. Ihre Rechte',
      content:
        `Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Eine erteilte Einwilligung können Sie jederzeit widerrufen, Art. 7 Abs. 3 DSGVO — ohne Angabe von Gründen und ohne Nachteil. Schreiben Sie dafür an ${SITE_CONFIG.email}; wir antworten innerhalb eines Monats.`,
    },
    {
      title: '7. Cookies',
      content: ANALYTICS_ACTIVE
        ? 'Diese Website verwendet technisch notwendige Cookies, die für den Betrieb und zum Speichern Ihrer Cookie-Entscheidung gebraucht werden, sowie — ausschließlich mit Ihrer Einwilligung — Cookies für Statistik und Marketing. Ohne Ihre Einwilligung werden diese nicht gesetzt. Sie können Ihre Entscheidung jederzeit über "Cookie-Einstellungen" am Ende jeder Seite ändern oder widerrufen. Eine vollständige Aufstellung je Cookie steht in der Cookie-Richtlinie unter /cookie-richtlinie.'
        : 'Diese Website verwendet derzeit ausschließlich technisch notwendige Cookies — gebraucht für den Betrieb der Seite und um Ihre Cookie-Entscheidung zu speichern. Statistik- und Marketing-Werkzeuge sind nicht eingerichtet und werden nicht geladen: es findet keine Reichweitenmessung und kein Tracking statt. Sobald sich das ändert, wird es nur nach Ihrer Einwilligung geschehen, und dieser Abschnitt sowie die Cookie-Richtlinie unter /cookie-richtlinie werden entsprechend angepasst.',
    },
    {
      title: '8. Kontakt und Beschwerderecht',
      content:
        `Fragen zum Datenschutz richten Sie an ${SITE_CONFIG.email}. Sie haben außerdem das Recht, sich nach Art. 77 DSGVO bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig ist die Landesdatenschutzbehörde des Bundeslandes, in dem wir unseren Sitz haben; eine Übersicht aller Aufsichtsbehörden führt der Bundesbeauftragte für den Datenschutz und die Informationsfreiheit unter bfdi.bund.de.`,
    },
  ];

  return (
    <main>
      <script id="bc-datenschutz" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ name: 'Datenschutzerklärung', path: '/datenschutz' }])) }} />
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ color: '#fff' }}>Datenschutzerklärung</h1>
          {/*
            * Kein new Date() im Rendern.
            *
            * Die niederländische Fassung zeigt hier das aktuelle Datum, sodass
            * jeder Build behauptet, die Erklärung sei heute geändert worden —
            * bei einem Rechtstext die falsche Aussage, und bei statischem
            * Prerendering ohnehin das Datum des Builds und nicht des Besuchs.
            */}
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Stand: Oktober 2026</p>
        </div>
      </section>

      <div className="container" style={{ padding: '3rem 2rem', maxWidth: 900 }}>
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>{section.title}</h2>
            <p style={{ lineHeight: 1.7, fontSize: '0.95rem' }}>{section.content}</p>
          </div>
        ))}
        <p style={{ lineHeight: 1.7, fontSize: '0.88rem', color: 'var(--gray-500)' }}>
          Diese Erklärung ist anwaltlich nicht geprüft und sollte vor dem Start durchgesehen
          werden. Weitere Angaben: <a href="/impressum" style={{ color: '#b93c20' }}>Impressum</a>
          {' · '}
          <a href="/cookie-richtlinie" style={{ color: '#b93c20' }}>Cookie-Richtlinie</a>
          {' · '}
          <a href="/agb" style={{ color: '#b93c20' }}>AGB</a>
        </p>
      </div>
    </main>
  );
}
