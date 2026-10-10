import type { Metadata } from 'next';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { FAQ_GLOBAL, FAQ_SCHLUESSEL_NACHMACHEN, FAQ_TRANSPONDER, FAQ_SMART_KEY, FAQ_AUTO_OEFFNEN, FAQ_ALLE_SCHLUESSEL_VERLOREN } from '@/config/faq';

export const metadata: Metadata = {
  title: {
    absolute: `Häufige Fragen zum Autoschlüssel | FAQ | ${SITE_CONFIG.name}`,
  },
  description: `Antwoorden op alle vragen over autosleutel bijmaken, kosten, transponder programmeren, smart key en auto openen. Bel direct: ${SITE_CONFIG.phone}`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/haeufige-fragen`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/haeufige-fragen`,
      'x-default': `${SITE_CONFIG.domain}/haeufige-fragen`,
    },
  },
  openGraph: {
    url: `${SITE_CONFIG.domain}/haeufige-fragen`,
    type: 'website',
    title: `Häufige Fragen zum Autoschlüssel nachmachen | ${SITE_CONFIG.name}`,
    description: `Alles wat u wilt weten over autosleutels bijmaken, kosten en onze service. Bel ${SITE_CONFIG.phone}`,
    images: [{ url: `${SITE_CONFIG.domain}/og-image.png`, width: 1200, height: 630, alt: 'Häufige Fragen zum Autoschlüssel nachmachen — Autoschlüssel24' }],
  },
};

// Combine all FAQs for the dedicated FAQ page — most comprehensive page
const allFaqs = [
  ...FAQ_GLOBAL,
  ...FAQ_SCHLUESSEL_NACHMACHEN,
  ...FAQ_TRANSPONDER,
  ...FAQ_SMART_KEY,
  ...FAQ_AUTO_OEFFNEN,
  ...FAQ_ALLE_SCHLUESSEL_VERLOREN,
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
    { '@type': 'ListItem', position: 2, name: 'Häufige Fragen', item: `${SITE_CONFIG.domain}/haeufige-fragen` },
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: allFaqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.a,
    },
  })),
};

/*
 * Die Abschnitte, nach Frage statt nach Index.
 *
 * Hier stand eine Auswahl per Position — FAQ_GLOBAL[14], FAQ_ALLE_SCHLUESSEL_VERLOREN[1] und so
 * weiter. Das bricht, sobald eine Frage dazukommt oder wegfällt: die deutsche
 * FAQ ist kürzer als die niederländische, und der Build ist genau daran
 * gescheitert ("Cannot read properties of undefined"). Ausgewählt wird jetzt
 * über ein Stück der Frage, und was nicht gefunden wird, fällt weg statt den
 * Build zu stoppen.
 */
const pick = (list: typeof FAQ_GLOBAL, ...needles: string[]) =>
  needles
    .map((n) => list.find((f) => f.q.toLowerCase().includes(n.toLowerCase())))
    .filter((f): f is (typeof FAQ_GLOBAL)[number] => Boolean(f));

const sections = [
  {
    title: '💰 Kosten & Preise',
    faqs: [
      ...pick(FAQ_GLOBAL, 'was kostet es', 'kommen am ende', 'wie bezahle ich'),
      ...pick(FAQ_SMART_KEY, 'so viel teurer'),
    ],
  },
  {
    title: '⏱️ Erreichbarkeit',
    faqs: pick(FAQ_GLOBAL, 'wie schnell', 'wer kommt'),
  },
  {
    title: '🔑 Schlüssel verloren & nachmachen',
    faqs: [
      ...pick(FAQ_GLOBAL, 'alle schlüssel verloren', 'schlüsseldienst moderne'),
      ...pick(FAQ_SCHLUESSEL_NACHMACHEN, 'vorhandener schlüssel', 'zweitschlüssel oder ersatzschlüssel', 'wie lange dauert'),
    ],
  },
  {
    title: '📡 Transponder & Keyless Go',
    faqs: [
      ...pick(FAQ_GLOBAL, 'motor startet nicht'),
      ...pick(FAQ_TRANSPONDER, 'was ist ein transponder', 'fbs4'),
      ...pick(FAQ_SMART_KEY, 'nicht mehr erkannt'),
    ],
  },
  {
    title: '🚗 Auto öffnen',
    faqs: pick(FAQ_AUTO_OEFFNEN, 'schaden', 'kind oder ein hund', 'hersteller-app', 'nachweisen'),
  },
  {
    title: '🛡️ Alle Schlüssel verloren',
    faqs: pick(FAQ_ALLE_SCHLUESSEL_VERLOREN, 'alle schlüssel verloren', 'verlorenen schlüssel', 'im vergleich zum händler'),
  },
  {
    title: '✅ Garantie & Unterlagen',
    faqs: pick(FAQ_GLOBAL, 'so gut wie der vom hersteller', 'welche unterlagen', 'allen marken', 'repariert werden'),
  },
];

export default function FAQPage() {
  return (
    <>
      <script id="schema-faq-page" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="schema-faq-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--orange-400)', marginBottom: '0.75rem' }}>VEELGESTELDE VRAGEN</p>
          <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Alles zum Autoschlüssel nachmachen und anlernen</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 640, margin: '0 auto 1.5rem' }}>
            Antworten auf die Fragen, die uns am häufigsten gestellt werden. Nicht gefunden, was Sie suchen?
          </p>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ display: 'inline-block', background: 'var(--orange-500)', color: '#fff', padding: '0.875rem 2rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
            📞 Jetzt anrufen: {SITE_CONFIG.phone}
          </a>
        </section>

        <div className="container" style={{ padding: '4rem 2rem', maxWidth: 960 }}>

          {sections.map((section) => (
            <div key={section.title} style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--gray-200)', color: 'var(--gray-900)' }}>
                {section.title}
              </h2>
              {section.faqs.map((faq, i) => (
                <details
                  key={i}
                  style={{ borderBottom: '1px solid var(--color-border)', padding: '1.25rem 0' }}
                >
                  <summary style={{ fontSize: '1.02rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text-primary)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    {faq.q}
                    <span style={{ color: 'var(--orange-500)', flexShrink: 0, fontSize: '1.3rem', lineHeight: 1 }}>+</span>
                  </summary>
                  <p style={{ marginTop: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.8, fontSize: '0.95rem', paddingLeft: '0' }}>{faq.a}</p>
                </details>
              ))}
            </div>
          ))}

          {/* ── COMPREHENSIVE FAQ SEO GUIDE ARTICLE ── */}
          <div className="seo-article-block" style={{ marginTop: '3.5rem', marginBottom: '3.5rem' }}>
            <h2>Technischer Hintergrund: Wegfahrsperre, Transponder und Keyless Go</h2>
            <p>
              Der Autoschlüssel hat sich in zwanzig Jahren vom Blech zum Rechner entwickelt. Früher
              war er ein ausgeschnittenes Stück Metall, das einen Zylinder drehte; heute sitzt im
              Schlüsselkopf ein Transponder, der über Funk (RFID) mit der Ringantenne rund um das
              Zündschloss spricht. Ohne den richtigen Code gibt die Motorsteuerung weder Kraftstoff
              noch Zündung frei — der Anlasser dreht, der Motor läuft nicht an. Das ist der Grund,
              warum ein gefräster Rohling allein nichts nützt und warum ADAC- und
              Versicherer-Ratgeber schreiben, ein Schlüsseldienst könne das nicht.
            </p>
            <h3>Wegfahrsperren: EWS, CAS, FEM/BDC, MQB und FBS4</h3>
            <p>
              Die Hersteller entwickeln laufend neue Generationen von Wegfahrsperren, um Diebstahl
              zu erschweren — BMW von EWS über CAS zu FEM/BDC, der VW-Konzern zu MQB mit
              Online-Freigabe, Mercedes zu FBS4. Beim Anlernen eines Schlüssels lesen unsere Partner
              über die OBD-Schnittstelle die Speicher (EEPROM/MCU) aus und berechnen die
              Sicherheitsdaten, mit denen ein neuer Schlüssel in der Wegfahrsperre hinterlegt wird.
              Wo der Hersteller das nur über eine Online-Freigabe zulässt, geht es nicht — und das
              sagen wir am Telefon, statt für eine Anfahrt zu berechnen.
            </p>
            <h3>Schlüssel defekt oder im Wasser gewesen — was dann?</h3>
            <p>
              Ist der Schlüssel ins Wasser gefallen, oder reagieren die Tasten nicht mehr? In den
              meisten Fällen lässt sich die Platine instand setzen, die Mikroschalter tauschen oder
              ein neues Gehäuse montieren. Das ist erheblich günstiger als ein kompletter
              Ersatzschlüssel — und der Schlüssel bleibt der, den Ihr Fahrzeug schon kennt, es muss
              also nichts neu angelernt werden.
            </p>
          </div>

          <div style={{ background: 'linear-gradient(135deg, var(--orange-500), var(--orange-600))', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', marginTop: '2rem' }}>
            <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.4rem' }}>Ihre Frage steht nicht dabei?</h2>
            {/* Hier stand "wij antwoorden binnen 2 minuten" — eine Zusage, die
                niemand einhalten kann und die niemand nachprüft, bis sie
                gebrochen ist. 24/7 erreichbar ist wahr und genügt. */}
            <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '1.5rem' }}>Rufen Sie an oder schreiben Sie per WhatsApp — wir sind rund um die Uhr erreichbar.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ background: '#fff', color: 'var(--orange-600)', padding: '0.875rem 1.75rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
                📞 {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} style={{ background: '#25D366', color: '#fff', padding: '0.875rem 1.75rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
