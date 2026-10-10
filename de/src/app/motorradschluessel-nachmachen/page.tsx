import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import { ARRIVAL, ARRIVAL_TITLE } from '@/config/arrival';
import SplitHero from '@/components/SplitHero/SplitHero';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';

/*
 * Eine Seite für Motorrad- und Rollerschlüssel, nicht zehn Markenseiten.
 *
 * Zehn fast gleiche Markenseiten sind dasselbe Muster, das der
 * niederländischen Seite 664 Modellseiten eingebracht hat, die inzwischen
 * alle weiterleiten. Wer "motorradschlüssel nachmachen" sucht, will eine
 * Antwort und kein Verzeichnis.
 *
 * KEIN Preis steht auf dieser Seite. SITE_CONFIG.prices hat keine Zeile für
 * Motorräder, und eine Zahl, die für eine einzelne Seite erfunden wird, ist
 * genau das, was diese Konfiguration verhindern soll. Kommt eine Zeile dazu,
 * kann die Seite sie tragen.
 *
 * Zwei Dinge sind mit den Partnerbetrieben zu klären, bevor man sich auf
 * diese Seite verlässt: welche der zehn Marken sie vor Ort anlernen können,
 * und ob die Beschreibungen unten dem entsprechen, was sie in der Praxis
 * sehen. Die Markenhinweise sind mit Absicht allgemein gehalten und nennen
 * ein System nur, wo es gut dokumentiert ist.
 *
 * Die Seite ist auf der Annahme gebaut, nicht auf Nachfragedaten — beurteile
 * sie nach 60 Tagen an ihren Impressionen.
 */

const PAGE_PATH = '/motorradschluessel-nachmachen';
const PAGE_URL = `${SITE_CONFIG.domain}${PAGE_PATH}`;

export const metadata: Metadata = {
  title: { absolute: `Motorradschlüssel nachmachen oder verloren? ${ARRIVAL_TITLE}` },
  description:
    'Motorradschlüssel nachmachen oder verloren? Honda, Yamaha, Kawasaki, BMW Motorrad, Harley und mehr — unser Partner kommt zu Ihrem Motorrad, Festpreis vorab am Telefon.',
  alternates: {
    canonical: PAGE_URL,
    languages: { 'de-DE': PAGE_URL },
  },
  openGraph: {
    type: 'website',
    url: PAGE_URL,
    title: 'Motorradschlüssel nachmachen oder verloren? Wir kommen zu Ihrem Motorrad',
    description:
      'Motorrad- und Rollerschlüssel nachmachen, auch wenn keiner mehr da ist. Vor Ort, Festpreis vorab.',
  },
};

const brands = [
  { name: 'Honda', note: 'Von Rollern wie PCX und Forza bis CBR und Africa Twin. Viele Hondas haben eine Wegfahrsperre (HISS), bei der ein neuer Schlüssel angelernt werden muss.' },
  { name: 'Yamaha', note: 'Von NMAX und X-Max bis zur MT- und R-Reihe. Bei Modellen mit Wegfahrsperre funktioniert ein gefräster Schlüssel nur, wenn er auch angelernt ist.' },
  { name: 'Kawasaki', note: 'Ninja, Z und Versys. Manche Modelle haben einen codierten Schlüssel, neuere ein Keyless-System.' },
  { name: 'Suzuki', note: 'Von Burgman und Address bis zur GSX- und V-Strom-Reihe. Wir prüfen je Modell, ob es ein einfacher oder ein codierter Schlüssel ist.' },
  { name: 'BMW Motorrad', note: 'R-, F-, S- und K-Reihe. Ältere Modelle haben einen codierten Schlüssel, bei neueren ist Keyless Ride möglich.' },
  { name: 'Harley-Davidson', note: 'Bei vielen Modellen arbeitet ein Fob, der mit dem Motorrad gekoppelt ist; ein neuer muss am Fahrzeug angelernt werden.' },
  { name: 'Ducati', note: 'Monster, Multistrada, Panigale und Scrambler. Je nach Modell und Baujahr ein codierter Schlüssel oder Hands-free.' },
  { name: 'KTM', note: 'Duke, Adventure und SMC. Wir prüfen je Modell und Baujahr, welche Schlüsselart und welche Kopplung dazugehört.' },
  { name: 'Triumph', note: 'Street Triple, Speed Triple, Tiger und Bonneville. Je nach Modell ein codierter Schlüssel oder Keyless.' },
  { name: 'Vespa und Piaggio', note: 'Roller mit Zulassung. Nennen Sie uns Marke, Modell und Baujahr, dann sagen wir, welche Schlüsselart dazugehört.' },
];

const faqItems = [
  {
    q: 'Kann ein Motorradschlüssel nachgemacht werden?',
    a: 'In den meisten Fällen ja. Hat das Motorrad keine Wegfahrsperre, genügt das Fräsen. Sitzt ein Transponder im Schlüssel, muss der neue Schlüssel zusätzlich angelernt werden — sonst passt er, aber der Motor startet nicht. An Marke, Modell und Baujahr sehen wir, welcher der beiden Fälle auf Sie zutrifft.',
  },
  {
    q: 'Ich habe meinen Motorradschlüssel verloren und keinen Zweitschlüssel. Was jetzt?',
    a: 'Rufen Sie an oder schreiben Sie per WhatsApp, mit Marke, Modell und Baujahr. Ob das vor Ort möglich ist, hängt vom Modell ab — Sie hören das sofort, und Sie bekommen den Festpreis am Telefon, bevor jemand losfährt. Wir sagen nichts für ein Modell zu, bei dem wir es nicht sicher wissen.',
  },
  {
    q: 'Was brauche ich, um einen Motorradschlüssel machen zu lassen?',
    a: 'Einen gültigen Personalausweis oder Pass und die Zulassungsbescheinigung Teil I, aus der hervorgeht, dass das Fahrzeug Ihnen gehört. Ohne diesen Nachweis fertigen wir keinen Schlüssel an.',
  },
  {
    q: 'Kommen Sie auch zu mir nach Hause?',
    a: `Ja. Unser Partner kommt ${ARRIVAL} zu Ihrem Motorrad — zu Hause, am Arbeitsplatz oder am Straßenrand. Sie müssen das Fahrzeug nicht transportieren, und es muss nicht abgeschleppt werden.`,
  },
  {
    q: 'Was kostet ein Motorradschlüssel?',
    a: 'Das hängt von Marke, Modell und davon ab, ob ein Transponder verbaut ist. Sie hören den Festpreis am Telefon, bevor jemand losfährt. Alle Beträge sind Bruttopreise inklusive 19 % MwSt.',
  },
  {
    q: 'Machen Sie auch Rollerschlüssel?',
    a: 'Ja, für Roller mit Zulassung — unter anderem Vespa, Piaggio, Honda und Yamaha. Nennen Sie uns Marke, Modell und Baujahr, dann sagen wir, was möglich ist.',
  },
];

export default function MotorradschluesselNachmachen() {
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
      { '@type': 'ListItem', position: 2, name: 'Motorradschlüssel nachmachen', item: PAGE_URL },
    ],
  };
  const link = { color: 'var(--orange-600)', fontWeight: 600 } as const;

  return (
    <div>
      <script id="motor-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="motor-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Motorradschlüssel nachmachen' }]}
        titleTop="Motorradschlüssel nachmachen oder verloren?"
        titleAccent="Wir kommen zu Ihrem Motorrad"
        lead="Schlüssel von Motorrad oder Roller verloren, defekt, oder einen Zweitschlüssel nötig? Unser Partner fertigt ihn vor Ort an und lernt ihn an — ohne Transport und ohne Tage Wartezeit."
        facts={<HeroQuickFacts />}
        image={{
          src: '/images/seo/autoschluessel24_autoschluessel-spezialist_vor_ort.webp',
          alt: 'Autoschlüssel-Spezialist in Arbeitskleidung am Fahrzeug, Servicefahrzeug im Hintergrund',
        }}
      >
        <LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" />
      </SplitHero>

      <VerifiedReviewBanner />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Die zehn häufigsten Marken</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Jede Marke hat ihr eigenes Schlüsselsystem, und innerhalb einer Marke unterscheidet es
            sich nach Modell und Baujahr. Das sind die Marken, nach denen am häufigsten gefragt wird.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
            {brands.map((b) => (
              <li key={b.name}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{b.name} Schlüssel nachmachen</h3>
                <p style={{ color: 'var(--gray-600)', lineHeight: 1.65 }}>{b.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Verloren oder defekt — was passt zu Ihrem Fall?</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="price-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Ihre Lage</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Was wir tun</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Zweitschlüssel nötig</td>
                  <td style={{ padding: '0.9rem' }}>Fräsen, und anlernen, wenn ein Transponder verbaut ist</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Einen Schlüssel verloren, einer ist noch da</td>
                  <td style={{ padding: '0.9rem' }}>Zweitschlüssel anfertigen — der günstigste Weg</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Alle Schlüssel verloren</td>
                  <td style={{ padding: '0.9rem' }}>Je Modell prüfen, was vor Ort geht; Festpreis vorab am Telefon</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Schlüssel defekt oder Batterie leer (Keyless)</td>
                  <td style={{ padding: '0.9rem' }}>Gehäuse oder Batterie wechseln — oft ohne neuen Schlüssel</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '1rem' }}>
            Der Preis hängt von Marke, Modell und Baujahr ab. Sie hören ihn am Telefon, bevor jemand
            losfährt — als Bruttopreis inklusive 19 % MwSt.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '2rem' }}>Häufige Fragen: Motorradschlüssel nachmachen</h2>
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
            Geht es um ein Auto? Dann siehe{' '}
            <Link href="/leistungen/autoschluessel-nachmachen" style={link}>Autoschlüssel nachmachen</Link>{' '}
            oder{' '}
            <Link href="/autoschluessel-verloren" style={link}>Autoschlüssel verloren</Link>. Einen defekten
            Schlüssel können Sie über{' '}
            <Link href="/leistungen/autoschluessel-reparieren" style={link}>Autoschlüssel reparieren</Link>{' '}
            instand setzen lassen.
          </p>
        </div>
      </section>
    </div>
  );
}
