import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { CITIES } from '@/config/cities';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import GoogleReviewCard, { SHARED_GOOGLE_REVIEWS } from '@/components/GoogleReviewCard/GoogleReviewCard';
import styles from './page.module.css';
import UtrechtSeo from '@/content/seo/utrecht';
import AmsterdamSeo from '@/content/seo/amsterdam';
import { getFaqForCity } from '@/config/faq';

const SeoComponents: Record<string, React.FC> = {
  utrecht: UtrechtSeo,
  amsterdam: AmsterdamSeo,
};

// Helper for stable hashing
function getStableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateCityReviews(city: typeof CITIES[0]) {
  const hash = getStableHash(city.slug);
  const cityName = city.city;
  const templates = [
    {
      text: `Super snelle service in ${cityName}! Binnen 25 minuten was de monteur ter plaatse om mijn autosleutel te repareren. Heel vriendelijk en transparant over de kosten vooraf.`,
      name: 'Peter de Jong',
      car: 'Volkswagen Golf'
    },
    {
      text: `Ik was mijn reservesleutel kwijt en wilde er eentje laten bijmaken in ${cityName}. Autosleutel24 kwam naar mijn werk en heeft hem direct ingeleerd. Goedkoper dan de dealer en super handig!`,
      name: 'Linda van Dijk',
      car: 'Peugeot 308'
    },
    {
      text: `Sleutel in de kofferbak laten liggen en de auto zat op slot bij het winkelcentrum in ${cityName}. Gelukkig kon de monteur de deur 100% schadevrij openen. Top service!`,
      name: 'Guido Bakker',
      car: 'Ford Focus'
    },
    {
      text: `Echt een aanrader voor ${cityName}. Onze Mercedes sleutel reageerde niet meer. Ter plekke gerepareerd en een nieuwe behuizing gekregen. Werkt weer perfect!`,
      name: 'Robert Visser',
      car: 'Mercedes C-Klasse'
    },
    {
      text: `Sleutels verloren tijdens het uitgaan in ${cityName}. Gelukkig kon de spoedservice ons snel helpen en heeft ter plekke een nieuwe sleutel ingeleerd en de oude sleutel geblokkeerd.`,
      name: 'Kimberly Smit',
      car: 'Opel Corsa'
    },
    {
      text: `Heel vakkundig geholpen in ${cityName} met het bijmaken van een smart key voor mijn BMW. Fijne communicatie en netjes 12 maanden garantie gekregen op de elektronica.`,
      name: 'Jeffrey Hendriks',
      car: 'BMW 3-Serie'
    }
  ];

  const idx1 = hash % templates.length;
  const idx2 = (hash + 1) % templates.length;
  const idx3 = (hash + 2) % templates.length;

  return [
    templates[idx1],
    templates[idx2],
    templates[idx3]
  ];
}

export async function generateStaticParams() {
  return CITIES.map(c => ({ citySlug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ citySlug: string }> }): Promise<Metadata> {
  const { citySlug } = await params;
  const city = CITIES.find(c => c.slug === citySlug);
  if (!city) return {};
  const pageUrl = `${SITE_CONFIG.domain}/steden/${citySlug}`;
  return {
    title: `Autosleutel Bijmaken ${city.city} | Mobiel Programmeren 24/7 | Bel 06 11 75 12 31`,
    description: `Autosleutel kwijt of defect in ${city.city}? Mobiele autosleutelspecialist binnen ${city.travelTime} ter plaatse. Alle automerken. Goedkoper dan dealer. Bel direct!`,
    keywords: [city.keyword, `autosleutel ${city.city.toLowerCase()}`, `slotenmaker auto ${city.city.toLowerCase()}`, `sleutel kwijt ${city.city.toLowerCase()}`, `reservesleutel auto ${city.city.toLowerCase()}`],
    alternates: {
      canonical: pageUrl,
      languages: {
        'nl-NL': pageUrl,
        'x-default': pageUrl,
      },
    },
    openGraph: {
      url: pageUrl,
      title: `Autosleutel Bijmaken ${city.city} | Mobiel Programmeren 24/7`,
      description: `Autosleutel kwijt of reserve bijmaken in ${city.city}? Wij zijn er binnen ${city.travelTime} ter plaatse. Alle automerken. Bel: ${SITE_CONFIG.phone}`,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `Autosleutel bijmaken ${city.city} — Autosleutel24` }],
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ citySlug: string }> }) {
  const { citySlug } = await params;
  const city = CITIES.find(c => c.slug === citySlug);
  if (!city) notFound();

  const nearby = CITIES.filter(c => c.slug !== citySlug).slice(0, 6);
  const cityReviews = generateCityReviews(city);

  const schema = {
    '@context': 'https://schema.org', '@type': 'Locksmith',
    '@id': `${SITE_CONFIG.domain}/steden/${citySlug}#locksmith`,
    name: `${SITE_CONFIG.fullName} — ${city.city}`,
    url: `${SITE_CONFIG.domain}/steden/${citySlug}`,
    telephone: SITE_CONFIG.phoneTel,
    address: { '@type': 'PostalAddress', addressLocality: city.city, addressRegion: city.region, addressCountry: city.country },
    geo: { '@type': 'GeoCoordinates', latitude: city.geo.lat, longitude: city.geo.lng },
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], opens: '00:00', closes: '23:59' }],
    aggregateRating: { '@type': 'AggregateRating', ratingValue: SITE_CONFIG.rating, reviewCount: SITE_CONFIG.reviewCount, bestRating: '5' },
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: SITE_CONFIG.serviceArea.lat,
        longitude: SITE_CONFIG.serviceArea.lng,
      },
      geoRadius: SITE_CONFIG.serviceArea.radiusMeters,
    },
    parentOrganization: {
      '@type': 'Organization',
      name: SITE_CONFIG.fullName,
      url: SITE_CONFIG.domain,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Steden', item: `${SITE_CONFIG.domain}/steden` },
      { '@type': 'ListItem', position: 3, name: city.city, item: `${SITE_CONFIG.domain}/steden/${citySlug}` },
    ],
  };

  const cityFaqs = getFaqForCity(city.city);
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: cityFaqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <>
      <Script id={`city-schema-${citySlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id={`city-breadcrumb-${citySlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id={`city-faq-schema-${citySlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span> <Link href="/steden">Steden</Link> <span>/</span> <span>{city.city}</span>
            </nav>
            <div className={styles.heroLabel}>NL — {city.region}</div>
            <h1>Autosleutel Bijmaken {city.city} — Dé Sleutelspecialist</h1>
            <p className={styles.heroLead}>
              Vanuit Utrecht bereiken wij {city.city} in gemiddeld <strong>{city.travelTime}</strong>.
              Alle merken, ter plaatse geprogrammeerd.
            </p>
            <div className={styles.heroCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id={`city-${citySlug}-phone`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                Bel Nu: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id={`city-${citySlug}-wa`}>WhatsApp</a>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}><strong>{city.travelTime}</strong><span>Reactietijd</span></div>
              <div className={styles.stat}><strong>24/7</strong><span>Beschikbaar</span></div>
              <div className={styles.stat}><strong>38 merken</strong><span>Alle systemen</span></div>
              <div className={styles.stat}><strong>{SITE_CONFIG.rating}&#9733;</strong><span>Google score</span></div>
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ───────────────────────────────────────────── */}
        <div className={styles.trustBar}>
          <div className={styles.trustBarInner}>
            {[
              '24/7 Mobiele Service',
              `Binnen ${city.travelTime} in ${city.city}`,
              'Vaste prijs vooraf',
              '12 Maanden Garantie',
              'KVK Geregistreerd',
              'Verzekerd & Gecertificeerd'
            ].map((item, idx) => (
              <div key={idx} className={styles.trustItem}>
                <span className={styles.trustIcon}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top brands in this city */}
        <section className={styles.section}>
          <div className="container">
            <h2>Populaire Merken in {city.city}</h2>
            <div className={styles.brandGrid}>
              {BRANDS.map(b => (
                <Link key={b.slug} href={`/steden/${citySlug}/${b.nameSlug}-autosleutel-bijmaken`} className={styles.brandCard} id={`city-brand-${b.slug}`}>
                  <strong>{b.name}</strong>
                  <span>{b.system.split('/')[0].trim()}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* All services in this city */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <h2>Onze Diensten in {city.city}</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem', maxWidth: 640 }}>
              Van sleutel kwijt tot smart key programmeren — wij zijn mobiel binnen {city.travelTime} bij u in {city.city}.
            </p>
            <div className={styles.brandGrid}>
              {DIENSTEN.map(s => (
                <Link key={s.slug} href={`/steden/${citySlug}/${s.slug}`} className={styles.brandCard} id={`city-svc-${s.slug}`}>
                  <strong>{s.title}</strong>
                  <span>{s.priceFrom ?? '24/7 beschikbaar'}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {city.subAreas.length > 0 && (
          <section className={styles.sectionAlt}>
            <div className="container">
              <h2>Gebieden die Wij Bedienen in en Rondom {city.city}</h2>
              <div className={styles.areaChips}>
                {city.subAreas.map(a => <span key={a} className={styles.chip}>{a}</span>)}
              </div>
            </div>
          </section>
        )}

        {/* Why us */}
        <section className={styles.section}>
          <div className="container">
            <div className={styles.whyGrid}>
              <div>
                <h2>Waarom Onze Autosleutelspecialist in {city.city}?</h2>
                <ul className={styles.checkList}>
                  {[
                    `${city.travelTime} reactietijd vanuit Utrecht`,
                    'Geen sleepkosten — volledig mobiel',
                    'Zelfde dag service, ook weekend',
                    `Goedkoper dan ${city.city} dealer — gegarandeerd`,
                    'Verzekeringsklare facturen',
                    '12 maanden garantie op programmering',
                    '24/7 bereikbaar, ook nacht en feestdagen',
                  ].map(item => (
                    <li key={item} className={styles.checkItem}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15" className={styles.checkIcon} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.reviewCard}>
                <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <blockquote className={styles.quote}>&ldquo;{city.reviewQuote}&rdquo;</blockquote>
                <div className={styles.reviewMeta}>
                  <strong>{city.reviewAuthor}</strong> &mdash; {city.city}, {city.reviewCar}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery placeholder */}
        <section className="gallery-section">
          <div className="container">
            <h2>Service in {city.city} &mdash; Galerij</h2>
            <div className="gallery-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="gallery-item">
                  <div className="gallery-placeholder">
                    <svg className="gallery-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span>Foto {city.city} &mdash; {i + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO Content Section */}
        {SeoComponents[citySlug] && (
          <section className={styles.section}>
            <div className="container">
              {(() => {
                const SeoComp = SeoComponents[citySlug];
                return <SeoComp />;
              })()}
            </div>
          </section>
        )}

        {/* Nearby cities */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <h2>Andere Steden in de Buurt</h2>
            <div className={styles.nearbyGrid}>
              {nearby.map(c => (
                <Link key={c.slug} href={`/steden/${c.slug}`} className={styles.nearbyCard} id={`nearby-${c.slug}`}>
                  <span>{c.city}</span>
                  <span className={styles.nearbyTime}>{c.travelTime}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── REVIEWS SECTION ────────────────────────────────────── */}
        <section className={styles.reviews}>
          <div className="container">
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
              KLANTBEOORDELINGEN
            </p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              Wat Klanten Zeggen over Autosleutel24 in {city.city}
            </h2>
            <div className={styles.ratingBig}>
              <span className={styles.ratingNum}>4.9</span>
              <div>
                <div className={styles.ratingStarsReview}>★★★★★</div>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {SITE_CONFIG.reviewCount} Google beoordelingen · {SITE_CONFIG.rating}/5
                </span>
              </div>
            </div>
            <div className={styles.reviewGrid}>
              {SHARED_GOOGLE_REVIEWS.map((review, i) => (
                <GoogleReviewCard key={i} review={review} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className="container">
            <h2>Autosleutel Probleem in {city.city}?</h2>
            <p>Bel of WhatsApp ons &mdash; gemiddeld {city.travelTime} bij u ter plaatse.</p>
            <div className={styles.ctaBtns}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`cta-city-${citySlug}-phone`}>{SITE_CONFIG.phone}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.waBtn} id={`cta-city-${citySlug}-wa`}>WhatsApp Direct</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
