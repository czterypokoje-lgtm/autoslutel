import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import { ARRIVAL, ARRIVAL_TITLE } from '@/config/arrival';
import SplitHero from '@/components/SplitHero/SplitHero';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';

/*
 * One page for motorcycle and scooter keys, not ten brand pages.
 *
 * The brand audit cut twelve car brands that had no Dutch market and no
 * impressions, and this replaces that space with the ten motorcycle brands
 * that are actually on Dutch roads. It is deliberately a single page: ten
 * near-identical brand pages is the same scaled-content pattern that took the
 * 664 model pages out, and a rider searching "motorsleutel bijmaken" wants one
 * answer, not a directory.
 *
 * NO price is printed. SITE_CONFIG.prices has no motorcycle row and a number
 * invented for one page is exactly what that config exists to prevent. Add one
 * and this page can carry it.
 *
 * Two things to confirm with the technicians before relying on this page:
 * which of the ten brands they can program on the spot, and that the wording
 * below about key types matches what they see in practice. The brand notes are
 * general on purpose; they name a system only where it is well documented.
 *
 * Search Console has no motorcycle queries in its top 1,000 yet, so this page
 * is built on the brief, not on demand data. Judge it on impressions after
 * 60 days, the same way the brand audit holds brands.
 */

export const metadata: Metadata = {
  title: { absolute: `Motorsleutel Bijmaken of Kwijt? ${ARRIVAL_TITLE}` },
  description: `Motorsleutel bijmaken of kwijt? Honda, Yamaha, Kawasaki, BMW, Harley en meer: binnen ${ARRIVAL} ter plaatse, prijs telefonisch vooraf. Bel direct!`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/motorsleutel-bijmaken`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/motorsleutel-bijmaken`,
      'x-default': `${SITE_CONFIG.domain}/motorsleutel-bijmaken`,
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.domain}/motorsleutel-bijmaken`,
    title: 'Motorsleutel bijmaken of kwijt? Wij komen naar uw motor toe',
    description: 'Motorsleutel of scootersleutel bijmaken, ook als u er geen meer heeft. Op locatie, prijs vooraf.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Motorsleutel bijmaken — Autosleutel24' }],
  },
};

const brands = [
  { name: 'Honda', note: 'Van scooters als de PCX en Forza tot de CBR en Africa Twin. Veel Honda\'s hebben een startonderbreker (HISS), waarbij een nieuwe sleutel moet worden ingeleerd.' },
  { name: 'Yamaha', note: 'Van de NMAX en X-Max tot de MT- en R-serie. Bij modellen met een startonderbreker werkt een gefreesde sleutel alleen als hij ook is ingeleerd.' },
  { name: 'Kawasaki', note: 'Ninja, Z en Versys. Sommige modellen hebben een gecodeerde sleutel, nieuwere modellen een keyless systeem.' },
  { name: 'Suzuki', note: 'Van de Burgman en Address tot de GSX- en V-Strom-serie. Wij kijken per model of het om een gewone of een gecodeerde sleutel gaat.' },
  { name: 'BMW Motorrad', note: 'R, F, S en K-serie. Oudere modellen hebben een gecodeerde sleutel, bij nieuwere modellen is keyless ride mogelijk.' },
  { name: 'Harley-Davidson', note: 'Bij veel modellen werkt een sleutelhanger die met de motor is gekoppeld; een nieuwe moet bij de motor worden ingeleerd.' },
  { name: 'Ducati', note: 'Monster, Multistrada, Panigale en Scrambler. Afhankelijk van model en bouwjaar een gecodeerde sleutel of hands-free.' },
  { name: 'KTM', note: 'Duke, Adventure en SMC. Wij kijken per model en bouwjaar welk type sleutel en welke koppeling erbij hoort.' },
  { name: 'Triumph', note: 'Street Triple, Speed Triple, Tiger en Bonneville. Afhankelijk van het model een gecodeerde sleutel of keyless.' },
  { name: 'Vespa en Piaggio', note: 'Scooters met kenteken. Bel of app met merk, model en bouwjaar, dan horen wij wat voor sleutel erbij hoort.' },
];

const faqItems = [
  {
    q: 'Kan een motorsleutel worden bijgemaakt?',
    a: 'Meestal wel. Bij een motor zonder startonderbreker volstaat het frezen van de sleutel. Zit er een chip in, dan moet de nieuwe sleutel ook worden ingeleerd, anders past hij wel maar start de motor niet. Aan merk, model en bouwjaar zien wij welk van de twee bij u past.',
  },
  {
    q: 'Ik ben mijn motorsleutel kwijt en heb geen reservesleutel. Wat nu?',
    a: 'Bel of app ons met merk, model, bouwjaar en kenteken. Of dat op locatie kan, hangt af van het model. U hoort het direct en u krijgt de prijs telefonisch voordat wij komen, zodat u niet voor verrassingen komt te staan. Wij beloven niet iets voor een model waarvan wij het niet zeker weten.',
  },
  {
    q: 'Wat heb ik nodig om een motorsleutel te laten maken?',
    a: 'Twee documenten: een geldig legitimatiebewijs en het kentekenbewijs (deel 1B of de kentekencard) waaruit blijkt dat u de rechtmatige eigenaar bent. Zonder deze documenten maken wij geen sleutels bij.',
  },
  {
    q: 'Komt u ook bij mij thuis of op locatie?',
    a: `Ja. Wij komen naar uw motor toe, bij u thuis, op uw werk of langs de weg, binnen ${ARRIVAL} ter plaatse. U hoeft de motor niet te vervoeren.`,
  },
  {
    q: 'Wat kost een motorsleutel bijmaken?',
    a: 'Dat hangt af van het merk, het model en of er een chip in zit. Wij noemen u telefonisch een vaste prijs voordat wij vertrekken.',
  },
  {
    q: 'Kunt u ook een scootersleutel maken?',
    a: 'Ja, voor scooters met kenteken van onder meer Vespa, Piaggio, Honda en Yamaha. Bel of app met merk, model en bouwjaar, dan horen wij wat mogelijk is.',
  },
];

export default function MotorsleutelBijmaken() {
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
      { '@type': 'ListItem', position: 2, name: 'Motorsleutel bijmaken', item: `${SITE_CONFIG.domain}/motorsleutel-bijmaken` },
    ],
  };
  const link = { color: 'var(--orange-600)', fontWeight: 600 } as const;

  return (
    <div>
      <script id="motor-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="motor-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Motorsleutel bijmaken' }]}
        titleTop="Motorsleutel Bijmaken of Kwijt?"
        titleAccent="Wij Komen Naar Uw Motor Toe"
        lead="Sleutel van uw motor of scooter kwijt of kapot, of een reserve nodig? Wij maken hem op locatie bij en leren hem in, zodat u niet hoeft te slepen of dagen te wachten."
        facts={<HeroQuickFacts />}
        image={{
          src: '/images/seo/autosleutel24_autosleutelspecialist_op_locatie.webp',
          alt: 'Autosleutelspecialist van Autosleutel24 in bedrijfskleding op locatie, met servicebus op de achtergrond',
        }}
      >
        <LeadCaptureForm phone={SITE_CONFIG.phoneTel} theme="light" hideDirect />
      </SplitHero>

      <VerifiedReviewBanner />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1.25rem' }}>De tien meest gereden motormerken</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Elk merk heeft een eigen sleutelsysteem en binnen een merk verschilt het per model en
            bouwjaar. Dit zijn de merken waar wij het meest naar gevraagd worden.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
            {brands.map((b) => (
              <li key={b.name}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{b.name} sleutel bijmaken</h3>
                <p style={{ color: 'var(--gray-600)', lineHeight: 1.65 }}>{b.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Uw sleutel is kwijt of kapot: wat past bij u?</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="price-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Uw situatie</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Wat wij doen</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Reservesleutel nodig</td>
                  <td style={{ padding: '0.9rem' }}>Frezen, en inleren als er een chip in zit</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Sleutel kwijt, nog één over</td>
                  <td style={{ padding: '0.9rem' }}>Een tweede sleutel bijmaken: de goedkoopste route</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Alle sleutels kwijt</td>
                  <td style={{ padding: '0.9rem' }}>Per model bekijken wat op locatie kan; prijs telefonisch vooraf</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Sleutel kapot of batterij leeg (keyless)</td>
                  <td style={{ padding: '0.9rem' }}>Behuizing of batterij vervangen, vaak zonder nieuwe sleutel</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '1rem' }}>
            Bedragen hangen af van merk, model en bouwjaar. U hoort de prijs telefonisch voordat wij
            vertrekken.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '2rem' }}>Veelgestelde vragen: motorsleutel bijmaken</h2>
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
            Gaat het om een auto? Zie{' '}
            <Link href="/diensten/autosleutel-bijmaken" style={link}>autosleutel bijmaken</Link>{' '}
            of{' '}
            <Link href="/autosleutel-kwijt" style={link}>autosleutel kwijt</Link>. Een kapotte sleutel
            kunt u laten repareren via{' '}
            <Link href="/diensten/autosleutels-repareren" style={link}>autosleutel repareren</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
