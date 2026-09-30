import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import { BRANDS } from '@/config/brands';
import { isNoindexBrand } from '@/config/thinPages';
import SplitHero from '@/components/SplitHero/SplitHero';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';

/*
 * "Laten maken" is the biggest keyword family in Search Console for this
 * site: 17,314 impressions across 212 queries between 13 Jul and 30 Sep 2026,
 * average position 47, six clicks. Almost all of it is a brand or a city put
 * in front of "sleutel laten maken" ("bmw sleutel laten maken", "auto sleutel
 * laten maken"), and it was landing on 404s and on pages that never used the
 * phrase.
 *
 * This page is deliberately NOT a second copy of /diensten/autosleutel-bijmaken.
 * That page is the transactional one. This one answers the question that sits
 * in front of it — where do I have a car key made, and what does each route
 * cost me in time and money — and then hands every brand-shaped query to the
 * brand page through a link that says "laten maken". If it starts ranking for
 * plain "autosleutel bijmaken" instead, fold it into that page.
 */

export const metadata: Metadata = {
  title: { absolute: 'Autosleutel Laten Maken: Dealer, Slotenmaker of Mobiel?' },
  description: `Autosleutel laten maken? Vergelijk dealer, slotenmaker en mobiele specialist op prijs en tijd. Bij ons vanaf €${SITE_CONFIG.prices.transponder}, op locatie, met 12 maanden garantie.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/autosleutel-laten-maken`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/autosleutel-laten-maken`,
      'x-default': `${SITE_CONFIG.domain}/autosleutel-laten-maken`,
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.domain}/autosleutel-laten-maken`,
    title: 'Autosleutel laten maken: dealer, slotenmaker of mobiel?',
    description:
      'Drie manieren om een autosleutel te laten maken, wat elke route kost en hoe lang het duurt.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Autosleutel laten maken — Autosleutel24' }],
  },
};

const faqItems = [
  {
    q: 'Waar kan ik een autosleutel laten maken?',
    a: 'Bij de merkdealer, bij een slotenmaker met werkplaats, of bij een mobiele autosleutelspecialist die naar u toe komt. Bij de dealer wordt de sleutel meestal besteld en moet de auto er vaak naartoe; een mobiele specialist frest en programmeert de sleutel op uw eigen locatie, bijvoorbeeld op de oprit of op uw werk.',
  },
  {
    q: 'Wat heb ik nodig om een autosleutel te laten maken?',
    a: 'Twee documenten: een geldig legitimatiebewijs (paspoort, ID-kaart of rijbewijs) en het kentekenbewijs (deel 1B of de kentekencard) waaruit blijkt dat u de rechtmatige eigenaar bent. Zonder deze documenten maken wij geen sleutels bij. Verder hoeft u alleen uw kenteken door te geven; merk, model en bouwjaar zoeken wij zelf op.',
  },
  {
    q: 'Kan ik een autosleutel laten maken als ik alle sleutels kwijt ben?',
    a: `Ja. Zonder werkende sleutel moet de sleutelcode uit de auto worden gelezen en een nieuwe sleutel op die code worden gefreesd en ingeleerd. Dat is meer werk dan een tweede sleutel bij een werkende, daarom begint de prijs dan bij €${SITE_CONFIG.prices.allKeysLost}. Alles staat op de pagina autosleutel kwijt.`,
  },
  {
    q: 'Moet mijn auto naar een garage om een sleutel te laten maken?',
    a: 'Niet bij ons. Wij komen met een volledig uitgeruste servicebus naar uw auto, frezen de baard en programmeren de sleutel via de OBD-poort. U hoeft niet te slepen en niet te wachten op een bestelling.',
  },
  {
    q: 'Wat als mijn sleutel kapot is in plaats van kwijt?',
    a: 'Dan hoeft u vaak geen nieuwe sleutel. Losse knoppen, een gebarsten behuizing of een lege batterij zijn meestal snel te verhelpen en goedkoper dan vervangen. Kijk bij autosleutel repareren, behuizing vervangen of batterij vervangen.',
  },
  {
    q: 'Wat kost het om een autosleutel te laten maken?',
    a: `Een transpondersleutel begint bij €${SITE_CONFIG.prices.transponder}, een klapsleutel met afstandsbediening bij €${SITE_CONFIG.prices.klapsleutel}, een smart key bij €${SITE_CONFIG.prices.smartKey}. U hoort de exacte prijs telefonisch voordat wij vertrekken. Gemiddeld is dat 30-50% goedkoper dan de officiële merkdealer.`,
  },
];

const indexedBrands = BRANDS.filter((b) => !isNoindexBrand(b.nameSlug));

export default function AutosleutelLatenMaken() {
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
      { '@type': 'ListItem', position: 2, name: 'Autosleutel laten maken', item: `${SITE_CONFIG.domain}/autosleutel-laten-maken` },
    ],
  };

  return (
    <div>
      <script id="lm-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="lm-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Autosleutel laten maken' }]}
        titleTop="Autosleutel Laten Maken?"
        titleAccent="Kies de Route die bij Uw Situatie Past"
        lead="Een nieuwe autosleutel laat u maken bij de dealer, bij een slotenmaker of bij een specialist die naar u toe komt. Het verschil zit in tijd, prijs en of uw auto ergens naartoe moet."
        facts={<HeroQuickFacts price={`Vanaf €${SITE_CONFIG.prices.transponder}`} />}
        image={{
          src: '/images/seo/autosleutel_specialist_utrecht_amsterdam_background.webp',
          alt: 'Sleutelwand met autosleutels per merk in de servicebus van Autosleutel24',
        }}
      >
        <p
          data-direct-answer
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.15rem',
            background: 'var(--gray-50)',
            borderLeft: '3px solid var(--orange-500)',
            borderRadius: '8px',
            fontSize: '0.98rem',
            lineHeight: 1.65,
            color: 'var(--gray-700)',
          }}
        >
          Een autosleutel laten maken kan bij de dealer, een slotenmaker of een mobiele
          specialist. Wij komen naar uw locatie, frezen en programmeren de sleutel ter plekke, vanaf
          €{SITE_CONFIG.prices.transponder}, met 12 maanden garantie.
        </p>
        <VehicleWizard fallback={<LeadCaptureForm phone={SITE_CONFIG.phoneTel} theme="light" />} />
      </SplitHero>

      <VerifiedReviewBanner />
      <BrandsMarquee />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Drie manieren om een autosleutel te laten maken</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="price-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Route</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Hoe het gaat</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Let op</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.9rem' }}><strong>Merkdealer</strong></td>
                  <td style={{ padding: '0.9rem' }}>Sleutel wordt besteld en ingeleerd bij de dealer</td>
                  <td style={{ padding: '0.9rem' }}>Vaak een afspraak, soms slepen, doorgaans de hoogste prijs</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}><strong>Slotenmaker met werkplaats</strong></td>
                  <td style={{ padding: '0.9rem' }}>U komt langs; frezen is meestal mogelijk</td>
                  <td style={{ padding: '0.9rem' }}>Programmeren kan niet elke slotenmaker voor elk merk</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}><strong>Mobiele specialist (Autosleutel24)</strong></td>
                  <td style={{ padding: '0.9rem' }}>Wij komen naar uw auto, frezen en programmeren ter plekke</td>
                  <td style={{ padding: '0.9rem' }}>Gemiddeld 30-50% goedkoper dan de dealer, 12 maanden garantie</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginTop: '1.25rem' }}>
            Welke route past, hangt af van uw situatie. Heeft u nog een werkende sleutel, dan is een
            tweede sleutel de goedkoopste oplossing. Is uw sleutel kwijt, dan leest een specialist de
            code uit de auto. Is hij alleen kapot, kijk dan eerst of{' '}
            <Link href="/diensten/autosleutels-repareren" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              autosleutel repareren
            </Link>{' '}
            volstaat.
          </p>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1rem' }}>Wat heeft u nodig om een autosleutel te laten maken?</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Om diefstal te voorkomen maken wij alleen een sleutel bij voor de rechtmatige eigenaar.
            Houd daarom twee dingen bij de hand: een geldig legitimatiebewijs en het kentekenbewijs
            (deel 1B of de kentekencard). Uw kenteken is genoeg om merk, model en bouwjaar op te
            zoeken, dus u hoeft niet te weten welk type sleutel uw auto heeft.
          </p>
          <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
            <table className="price-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Type sleutel laten maken</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Vanaf</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: '0.9rem' }}>Transpondersleutel</td><td style={{ padding: '0.9rem' }}><strong>€{SITE_CONFIG.prices.transponder}</strong></td></tr>
                <tr><td style={{ padding: '0.9rem' }}>Klapsleutel met afstandsbediening</td><td style={{ padding: '0.9rem' }}><strong>€{SITE_CONFIG.prices.klapsleutel}</strong></td></tr>
                <tr><td style={{ padding: '0.9rem' }}>Smart key / keyless</td><td style={{ padding: '0.9rem' }}><strong>€{SITE_CONFIG.prices.smartKey}</strong></td></tr>
                <tr><td style={{ padding: '0.9rem' }}>Alle sleutels kwijt</td><td style={{ padding: '0.9rem' }}><strong>€{SITE_CONFIG.prices.allKeysLost}</strong></td></tr>
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '1rem' }}>
            Bedragen zijn {SITE_CONFIG.prices.exVatDisclaimer} en afhankelijk van merk, model en
            bouwjaar. U hoort de exacte prijs telefonisch voordat wij vertrekken.{' '}
            <Link href="/prijzen" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              Bekijk het volledige prijsoverzicht →
            </Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1rem' }}>Autosleutel laten maken per merk</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            Elk merk heeft een eigen sleutelsysteem. Kies uw merk voor de modellen, de bouwjaren en
            wat er bij uw auto komt kijken.
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '0.6rem 1rem',
            }}
          >
            {indexedBrands.map((b) => (
              <li key={b.nameSlug}>
                <Link
                  href={`/merken/${b.nameSlug.toLowerCase()}-autosleutel-bijmaken`}
                  style={{ color: 'var(--orange-600)', fontWeight: 600 }}
                >
                  {b.name} sleutel laten maken
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '2rem' }}>Veelgestelde vragen: autosleutel laten maken</h2>
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
            Weet u al wat u nodig heeft? Alles over prijs, werkwijze en garantie staat op{' '}
            <Link href="/diensten/autosleutel-bijmaken" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              autosleutel bijmaken
            </Link>
            . Is uw sleutel weg, begin dan bij{' '}
            <Link href="/autosleutel-kwijt" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              autosleutel kwijt
            </Link>
            . Wilt u weten waarom een kopie niet altijd start, lees dan{' '}
            <Link href="/autosleutel-kopieren" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              autosleutel kopiëren
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
