import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import Image from 'next/image';
import { CITIES } from '@/config/cities';
import { BRANDS } from '@/config/brands';
import { DIENSTEN } from '@/config/diensten';
const BrandsLogoGrid = dynamic(() => import('@/components/BrandsLogoGrid/BrandsLogoGrid'));
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
const GallerySlider = dynamic(() => import('@/components/GallerySlider/GallerySlider'));
import { REAL_GALLERY_PROJECTS } from '@/config/gallery';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import HeroTrustBadge from '@/components/HeroTrustBadge/HeroTrustBadge';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import CitySeoText from '@/components/CitySeoText/CitySeoText';
import FeatureCards from '@/components/FeatureCards/FeatureCards';
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

import GoogleReviewsCta from '@/components/GoogleReviewsCta/GoogleReviewsCta';
import { getBaseLocalBusinessSchema } from '@/utils/schema';

// Haversine distance formula
function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
    description: city.customMetaDesc || `Autosleutel kwijt of defect in ${city.city}? Mobiele autosleutelspecialist binnen 30-60 min ter plaatse. Alle automerken. Goedkoper dan dealer. Bel direct!`,
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
      description: `Autosleutel kwijt of reserve bijmaken in ${city.city}? Wij zijn er binnen 30-60 min ter plaatse. Alle automerken. Bel: ${SITE_CONFIG.phone}`,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `Autosleutel bijmaken ${city.city} — Autosleutel24` }],
    },
    other: {
      'geo.region': 'NL',
      'geo.placename': `${city.city}, Nederland`,
      'geo.position': `${city.geo.lat};${city.geo.lng}`,
      'ICBM': `${city.geo.lat}, ${city.geo.lng}`,
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ citySlug: string }> }) {
  const { citySlug } = await params;
  const city = CITIES.find(c => c.slug === citySlug);
  if (!city) notFound();

  // Find 3 geographically closest cities
  const closestCities = CITIES
    .filter(c => c.slug !== citySlug && c.geo && city.geo)
    .map(c => ({
      ...c,
      distance: getDistanceFromLatLonInKm(
        parseFloat(city.geo.lat), parseFloat(city.geo.lng),
        parseFloat(c.geo.lat), parseFloat(c.geo.lng)
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  const schema = {
    ...getBaseLocalBusinessSchema(),
    '@id': `${SITE_CONFIG.domain}/steden/${citySlug}#locksmith`,
    url: `${SITE_CONFIG.domain}/steden/${citySlug}`,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: city.geo.lat,
      longitude: city.geo.lng,
    },
    areaServed: {
      '@type': 'City',
      name: city.city,
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

  // Generate deterministic E-E-A-T local data
  const area1 = city.subAreas && city.subAreas.length > 0 ? city.subAreas[0] : `${city.city} Centrum`;
  const area2 = city.subAreas && city.subAreas.length > 1 ? city.subAreas[1] : `omgeving ${city.city}`;

  const imagePathWebp = path.join(process.cwd(), 'public', 'images', `autosleutel-bijmaken-${citySlug}.webp`);
  const imagePathPng = path.join(process.cwd(), 'public', 'images', `autosleutel-bijmaken-${citySlug}.png`);
  const imagePathJpg = path.join(process.cwd(), 'public', 'images', `autosleutel-bijmaken-${citySlug}.jpg`);
  
  let hasHeroImage = false;
  let heroImageExt = '.webp';
  
  if (fs.existsSync(imagePathWebp)) {
    hasHeroImage = true;
    heroImageExt = '.webp';
  } else if (fs.existsSync(imagePathPng)) {
    hasHeroImage = true;
    heroImageExt = '.png';
  } else if (fs.existsSync(imagePathJpg)) {
    hasHeroImage = true;
    heroImageExt = '.jpg';
  }

  return (
    <>
      <Script id={`city-schema-${citySlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id={`city-breadcrumb-${citySlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* Hero */}
        {hasHeroImage ? (
          <section className={styles.heroUtrecht}>
            <div className={styles.heroUtrechtInner}>
              <div className={styles.heroTopContent}>
                <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                  <Link href="/" style={{ color: 'var(--gray-500)' }}>Home</Link> <span style={{ color: 'var(--gray-400)' }}>/</span> <Link href="/steden" style={{ color: 'var(--gray-500)' }}>Steden</Link> <span style={{ color: 'var(--gray-400)' }}>/</span> <span style={{ color: 'var(--navy-900)' }}>{city.city}</span>
                </nav>
                <div style={{ marginBottom: '1.25rem', marginTop: '0.25rem' }}>
                  <HeroTrustBadge />
                </div>
                <h1>
                  {city.customH1 ? (
                    city.customH1
                  ) : (
                    <>Autosleutel Bijmaken & Sleutelmaker {city.city} — <span style={{ color: 'var(--orange-500)' }}>24/7 Service</span></>
                  )}
                </h1>
                <p className={styles.heroUtrechtLead}>
                  Wij zijn gemiddeld binnen <strong>{city.travelTime}</strong> bij u in {city.city}.
                  Alle merken, ter plaatse geprogrammeerd.
                </p>
              </div>

              <div className={styles.heroImageContent}>
                <Image 
                  src={`/images/autosleutel-bijmaken-${city.slug}${heroImageExt}`}
                  alt={`Autosleutel bijmaken ${city.city} - 24/7 service op locatie`}
                  width={800}
                  height={450}
                  style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
                  priority
                  fetchPriority="high"
                />
              </div>

              <div className={styles.heroBottomContent}>
                <LeadCaptureForm city={city.city} phone={SITE_CONFIG.phone} theme="light" />
              </div>
            </div>
          </section>
        ) : (
          <section className={styles.hero}>
            <div className={styles.heroInner}>
              <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                <Link href="/">Home</Link> <span>/</span> <Link href="/steden">Steden</Link> <span>/</span> <span>{city.city}</span>
              </nav>
              <div style={{ marginBottom: '1.25rem', marginTop: '0.25rem' }}>
                <HeroTrustBadge />
              </div>
              <h1>{city.customH1 || `Autosleutel Bijmaken & Sleutelmaker ${city.city} — 24/7 Service`}</h1>
              <p className={styles.heroLead}>
                Wij zijn gemiddeld binnen <strong>{city.travelTime}</strong> bij u in {city.city}.
                Alle merken, ter plaatse geprogrammeerd.
              </p>
              <LeadCaptureForm city={city.city} phone={SITE_CONFIG.phone} />
            </div>
          </section>
        )}

        {/* ── TRUST FEATURE CARDS ───────────────────────────────────────────── */}
        <div style={{ backgroundColor: '#f3f4f6', padding: '1px 0' }}>
          <FeatureCards 
            features={[
              {
                id: 'feature-1',
                icon: <Image src="/images/icon_van.webp" alt="Mobiele Service" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: '24/7 Mobiele Slotenmaker',
                description: `Wij rijden als lokale mobiele slotenmaker direct naar uw locatie in ${city.city} om u zonder vertraging weer op weg te helpen.`,
                linkText: 'Meer over mobiele service',
                linkUrl: '/diensten'
              },
              {
                id: 'feature-2',
                icon: <Image src="/images/icon_map.webp" alt="Werkgebied" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: `Snel ter plaatse in ${city.city}`,
                description: `Wij werken dagelijks in ${area1}, ${area2} en de rest van ${city.city}. Bel ons en u hoort meteen hoe snel een monteur bij u kan zijn.`,
                linkText: 'Vind een monteur',
                linkUrl: '#contact'
              },
              {
                id: 'feature-3',
                icon: <Image src="/images/icon_price.webp" alt="Vaste prijs" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: 'Ervaren & Vaste Prijs',
                description: `U krijgt vooraf een vaste prijs voor de klus in ${city.city}, zodat u nooit voor verrassingen komt te staan. Geen voorrijkosten, geen meerwerk achteraf.`,
                linkText: 'Bekijk onze tarieven',
                linkUrl: '/prijzen'
              },
              {
                id: 'feature-4',
                icon: <Image src="/images/icon_car_check.webp" alt="Garantie" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: '12 Maanden Garantie',
                description: 'Wij bieden standaard 12 maanden volledige garantie op al onze geleverde sleutels en het programmeren daarvan.',
                linkText: 'Bekijk waar wij service verlenen',
                linkUrl: '/steden'
              },
              {
                id: 'feature-5',
                icon: <Image src="/images/icon_insurance.webp" alt="Verzekerd" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: 'Verzekerd & Gecertificeerd',
                description: 'U bent 100% verzekerd. We werken samen met alle grote verzekeraars.',
                linkText: 'Lees meer over verzekering',
                linkUrl: '/blog/verzekering-dekt-autosleutel-vervangen'
              }
            ]}
          />
        </div>
        
        {/* ── BRANDS MARQUEE ──────────────────────────────────────── */}
        <BrandsMarquee />

        {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
        <HowItWorks cityName={city.city} />


        {/* Technician trust card — placed high for mobile conversions */}
        <section style={{ padding: '2.5rem 0', background: 'var(--color-bg-alt)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '2rem', alignItems: 'center' }}>
              <div>
                <p className="section-eyebrow" style={{ color: 'var(--color-primary)' }}>UW MONTEUR IN {city.city.toUpperCase()}</p>
                <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.5rem', marginTop: '0.25rem' }}>Berkan Acarol — Gecertificeerd Hoofdtechnicus</h2>
                <p style={{ color: 'var(--gray-700)', lineHeight: 1.6, marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Uw sleutelprobleem in {city.city} wordt persoonlijk opgelost door Berkan. Gecertificeerd op Autel IM608 Pro&nbsp;II en AVDI Abrites — dezelfde apparatuur als de officiële dealer, maar zonder de wachttijd en de hoge kosten.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: 1.7 }}>
                  <li style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span><span><strong>Autel IM608 Pro II &amp; AVDI Abrites</strong> — dealer-niveau apparatuur</span></li>
                  <li style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span><span><strong>Schadevrij werken</strong> — 12 maanden garantie op elk onderdeel</span></li>
                  <li style={{ display: 'flex', gap: '0.5rem' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span><span><strong>Vaste prijs vooraf</strong> — nooit een verrassingsrekening</span></li>
                </ul>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary" id={`city-berkan-phone-${city.slug}`}>📞 Bel Berkan: {SITE_CONFIG.phone}</a>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img
                  src="/images/team/berkan-acarol-autosleutelspecialist-utrecht.webp"
                  alt={`Berkan Acarol — Autosleutelspecialist ${city.city}`}
                  loading="lazy"
                  style={{ width: '100%', maxWidth: '300px', height: '200px', objectFit: 'cover', objectPosition: 'top', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SEO Gallery — max 3 city-relevant images */}
        <section style={{ padding: '4rem 0', background: 'var(--gray-50)', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '1rem', color: 'var(--navy-900)' }}>
              Service in {city.city} &mdash; Galerij
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--gray-600)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
              Een impressie van ons dagelijks werk: van sleutels inleren op locatie tot schadevrij openen van portieren in {city.city}.
            </p>
            {(() => {
              const citySpecific = REAL_GALLERY_PROJECTS.filter(p =>
                p.alt.toLowerCase().includes(city.city.toLowerCase()) ||
                p.src.toLowerCase().includes(citySlug)
              );
              const pool = citySpecific.length > 0 ? citySpecific : REAL_GALLERY_PROJECTS;
              return (
                <GallerySlider
                  images={pool.slice(0, 3).map(p => ({ src: p.src, caption: p.alt }))}
                  title=""
                />
              );
            })()}
          </div>
        </section>

        {/* Top brands in this city (SEO List) */}
        <BrandsLogoGrid
          title={`Welke Merken Bedienen Wij in ${city.city}?`}
          subtitle={`Wij maken en programmeren autosleutels voor alle gangbare automerken direct ter plaatse in ${city.city}. Onze mobiele dealer-niveau apparatuur ondersteunt:`}
        />

        {/* All services in this city */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Onze Diensten in {city.city}</h2>
            <div className={styles.serviceCardsGrid}>
              <Link href={`/diensten/autosleutel-bijmaken`} className={styles.serviceCardBig}>
                <div className={styles.serviceCardImg}>
                  <Image src="/images/service_bijmaken.webp" alt={`Autosleutel Bijmaken in ${city.city}`} fill style={{ objectFit: 'contain' }} />
                </div>
                <h3>Autosleutel Bijmaken in {city.city}</h3>
                <p>Heeft u een extra autosleutel nodig? Wij maken een nieuwe sleutel op locatie, vaak de helft goedkoper dan de dealer.</p>
                <div className={styles.serviceCardFooter}>
                  <span className={styles.serviceCardPrice}>Vanaf €149,- ex</span>
                  <span className={styles.serviceCardBtn}>Lees meer &rarr;</span>
                </div>
              </Link>

              <Link href={`/diensten/alle-sleutels-kwijt-auto`} className={styles.serviceCardBig}>
                <div className={styles.serviceCardImg}>
                  <Image src="/images/service_kwijt_illustration.webp" alt={`Autosleutels Kwijt in ${city.city}`} fill style={{ objectFit: 'contain' }} />
                </div>
                <h3>Autosleutels Kwijt in {city.city}</h3>
                <p>Geen enkele sleutel meer? Wij komen direct naar u toe, openen de auto, frezen een nieuwe sleutel en leren hem in.</p>
                <div className={styles.serviceCardFooter}>
                  <span className={styles.serviceCardPrice}>Vanaf €299,- ex</span>
                  <span className={styles.serviceCardBtn}>Lees meer &rarr;</span>
                </div>
              </Link>

              <Link href={`/diensten/auto-openen-zonder-sleutel`} className={styles.serviceCardBig}>
                <div className={styles.serviceCardImg}>
                  <Image src="/images/service_openen.webp" alt={`Autodeur Openen in ${city.city}`} fill style={{ objectFit: 'contain' }} />
                </div>
                <h3>Autodeur Openen in {city.city}</h3>
                <p>Sleutel in de auto laten liggen? Wij openen uw auto 100% schadevrij met speciaal gereedschap, zonder krassen.</p>
                <div className={styles.serviceCardFooter}>
                  <span className={styles.serviceCardPrice}>Vanaf €149,- ex</span>
                  <span className={styles.serviceCardBtn}>Lees meer &rarr;</span>
                </div>
              </Link>
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
                closestCities.map(c => (
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

        {/* ── INTERNAL LINKS BLOCK ── */}
        <section style={{ padding: '2rem 0', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <div className="container">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between' }}>
              <div style={{ flex: '1 1 300px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-900)', marginBottom: '1rem' }}>Nabijgelegen steden</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {closestCities.map(c => (
                    <li key={c.slug}>
                      <Link href={`/steden/${c.slug}`} style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 500 }}>
                        Autosleutel bijmaken {c.city} &rarr;
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ flex: '1 1 300px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-900)', marginBottom: '1rem' }}>Gerelateerde diensten in {city.city}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>
                    <Link href="/diensten/autosleutel-bijmaken" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 500 }}>
                      Sleutel bijmaken & programmeren &rarr;
                    </Link>
                  </li>
                  <li>
                    <Link href="/diensten/alle-sleutels-kwijt-auto" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 500 }}>
                      Alle autosleutels kwijt? &rarr;
                    </Link>
                  </li>
                  <li>
                    <Link href="/diensten/auto-openen-zonder-sleutel" style={{ color: 'var(--orange-600)', textDecoration: 'none', fontWeight: 500 }}>
                      Schadevrij autodeur openen &rarr;
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
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
            <GoogleReviewsCta />
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
