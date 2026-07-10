import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { FAQ_GLOBAL, FAQ_AUTOSLEUTEL_BIJMAKEN, FAQ_TRANSPONDER, FAQ_SMART_KEY, FAQ_AUTO_OP_SLOT, FAQ_AKL } from '@/config/faq';

export const metadata: Metadata = {
  title: {
    absolute: 'Veelgestelde Vragen Autosleutel | FAQ | Autosleutel24',
  },
  description: `Antwoorden op alle vragen over autosleutel bijmaken, kosten, transponder programmeren, smart key en auto openen. Bel direct: ${SITE_CONFIG.phone}`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/veelgestelde-vragen`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/veelgestelde-vragen`,
      'x-default': `${SITE_CONFIG.domain}/veelgestelde-vragen`,
    },
  },
  openGraph: {
    url: `${SITE_CONFIG.domain}/veelgestelde-vragen`,
    title: 'Veelgestelde Vragen Autosleutel Bijmaken | Autosleutel24',
    description: `Alles wat u wilt weten over autosleutels bijmaken, kosten en onze service. Bel ${SITE_CONFIG.phone}`,
  },
};

// Combine all FAQs for the dedicated FAQ page — most comprehensive page
const allFaqs = [
  ...FAQ_GLOBAL,
  ...FAQ_AUTOSLEUTEL_BIJMAKEN,
  ...FAQ_TRANSPONDER,
  ...FAQ_SMART_KEY,
  ...FAQ_AUTO_OP_SLOT,
  ...FAQ_AKL,
];

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
    { '@type': 'ListItem', position: 2, name: 'Veelgestelde Vragen', item: `${SITE_CONFIG.domain}/veelgestelde-vragen` },
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

// Section categories for structured display
const sections = [
  {
    title: '💰 Kosten & Prijzen',
    faqs: [FAQ_GLOBAL[0], FAQ_GLOBAL[4], FAQ_AUTOSLEUTEL_BIJMAKEN[2], FAQ_SMART_KEY[0]],
  },
  {
    title: '⏱️ Reactietijd & Beschikbaarheid',
    faqs: [FAQ_GLOBAL[1], FAQ_GLOBAL[5], FAQ_GLOBAL[13]],
  },
  {
    title: '🔑 Autosleutel Kwijt & Bijmaken',
    faqs: [FAQ_GLOBAL[2], FAQ_GLOBAL[3], FAQ_AUTOSLEUTEL_BIJMAKEN[0], FAQ_AUTOSLEUTEL_BIJMAKEN[1], FAQ_GLOBAL[12]],
  },
  {
    title: '📡 Transponder & Smart Key',
    faqs: [FAQ_GLOBAL[7], FAQ_GLOBAL[8], FAQ_TRANSPONDER[0], FAQ_TRANSPONDER[1], FAQ_TRANSPONDER[2], FAQ_SMART_KEY[1], FAQ_GLOBAL[11]],
  },
  {
    title: '🚗 Auto Openen',
    faqs: [FAQ_AUTO_OP_SLOT[0], FAQ_AUTO_OP_SLOT[1], FAQ_AUTO_OP_SLOT[2], FAQ_GLOBAL[10]],
  },
  {
    title: '🛡️ Alle Sleutels Kwijt (AKL)',
    faqs: [FAQ_AKL[0], FAQ_AKL[1], FAQ_GLOBAL[3]],
  },
  {
    title: '✅ Garantie & Betrouwbaarheid',
    faqs: [FAQ_GLOBAL[14], FAQ_GLOBAL[9], FAQ_GLOBAL[6]],
  },
];

export default function FAQPage() {
  return (
    <>
      <Script id="schema-faq-page" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-faq-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--orange-400)', marginBottom: '0.75rem' }}>VEELGESTELDE VRAGEN</p>
          <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Alles over Autosleutel Bijmaken & Programmeren</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 640, margin: '0 auto 1.5rem' }}>
            Antwoorden op de meest gestelde vragen over onze service. Niet gevonden wat u zocht?
          </p>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ display: 'inline-block', background: 'var(--orange-500)', color: '#fff', padding: '0.875rem 2rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
            📞 Bel direct: {SITE_CONFIG.phone}
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
            <h2>Technische Achtergrondinformatie over Autosleutel Programmering en Beveiliging</h2>
            <p>
              Het moderne autosleutelbeheer is de afgelopen twintig jaar drastisch veranderd. Waar een autosleutel vroeger slechts een stuk uitgesneden metaal was dat een cilinderslot draaide, is elke sleutel tegenwoordig een geavanceerde minicomputer. In de sleutelbehuizing zit een transponderchip ingebouwd die via radiofrequenties (RFID) met de ringantenne rond uw contactslot communiceert. Zonder de juiste cryptografische sleutelcode start de motor niet.
            </p>
            <h3>Startonderbrekers, EWS, CAS, FEM en MQB Systemen</h3>
            <p>
              Autofabrikanten ontwikkelen voortdurend nieuwe generaties startonderbrekers om diefstal te voorkomen. Bij het bijmaken van een autosleutel lezen onze monteurs via de OBD2-poort de geheugenchips (EEPROM/MCU) uit. Wij berekenen ter plaatse de juiste beveiligingssleutels om een nieuwe sleutel toe te voegen aan het immobilisatiesysteem van uw auto.
            </p>
            <h3>Wat te doen bij een kapotte of waterbeschadigde autosleutel?</h3>
            <p>
              Is uw sleutel in het water gevallen of reageren de knoppen niet meer? Vaak kunnen wij de elektronische printplaat herstellen, de microschakelaars vervangen of een nieuwe sleutelbehuizing monteren. Dit bespaart u honderden euro&apos;s ten opzichte van een compleet nieuwe sleutel bij de dealer.
            </p>
          </div>

          <div style={{ background: 'linear-gradient(135deg, var(--orange-500), var(--orange-600))', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', marginTop: '2rem' }}>
            <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.4rem' }}>Staat uw vraag er niet bij?</h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '1.5rem' }}>Bel of WhatsApp ons direct — wij antwoorden binnen 2 minuten.</p>
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
