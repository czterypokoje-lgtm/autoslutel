import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import SplitHero from '@/components/SplitHero/SplitHero';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';
import { DIENSTEN, REDIRECTED_SERVICE_SLUGS } from '@/config/diensten';
import { CITIES } from '@/config/cities';

/*
 * A page about WHO we are, not about what we do.
 *
 * Every other page on the site answers a job: bijmaken, kwijt, openen. This
 * one answers a different kind of search. "sleutelmaker" (262 impressions,
 * position 10), "auto slotenmaker" (172), "mobiele slotenmaker" (147),
 * "mobiele sleutelservice" (127) -- 708 impressions of people looking for a
 * PERSON to call, who have not yet named their problem. Landing them on a
 * service page asks them to self-diagnose before we have earned the call.
 *
 * It also settles a word. Dutch searchers use sleutelmaker, slotenmaker and
 * sleutelservice for the same trade, and Google has been rewriting our city
 * titles to say "Sleutelmaker" no matter what we wrote -- so the words
 * belong on one page that explains the difference honestly rather than
 * scattered as synonyms across sixty.
 */

export const metadata: Metadata = {
  title: { absolute: 'Mobiele Sleutelmaker voor Auto’s | Komt Naar U Toe' },
  description: `Mobiele sleutelmaker of slotenmaker nodig voor uw auto? Wij komen naar uw locatie, openen schadevrij en maken sleutels ter plaatse. Vanaf €${SITE_CONFIG.prices.transponder}, 24/7.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/mobiele-sleutelmaker`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/mobiele-sleutelmaker`,
      'x-default': `${SITE_CONFIG.domain}/mobiele-sleutelmaker`,
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.domain}/mobiele-sleutelmaker`,
    title: 'Mobiele Sleutelmaker voor Auto’s | Komt Naar U Toe',
    description:
      'Mobiele sleutelmaker voor auto’s: wij komen naar uw locatie, openen schadevrij en maken sleutels ter plaatse. 24/7 in heel Nederland.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Mobiele sleutelmaker — Autosleutel24' }],
  },
};

const faqItems = [
  {
    q: 'Wat is het verschil tussen een sleutelmaker, een slotenmaker en een autosleutelspecialist?',
    a: 'In het dagelijks taalgebruik nauwelijks iets, maar het werk verschilt wel. Een slotenmaker richt zich vaak op huis- en bedrijfssloten. Een sleutelmaker kopieert sleutels. Een autosleutelspecialist doet het derde stuk dat een moderne auto nodig heeft: de elektronica — de transponderchip en de startonderbreker inleren, zodat de sleutel niet alleen past maar de auto ook start. Wij doen alle drie, maar dan voor auto’s.',
  },
  {
    q: 'Wat betekent “mobiel” precies?',
    a: 'Dat er geen winkel is waar u naartoe moet. De werkplaats zit in de bus: freesmachine, diagnoseapparatuur, sleutelvoorraad en programmeersoftware. Wij rijden naar uw auto — thuis, op het werk, op de parkeerplaats of langs de weg — en doen het werk daar. Uw auto hoeft niet gesleept te worden, en dat scheelt meestal meer dan de klus zelf kost.',
  },
  {
    q: 'Kunnen jullie ook gewoon een sleutel kopiëren?',
    a: 'Ja, maar bij vrijwel elke auto van na 1998 is kopiëren alleen niet genoeg. De baard kan dan wel passen in het portier, maar zonder de juiste transpondercode start de motor niet. Wij frezen én programmeren, zodat u een sleutel krijgt die alles doet wat uw originele deed.',
  },
  {
    q: 'Hoe weet ik of jullie bij mij in de buurt komen?',
    a: 'Wij werken in een groeiend netwerk van vaste technici door heel Nederland. Bel of app met uw postcode, dan hoort u direct wie uw regio doet en wanneer hij er kan zijn. Op de stedenpagina staat waar wij vandaag actief zijn.',
  },
  {
    q: 'Zijn jullie ook ’s nachts en in het weekend bereikbaar?',
    a: 'Ja, 24 uur per dag en zeven dagen per week, ook op feestdagen. De prijs hoort u vooraf aan de telefoon en die geldt ongeacht het tijdstip.',
  },
  {
    q: 'Wat kost het om een mobiele sleutelmaker te laten komen?',
    a: `Voorrijden zit bij de prijs in. Een auto schadevrij openen begint bij €${SITE_CONFIG.prices.unlock}, een sleutel bijmaken bij €${SITE_CONFIG.prices.transponder}, en heeft u geen enkele sleutel meer dan begint het bij €${SITE_CONFIG.prices.allKeysLost}. U krijgt de exacte prijs telefonisch voordat wij vertrekken; zegt u nee, dan betaalt u niets.`,
  },
];

export default function MobieleSleutelmaker() {
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
      { '@type': 'ListItem', position: 2, name: 'Mobiele sleutelmaker', item: `${SITE_CONFIG.domain}/mobiele-sleutelmaker` },
    ],
  };
  /*
   * Locksmith rather than Service: this page is about the trade and the
   * people, which is the node that carries `sameAs` to the Google Business
   * Profile and can be matched against a "sleutelmaker in de buurt" search.
   */
  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Locksmith',
    '@id': `${SITE_CONFIG.domain}/mobiele-sleutelmaker#locksmith`,
    name: `${SITE_CONFIG.fullName} — mobiele sleutelmaker`,
    description:
      'Mobiele sleutelmaker en autoslotenmaker: wij komen naar de auto toe, openen schadevrij en frezen en programmeren sleutels ter plaatse.',
    telephone: SITE_CONFIG.phoneTel,
    url: `${SITE_CONFIG.domain}/mobiele-sleutelmaker`,
    areaServed: { '@type': 'Country', name: 'Nederland' },
    parentOrganization: { '@id': `${SITE_CONFIG.domain}/#localbusiness` },
  };

  return (
    <div>
      <script id="sm-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="sm-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script id="sm-biz" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Mobiele sleutelmaker' }]}
        titleTop="Mobiele Sleutelmaker voor Auto’s"
        titleAccent="Geen Winkel — Wij Komen Naar U Toe"
        lead="Zoekt u een sleutelmaker of slotenmaker voor uw auto? Onze werkplaats zit in de bus: frezen, programmeren en schadevrij openen gebeuren bij uw auto, niet achter een toonbank."
        image={{
          src: '/images/seo/autosleutel24_autosleutelspecialist_op_locatie.webp',
          alt: 'Autosleutelspecialist van Autosleutel24 in bedrijfskleding op locatie, met servicebus op de achtergrond',
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
          Een mobiele sleutelmaker komt naar uw auto in plaats van andersom. Wij openen schadevrij
          vanaf €{SITE_CONFIG.prices.unlock}, maken en programmeren een sleutel vanaf €
          {SITE_CONFIG.prices.transponder}, en werken ook als er geen enkele sleutel meer is vanaf €
          {SITE_CONFIG.prices.allKeysLost}. Voorrijden zit bij de prijs in en u betaalt geen
          sleepkosten, want de auto blijft staan waar hij staat.
        </p>
        <VehicleWizard fallback={<LeadCaptureForm phone={SITE_CONFIG.phoneTel} theme="light" />} />
      </SplitHero>

      <VerifiedReviewBanner />

      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '1rem' }}>Sleutelmaker, slotenmaker of autosleutelspecialist?</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Nederlanders gebruiken die drie woorden door elkaar en dat is prima — u zoekt iemand die
            het oplost, niet een functietitel. Toch zit er verschil in. Een slotenmaker werkt vooral
            aan huis- en bedrijfssloten. Een sleutelmaker kopieert sleutels. Bij een moderne auto is
            dat samen nog niet genoeg: de sleutel moet ook <em>elektronisch</em> bij de auto horen,
            anders gaat het portier wel open maar start de motor niet.
          </p>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginTop: '1rem' }}>
            Dat derde stuk — de transponderchip inleren in de startonderbreker — is waar wij ons op
            richten. Vandaar dat wij alle drie de woorden gebruiken en geen van drieën helemaal
            dekt wat er in de bus staat.
          </p>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Waarvoor bellen mensen ons het vaakst?</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {DIENSTEN.filter((d) => !REDIRECTED_SERVICE_SLUGS.has(d.slug))
              .slice(0, 8)
              .map((d) => (
                <Link
                  key={d.slug}
                  href={`/diensten/${d.slug}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '0.9rem 1.1rem',
                    background: '#fff',
                    border: '1px solid rgba(15,23,42,0.10)',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'var(--gray-800)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{d.title}</span>
                  <span style={{ color: 'var(--orange-600)', whiteSpace: 'nowrap' }}>
                    {d.priceFrom ?? 'Bekijk'} →
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '2rem' }}>Veelgestelde vragen</h2>
          {faqItems.map((f, i) => (
            <details key={i} className="faq-item">
              <summary className="faq-question">
                {f.q}
                <svg
                  className="faq-chevron"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <p className="faq-answer">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section-alt">
        <div className="container">
          <div className="seo-hub-box">
            <div className="seo-hub-grid">
              <div>
                <div className="seo-hub-title">Wat wij doen</div>
                <div className="seo-hub-col">
                  {DIENSTEN.filter((d) => !REDIRECTED_SERVICE_SLUGS.has(d.slug)).map((d) => (
                    <Link key={d.slug} href={`/diensten/${d.slug}`} className="seo-hub-link">
                      {`${d.title} →`}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="seo-hub-title">Sleutelmaker in uw stad</div>
                <div className="seo-hub-col">
                  <Link href="/steden" className="seo-hub-link" style={{ fontWeight: 'bold' }}>
                    Bekijk alle steden →
                  </Link>
                  {CITIES.filter((c) => c.priority === 'P1')
                    .slice(0, 10)
                    .map((c) => (
                      <Link key={c.slug} href={`/steden/${c.slug}`} className="seo-hub-link">
                        {`Sleutelmaker ${c.city} →`}
                      </Link>
                    ))}
                </div>
              </div>
              <div>
                <div className="seo-hub-title">Meer weten</div>
                <div className="seo-hub-col">
                  <Link href="/autosleutel-kwijt" className="seo-hub-link">Autosleutel kwijt →</Link>
                  <Link href="/autosleutel-gestolen" className="seo-hub-link">Autosleutel gestolen →</Link>
                  <Link href="/prijzen" className="seo-hub-link">Wat kost het? →</Link>
                  <Link href="/over-ons" className="seo-hub-link">Wie zijn wij? →</Link>
                  <Link href="/beoordelingen" className="seo-hub-link">Beoordelingen →</Link>
                  <Link href="/kennisbank" className="seo-hub-link">Kennisbank →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
