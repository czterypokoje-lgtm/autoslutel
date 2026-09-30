import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import SplitHero from '@/components/SplitHero/SplitHero';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';

/*
 * "Kopiëren" is close enough to "bijmaken" to be dangerous, so this page is
 * deliberately not another bijmaken page.
 *
 * 798 impressions for the kopiëren family and today a 404. The word matters
 * because of what the searcher believes: copying is what a shoe-repair shop
 * does for three euros while you wait, and that expectation is why people
 * are surprised by the price of a car key. So the page answers the question
 * behind the word — what copying does and does not get you on a car built
 * after about 1998 — and sends the transactional half to
 * /diensten/autosleutel-bijmaken rather than competing with it.
 *
 * If this ever starts ranking for plain "autosleutel bijmaken" instead of
 * for kopiëren, it should be folded into that page, not kept alongside it.
 */

export const metadata: Metadata = {
  title: { absolute: 'Autosleutel Kopiëren: Wanneer Kan Het en Wanneer Niet?' },
  description: `Autosleutel kopiëren? Bij een auto van na 1998 past de kopie wel, maar start de motor niet zonder de chip in te leren. Wat wél werkt, vanaf €${SITE_CONFIG.prices.transponder}.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/autosleutel-kopieren`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/autosleutel-kopieren`,
      'x-default': `${SITE_CONFIG.domain}/autosleutel-kopieren`,
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.domain}/autosleutel-kopieren`,
    title: 'Autosleutel Kopiëren: Wanneer Kan Het en Wanneer Niet?',
    description:
      'Een autosleutel kopiëren is meer dan de baard naslijpen. Wat er bij een moderne auto écht nodig is, en wat het kost.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Autosleutel kopiëren — Autosleutel24' }],
  },
};

const faqItems = [
  {
    q: 'Kan ik mijn autosleutel gewoon laten kopiëren bij de schoenmaker?',
    a: 'De baard wel, de rest niet. Een sleutelslijper kopieert het metalen profiel, waarmee u het portier opent en de sleutel in het contact past. Maar bij vrijwel elke auto van na 1998 zit er een transponderchip in de kop die zich bij de startonderbreker moet melden. Die chip wordt niet meegeslepen. Resultaat: de sleutel past, de motor start niet.',
  },
  {
    q: 'Wat is dan het verschil met bijmaken?',
    a: 'Kopiëren gaat over het metaal, bijmaken over het geheel. Wij frezen de baard én leren de chip in de boordcomputer in, zodat de nieuwe sleutel alles doet wat uw originele doet: openen, starten en meestal ook de afstandsbediening.',
  },
  {
    q: 'Wanneer is alleen kopiëren wél genoeg?',
    a: 'Bij auto’s van ruwweg voor 1998 zonder startonderbreker, en bij een tweede sleutel die u alleen als noodsleutel gebruikt om het portier te openen — bijvoorbeeld een reservesleutel voor in de garage. Voor alles wat moet kunnen starten is programmeren nodig.',
  },
  {
    q: 'Hoe weet ik of mijn sleutel een chip heeft?',
    a: 'Bijna zeker wel als de auto na 1998 is gebouwd, als er een startknop is, of als er een vergrendelingsknop op de sleutel zit. Twijfelt u: geef ons uw kenteken door, dan zoeken wij merk, model en bouwjaar op en zeggen wij welk type sleutel erbij hoort.',
  },
  {
    q: 'Wat kost een autosleutel kopiëren en programmeren?',
    a: `Een transpondersleutel frezen en inleren begint bij €${SITE_CONFIG.prices.transponder}. Een klapsleutel met afstandsbediening vanaf €${SITE_CONFIG.prices.klapsleutel}, een smart key vanaf €${SITE_CONFIG.prices.smartKey}. Heeft u geen enkele werkende sleutel meer, dan moet de code uit de auto gelezen worden en begint het bij €${SITE_CONFIG.prices.allKeysLost}.`,
  },
  {
    q: 'Kan ik online een sleutel kopen en die laten programmeren?',
    a: 'Soms. Een lege behuizing of een blanco sleutel van goede kwaliteit kunnen wij programmeren. Veel goedkope aanbiedingen zijn echter niet geschikt voor het betreffende model of bevatten een chip die niet te beschrijven is; dan bent u het geld kwijt en staat de auto er nog. Wij leveren liever de sleutel erbij, met 12 maanden garantie op onderdeel en programmering.',
  },
];

export default function AutosleutelKopieren() {
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
      { '@type': 'ListItem', position: 2, name: 'Autosleutel kopiëren', item: `${SITE_CONFIG.domain}/autosleutel-kopieren` },
    ],
  };

  return (
    <div>
      <script id="kop-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="kop-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Autosleutel kopiëren' }]}
        titleTop="Autosleutel Kopiëren?"
        titleAccent="De Baard Is het Makkelijke Deel"
        lead="Een autosleutel kopiëren klinkt als het naslijpen van een stuk metaal. Bij een moderne auto is dat hooguit de helft van het werk — de andere helft zit in een chip ter grootte van een rijstkorrel."
        facts={<HeroQuickFacts price={`Vanaf €${SITE_CONFIG.prices.transponder}`} />}
        image={{
          src: '/images/seo/autosleutel_specialist_utrecht_amsterdam_background.webp',
          alt: 'Sleutelwand met honderden sleutelbaarden en transponderbehuizingen per automerk',
        }}
      >
        <VehicleWizard fallback={<LeadCaptureForm phone={SITE_CONFIG.phoneTel} theme="light" />} />
      </SplitHero>

      <VerifiedReviewBanner />
      <BrandsMarquee />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1rem' }}>Waarom kopiëren alleen niet genoeg is</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Een autosleutel bestaat sinds eind jaren negentig uit twee dingen die los van elkaar
            werken. Het eerste is de baard: het gefreesde profiel dat mechanisch in het slot past.
            Dat is wat een sleutelslijper kopieert, en dat kost een paar euro.
          </p>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginTop: '1rem' }}>
            Het tweede is de transponder — een passieve chip in de kop van de sleutel zonder eigen
            batterij. Draait u de sleutel om, dan wekt een spoel rond het contactslot die chip op en
            vraagt om een code. Klopt het antwoord niet, dan draait de startmotor wel maar krijgt de
            motor geen brandstof of ontsteking. Die code staat in de startonderbreker van úw auto en
            wordt nergens meegeslepen.
          </p>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginTop: '1rem' }}>
            Daarom heet het bij ons geen kopiëren maar bijmaken: wij frezen de baard op de
            sleutelcode van uw auto en schrijven de nieuwe chip via de OBD-poort in het geheugen van
            de boordcomputer. Pas dan heeft u een tweede sleutel in plaats van een tweede stuk
            metaal.
          </p>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Wanneer kunt u waarmee volstaan?</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="price-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Situatie</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Wat er nodig is</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Vanaf</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Auto van vóór ±1998, geen startonderbreker</td>
                  <td style={{ padding: '0.9rem' }}>Alleen baard frezen</td>
                  <td style={{ padding: '0.9rem' }}>Vraag prijs</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Noodsleutel, alleen om het portier te openen</td>
                  <td style={{ padding: '0.9rem' }}>Alleen baard frezen</td>
                  <td style={{ padding: '0.9rem' }}>Vraag prijs</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Gewone tweede sleutel die moet starten</td>
                  <td style={{ padding: '0.9rem' }}>Frezen + transponder inleren</td>
                  <td style={{ padding: '0.9rem' }}><strong>€{SITE_CONFIG.prices.transponder}</strong></td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Klapsleutel met afstandsbediening</td>
                  <td style={{ padding: '0.9rem' }}>Frezen + chip + afstandsbediening koppelen</td>
                  <td style={{ padding: '0.9rem' }}><strong>€{SITE_CONFIG.prices.klapsleutel}</strong></td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Smart key / keyless</td>
                  <td style={{ padding: '0.9rem' }}>Programmeren in het keyless systeem</td>
                  <td style={{ padding: '0.9rem' }}><strong>€{SITE_CONFIG.prices.smartKey}</strong></td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Geen enkele werkende sleutel meer</td>
                  <td style={{ padding: '0.9rem' }}>Sleutelcode uit de auto lezen</td>
                  <td style={{ padding: '0.9rem' }}><strong>€{SITE_CONFIG.prices.allKeysLost}</strong></td>
                </tr>
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
          <h2 style={{ marginBottom: '2rem' }}>Veelgestelde vragen — autosleutel kopiëren</h2>
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
            Weet u al dat u een werkende tweede sleutel nodig heeft? Dan staat alles over prijs,
            werkwijze en garantie op{' '}
            <Link href="/diensten/autosleutel-bijmaken" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              autosleutel bijmaken
            </Link>
            . Heeft u helemaal geen sleutel meer, begin dan bij{' '}
            <Link href="/autosleutel-kwijt" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              autosleutel kwijt
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
