import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_CONFIG } from '@/config/site.config';
import { ARRIVAL } from '@/config/arrival';
import { CITIES } from '@/config/cities';
import { SERVICE_REGIONS } from '@/config/regions';
import { isNoindexCity } from '@/config/thinPages';
import { clampMeta } from '@/lib/meta';
import { breadcrumbSchema, getBaseLocalBusinessSchema } from '@/utils/schema';
import SplitHero from '@/components/SplitHero/SplitHero';
import HeroQuickFacts from '@/components/HeroQuickFacts/HeroQuickFacts';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VerifiedReviewBanner from '@/components/VerifiedReviewBanner/VerifiedReviewBanner';
import InstantServiceMap from '@/components/InstantServiceMap';

/*
 * One page per province the business wants to be found in.
 *
 * Someone in Rotterdam searching "autosleutel bijmaken zuid-holland", or a fleet
 * manager in Arnhem searching "autosleutel gelderland", should land on a page that
 * is about their province and names the towns they would recognise, not on a
 * national page or on a single city. These pages are the hub between the two: the
 * province, the towns in it with their neighbourhoods, and the links down to each.
 *
 * They are NOT a template with the province name swapped. What differs per page
 * comes from the city records (neighbourhoods, the local fact and the typical job
 * where one exists) and from which towns actually sit in that province, so a
 * Gelderland page lists Arnhem, Nijmegen and Apeldoorn and a Zuid-Holland page
 * lists Den Haag, Rotterdam and Delft. If a province has no record with a local
 * fact the section simply shows the towns; nothing is invented to fill it.
 *
 * "Randstad" is not a province. It is how people in Utrecht, Noord-Holland,
 * Zuid-Holland and Flevoland describe where they live, so the four pages that are
 * in it say so in a section of their own and link to each other.
 */

const RANDSTAD = new Set(['utrecht', 'noord-holland', 'zuid-holland', 'flevoland']);

export function generateStaticParams() {
  return SERVICE_REGIONS.map((r) => ({ regio: r.slug }));
}

const citiesIn = (name: string) =>
  CITIES.filter((c) => c.region === name && !isNoindexCity(c.slug)).sort((a, b) => {
    if (a.priority !== b.priority) return a.priority < b.priority ? -1 : 1;
    return a.city.localeCompare(b.city, 'nl');
  });

export async function generateMetadata(props: { params: Promise<{ regio: string }> }): Promise<Metadata> {
  const { regio } = await props.params;
  const region = SERVICE_REGIONS.find((r) => r.slug === regio);
  if (!region) return {};
  const towns = citiesIn(region.name).slice(0, 3).map((c) => c.city).join(', ');
  const url = `${SITE_CONFIG.domain}/regio/${region.slug}`;
  // /steden/utrecht already owns "Autosleutel Bijmaken Utrecht | …"; the province page must not repeat it.
  const title =
    region.slug === 'utrecht'
      ? `Autosleutel Provincie Utrecht | ${ARRIVAL.replace('min', 'Min')} Ter Plaatse`
      : `Autosleutel Bijmaken ${region.name} | ${ARRIVAL.replace('min', 'Min')} Ter Plaatse`;
  return {
    title: { absolute: title },
    description: clampMeta(
      `Autosleutel kwijt, kapot of bijmaken in ${region.name}? Binnen ${ARRIVAL} ter plaatse in ${towns} en omgeving. Vaste prijs vooraf, 24/7. Bel direct!`
    ),
    alternates: { canonical: url, languages: { 'nl-NL': url, 'x-default': url } },
    openGraph: {
      type: 'website',
      url,
      title,
      description: `Mobiele autosleutelspecialist in ${region.name}: kwijt, kapot of bijmaken, op locatie.`,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `Autosleutel bijmaken ${region.name} — Autosleutel24` }],
    },
  };
}

export default async function RegioPage(props: { params: Promise<{ regio: string }> }) {
  const { regio } = await props.params;
  const region = SERVICE_REGIONS.find((r) => r.slug === regio);
  if (!region) notFound();

  const cities = citiesIn(region.name);
  const top = cities.slice(0, 3).map((c) => c.city);
  const brands = [...new Set(cities.flatMap((c) => c.popularBrands ?? []))].slice(0, 5);
  const others = SERVICE_REGIONS.filter((r) => r.slug !== region.slug);
  const inRandstad = RANDSTAD.has(region.slug);
  const link = { color: 'var(--orange-600)', fontWeight: 600 } as const;

  const faq = [
    {
      q: `Komt u ook naar ${top.join(', ')} en de rest van ${region.name}?`,
      a: `Ja. Wij komen naar uw auto in heel ${region.name}, binnen ${ARRIVAL} ter plaatse, dag en nacht. Geef uw locatie door per telefoon of WhatsApp en u hoort direct hoe snel wij er zijn.`,
    },
    {
      q: `Wat kost een autosleutel bijmaken in ${region.name}?`,
      a: `Een reservesleutel begint bij €${SITE_CONFIG.prices.transponder}, een klapsleutel met afstandsbediening bij €${SITE_CONFIG.prices.klapsleutel} en een smart key bij €${SITE_CONFIG.prices.smartKey}. Zijn al uw sleutels kwijt, dan begint de prijs bij €${SITE_CONFIG.prices.allKeysLost}. U hoort de exacte prijs telefonisch voordat wij vertrekken.`,
    },
    {
      q: `Ik ben mijn autosleutel kwijt in ${region.name}. Moet de auto naar de dealer?`,
      a: 'Nee. Wij openen de auto schadevrij als hij op slot zit, lezen de sleutelcode uit en maken ter plaatse een nieuwe sleutel. Slepen naar de dealer is niet nodig.',
    },
    {
      q: `Voor welke automerken komt u in ${region.name}?`,
      a: `Voor alle gangbare merken${brands.length ? `, in ${region.name} vooral ${brands.join(', ')}` : ''}. Geef uw kenteken door en wij zoeken merk, model en bouwjaar zelf op.`,
    },
  ];

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_CONFIG.domain}/regio/${region.slug}#service`,
    name: `Autosleutel bijmaken en kwijt in ${region.name}`,
    serviceType: 'Autosleutel bijmaken, autosleutel kwijt, auto openen',
    url: `${SITE_CONFIG.domain}/regio/${region.slug}`,
    provider: getBaseLocalBusinessSchema(),
    areaServed: {
      '@type': 'AdministrativeArea',
      name: region.name,
      containsPlace: cities.map((c) => ({
        '@type': 'City',
        name: c.city,
        url: `${SITE_CONFIG.domain}/steden/${c.slug}`,
        geo: { '@type': 'GeoCoordinates', latitude: c.geo.lat, longitude: c.geo.lng },
      })),
    },
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const crumbs = breadcrumbSchema([
    { name: 'Werkgebied', path: '/steden' },
    { name: region.name, path: `/regio/${region.slug}` },
  ]);

  return (
    <div>
      <script id={`regio-service-${region.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script id={`regio-faq-${region.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script id={`regio-bc-${region.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />

      <SplitHero
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Werkgebied', href: '/steden' }, { label: region.name }]}
        titleTop={`Autosleutel Bijmaken in ${region.label}`}
        titleAccent={`Binnen ${ARRIVAL.replace('min', 'Min')} Ter Plaatse`}
        lead={`${region.intro} Sleutel kwijt, kapot of een reserve nodig? Wij komen naar uw auto.`}
        facts={<HeroQuickFacts price={`Vanaf €${SITE_CONFIG.prices.transponder}`} />}
        image={{
          src: '/images/seo/autosleutel24_autosleutelspecialist_op_locatie.webp',
          alt: 'Autosleutelspecialist van Autosleutel24 in bedrijfskleding op locatie, met servicebus op de achtergrond',
        }}
      >
        <LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" />
      </SplitHero>

      <VerifiedReviewBanner />

      <section style={{ maxWidth: 1100, margin: '2rem auto 0', padding: '0 1.25rem' }} aria-label={`Kaart van ons werkgebied, ook in ${region.name}`}>
        <h2 style={{ marginBottom: '1rem' }}>Ons werkgebied, ook in {region.name}</h2>
        <InstantServiceMap />
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 960 }}>
          <h2 style={{ marginBottom: '1rem' }}>Steden in {region.name} waar wij komen</h2>
          <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Kies uw stad voor de wijken, de werkwijze en de prijs. Staat uw plaats er niet bij, bel dan
            gewoon: wij komen ook naar de dorpen en gemeenten eromheen.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {cities.map((c) => (
              <li key={c.slug} style={{ border: '1px solid var(--gray-200)', borderRadius: 10, padding: '1rem', background: '#fff' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>
                  <Link href={`/steden/${c.slug}`} style={link}>{c.city}</Link>
                </h3>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.92rem', lineHeight: 1.55 }}>
                  {c.subAreas.slice(0, 4).join(', ')}
                </p>
                {c.localFact ? (
                  <p style={{ color: 'var(--gray-500)', fontSize: '0.88rem', lineHeight: 1.55, marginTop: '0.4rem' }}>
                    {c.localFact.split('. ')[0].replace(/\.$/, '')}.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-alt">
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '1rem' }}>Wat u in {region.name} van ons kunt verwachten</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="price-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Situatie</th>
                  <th style={{ textAlign: 'left', padding: '0.9rem' }}>Vanaf</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: '0.9rem' }}>Reservesleutel (transponder)</td><td style={{ padding: '0.9rem' }}><strong>€{SITE_CONFIG.prices.transponder}</strong></td></tr>
                <tr><td style={{ padding: '0.9rem' }}>Klapsleutel met afstandsbediening</td><td style={{ padding: '0.9rem' }}><strong>€{SITE_CONFIG.prices.klapsleutel}</strong></td></tr>
                <tr><td style={{ padding: '0.9rem' }}>Smart key / keyless</td><td style={{ padding: '0.9rem' }}><strong>€{SITE_CONFIG.prices.smartKey}</strong></td></tr>
                <tr><td style={{ padding: '0.9rem' }}>Alle sleutels kwijt</td><td style={{ padding: '0.9rem' }}><strong>€{SITE_CONFIG.prices.allKeysLost}</strong></td></tr>
              </tbody>
            </table>
          </div>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: '1rem' }}>
            Bedragen zijn {SITE_CONFIG.prices.exVatDisclaimer}, binnen {ARRIVAL} ter plaatse, met 12 maanden garantie. U hoort de exacte
            prijs telefonisch voordat wij vertrekken.{' '}
            <Link href="/prijzen" style={link}>Bekijk alle prijzen →</Link>
          </p>
        </div>
      </section>

      {inRandstad ? (
        <section className="section">
          <div className="container" style={{ maxWidth: 860 }}>
            <h2 style={{ marginBottom: '1rem' }}>Autosleutel bijmaken in de Randstad</h2>
            <p style={{ color: 'var(--gray-600)', lineHeight: 1.7 }}>
              Woont of werkt u in de Randstad, dan bent u met ons nooit ver van een monteur.
              Wij werken in {SERVICE_REGIONS.filter((r) => RANDSTAD.has(r.slug)).map((r) => r.name).join(', ')} en komen naar uw auto, waar u ook
              staat. Kijk ook bij:{' '}
              {others.filter((r) => RANDSTAD.has(r.slug)).map((r, i, all) => (
                <span key={r.slug}>
                  <Link href={`/regio/${r.slug}`} style={link}>{r.name}</Link>
                  {i < all.length - 1 ? ', ' : '.'}
                </span>
              ))}
            </p>
          </div>
        </section>
      ) : null}

      <section className={inRandstad ? 'section-alt' : 'section'}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h2 style={{ marginBottom: '2rem' }}>Veelgestelde vragen: autosleutel in {region.name}</h2>
          {faq.map((f, i) => (
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
            Alles over een verloren sleutel staat op{' '}
            <Link href="/autosleutel-kwijt" style={link}>autosleutel kwijt</Link>, de werkwijze voor een tweede sleutel op{' '}
            <Link href="/diensten/autosleutel-bijmaken" style={link}>autosleutel bijmaken</Link>. Andere provincies:{' '}
            {others.map((r, i) => (
              <span key={r.slug}>
                <Link href={`/regio/${r.slug}`} style={link}>{r.name}</Link>
                {i < others.length - 1 ? ', ' : '.'}
              </span>
            ))}
          </p>
        </div>
      </section>
    </div>
  );
}
