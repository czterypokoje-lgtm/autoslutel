import Link from 'next/link';
import Script from 'next/script';
import { DIENSTEN, type Service } from '@/config/diensten';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { CITIES, type City } from '@/config/cities';
import { BRANDS } from '@/config/brands';
import styles from './service.module.css';

// ── City-unique content generators (anti-duplicate-content) ────────────────
// These functions produce genuinely different sentences per city so Google
// never sees the same paragraph twice across the 40+ city × service combos.

function cityUniqueIntro(service: Service, city: City): string {
  const isFR = city.lang === 'FR';
  const time = city.travelTime;
  const region = city.region;

  if (isFR) {
    return `Besoin d'un spécialiste pour ${service.title.toLowerCase()} à ${city.city} (${region}) ? Notre technicien mobile intervient directement à votre emplacement à ${city.city} en moyenne en ${time} — sans remorquage, sans déplacement de votre part. ${service.intro}`;
  }

  // NL — vary sentence structure based on city to avoid exact duplicates
  const templates = [
    `Zoekt u een betrouwbare autosleutelspecialist voor ${service.title.toLowerCase()} in ${city.city}? Onze mobiele technicus rijdt direct naar uw locatie in ${city.city} (${region}) — gemiddeld binnen ${time} ter plaatse. Geen sleepkosten, geen gedoe. ${service.intro}`,
    `${service.title} nodig in ${city.city}? Als erkende sleutelspecialist bedienen wij de gehele regio ${region} en zijn gemiddeld binnen ${time} bij u in ${city.city}. Onze volledig uitgeruste bus staat dag en nacht klaar. ${service.intro}`,
    `Als u in ${city.city} of omgeving ${service.title.toLowerCase()} nodig heeft, bent u bij onze autosleutelspecialist aan het juiste adres. Vanuit onze rijdende werkplaats bereiken wij ${city.city} in gemiddeld ${time}. ${service.intro}`,
  ];

  // Deterministic city-based selection (stable across builds)
  const idx = city.city.length % templates.length;
  return templates[idx];
}

function cityUniqueFAQ(service: Service, city: City): { q: string; a: string }[] {
  const isFR = city.lang === 'FR';
  const time = city.travelTime;

  if (isFR) {
    return [
      {
        q: `Combien de temps faut-il pour arriver à ${city.city} ?`,
        a: `Depuis notre base, nous atteignons ${city.city} en moyenne en ${time}. Appelez maintenant — nous partons immédiatement.`,
      },
      {
        q: `${service.title} à ${city.city} — est-ce moins cher qu'un garage ?`,
        a: `Oui. En moyenne 30 à 50 % moins cher qu'un concessionnaire à ${city.city}. De plus, nous venons à vous — pas de frais de remorquage.`,
      },
      ...service.faq.slice(0, 2).map(f => ({
        q: f.q.replace('uw auto', `uw auto in ${city.city}`),
        a: f.a,
      })),
    ];
  }

  return [
    {
      q: `Hoe snel bent u bij mij in ${city.city}?`,
      a: `Wij bereiken ${city.city} vanuit onze vaste route gemiddeld in ${time}. Zodra u belt, rijden wij direct — dag en nacht, ook in het weekend.`,
    },
    {
      q: `Is ${service.title.toLowerCase()} in ${city.city} goedkoper dan bij de dealer?`,
      a: `Ja, gemiddeld 30–50% goedkoper dan een officieel dealer in ${city.city} of omgeving ${city.region}. Bovendien rijden wij naar u toe — geen sleepkosten, geen oponthoud.`,
    },
    {
      q: `Werkt u ook 's nachts en in het weekend in ${city.city}?`,
      a: `Ja. Wij zijn 24/7 beschikbaar in ${city.city} en omliggende plaatsen. Nacht- en weekendtoeslag van +25% is van toepassing.`,
    },
    ...service.faq.slice(0, 1).map(f => ({
      q: f.q,
      a: `${f.a} Wij voeren dit uit bij u in ${city.city} — geen verplaatsing nodig.`,
    })),
  ];
}

function cityUniqueWhyUs(service: Service, city: City): string[] {
  const time = city.travelTime;
  return [
    `Gemiddeld ${time} reactietijd in ${city.city} en omgeving ${city.region}`,
    `${service.title} specialist — ook AKL (Alle Sleutels Kwijt) service`,
    `Volledig mobiel — wij komen naar uw locatie in ${city.city}`,
    `Goedkoper dan ${city.city} dealer — gegarandeerd`,
    `Verzekeringsklare factuur na afloop`,
    `12 maanden garantie op uitgevoerd werk`,
    `24/7 beschikbaar, ook nacht, weekend en feestdagen`,
  ];
}

// ── Component ────────────────────────────────────────────────────────────────
export function CityServiceView({
  citySlug,
  serviceSlug,
  city,
  service,
}: {
  citySlug: string;
  serviceSlug: string;
  city: City;
  service: Service;
}) {
  const isFR = city.lang === 'FR';

  const uniqueIntro = cityUniqueIntro(service, city);
  const uniqueFAQ = cityUniqueFAQ(service, city);
  const whyUs = cityUniqueWhyUs(service, city);

  // Related services (exclude current)
  const relatedServices = DIENSTEN.filter(s => s.slug !== serviceSlug).slice(0, 5);

  // P1 brands for cross-linking — keeps internal link graph tight
  const p1Brands = BRANDS.filter(b => b.priority === 'P1').slice(0, 6);

  // Breadcrumb labels
  const t = {
    callNow: isFR ? 'Appelez Maintenant' : 'Bel Nu',
    quote: isFR ? 'Demander un devis' : 'Offerte Aanvragen',
    whyTitle: isFR ? `Pourquoi nous choisir à ${city.city} ?` : `Waarom Ons Kiezen in ${city.city}?`,
    stepsTitle: isFR ? 'Comment se déroule le service ?' : 'Hoe Verloopt de Service?',
    faqTitle: isFR ? `Questions — ${service.title} à ${city.city}` : `Veelgestelde Vragen — ${service.title} in ${city.city}`,
    servicesTitle: isFR ? `Autres services à ${city.city}` : `Andere Diensten in ${city.city}`,
    brandsTitle: isFR ? `Marques à ${city.city}` : `Automerken in ${city.city}`,
    ctaTitle: isFR
      ? `${service.title} à ${city.city} ? Appelez Directement`
      : `${service.title} Nodig in ${city.city}? Bel Direct — 24/7`,
    ctaSub: isFR
      ? `Moyenne ${city.travelTime} sur place. Prix fixe à l'avance.`
      : `Gemiddeld ${city.travelTime} bij u ter plaatse. Vaste prijs vooraf.`,
    moreInfo: isFR ? 'Meer info →' : 'Meer info →',
    brandsNote: isFR
      ? `Nous programmons des clés pour toutes les marques à ${city.city}.`
      : `Wij programmeren sleutels voor alle merken in ${city.city}.`,
  };

  // === Schema ================================================================
  const locksmithSchema = {
    '@context': 'https://schema.org',
    '@type': 'Locksmith',
    '@id': `${SITE_CONFIG.domain}/steden/${citySlug}/${serviceSlug}#locksmith`,
    name: `${service.title} ${city.city} — ${SITE_CONFIG.name}`,
    url: `${SITE_CONFIG.domain}/steden/${citySlug}/${serviceSlug}`,
    telephone: SITE_CONFIG.phoneTel,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.city,
      addressRegion: city.region,
      addressCountry: city.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: city.geo.lat, longitude: city.geo.lng },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: SITE_CONFIG.rating,
      reviewCount: SITE_CONFIG.reviewCount,
      bestRating: '5',
    },
  };

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${service.title} ${city.city}`,
    provider: { '@type': 'Locksmith', name: SITE_CONFIG.fullName, telephone: SITE_CONFIG.phoneTel, url: SITE_CONFIG.domain },
    areaServed: { '@type': 'City', name: city.city },
    description: `${service.title} in ${city.city}. Mobiel aan huis. ${city.travelTime} reactietijd. ${service.metaDesc}`,
    ...(service.priceFrom && { offers: { '@type': 'Offer', priceCurrency: 'EUR', description: service.priceFrom } }),
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `${service.title} in ${city.city}`,
    description: uniqueIntro,
    step: service.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: uniqueFAQ.map(f => ({
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
      { '@type': 'ListItem', position: 2, name: 'Steden', item: `${SITE_CONFIG.domain}/steden` },
      { '@type': 'ListItem', position: 3, name: city.city, item: `${SITE_CONFIG.domain}/steden/${citySlug}` },
      { '@type': 'ListItem', position: 4, name: service.title, item: `${SITE_CONFIG.domain}/steden/${citySlug}/${serviceSlug}` },
    ],
  };

  // ============================================================================
  return (
    <>
      <Script id={`ls-${citySlug}-${serviceSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(locksmithSchema) }} />
      <Script id={`svc-${citySlug}-${serviceSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id={`howto-${citySlug}-${serviceSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <Script id={`faq-${citySlug}-${serviceSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id={`bc-${citySlug}-${serviceSlug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main>
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span>
              <Link href="/steden">Steden</Link> <span>/</span>
              <Link href={`/steden/${citySlug}`}>{city.city}</Link> <span>/</span>
              <span>{service.title}</span>
            </nav>

            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--orange-400)', marginBottom: '0.75rem' }}>
              {city.city} · {city.region}
            </p>

            <h1>{isFR ? `Besoin de ${service.title.toLowerCase()} à ${city.city} ? Service mobile!` : `${service.title} in ${city.city} nodig? Mobiel op uw locatie!`}</h1>

            <p className={styles.heroLead}>{uniqueIntro}</p>

            {(service.priceFrom || service.duration) && (
              <div className={styles.heroBadges}>
                {service.priceFrom && <span className={styles.badge}>{service.priceFrom}</span>}
                {service.duration && <span className={styles.badge}>⏱ {service.duration}</span>}
                <span className={styles.badge}>24/7 Beschikbaar</span>
                <span className={styles.badge}>Mobiel aan huis</span>
              </div>
            )}

            <div className={styles.heroCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id={`csvc-${citySlug}-${serviceSlug}-phone`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                </svg>
                {t.callNow}: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id={`csvc-${citySlug}-${serviceSlug}-wa`}>WhatsApp</a>
              <Link href="/contact" className={styles.btnOutline} id={`csvc-${citySlug}-${serviceSlug}-form`}>{t.quote}</Link>
            </div>
          </div>
        </section>

        {/* ── SYSTEM BAR ──────────────────────────────────────────── */}
        {service.system && (
          <div className={styles.systemBar}>
            <div className={styles.systemBarInner}>
              <strong>Ondersteunde systemen:</strong>
              <span>{service.system}</span>
            </div>
          </div>
        )}

        {/* ── STEPS + WHY US ──────────────────────────────────────── */}
        <section className={styles.section}>
          <div className="container">
            <div className={styles.contentGrid}>
              <div>
                <h2>{t.stepsTitle}</h2>
                <ol className={styles.stepList}>
                  {service.steps.map((step, i) => (
                    <li key={i} className={styles.stepItem}>
                      <span className={styles.stepNum}>{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                {/* Why us — city-unique bullets */}
                <div className={styles.seoContent}>
                  <h2>{t.whyTitle}</h2>
                  <ul className={styles.checkList}>
                    {whyUs.map(item => (
                      <li key={item} className={styles.checkItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ color: 'var(--color-success)', flexShrink: 0 }} aria-hidden="true">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sidebar CTA */}
              <aside className={styles.sidebar}>
                <div className={styles.sideCard}>
                  <h3>{isFR ? 'Besoin d\'aide immédiate ?' : 'Direct Hulp Nodig?'}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
                    {isFR
                      ? `Appelez ou WhatsApp. Moyenne ${city.travelTime} sur place à ${city.city}.`
                      : `Bel of WhatsApp ons. Gemiddeld binnen ${city.travelTime} bij u in ${city.city}.`}
                  </p>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.sidePhone} id={`csvc-sidebar-${citySlug}-${serviceSlug}-phone`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                    </svg>
                    {SITE_CONFIG.phone}
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.sideWa} id={`csvc-sidebar-${citySlug}-${serviceSlug}-wa`}>WhatsApp Direct</a>

                  <div className={styles.sideList}>
                    {['Geen sleepkosten', 'Vaste prijs vooraf', 'Verzekeringsklare factuur', '12 maanden garantie', '24/7 beschikbaar'].map(item => (
                      <div key={item} className={styles.sideListItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ color: 'var(--color-success)', flexShrink: 0 }} aria-hidden="true">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <section className={styles.sectionAlt}>
          <div className="container" style={{ maxWidth: 860 }}>
            <h2>{t.faqTitle}</h2>
            {uniqueFAQ.map((f, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-question">
                  {f.q}
                  <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </summary>
                <p className="faq-answer">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── OTHER SERVICES IN THIS CITY (internal linking) ───────── */}
        <section className={styles.section}>
          <div className="container">
            <h2>{t.servicesTitle}</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1.25rem', maxWidth: 580 }}>
              {isFR
                ? `Nous proposons également les services suivants à ${city.city} :`
                : `Naast ${service.title.toLowerCase()} bieden wij ook de volgende diensten aan in ${city.city}:`}
            </p>
            <div className={styles.relatedGrid}>
              {relatedServices.map(s => (
                <Link key={s.slug} href={`/steden/${citySlug}/${s.slug}`} id={`csvc-svc-${s.slug}`} className={styles.relatedCard}>
                  <strong>{s.title}</strong>
                  <p>{s.intro.substring(0, 90)}...</p>
                  <span className={styles.relatedArrow}>{t.moreInfo}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── BRAND LINKS IN THIS CITY (internal linking) ─────────── */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <h2>{t.brandsTitle}</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1.25rem', maxWidth: 580 }}>
              {t.brandsNote}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {p1Brands.map(b => (
                <Link
                  key={b.slug}
                  href={`/steden/${citySlug}/${b.nameSlug}-sleutel-programmeren`}
                  id={`csvc-brand-${b.slug}`}
                  style={{
                    padding: '0.45rem 0.9rem',
                    background: '#fff',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--navy-700)',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {`${b.name} ${isFR ? 'Programmation' : 'Sleutel'} ${city.city}`}
                </Link>
              ))}
              <Link
                href={`/steden/${citySlug}`}
                style={{
                  padding: '0.45rem 0.9rem',
                  background: 'var(--orange-50, #fff7ed)',
                  border: '1px solid var(--orange-200, #fed7aa)',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--orange-700, #c2410c)',
                  textDecoration: 'none',
                }}
              >
                Alle diensten & merken in {city.city} →
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────── */}
        <section className={styles.cta}>
          <div className="container">
            <h2>{t.ctaTitle}</h2>
            <p>{t.ctaSub}</p>
            <div className={styles.ctaBtns}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`csvc-cta-${citySlug}-${serviceSlug}-phone`}>
                {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.waBtn} id={`csvc-cta-${citySlug}-${serviceSlug}-wa`}>
                WhatsApp Direct
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
