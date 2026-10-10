import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import { preisAb } from '@/config/leistungen';
import SplitHero from '@/components/SplitHero/SplitHero';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';

/*
 * "Nachmachen lassen" — die Frage vor dem Auftrag.
 *
 * Auf der niederländischen Seite ist "laten maken" die größte
 * Suchanfragen-Familie der Domain (17.314 Impressionen über 212 Anfragen in
 * elf Wochen), und fast alles davon ist eine Marke oder eine Stadt vor
 * "sleutel laten maken". Die deutsche Entsprechung ist "nachmachen lassen",
 * und sie trägt dieselbe Absicht: nicht "was kostet es", sondern "wo lasse
 * ich das machen".
 *
 * Diese Seite ist mit Absicht KEINE zweite Fassung von
 * /leistungen/autoschluessel-nachmachen. Die ist die Auftragsseite. Diese
 * beantwortet die Frage, die davorsteht — Vertragshändler, Schlüsseldienst
 * oder mobiler Fachbetrieb, und was jeder Weg an Zeit und Geld kostet.
 *
 * Wenn sie stattdessen für das einfache "autoschlüssel nachmachen" zu ranken
 * beginnt, gehört sie in jene Seite hineingefaltet statt daneben.
 */

const PAGE_PATH = '/autoschluessel-nachmachen-lassen';
const PAGE_URL = `${SITE_CONFIG.domain}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: { absolute: 'Autoschlüssel nachmachen lassen: Händler, Schlüsseldienst oder mobil?' },
  description:
    'Autoschlüssel nachmachen lassen? Vertragshändler, Schlüsseldienst und mobiler Fachbetrieb im Vergleich — nach Zeit, Preis und ob Ihr Auto irgendwohin muss. Festpreis vorab, 12 Monate Garantie.',
  alternates: {
    canonical: PAGE_URL,
    /* Nur de-DE: ein hreflang-Verweis auf die niederländische Seite wäre erst
       richtig, wenn sie zurückverweist. Siehe app/page.tsx. */
    languages: { 'de-DE': PAGE_URL },
  },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: 'Autoschlüssel nachmachen lassen: Händler, Schlüsseldienst oder mobil?',
    description:
      'Drei Wege, einen Autoschlüssel nachmachen zu lassen — was jeder kostet und wie lange er dauert.',
  },
};

const faqItems = [
  {
    q: 'Wo kann ich einen Autoschlüssel nachmachen lassen?',
    a: 'Beim Vertragshändler, bei einem Schlüsseldienst mit Werkstatt, oder bei einem mobilen Fachbetrieb, der zu Ihrem Fahrzeug kommt. Der Händler bestellt den Schlüssel meist auf Fahrgestellnummer, und das Auto muss in der Regel in die Werkstatt. Ein mobiler Fachbetrieb fräst und lernt den Schlüssel dort an, wo das Fahrzeug steht — in der Einfahrt, auf dem Firmenparkplatz oder in der Tiefgarage.',
  },
  {
    q: 'Was brauche ich, um einen Autoschlüssel nachmachen zu lassen?',
    a: 'Zwei Dinge: einen gültigen Personalausweis oder Pass und die Zulassungsbescheinigung Teil I, aus der hervorgeht, dass das Fahrzeug Ihnen gehört. Ohne diesen Nachweis fertigen wir keinen Schlüssel an — genau das verhindert, dass sich ein Dritter einen Schlüssel für Ihr Auto machen lässt. Außerdem brauchen wir Marke, Modell, Baujahr und Schlüsselart.',
  },
  {
    q: 'Reicht das Kennzeichen, damit Sie mein Fahrzeug erkennen?',
    a: 'Nein, und das ist der eine Punkt, in dem sich Deutschland von den Niederlanden unterscheidet. Dort gibt das öffentliche RDW-Register zu jedem Kennzeichen Marke, Modell und Baujahr heraus. In Deutschland gibt das Kraftfahrt-Bundesamt Halter- und Fahrzeugdaten nicht an Dritte heraus, es gibt also keine Abfrage, die wir für Sie machen könnten. Nennen Sie uns deshalb Marke, Modell und Baujahr — sie stehen in Ihrer Zulassungsbescheinigung Teil I.',
  },
  {
    q: 'Geht das auch, wenn kein Schlüssel mehr da ist?',
    a: 'Ja. Das ist der Fall "alle Schlüssel verloren": ohne funktionierenden Schlüssel müssen die Schlüsseldaten über die OBD-Schnittstelle aus dem Steuergerät gelesen werden, danach wird ein Rohling auf Ihr Schließsystem gefräst und an der Wegfahrsperre angelernt. Das ist mehr Arbeit als ein Zweitschlüssel bei vorhandenem Original und kostet entsprechend mehr. Alles dazu steht auf der Seite "Autoschlüssel verloren".',
  },
  {
    q: 'Muss mein Auto dafür in eine Werkstatt?',
    a: 'Bei uns nicht. Der Partnerbetrieb kommt mit Fräse und Diagnosetechnik zu Ihrem Fahrzeug, fräst das Schlüsselblatt und lernt den Transponder über die OBD-Schnittstelle an. Es muss nichts abgeschleppt werden, und es wird nichts bestellt, worauf Sie Tage warten.',
  },
  {
    q: 'Was, wenn mein Schlüssel kaputt ist und nicht verloren?',
    a: 'Dann brauchen Sie oft keinen neuen. Lose Tasten, ein gerissenes Gehäuse oder eine leere Batterie lassen sich meist reparieren, und das ist deutlich günstiger als ein Ersatzschlüssel — außerdem bleibt es der Schlüssel, den Ihr Fahrzeug schon kennt. Siehe "Autoschlüssel reparieren", "Schlüsselgehäuse wechseln" und "Batterie wechseln".',
  },
  {
    q: 'Was kostet es, einen Autoschlüssel nachmachen zu lassen?',
    a: 'Das hängt von Marke, Modell, Baujahr und Schlüsselart ab: ein Transponderschlüssel ist die einfachste Arbeit, ein Keyless-Go-Schlüssel die aufwendigste. Sie hören den Festpreis am Telefon, bevor jemand losfährt, und er ändert sich am Fahrzeug nicht. Alle Beträge sind Bruttopreise inklusive 19 % MwSt., wie es die Preisangabenverordnung gegenüber Verbrauchern verlangt.',
  },
];

/*
 * Die Preiszeilen, nur mit echten Zahlen.
 *
 * preisAb() gibt undefined zurück, solange der Betrag in site.config.ts auf
 * TBD steht; die Zeile zeigt dann "Festpreis vorab" statt eines Platzhalters.
 * Die niederländische Fassung schrieb €{SITE_CONFIG.prices.transponder}
 * direkt in den Text — das hätte hier "€__TBD__" ergeben.
 */
const priceRows: [string, string | undefined][] = [
  ['Transponderschlüssel', preisAb('transponder')],
  ['Klappschlüssel mit Funkfernbedienung', preisAb('klapsleutel')],
  ['Keyless Go / Smart Key', preisAb('smartKey')],
  ['Alle Schlüssel verloren', preisAb('allKeysLost')],
];

export default function AutoschluesselNachmachenLassen() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${PAGE_URL}#faqpage`,
    mainEntity: faqItems.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Autoschlüssel nachmachen lassen', item: PAGE_URL },
    ],
  };

  return (
    <div>
      <script id="lm-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="lm-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Autoschlüssel nachmachen lassen' }]}
        titleTop="Autoschlüssel nachmachen lassen?"
        titleAccent="Drei Wege — und welcher zu Ihrer Lage passt"
        lead="Einen neuen Autoschlüssel bekommen Sie beim Vertragshändler, bei einem Schlüsseldienst oder bei einem Fachbetrieb, der zu Ihnen kommt. Der Unterschied liegt in Zeit, Preis und darin, ob Ihr Auto irgendwohin muss."
        facts={<HeroQuickFacts price={preisAb('transponder')} />}
        image={{
          src: '/images/seo/autoschluessel_spezialist_background.webp',
          alt: 'Schlüsselwand mit Autoschlüsseln nach Marke im Servicefahrzeug',
        }}
      >
        <VehicleWizard fallback={<LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" />} />
      </SplitHero>

      <VerifiedReviewBanner />
      <BrandsMarquee />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Drei Wege, einen Autoschlüssel nachmachen zu lassen</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="price-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Weg</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Wie es abläuft</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Worauf zu achten ist</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.9rem' }}><strong>Vertragshändler</strong></td>
                  <td style={{ padding: '0.9rem' }}>Schlüssel wird auf Fahrgestellnummer bestellt und in der Werkstatt angelernt</td>
                  <td style={{ padding: '0.9rem' }}>Termin nötig, das Fahrzeug muss hin — ohne Schlüssel also abgeschleppt werden</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}><strong>Schlüsseldienst mit Werkstatt</strong></td>
                  <td style={{ padding: '0.9rem' }}>Sie fahren hin; das Fräsen ist meist möglich</td>
                  <td style={{ padding: '0.9rem' }}>Das Anlernen an der Wegfahrsperre kann nicht jeder Betrieb für jede Marke</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}><strong>Mobiler Fachbetrieb ({SITE_CONFIG.name})</strong></td>
                  <td style={{ padding: '0.9rem' }}>Der Partner kommt zu Ihrem Fahrzeug, fräst und lernt vor Ort an</td>
                  <td style={{ padding: '0.9rem' }}>Festpreis vorab, keine Abschleppkosten, 12 Monate Garantie</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginTop: '1.25rem' }}>
            Welcher Weg passt, hängt davon ab, was Sie noch haben. Mit einem funktionierenden
            Schlüssel ist ein Zweitschlüssel die günstigste Lösung — und der richtige Moment dafür
            ist jetzt, nicht nach dem Verlust. Ist der Schlüssel weg, müssen die Schlüsseldaten aus
            dem Steuergerät gelesen werden. Ist er nur beschädigt, prüfen Sie zuerst, ob{' '}
            <Link href="/leistungen/autoschluessel-reparieren" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              Autoschlüssel reparieren
            </Link>{' '}
            genügt.
          </p>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1rem' }}>Was Sie dafür brauchen</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Wir fertigen einen Schlüssel nur für den Halter des Fahrzeugs an. Legen Sie deshalb zwei
            Dinge bereit: einen gültigen Personalausweis oder Pass und die Zulassungsbescheinigung
            Teil I. Dazu brauchen wir Marke, Modell, Baujahr und die Art des Schlüssels — anders als
            in den Niederlanden gibt es in Deutschland kein öffentliches Register, das uns das zu
            einem Kennzeichen beantworten könnte; alle vier Angaben stehen in Ihrer
            Zulassungsbescheinigung.
          </p>
          <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
            <table className="price-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Art des Schlüssels</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Preis</th>
                </tr>
              </thead>
              <tbody>
                {priceRows.map(([label, price]) => (
                  <tr key={label}>
                    <td style={{ padding: '0.9rem' }}>{label}</td>
                    <td style={{ padding: '0.9rem' }}><strong>{price ?? 'Festpreis vorab'}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '1rem' }}>
            Alle Beträge sind Bruttopreise {SITE_CONFIG.prices.exVatDisclaimer} und hängen von
            Marke, Modell und Baujahr ab. Den genauen Festpreis hören Sie am Telefon, bevor jemand
            losfährt.{' '}
            <Link href="/preise" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              Zur vollständigen Preisübersicht →
            </Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          {/*
            * Hier stehen auf der niederländischen Seite 59 Links auf
            * /merken/<marke>-autosleutel-bijmaken, einer je Marke. Diese App
            * hat keine Markenseiten, also wäre jeder davon eine 404 — siehe
            * BrandsLogoGrid. Stattdessen verweist dieser Abschnitt auf die
            * Leistungen, die es gibt: nach Schlüsselart, nicht nach Marke.
            * Sobald /marken existiert, gehört die Markenliste zurück.
            */}
          <h2 style={{ marginBottom: '1rem' }}>Nach Art des Schlüssels</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            Nicht die Marke entscheidet, wie viel Arbeit ein Schlüssel ist, sondern sein
            Schließ- und Sicherungssystem. Wählen Sie, was auf Ihren Fall zutrifft:
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '0.6rem 1rem',
            }}
          >
            {[
              ['Autoschlüssel nachmachen', '/leistungen/autoschluessel-nachmachen'],
              ['Zweitschlüssel anfertigen', '/leistungen/ersatzschluessel-anfertigen'],
              ['Transponder anlernen', '/leistungen/transponder-anlernen'],
              ['Funkschlüssel nachmachen', '/leistungen/funkschluessel-nachmachen'],
              ['Keyless Go / Smart Key', '/leistungen/keyless-go-schluessel'],
              ['Alle Autoschlüssel verloren', '/leistungen/alle-autoschluessel-verloren'],
              ['Autoschlüssel reparieren', '/leistungen/autoschluessel-reparieren'],
              ['Schlüsselgehäuse wechseln', '/leistungen/schluesselgehaeuse-wechseln'],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
                  {label} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '2rem' }}>Häufige Fragen: Autoschlüssel nachmachen lassen</h2>
          {faqItems.map((f, i) => (
            <details key={i} className="faq-item">
              <summary className="faq-question">
                {f.q}
                <svg className="faq-chevron" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <p className="faq-answer">{f.a}</p>
            </details>
          ))}
          <p style={{ marginTop: '2rem', color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Sie wissen schon, was Sie brauchen? Preis, Ablauf und Garantie stehen auf{' '}
            <Link href="/leistungen/autoschluessel-nachmachen" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              Autoschlüssel nachmachen
            </Link>
            . Ist der Schlüssel weg, beginnen Sie bei{' '}
            <Link href="/autoschluessel-verloren" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              Autoschlüssel verloren
            </Link>
            . Und warum eine reine Kopie nicht immer startet, steht auf{' '}
            <Link href="/autoschluessel-kopieren" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              Autoschlüssel kopieren
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
