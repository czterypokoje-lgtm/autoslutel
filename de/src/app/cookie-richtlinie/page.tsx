import type { Metadata } from 'next';
import { breadcrumbSchema } from '@/utils/schema';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import ConsentPreferencesButton from '@/components/ConsentBanner/ConsentPreferencesButton';

export const metadata: Metadata = {
  title: {
    absolute: `Cookie-Richtlinie | ${SITE_CONFIG.name}`,
  },
  description:
    'Welche Cookies diese Website setzt, wofür, wie lange sie gespeichert bleiben und wie Sie Ihre Einwilligung jederzeit ändern oder widerrufen.',
  alternates: { canonical: `${SITE_CONFIG.domain}/cookie-richtlinie` },
};

/**
 * Was diese Seite wirklich lädt — und was nicht.
 *
 * Die niederländische Fassung listet hier GA4, Microsoft Clarity (mit
 * Sitzungsaufzeichnung), Google Ads und DoubleClick, weil die dort auch laufen.
 * In dieser App stehen alle Messwerkzeuge auf null (siehe site.config.ts,
 * analytics) — es wird also nichts davon geladen, und keines dieser Cookies
 * wird gesetzt.
 *
 * Diese Liste zu übersetzen hätte eine Verarbeitung beschrieben, die nicht
 * stattfindet. Das ist derselbe Fehler wie der umgekehrte, nur spiegelbildlich:
 * die alte niederländische Richtlinie nannte einmal nur "analytische cookies",
 * während Ads, DoubleClick und Clarity ebenfalls liefen, und eine falsche
 * Angabe ist für sich schon ein Verstoß.
 *
 * Darum tragen die Kategorien `active`. Was nicht aktiv ist, erscheint als
 * Hinweis, nicht als Tabelle — und schaltet sich von selbst ein, sobald in
 * site.config.ts ein Konto eingetragen wird. Beim Eintragen bitte die Zeilen
 * prüfen: Namen und Fristen gelten für die Werkzeuge, die dann wirklich laufen.
 */

const ANALYTICS_ACTIVE = Boolean(SITE_CONFIG.analytics.ga4Id);
const MARKETING_ACTIVE = Boolean(
  SITE_CONFIG.analytics.googleAdsId || SITE_CONFIG.analytics.bingUetId
);

const CATEGORIES = [
  {
    name: 'Technisch notwendig',
    consent: 'Immer aktiv — keine Einwilligung erforderlich',
    active: true,
    intro:
      'Nötig, damit die Website funktioniert und Ihre Cookie-Entscheidung gespeichert bleibt. Diese Cookies werden nicht verwendet, um Sie zu verfolgen, und sie brauchen nach § 25 Abs. 2 TDDDG keine Einwilligung.',
    rows: [['as24_consent', SITE_CONFIG.name, 'Speichert Ihre Cookie-Entscheidung', '6 Monate']],
  },
  {
    name: 'Statistik',
    consent: 'Nur mit Ihrer Einwilligung',
    active: ANALYTICS_ACTIVE,
    intro:
      'Hilft uns zu verstehen, welche Seiten funktionieren. Wird erst gesetzt, nachdem Sie zugestimmt haben.',
    rows: [
      ['_ga, _ga_*', 'Google Analytics 4', 'Unterscheidet Besucher und Sitzungen', '2 Jahre'],
    ],
  },
  {
    name: 'Marketing',
    consent: 'Nur mit Ihrer Einwilligung',
    active: MARKETING_ACTIVE,
    intro:
      'Misst, welche Anzeige zu einer Anfrage geführt hat. Wird erst gesetzt, nachdem Sie zugestimmt haben.',
    rows: [
      ['_gcl_au', 'Google Ads', 'Misst Conversions aus Anzeigen', '90 Tage'],
      ['IDE, test_cookie', 'Google DoubleClick', 'Anzeigenmessung und -auswahl', 'max. 1 Jahr'],
    ],
  },
];

const cell: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  borderBottom: '1px solid var(--color-border, #e4e9ed)',
  fontSize: '0.875rem',
  verticalAlign: 'top',
  textAlign: 'left',
};

export default function CookiePage() {
  return (
    <main>
      <script id="bc-cookie" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ name: 'Cookie-Richtlinie', path: '/cookie-richtlinie' }])) }} />
      <section
        style={{
          background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)',
          padding: '4rem 2rem',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ color: '#fff' }}>Cookie-Richtlinie</h1>
          {/* Kein new Date(): ein Rechtstext, der bei jedem Build behauptet,
              heute geändert worden zu sein, sagt etwas Falsches. */}
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Stand: Oktober 2026</p>
        </div>
      </section>

      <div className="container" style={{ padding: '3rem 2rem', maxWidth: 900 }}>
        <p style={{ lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '2rem' }}>
          Ein Cookie ist eine kleine Textdatei, die bei Ihrem Besuch auf Ihrem Gerät gespeichert
          wird. Ohne Ihre Einwilligung setzen wir ausschließlich technisch notwendige Cookies.
          Cookies für Statistik und Marketing werden erst gesetzt, nachdem Sie zugestimmt haben —
          so verlangt es § 25 Abs. 1 TDDDG.
        </p>
        {!ANALYTICS_ACTIVE && !MARKETING_ACTIVE && (
          <p
            style={{
              lineHeight: 1.7,
              fontSize: '0.95rem',
              marginBottom: '2rem',
              padding: '1rem 1.25rem',
              background: '#f1f5f9',
              borderLeft: '3px solid #0d5f70',
              borderRadius: '4px',
            }}
          >
            <strong>Derzeit nur notwendige Cookies.</strong> Auf dieser Website sind keine
            Werkzeuge für Statistik oder Marketing eingerichtet; es findet also keine
            Reichweitenmessung und kein Tracking statt. Die Kategorien unten stehen hier, damit
            Sie sehen, was eingesetzt würde — und sie werden erst mit Ihrer Einwilligung aktiv,
            sobald wir sie einrichten.
          </p>
        )}

        {CATEGORIES.map((cat) => (
          <div key={cat.name} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>
              {cat.name}
              {!cat.active && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginLeft: '0.6rem' }}>
                  — derzeit nicht eingesetzt
                </span>
              )}
            </h2>
            <p
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#0d5f70',
                margin: '0 0 0.6rem',
              }}
            >
              {cat.consent}
            </p>
            <p style={{ lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1rem' }}>
              {cat.intro}
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520 }}>
                <thead>
                  <tr>
                    <th style={{ ...cell, fontWeight: 700 }}>Cookie</th>
                    <th style={{ ...cell, fontWeight: 700 }}>Anbieter</th>
                    <th style={{ ...cell, fontWeight: 700 }}>Zweck</th>
                    <th style={{ ...cell, fontWeight: 700 }}>Speicherdauer</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.rows.map((r) => (
                    <tr key={r[0]}>
                      <td style={{ ...cell, fontFamily: 'monospace' }}>{r[0]}</td>
                      <td style={cell}>{r[1]}</td>
                      <td style={cell}>{r[2]}</td>
                      <td style={cell}>{r[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div
          style={{
            marginBottom: '2rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid var(--color-border, #e4e9ed)',
          }}
        >
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
            Einwilligung ändern oder widerrufen
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: '0.95rem' }}>
            Sie können Ihre Entscheidung jederzeit anpassen. Der Widerruf ist genauso einfach wie
            die Zustimmung (Art. 7 Abs. 3 DSGVO) und hat keine Folgen für die Nutzung dieser
            Website. Klicken Sie dafür auf{' '}
            <ConsentPreferencesButton /> — zu finden auch am Ende jeder Seite.
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
            Übermittlung in Drittländer und Fragen
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: '0.95rem' }}>
            Sobald Statistik- oder Marketing-Werkzeuge eingesetzt werden, können deren Anbieter
            Daten außerhalb des Europäischen Wirtschaftsraums verarbeiten; eine Einwilligung
            dafür wird dann gesondert eingeholt. Wie wir mit personenbezogenen Daten umgehen,
            steht in unserer <Link href="/datenschutz">Datenschutzerklärung</Link>. Fragen
            richten Sie an {SITE_CONFIG.email}. Sie haben außerdem das Recht, sich nach Art. 77
            DSGVO bei der Datenschutz-Aufsichtsbehörde Ihres Bundeslandes zu beschweren; eine
            Übersicht führt der Bundesbeauftragte für den Datenschutz und die
            Informationsfreiheit unter bfdi.bund.de.
          </p>
        </div>
      </div>
    </main>
  );
}
