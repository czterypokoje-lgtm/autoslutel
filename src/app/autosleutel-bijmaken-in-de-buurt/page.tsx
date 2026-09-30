import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import SplitHero from '@/components/SplitHero/SplitHero';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import NearestCity from '@/components/NearestCity/NearestCity';
import ServiceAreaMap from '@/components/ServiceAreaMap/ServiceAreaMap';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';
import { CITIES } from '@/config/cities';

/*
 * The best-converting local query on the site, with nowhere to land.
 *
 * "autosleutel bijmaken in de buurt": 95 impressions, 2 clicks, average
 * position 8.4 — already on page one, and the highest click rate of any
 * local query in the export. It has been ranking against the city hub, which
 * answers "which cities" rather than "are you near me".
 *
 * So this page answers the question as asked. The browser is the only thing
 * that knows where the reader is, so NearestCity asks it — behind a button,
 * because an unprompted permission dialog gets dismissed on reflex and cannot
 * be asked twice. Everything below works without it.
 */

const REGIONS = Array.from(new Set(CITIES.map((c) => c.region))).sort();

export const metadata: Metadata = {
  title: { absolute: 'Autosleutel Bijmaken in de Buurt | Wij Komen Naar U Toe' },
  description: `Autosleutel bijmaken in de buurt? Onze monteur rijdt naar uw locatie in heel Nederland en maakt de sleutel ter plaatse, vanaf €${SITE_CONFIG.prices.transponder}. Bel of app direct.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/autosleutel-bijmaken-in-de-buurt`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/autosleutel-bijmaken-in-de-buurt`,
      'x-default': `${SITE_CONFIG.domain}/autosleutel-bijmaken-in-de-buurt`,
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.domain}/autosleutel-bijmaken-in-de-buurt`,
    title: 'Autosleutel Bijmaken in de Buurt | Wij Komen Naar U Toe',
    description:
      'Autosleutel bijmaken in de buurt? Onze monteur komt naar uw locatie en maakt de sleutel ter plaatse. 24/7 in heel Nederland.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Autosleutel bijmaken in de buurt — Autosleutel24' }],
  },
};

const faqItems = [
  {
    q: 'Hoe weet ik of er een monteur bij mij in de buurt is?',
    a: 'Gebruik de knop hierboven om uw locatie te delen, dan ziet u direct welk servicegebied het dichtstbij ligt. Werkt dat niet of staat uw plaats er niet tussen, bel ons dan met uw postcode — wij rijden verder dan de lijst hieronder en zeggen eerlijk wanneer iemand er kan zijn.',
  },
  {
    q: 'Moet ik naar een winkel komen?',
    a: 'Nee. Er is geen winkel. De werkplaats zit in de bus: freesmachine, diagnoseapparatuur en sleutelvoorraad rijden mee. Wij komen naar uw auto, waar die ook staat — thuis, op het werk, op een parkeerdek of langs de weg.',
  },
  {
    q: 'Wat kost het als ik verder weg woon?',
    a: `Voorrijden zit bij de prijs in. Een sleutel bijmaken begint bij €${SITE_CONFIG.prices.transponder} en u hoort de exacte prijs telefonisch voordat wij vertrekken. Er komen achteraf geen kilometers bij.`,
  },
  {
    q: 'Hoe snel kan iemand er zijn?',
    a: 'Dat hangt af van waar u staat en wie er op dat moment in uw regio rijdt. Wij noemen daarom geen vast aantal minuten voor het hele land: u krijgt aan de telefoon een echte aankomsttijd van de monteur die naar u toe komt, niet een gemiddelde.',
  },
  {
    q: 'Werken jullie ook buiten de grote steden?',
    a: 'Ja. De stedenpagina laat zien waar wij vaste technici hebben, maar die rijden ook naar de plaatsen daaromheen. Als u twijfelt: bellen kost een minuut en u weet het meteen.',
  },
];

export default function InDeBuurt() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
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
      { '@type': 'ListItem', position: 2, name: 'Autosleutel bijmaken in de buurt', item: `${SITE_CONFIG.domain}/autosleutel-bijmaken-in-de-buurt` },
    ],
  };

  return (
    <div>
      <script id="buurt-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="buurt-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'In de buurt' }]}
        titleTop="Autosleutel Bijmaken in de Buurt?"
        titleAccent="Er Hoeft Niemand Ergens Heen — Behalve Wij"
        lead="Wij hebben geen winkel waar u naartoe rijdt. De werkplaats zit in de bus en die komt naar uw auto, waar die ook staat."
        facts={<HeroQuickFacts price={`Vanaf €${SITE_CONFIG.prices.transponder}`} />}
        image={{
          src: '/images/seo/autosleutel24_autosleutelspecialist_op_locatie.webp',
          alt: 'Autosleutelspecialist van Autosleutel24 met servicebus op locatie',
        }}
      >
        <VehicleWizard fallback={<LeadCaptureForm phone={SITE_CONFIG.phoneTel} theme="light" />} />
      </SplitHero>

      <section className="section">
        <div className="container" style={{ maxWidth: 780 }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Wie is er bij mij in de buurt?</h2>
          <NearestCity />
        </div>
      </section>

      <VerifiedReviewBanner />

      <ServiceAreaMap />

      <section className="section-alt">
        <div className="container">
          <h2 style={{ marginBottom: '0.75rem' }}>Onze servicegebieden per provincie</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 780 }}>
            Hieronder staan de plaatsen waar wij een vaste technicus hebben. Staat uw plaats er niet
            bij, dan betekent dat niet dat wij niet komen — het betekent dat er nog geen eigen pagina
            voor is. Bel met uw postcode.
          </p>
          {REGIONS.map((region) => (
            <div key={region} style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--gray-900)' }}>{region}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {CITIES.filter((c) => c.region === region).map((c) => (
                  <Link
                    key={c.slug}
                    href={`/steden/${c.slug}`}
                    style={{
                      padding: '0.45rem 0.85rem',
                      background: '#fff',
                      border: '1px solid rgba(15,23,42,0.10)',
                      borderRadius: '999px',
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      color: 'var(--gray-700)',
                    }}
                  >
                    {c.city}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '2rem' }}>Veelgestelde vragen</h2>
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
        </div>
      </section>
    </div>
  );
}
