import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import Image from 'next/image';
import { CITIES } from '@/config/cities';
import { BRANDS } from '@/config/brands';
import { DIENSTEN } from '@/config/diensten';
import BrandsLogoGrid from '@/components/BrandsLogoGrid/BrandsLogoGrid';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import GoogleReviewCard from '@/components/GoogleReviewCard/GoogleReviewCard';
import { generateContextualReviews } from '@/utils/reviews';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import CitySeoText from '@/components/CitySeoText/CitySeoText';
import styles from './page.module.css';
import UtrechtSeo from '@/content/seo/utrecht';
import AmsterdamSeo from '@/content/seo/amsterdam';
import DenHaagSeo from '@/content/seo/den-haag';
import RotterdamSeo from '@/content/seo/rotterdam';
import { getFaqForCity } from '@/config/faq';
import FaqSection from '@/components/FaqSection/FaqSection';

const SeoComponents: Record<string, React.FC> = {
  utrecht: UtrechtSeo,
  amsterdam: AmsterdamSeo,
  'den-haag': DenHaagSeo,
  rotterdam: RotterdamSeo,
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
    title: {
      absolute: city.customMetaTitle || `Autosleutel Bijmaken & Sleutelmaker ${city.city} | 24/7`,
    },
    description: city.customMetaDesc || `Autosleutel kwijt of defect in ${city.city}? Mobiele autosleutelspecialist binnen ${city.travelTime} ter plaatse. Alle automerken. Goedkoper dan dealer. Bel direct!`,
    keywords: [city.keyword, `autosleutel ${city.city.toLowerCase()}`, `slotenmaker auto ${city.city.toLowerCase()}`, `autosleutel kwijt ${city.city.toLowerCase()}`, `reservesleutel auto ${city.city.toLowerCase()}`],
    alternates: {
      canonical: pageUrl,
      languages: {
        'nl-NL': pageUrl,
        'x-default': pageUrl,
      },
    },
    openGraph: {
      type: 'website',
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
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: parseFloat(SITE_CONFIG.rating),
      reviewCount: parseInt(SITE_CONFIG.reviewCount, 10),
      bestRating: 5,
    },
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
  const mappedFaqs = cityFaqs.map(f => ({ question: f.q, answer: f.a }));

  const imagePath = path.join(process.cwd(), 'public', 'images', `autosleutel-bijmaken-${citySlug}.webp`);
  const hasHeroImage = fs.existsSync(imagePath);

  return (
    <>
      <Script id={`city-schema-${citySlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id={`city-breadcrumb-${citySlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* Hero */}
        {hasHeroImage ? (
          <section className={styles.heroUtrecht}>
            <div className={styles.heroUtrechtInner}>
              <div className={styles.heroUtrechtText}>
                <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                  <Link href="/" style={{ color: 'var(--gray-500)' }}>Home</Link> <span style={{ color: 'var(--gray-400)' }}>/</span> <Link href="/steden" style={{ color: 'var(--gray-500)' }}>Steden</Link> <span style={{ color: 'var(--gray-400)' }}>/</span> <span style={{ color: 'var(--navy-900)' }}>{city.city}</span>
                </nav>
                <div className={styles.heroLabel} style={{ color: 'var(--orange-600)' }}>NL — {city.region}</div>
                <h1>{city.customH1 || `Autosleutel Bijmaken & Sleutelmaker ${city.city} — 24/7 Service`}</h1>
                <p className={styles.heroUtrechtLead}>
                  Wij zijn gemiddeld binnen <strong>{city.travelTime}</strong> bij u in {city.city}.
                  Alle merken, ter plaatse geprogrammeerd.
                </p>
                <LeadCaptureForm city={city.city} phone={SITE_CONFIG.phone} theme="light" />
              </div>
              <div className={styles.heroUtrechtImage}>
                <Image 
                  src={`/images/autosleutel-bijmaken-${city.slug}.webp`}
                  alt={`Autosleutel bijmaken ${city.city} - 24/7 service op locatie`}
                  width={800}
                  height={450}
                  style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
                  priority
                />
              </div>
            </div>
          </section>
        ) : (
          <section className={styles.hero}>
            <div className={styles.heroInner}>
              <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                <Link href="/">Home</Link> <span>/</span> <Link href="/steden">Steden</Link> <span>/</span> <span>{city.city}</span>
              </nav>
              <div className={styles.heroLabel}>NL — {city.region}</div>
              <h1>{city.customH1 || `Autosleutel Bijmaken & Sleutelmaker ${city.city} — 24/7 Service`}</h1>
              <p className={styles.heroLead}>
                Wij zijn gemiddeld binnen <strong>{city.travelTime}</strong> bij u in {city.city}.
                Alle merken, ter plaatse geprogrammeerd.
              </p>
              <LeadCaptureForm city={city.city} phone={SITE_CONFIG.phone} />
            </div>
          </section>
        )}

        {/* ── TRUST BAR ───────────────────────────────────────────── */}
        <div className={styles.trustBar}>
          <div className={styles.trustBarInner}>
            {[
              '24/7 Mobiele Service',
              `Binnen ${city.travelTime} in ${city.city}`,
              'Vaste prijs vooraf',
              '12 Maanden Garantie',
              `KVK ${SITE_CONFIG.kvk}`,
              'Verzekerd & Gecertificeerd'
            ].map((item, idx) => (
              <div key={idx} className={styles.trustItem}>
                <span className={styles.trustIcon}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* ── BRANDS MARQUEE ──────────────────────────────────────── */}
        <BrandsMarquee />

        {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
        <HowItWorks cityName={city.city} />

        {/* ── LOKALE ERVARING — Unique content per city ─────────────── */}
        {(city.localFact || city.popularBrands || city.commonJob) && (
          <section className={styles.sectionAlt} style={{ padding: '2.5rem 0' }}>
            <div className="container">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>

                {city.localFact && (
                  <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>📍</div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--gray-800)' }}>Lokale Ervaring in {city.city}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>{city.localFact}</p>
                  </div>
                )}

                {city.popularBrands && (
                  <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>🚗</div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gray-800)' }}>Meest gevraagde merken in {city.city}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {city.popularBrands.map(brand => (
                        <span key={brand} style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: '999px', padding: '0.25rem 0.75rem', fontSize: '0.82rem', fontWeight: 600 }}>{brand}</span>
                      ))}
                    </div>
                  </div>
                )}

                {city.commonJob && (
                  <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem' }}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>🔑</div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--gray-800)' }}>Meest voorkomende opdracht</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: 0 }}>{city.commonJob}</p>
                    {city.avgJobDuration && (
                      <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--color-primary)', fontWeight: 600, margin: '0.5rem 0 0' }}>⏱ Gemiddelde werktijd: {city.avgJobDuration}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Top brands in this city (SEO List) */}
        <BrandsLogoGrid
          title={`Welke Merken Bedienen Wij in ${city.city}?`}
          subtitle={`Wij maken en programmeren autosleutels voor alle gangbare automerken direct ter plaatse in ${city.city}. Onze mobiele dealer-niveau apparatuur ondersteunt:`}
        />

        {/* All services in this city */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <h2>Onze Diensten in {city.city}</h2>
            <p className={styles.seoIntro}>
              Heeft u met spoed een autosleutel nodig of bent u uw sleutels kwijt in {city.city}? Wij bieden de volgende diensten op locatie:
            </p>
            <div className={styles.nearbyGrid}>
              {DIENSTEN.map(s => (
                <Link key={s.slug} href={`/diensten/${s.slug}`} className={styles.nearbyCard}>
                  <span>{s.title} in {city.city}</span>
                  <span className={styles.nearbyTime}>{s.priceFrom || '24/7 Actief'}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.tableTitle}>Waarom Ons? Bespaar 30–50% vs Dealer in {city.city}</h2>
            <p className={styles.tableDesc}>
              Dealer-niveau apparatuur, transparante prijzen, dezelfde dag service. Wij komen naar u toe in {city.city}.
            </p>
            <div className={styles.comparisonWrapper}>
              <table className={styles.comparisonTable}>
                <thead>
                  <tr>
                    <th>Vergelijking</th>
                    <th>Dealer in {city.city}</th>
                    <th className={styles.tableHighlight}>Autosleutel24 ✓</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Prijs</td>
                    <td>€300 – €900</td>
                    <td className={styles.tableHighlight}>€150 – €500</td>
                  </tr>
                  <tr>
                    <td>Wachttijd</td>
                    <td>3 – 14 dagen</td>
                    <td className={styles.tableHighlight}>Zelfde dag in {city.city}</td>
                  </tr>
                  <tr>
                    <td>Sleepkosten</td>
                    <td>€100 – €150</td>
                    <td className={styles.tableHighlight}>Geen (wij komen naar u)</td>
                  </tr>
                  <tr>
                    <td>Garantie</td>
                    <td>Ja</td>
                    <td className={styles.tableHighlight}>12 maanden</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

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

        {/* SEO Gallery */}
        <section className="gallery-section">
          <div className="container">
            <h2>Service in {city.city} &mdash; Galerij</h2>
            <div className="gallery-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="gallery-item">
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
                    <Image
                      src={`/images/cities/${citySlug}/autosleutel-bijmaken-${citySlug}-${i + 1}.webp`}
                      alt={`Autosleutel bijmaken op locatie - Foto ${i + 1}`}
                      fill
                      unoptimized={true}
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                    <Script id={`gallery-gps-${citySlug}-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{
                      __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ImageObject",
                        "contentUrl": `https://autosleutel24.nl/images/cities/${citySlug}/autosleutel-bijmaken-${citySlug}-${i + 1}.webp`,
                        "name": `Autosleutel bijmaken ${city.city} - Foto ${i + 1}`,
                        "description": `Autosleutel bijmaken, inleren en programmeren op locatie in ${city.city}.`,
                        "contentLocation": {
                          "@type": "Place",
                          "name": city.city,
                          "geo": {
                            "@type": "GeoCoordinates",
                            "latitude": parseFloat(city.geo.lat),
                            "longitude": parseFloat(city.geo.lng)
                          }
                        }
                      })
                    }} />
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

        {/* Neighborhoods / Nearby cities SEO block */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <h2>Waar Komen Wij voor Auto Slotenmaker in {city.city}?</h2>
            <p className={styles.seoIntro}>
              Als dé mobiele <strong>auto slotenmaker</strong> zijn wij actief in regio {city.region} en omstreken. Heeft u uw <strong>sleutel in auto</strong> laten liggen, heeft u hulp nodig bij het <strong>autodeur openen</strong> zonder schade, of moeten we een <strong>autosleutel bijmaken</strong> of <strong>autosleutels repareren</strong>? Binnen gemiddeld {city.travelTime} staan wij voor u klaar in:
            </p>
            <ul className={styles.seoList}>
              {city.subAreas.length > 0 ? (
                city.subAreas.map(area => {
                  const areaLower = area.toLowerCase();
                  const cityLower = city.city.toLowerCase();
                  const displayName = areaLower.startsWith(cityLower) ? area : `${city.city} ${area}`;
                  
                  return (
                    <li key={area}>
                      <strong>{displayName}</strong>
                    </li>
                  );
                })
              ) : (
                nearby.map(c => (
                  <li key={c.slug}>
                    <Link href={`/steden/${c.slug}`}>
                      <strong>{c.city}</strong>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        {/* ── COMPREHENSIVE CITY SEO GUIDE ARTICLE ── */}
        <section style={{ padding: '3.5rem 0', background: '#ffffff' }}>
          <div className="container">
            <CitySeoText cityName={city.city} travelTime={city.travelTime} />
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
              {generateContextualReviews(city.city, 'city').map((review, i) => (
                <GoogleReviewCard key={i} review={review} />
              ))}
            </div>
          </div>
        </section>



        {/* FAQ SECTION */}
        <FaqSection customFaqs={mappedFaqs} cityName={city.city} />

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
