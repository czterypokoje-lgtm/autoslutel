import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { LOCATIONS } from '@/config/locations';
import { SERVICES } from '@/config/services';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import styles from './page.module.css';

export async function generateStaticParams() {
  return LOCATIONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const loc = LOCATIONS.find((l) => l.slug === slug);
  if (!loc) return {};
  return {
    title: `Autosleutel Bijmaken ${loc.city} | Mobiele Service | ${SITE_CONFIG.responseTime}`,
    description: `Autosleutel bijmaken in ${loc.city}. Mobiele service, alle merken. Alle sleutels kwijt? Wij komen naar u toe. BMW, Mercedes, Audi, VW, Toyota. ${loc.travelTime} vanuit Utrecht. 24/7.`,
    keywords: [`autosleutel bijmaken ${loc.city.toLowerCase()}`, `autosleutel ${loc.city.toLowerCase()}`, `sleutel kwijt ${loc.city.toLowerCase()}`, `mobiele autosleutel specialist ${loc.city.toLowerCase()}`],
    alternates: { canonical: `${SITE_CONFIG.domain}/locaties/${slug}` },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loc = LOCATIONS.find((l) => l.slug === slug);
  if (!loc) notFound();

  const nearbyLocations = LOCATIONS.filter((l) => l.country === loc.country && l.slug !== slug).slice(0, 4);

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Locksmith',
    name: `${SITE_CONFIG.fullName} — ${loc.city} Service`,
    url: `${SITE_CONFIG.domain}/locaties/${slug}`,
    telephone: SITE_CONFIG.phoneTel,
    address: {
      '@type': 'PostalAddress',
      addressLocality: loc.city,
      addressRegion: loc.region,
      addressCountry: loc.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: loc.geo.lat, longitude: loc.geo.lng },
    areaServed: { '@type': 'City', name: loc.city },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], opens: '00:00', closes: '23:59' },
    ],
  };

  const flagMap: Record<string, string> = { NL: '🇳🇱', BE: '🇧🇪', DE: '🇩🇪' };
  const flag = flagMap[loc.country] || '';

  return (
    <>
      <Script id={`loc-schema-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />

      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroBreadcrumb}>
            <Link href="/">Home</Link> › <Link href="/locaties">Locaties</Link> › {loc.city}
          </div>
          <div className={styles.heroInner}>
            <div className={styles.heroText}>
              <div className={styles.heroLabel}>
                {flag} {loc.region}, {loc.country}
              </div>
              <h1>Autosleutel Bijmaken {loc.city} — Mobiele Auto Slotenmaker</h1>
              <p className={styles.heroDesc}>
                Vanuit onze Utrecht basis bereiken wij {loc.city} in ongeveer <strong>{loc.travelTime}</strong>. Of u thuis bent, op het werk, of gestrand — wij komen naar u toe.
              </p>
              <div className={styles.heroCtas}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id={`loc-${loc.city.toLowerCase()}-phone`}>
                  📞 Bel Nu: {SITE_CONFIG.phone}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id={`loc-${loc.city.toLowerCase()}-wa`}>
                  💬 WhatsApp
                </a>
              </div>
              <div className={styles.heroStats}>
                <div className={styles.stat}><strong>{loc.travelTime}</strong><span>Reistijd vanuit Utrecht</span></div>
                <div className={styles.stat}><strong>24/7</strong><span>Bereikbaar</span></div>
                <div className={styles.stat}><strong>Alle merken</strong><span>BMW, Mercedes, VW, Toyota...</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Services in this city */}
        <section className={styles.services}>
          <div className="container">
            <h2>Diensten in {loc.city}</h2>
            <div className={styles.servicesGrid}>
              {SERVICES.map((s) => (
                <Link key={s.slug} href={`/diensten/${s.slug}`} className={styles.serviceCard} id={`loc-service-${s.slug}`}>
                  <span className={styles.sIcon}>{s.icon}</span>
                  <span className={styles.sTitle}>{s.title}</span>
                  <span className={styles.sPrice}>{s.price}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Sub-areas */}
        <section className={styles.subAreas}>
          <div className="container">
            <h2>Gebieden die Wij Bedienen Nabij {loc.city}</h2>
            <p>Naast {loc.city} zelf bedienen wij ook de volgende omliggende gebieden:</p>
            <div className={styles.subAreasGrid}>
              {loc.subAreas.map((area) => (
                <div key={area} className={styles.subAreaChip}>📍 {area}</div>
              ))}
            </div>
          </div>
        </section>

        {/* Why us in this city */}
        <section className={styles.whyUs}>
          <div className="container">
            <div className={styles.whyUsGrid}>
              <div>
                <h2>Waarom Kiezen voor Ons in {loc.city}?</h2>
                <ul className={styles.whyList}>
                  <li>✅ {loc.travelTime} reactie vanuit Utrecht</li>
                  <li>✅ Geen sleepkosten nodig — volledig mobiel</li>
                  <li>✅ Service op dezelfde dag</li>
                  <li>✅ Concurrerende prijzen vs {loc.city} dealers</li>
                  <li>✅ Nederlands {loc.country !== 'NL' ? '& lokale taal ' : ''} sprekend</li>
                  <li>✅ 24/7 bereikbaar, ook weekend en feestdagen</li>
                  <li>✅ Verzekeringsklare facturen</li>
                  <li>✅ 12 maanden garantie</li>
                </ul>
              </div>
              <div className={styles.reviewHighlight}>
                <div className="stars">★★★★★</div>
                <p className={styles.reviewText}>&quot;{loc.reviewQuote}&quot;</p>
                <div className={styles.reviewAuthor}>
                  <strong>{loc.reviewAuthor}</strong> — {loc.reviewCar}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="gallery-section">
          <div className="container">
            <h2>Galerij — Service in {loc.city}</h2>
            <p>Foto&apos;s van onze werkzaamheden in en rondom {loc.city}.</p>
            <div className="gallery-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="gallery-item">
                  <div className="gallery-item-placeholder">
                    <span>📷</span>
                    <span>Foto {loc.city}</span>
                    <small>gallery/locaties/{slug}/{i + 1}.webp</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nearby locations */}
        <section className={styles.nearby}>
          <div className="container">
            <h2>Andere Locaties in de Buurt</h2>
            <div className={styles.nearbyGrid}>
              {nearbyLocations.map((nl) => (
                <Link key={nl.slug} href={`/locaties/${nl.slug}`} className={styles.nearbyCard} id={`nearby-${nl.city.toLowerCase()}`}>
                  <span>{nl.city}</span>
                  <span className={styles.nearbyTime}>{nl.travelTime}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className="container">
            <div className={styles.ctaInner}>
              <h2>Autosleutel Probleem in {loc.city}?</h2>
              <p>Bel of WhatsApp ons — wij zijn gemiddeld binnen {loc.travelTime} bij u.</p>
              <div className={styles.ctaBtns}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-white btn-lg" id={`cta-loc-${loc.city.toLowerCase()}-phone`}>
                  📞 {SITE_CONFIG.phone}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.ctaWa} id={`cta-loc-${loc.city.toLowerCase()}-wa`}>
                  💬 WhatsApp Direct
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
