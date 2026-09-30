import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import SplitHero from '@/components/SplitHero/SplitHero';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';

/*
 * Search Console, 13 Jul - 30 Sep 2026, "sleutelkaart" and "keycard" queries:
 * renault keycard bijmaken (130 impressions, pos 64), ...kosten (81, pos 72),
 * renault sleutelkaart bijmaken nijmegen (76, pos 35), renault clio
 * sleutelkaart bijmaken (69, pos 62), renault scenic keycard bijmaken (69,
 * pos 67). About 425 impressions, no clicks. Every specialist in the results
 * for these queries has a page about the card by name and puts "kwijt of
 * kapot" in the title; /merken/renault-autosleutel-bijmaken has to cover every
 * Renault key at once and cannot lead with that wording.
 *
 * So this page takes the two situations the searcher is in — the card is gone,
 * or the card is broken — and the brand page keeps "bijmaken". The two link to
 * each other. No price is printed as "vanaf" here: a sleutelkaart is not one of
 * the price rows in SITE_CONFIG.prices and a number invented for one page is
 * exactly the contradiction the config exists to prevent. Set a sleutelkaart
 * row there and this page can carry it.
 */

export const metadata: Metadata = {
  title: { absolute: 'Renault Sleutelkaart Kwijt of Kapot? Nieuwe Kaart op Locatie' },
  description:
    'Renault sleutelkaart kwijt of kapot? Wij programmeren een nieuwe kaart op locatie, ook zonder enkele kaart. Prijs vooraf, 12 maanden garantie. Bel nu!',
  alternates: {
    canonical: `${SITE_CONFIG.domain}/renault-sleutelkaart-kwijt-of-kapot`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/renault-sleutelkaart-kwijt-of-kapot`,
      'x-default': `${SITE_CONFIG.domain}/renault-sleutelkaart-kwijt-of-kapot`,
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.domain}/renault-sleutelkaart-kwijt-of-kapot`,
    title: 'Renault sleutelkaart kwijt of kapot? Nieuwe kaart op locatie',
    description:
      'Renault keycard kwijt, kapot of herkent uw auto de kaart niet meer? Wij programmeren een nieuwe kaart bij u op locatie.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Renault sleutelkaart vervangen — Autosleutel24' }],
  },
};

const faqItems = [
  {
    q: 'Wat kost een nieuwe Renault sleutelkaart?',
    a: `De prijs hangt af van het model, het bouwjaar en het type kaart, en of u nog een werkende kaart heeft. Wij noemen u telefonisch een vaste prijs voordat wij vertrekken. Als richtlijn: een reservesleutel begint bij €${SITE_CONFIG.prices.transponder} en een complete oplossing als alle sleutels weg zijn bij €${SITE_CONFIG.prices.allKeysLost}. Gemiddeld is dat 30-50% goedkoper dan de dealer.`,
  },
  {
    q: 'Kan ik een Renault sleutelkaart laten maken als ik geen enkele kaart meer heb?',
    a: 'Ja. Zonder werkende kaart lezen wij de sleutelcode uit de boordcomputer van uw Renault en leren wij een nieuwe kaart in. Daarvoor komen wij naar uw auto; u hoeft niet te slepen. Wij vragen uw legitimatiebewijs en het kentekenbewijs om vast te stellen dat u de eigenaar bent.',
  },
  {
    q: 'Werkt mijn verloren kaart nog nadat er een nieuwe is ingeleerd?',
    a: 'Dat kunnen wij regelen. Bij het inleren van een nieuwe kaart kan de verloren kaart uit het systeem van de auto worden verwijderd, zodat iemand die hem vindt de auto niet kan starten. Of dat kan hangt af van het model; wij bespreken het vooraf.',
  },
  {
    q: 'Mijn auto zegt dat de kaart niet wordt herkend. Is de kaart kapot?',
    a: 'Niet altijd. Meestal is de batterij in de kaart leeg, of zit er te weinig contact door een versleten behuizing. Dat is goedkoper op te lossen dan met een nieuwe kaart. Herkent de auto de kaart daarna nog niet, dan controleren wij of de chip beschadigd is.',
  },
  {
    q: 'Kunt u een kapotte Renault sleutelkaart repareren?',
    a: 'Een lege batterij en een gebarsten behuizing wel: dat zijn de twee meest voorkomende oorzaken. Is de elektronica in de kaart zelf stuk, dan is een nieuwe kaart programmeren de betrouwbare route. Wij zeggen het eerlijk vooraf welke van de twee bij u past.',
  },
  {
    q: 'Hoe lang duurt het en komt u ook bij mij?',
    a: 'Het programmeren duurt meestal 30 tot 60 minuten op locatie. Wij werken in Utrecht, Amsterdam, Almere, Amersfoort, Den Haag, Rotterdam en de rest van Midden-Nederland; geef uw kenteken en postcode door en u hoort direct of en wanneer wij kunnen komen.',
  },
];

export default function RenaultSleutelkaart() {
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
      { '@type': 'ListItem', position: 2, name: 'Renault', item: `${SITE_CONFIG.domain}/merken/renault-autosleutel-bijmaken` },
      { '@type': 'ListItem', position: 3, name: 'Sleutelkaart kwijt of kapot', item: `${SITE_CONFIG.domain}/renault-sleutelkaart-kwijt-of-kapot` },
    ],
  };
  const link = { color: 'var(--orange-600)', fontWeight: 600 } as const;

  return (
    <div>
      <script id="rk-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="rk-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <SplitHero
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Renault', href: '/merken/renault-autosleutel-bijmaken' },
          { label: 'Sleutelkaart kwijt of kapot' },
        ]}
        titleTop="Renault Sleutelkaart Kwijt of Kapot?"
        titleAccent="Nieuwe Kaart, Ter Plekke Geprogrammeerd"
        lead="Zonder kaart start uw Renault niet en past de dealer-afspraak meestal niet in uw dag. Wij komen naar uw auto, lezen de code uit en leren een nieuwe kaart in."
        facts={<HeroQuickFacts />}
        image={{
          src: '/images/seo/autosleutel_specialist_utrecht_amsterdam_background.webp',
          alt: 'Autosleutelspecialist programmeert een Renault sleutelkaart bij een geparkeerde auto',
        }}
      >
        <VehicleWizard fallback={<LeadCaptureForm phone={SITE_CONFIG.phoneTel} theme="light" />} />
      </SplitHero>

      <VerifiedReviewBanner />

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Uw kaart is kwijt of kapot: wat past bij u?</h2>
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
                  <td style={{ padding: '0.9rem' }}>Kaart kwijt, nog één kaart over</td>
                  <td style={{ padding: '0.9rem' }}>Reservekaart programmeren: de goedkoopste route</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Alle kaarten kwijt of gestolen</td>
                  <td style={{ padding: '0.9rem' }}>Code uit de boordcomputer lezen en een nieuwe kaart inleren</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Auto herkent de kaart niet meer</td>
                  <td style={{ padding: '0.9rem' }}>Eerst de batterij en de behuizing controleren, dan pas de chip</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.9rem' }}>Kaart gebarsten of knoppen kapot</td>
                  <td style={{ padding: '0.9rem' }}>Behuizing vervangen, of een nieuwe kaart als de elektronica stuk is</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '1rem' }}>
            Kaarten zitten onder meer in Clio, Mégane, Scénic, Captur en Kadjar. Welk type uw auto
            heeft, zien wij aan uw kenteken. De prijs hoort u telefonisch voordat wij vertrekken;
            bedragen zijn {SITE_CONFIG.prices.exVatDisclaimer}.
          </p>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1rem' }}>Waarom een Renault kaart niet gewoon te kopiëren is</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
            De kaart is met uw auto gekoppeld. Er zit een chip in die de auto herkent, en die code
            staat in de boordcomputer van uw Renault. Een blanco kaart doet daarom niets totdat hij
            is ingeleerd. Wij doen dat via de OBD-poort, bij u op de oprit of parkeerplaats, met
            dezelfde apparatuur als de dealer.
          </p>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginTop: '1rem' }}>
            Is de kaart alleen kapot en niet weg, kijk dan eerst naar de goedkopere oplossingen:{' '}
            <Link href="/diensten/batterij-vervangen" style={link}>batterij vervangen</Link>,{' '}
            <Link href="/diensten/behuizing-vervangen" style={link}>behuizing vervangen</Link> of{' '}
            <Link href="/diensten/autosleutels-repareren" style={link}>autosleutel repareren</Link>. Is
            hij écht weg, ga dan naar{' '}
            <Link href="/autosleutel-kwijt" style={link}>autosleutel kwijt</Link>.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '2rem' }}>Veelgestelde vragen: Renault sleutelkaart kwijt of kapot</h2>
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
            Alle Renault-modellen, bouwjaren en sleutels staan op{' '}
            <Link href="/merken/renault-autosleutel-bijmaken" style={link}>Renault autosleutel bijmaken</Link>.
            Rijdt u een Dacia? Die gebruikt een vergelijkbare kaart, zie{' '}
            <Link href="/merken/dacia-autosleutel-bijmaken" style={link}>Dacia sleutelkaart bijmaken</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
