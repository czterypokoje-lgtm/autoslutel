import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site.config';
import SplitHero from '@/components/SplitHero/SplitHero';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
import { DIENSTEN, REDIRECTED_SERVICE_SLUGS } from '@/config/diensten';
import { BRANDS } from '@/config/brands';
import { CITIES } from '@/config/cities';

/*
 * Stolen is not the same job as lost, which is why this is not a section of
 * /autosleutel-kwijt.
 *
 * When a key is lost, nobody has it. When it is stolen, somebody has it, and
 * that person may also know which car it belongs to and where that car sleeps.
 * Everything on this page follows from that one difference: the police report
 * the insurer will ask for, wiping the stolen key from the immobiliser as the
 * point of the visit rather than a nicety, and the fact that a keyless car can
 * be taken without the key ever leaving the hallway.
 *
 * Search Console: 612 impressions at average position 50 over three months,
 * against a blog post that answers the question and sells nothing. The post
 * stays -- it is the informational half -- and links here.
 */

export const metadata: Metadata = {
  title: { absolute: 'Autosleutel Gestolen? Direct Blokkeren en Nieuwe Sleutel' },
  description: `Autosleutel gestolen? De dief kan uw auto starten. Wij wissen de gestolen sleutel uit de boordcomputer en maken ter plaatse een nieuwe, vanaf €${SITE_CONFIG.prices.allKeysLost}. 24/7.`,
  alternates: {
    canonical: `${SITE_CONFIG.domain}/autosleutel-gestolen`,
    languages: {
      'nl-NL': `${SITE_CONFIG.domain}/autosleutel-gestolen`,
      'x-default': `${SITE_CONFIG.domain}/autosleutel-gestolen`,
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_CONFIG.domain}/autosleutel-gestolen`,
    title: 'Autosleutel Gestolen? Direct Blokkeren en Nieuwe Sleutel',
    description:
      'Autosleutel gestolen? Wij wissen de gestolen sleutel uit de startonderbreker en maken ter plaatse een nieuwe. 24/7 op locatie.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Autosleutel gestolen — Autosleutel24' }],
  },
};

const faqItems = [
  {
    q: 'Mijn autosleutel is gestolen — wat moet ik als eerste doen?',
    a: 'Zet de auto als het kan op een plek met zicht of achter een poort, en doe aangifte bij de politie. Bel ons daarna: zolang de gestolen sleutel nog in de startonderbreker staat, kan wie hem heeft de auto gewoon starten. Wij komen naar de auto toe, wissen die sleutel uit het geheugen en leveren een nieuwe.',
  },
  {
    q: 'Waarom is aangifte doen belangrijk?',
    a: 'Uw verzekeraar vraagt er vrijwel altijd om bij diefstal, en zonder aangifte is een claim lastig. Het kost een paar minuten online of op het bureau. U krijgt van ons een gespecificeerde factuur die u samen met het proces-verbaalnummer kunt indienen.',
  },
  {
    q: 'Kan de dief mijn auto starten met de gestolen sleutel?',
    a: 'Ja, tot het moment dat die sleutel uit de startonderbreker gewist is. Dat is precies wat wij doen en het is het belangrijkste deel van het werk — een nieuwe sleutel laten maken zonder de oude te blokkeren lost het probleem niet op, het geeft u alleen een tweede sleutel naast die van de dief.',
  },
  {
    q: 'Wat kost het als mijn sleutel gestolen is?',
    a: `Heeft u nog een tweede werkende sleutel, dan is het een kwestie van de gestolen sleutel wissen en een nieuwe inleren: vanaf €${SITE_CONFIG.prices.transponder}. Is de gestolen sleutel uw enige sleutel, dan moet de sleutelcode uit de boordcomputer gelezen worden en begint het bij €${SITE_CONFIG.prices.allKeysLost}. U hoort de prijs telefonisch voordat wij vertrekken.`,
  },
  {
    q: 'Mijn auto is keyless — de sleutel lag binnen en is toch gebruikt',
    a: 'Dat is een relay-aanval: twee mensen met een versterker vangen het signaal van uw sleutel op door de voordeur heen en spelen het af bij de auto. De sleutel blijft dan gewoon in huis liggen. Bewaar hem in een Faraday-hoesje of blikken trommel, en overweeg een Ghost immobiliser — een extra code die met de knoppen in de auto ingevoerd moet worden voordat hij start.',
  },
  {
    q: 'Vergoedt mijn verzekering een gestolen autosleutel?',
    a: 'Bij WA+ (beperkt casco) en All Risk is diefstal van sleutels meestal gedekt, bij alleen WA niet. Het eigen risico verschilt per polis. Controleer ook of uw inboedelverzekering iets dekt als de sleutel bij een woninginbraak is meegenomen.',
  },
  {
    q: 'Moeten de sloten ook vervangen worden?',
    a: 'Meestal niet. Bij vrijwel alle auto’s van na 2000 zit de beveiliging in de elektronica, niet in het slot: zodra de sleutel uit de startonderbreker gewist is, start de auto er niet meer mee. Alleen als er ook een kentekenbewijs of adresgegevens zijn meegenomen adviseren wij verder te kijken dan de sleutel alleen.',
  },
  {
    q: 'Hoe snel kunnen jullie er zijn?',
    a: 'Wij zijn 24 uur per dag bereikbaar, ook ’s nachts en in het weekend. Bij diefstal gaat het om de tijd tussen nu en het moment dat de sleutel onbruikbaar is, dus dit is een spoedklus — bel, dan hoort u direct wanneer een monteur bij u kan zijn.',
  },
];

const steps = [
  { n: '1', title: 'Zet de auto veilig', desc: 'Als het kan achter een poort of in zicht. Verplaats hem niet ver — wij komen naar de auto toe.' },
  { n: '2', title: 'Doe aangifte', desc: 'Online of op het bureau. Uw verzekeraar vraagt om het proces-verbaalnummer.' },
  { n: '3', title: 'Bel ons', desc: 'Geef merk, model, bouwjaar en locatie door. U hoort direct de prijs en wanneer wij er zijn.' },
  { n: '4', title: 'Sleutel gewist, nieuwe erin', desc: 'Wij wissen de gestolen sleutel uit de startonderbreker en leren ter plaatse een nieuwe in.' },
];

export default function AutosleutelGestolen() {
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
      { '@type': 'ListItem', position: 2, name: 'Autosleutel gestolen', item: `${SITE_CONFIG.domain}/autosleutel-gestolen` },
    ],
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Autosleutel gestolen — blokkeren en vervangen op locatie',
    serviceType: 'Gestolen autosleutel uit de startonderbreker wissen en vervangen',
    provider: { '@id': `${SITE_CONFIG.domain}/#localbusiness` },
    areaServed: { '@type': 'Country', name: 'Nederland' },
    availableChannel: {
      '@type': 'ServiceChannel',
      servicePhone: SITE_CONFIG.phoneTel,
      serviceUrl: `${SITE_CONFIG.domain}/autosleutel-gestolen`,
    },
  };

  return (
    <div>
      <script id="gestolen-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id="gestolen-bc" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script id="gestolen-service" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Autosleutel gestolen' }]}
        titleTop="Autosleutel Gestolen?"
        titleAccent="Blokkeer Hem Voordat Iemand Anders Rijdt"
        lead="Bij diefstal telt iets anders dan bij verlies: iemand heeft uw sleutel. Wij komen naar uw auto toe, wissen de gestolen sleutel uit de startonderbreker en leveren ter plaatse een nieuwe."
        facts={<HeroQuickFacts price={`Vanaf €${SITE_CONFIG.prices.allKeysLost}`} />}
        image={{
          src: '/images/seo/autosleutel_specialist_utrecht_amsterdam_background.webp',
          alt: 'Sleutelwand in de werkplaats van Autosleutel24 met transpondersleutels per automerk',
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
          Is uw autosleutel gestolen, doe dan aangifte en laat de sleutel zo snel mogelijk uit de
          boordcomputer wissen — tot dat moment kan wie hem heeft de auto gewoon starten. Met een
          tweede werkende sleutel kost dat vanaf €{SITE_CONFIG.prices.transponder}; was de gestolen
          sleutel uw enige, dan lezen wij de sleutelcode uit de auto en begint het bij €
          {SITE_CONFIG.prices.allKeysLost}. Wij werken 24/7 op locatie.
        </p>
        <VehicleWizard hideContact fallback={<LeadCaptureForm phone={SITE_CONFIG.phoneTel} theme="light" hideDirect />} />
      </SplitHero>

      <VerifiedReviewBanner />
      <BrandsMarquee />

      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '1rem' }}>Wat u nu moet doen — in vier stappen</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Diefstal van een autosleutel is geen papierwerk dat kan wachten. Zolang de sleutel in
            het geheugen van de auto staat, is hij een werkende sleutel — waar hij ook is.
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1.25rem' }}>
            {steps.map((s) => (
              <li
                key={s.n}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.25rem 1fr',
                  gap: '1rem',
                  alignItems: 'start',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    borderRadius: '50%',
                    background: 'var(--orange-500)',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                  }}
                >
                  {s.n}
                </span>
                <span>
                  <strong style={{ display: 'block', color: 'var(--gray-900)' }}>{s.title}</strong>
                  <span style={{ color: 'var(--gray-600)', lineHeight: 1.6 }}>{s.desc}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '1rem' }}>Gestolen is niet hetzelfde als kwijt</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
            Raakt u een sleutel kwijt, dan heeft niemand hem. Wordt hij gestolen, dan heeft iemand
            hem — en bij een tas, jas of woninginbraak vaak ook uw adres of kentekenbewijs erbij.
            Daarom is het wissen van de oude sleutel hier niet het sluitstuk maar het doel van het
            bezoek: daarna is het ding in andermans zak een stuk plastic.
          </p>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginTop: '1rem' }}>
            Heeft u de sleutel simpelweg verloren en heeft niemand hem meegenomen, dan leest{' '}
            <Link href="/autosleutel-kwijt" style={{ color: 'var(--orange-600)', fontWeight: 600 }}>
              autosleutel kwijt
            </Link>{' '}
            prettiger: dezelfde techniek, minder haast. Wilt u weten hoe uw keyless auto zonder de
            sleutel geopend kan zijn, dan legt{' '}
            <Link
              href="/blog/faraday-pouch-bescherming-relay-attack"
              style={{ color: 'var(--orange-600)', fontWeight: 600 }}
            >
              de uitleg over relay-aanvallen
            </Link>{' '}
            uit hoe dat werkt en wat een Faraday-hoesje wel en niet tegenhoudt.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 900 }}>
          <h2 style={{ marginBottom: '2rem' }}>Veelgestelde vragen — autosleutel gestolen</h2>
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
                <div className="seo-hub-title">Andere diensten</div>
                <div className="seo-hub-col">
                  {DIENSTEN.filter((d) => !REDIRECTED_SERVICE_SLUGS.has(d.slug)).map((d) => (
                    <Link key={d.slug} href={`/diensten/${d.slug}`} className="seo-hub-link">
                      {`${d.title} →`}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="seo-hub-title">Automerken</div>
                <div className="seo-hub-col">
                  {BRANDS.filter((b) => b.priority === 'P1').map((b) => (
                    <Link
                      key={b.slug}
                      href={`/merken/${b.nameSlug.toLowerCase()}-autosleutel-bijmaken`}
                      className="seo-hub-link"
                    >
                      {`${b.name} autosleutel bijmaken →`}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="seo-hub-title">In de regio</div>
                <div className="seo-hub-col">
                  <Link href="/steden" className="seo-hub-link" style={{ fontWeight: 'bold' }}>
                    Bekijk alle steden →
                  </Link>
                  {CITIES.filter((c) => c.priority === 'P1')
                    .slice(0, 8)
                    .map((c) => (
                      <Link key={c.slug} href={`/steden/${c.slug}`} className="seo-hub-link">
                        {`Autosleutel gestolen ${c.city} →`}
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
