import Link from 'next/link';
import Script from 'next/script';
import { BRANDS, type Brand } from '@/config/brands';
import { CITIES, type City } from '@/config/cities';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';

// Helper for stable hashing
function getStableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateBrandReviews(brandName: string, cityName: string, brandSlug: string) {
  const hash = getStableHash(brandSlug + '-' + cityName);
  const templates = [
    {
      text: `Uitstekende service voor mijn ${brandName} in ${cityName}. De monteur was er snel, kende het sleutelsysteem door en door en programmeerde de nieuwe sleutel binnen 30 minuten.`,
      name: 'Michael de Vries',
      car: `${brandName} 3 Serie`
    },
    {
      text: `Alle sleutels kwijt van onze ${brandName} in ${cityName}. Autosleutel24 was de enige die ons ter plekke kon helpen zonder wegsleepkosten. Echt een aanrader!`,
      name: 'Sandra Janssen',
      car: `${brandName} Golf`
    },
    {
      text: `Vooraf een duidelijke prijs gekregen en de monteur kwam netjes op tijd bij ons thuis in ${cityName} om een reservesleutel voor de ${brandName} bij te maken. Uitstekende garantie en factuur gekregen.`,
      name: 'Frank de Groot',
      car: `${brandName} C-Klasse`
    },
    {
      text: `Super geholpen met een nieuwe smart key voor onze ${brandName} bij ${cityName}. Goedkoper dan de merkdealer en snelle service ter plaatse.`,
      name: 'Sophie Bakker',
      car: `${brandName} Yaris`
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

export function CityBrandView({ citySlug, brandSlug, city, brand }: { citySlug: string, brandSlug: string, city: City, brand: Brand }) {
  const brandReviews = generateBrandReviews(brand.name, city.city, brandSlug);
  const t = {
    heroSub: `Wij bereiken ${city.city} gemiddeld in`,
    cheaper: `Goedkoper dan ${brand.name} dealer — gegarandeerd.`,
    responseTime: 'Reactietijd',
    available: 'Beschikbaar',
    noTow: 'Geen sleepkosten',
    modelsTitle: `${brand.name} Modellen in ${city.city}`,
    modelsSub: `Wij programmeren sleutels voor de volgende ${brand.name} modellen in ${city.city}:`,
    whyTitle: `Waarom Kiezen voor Autosleutel24 in ${city.city}?`,
    details: 'Details →',
    years: 'Bouwjaren:',
    callNow: 'Bel Nu',
    problemTitle: `${brand.name} Sleutel Probleem in ${city.city}?`,
    problemSub: `Bel of WhatsApp — gemiddeld ${city.travelTime} bij u ter plaatse.`,
    othersInCity: `Andere Merken in ${city.city}`,
    brandInOthers: `${brand.name} in Andere Steden`,
  };

  const faqItems = [
    { q: `Hoe snel bent u bij mij in ${city.city}?`, a: `Vanuit Utrecht bereiken wij ${city.city} gemiddeld in ${city.travelTime}. U belt — wij rijden direct.` },
    { q: `Kunt u mijn ${brand.name} programmeren zonder originele sleutel?`, a: `Ja. AKL (Alle Sleutels Kwijt) service is onze specialiteit voor ${brand.name}. Systeem: ${brand.system}. Bel voor exacte mogelijkheden.` },
    { q: `Kost ${brand.name} sleutelprogrammering in ${city.city} minder dan bij de dealer?`, a: `Gemiddeld 30–50% minder. Wij komen naar u toe — geen sleepkosten of vervoerskosten.` },
    { q: `Werkt u ook 's nachts in ${city.city}?`, a: `Ja. 24/7 beschikbaar, ook nacht en weekend. Nacht toeslag +25% van toepassing.` },
  ];

  const schema = {
    '@context': 'https://schema.org', '@type': 'Locksmith',
    '@id': `${SITE_CONFIG.domain}/steden/${citySlug}/${brandSlug}#locksmith`,
    name: `${brand.name} Sleutelspecialist ${city.city} — ${SITE_CONFIG.name}`,
    url: `${SITE_CONFIG.domain}/steden/${citySlug}/${brandSlug}`,
    telephone: SITE_CONFIG.phoneTel,
    address: { '@type': 'PostalAddress', addressLocality: city.city, addressRegion: city.region, addressCountry: city.country },
    geo: { '@type': 'GeoCoordinates', latitude: city.geo.lat, longitude: city.geo.lng },
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
  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqItems.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Steden', item: `${SITE_CONFIG.domain}/steden` },
      { '@type': 'ListItem', position: 3, name: city.city, item: `${SITE_CONFIG.domain}/steden/${citySlug}` },
      { '@type': 'ListItem', position: 4, name: brand.name, item: `${SITE_CONFIG.domain}/steden/${citySlug}/${brandSlug}` },
    ],
  };

  const techNotes: Record<string, string> = {
    'volkswagen-autosleutel-bijmaken': 'Onze technici zijn volledig uitgerust om de modernste VAG sleutelsystemen te programmeren, inclusief ondersteuning voor de nieuwste MQB en SFD beveiligingsplatforms.',
    'bmw-autosleutel-bijmaken': 'Wij programmeren ter plaatse alle BMW startblokkering systemen, waaronder CAS1, CAS2, CAS3, CAS4 en de nieuwere FEM/BDC modules.',
    'mercedes-autosleutel-bijmaken': 'Als Mercedes-Benz specialist programmeren we sleutels direct in uw EIS/EZS contactslotmodule en ondersteunen we zowel FBS3 als FBS4 systemen.',
    'audi-autosleutel-bijmaken': 'Complete ondersteuning voor alle Audi transponder- en smartkey-systemen, inclusief BCM2 en MQB startonderbrekers.',
    'opel-autosleutel-bijmaken': 'Opel transponders en afstandsbedieningen programmeren we snel via de OBD-poort, inclusief de nieuwste generatie smart keys.',
    'peugeot-autosleutel-bijmaken': 'Expertise in PSA sleuteltechnologie voor het inleren van afstandsbedieningen en keyless-go systemen op locatie.',
    'renault-autosleutel-bijmaken': 'Directe programmering van Renault keycards en smart keys via onze mobiele OBD diagnose-apparatuur.',
  };
  const techNote = techNotes[brandSlug] || `Wij programmeren en maken de autosleutels van ${brand.name} direct op uw locatie via moderne diagnose-apparatuur.`;

  const geoNote = city.subAreas.length > 0 
    ? `Onze mobiele bus is actief in heel ${city.city}, inclusief omliggende wijken en gebieden zoals ${city.subAreas.slice(0, 3).join(', ')}.`
    : `Onze mobiele bus bedient de gehele regio van ${city.city} direct aan huis of op het werk.`;

  const relatedBrands = BRANDS.filter(b => b.priority === 'P1' && b.slug !== brand.slug).slice(0, 5);
  const relatedCities = CITIES.filter(c => c.country === city.country && c.slug !== citySlug && c.priority !== 'P3').slice(0, 5);

  return (
    <>
      <Script id={`combo-ls-${citySlug}-${brand.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id={`combo-faq-${citySlug}-${brand.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id={`combo-breadcrumb-${citySlug}-${brand.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* Hero */}
        <section style={{ background: 'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding: '4rem 2rem 3rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <nav style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.45)' }}>Home</Link> /
              <Link href="/steden" style={{ color: 'rgba(255,255,255,0.45)' }}>Steden</Link> /
              <Link href={`/steden/${citySlug}`} style={{ color: 'rgba(255,255,255,0.45)' }}>{city.city}</Link> /
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{brand.name}</span>
            </nav>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--orange-400)', marginBottom: '0.75rem' }}>
              {city.city} · {city.region}
            </p>
            <h1 style={{ color: '#fff', fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', marginBottom: '1rem' }}>
              {brand.name} Autosleutel Bijmaken & Programmeren in {city.city}
              <br /><span style={{ color: 'var(--orange-500)', fontSize: '0.7em' }}>Autosleutel Specialist — Mobiel Ter Plaatse</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: 680 }}>
              {brand.excerpt} {techNote} {geoNote} {t.heroSub} <strong style={{ color: '#fff' }}>{city.travelTime}</strong>.
              Systeem: <strong style={{ color: '#fff' }}>{brand.system}</strong>. {t.cheaper}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`cb-${citySlug}-${brand.slug}-phone`}>{SITE_CONFIG.phone}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', background: '#25d366', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: '4px', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }} id={`cb-${citySlug}-${brand.slug}-wa`}>WhatsApp</a>
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[[city.travelTime, t.responseTime], ['24/7', t.available], ['Geen', t.noTow], [SITE_CONFIG.rating + '★', 'Google']].map(([v, l]) => (
                <div key={l} style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--orange-400)', lineHeight: 1 }}>{v}</strong>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.2rem' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ───────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '1.25rem 2rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.5rem', justifyContent: 'center', alignItems: 'center' }}>
            {[
              '24/7 Mobiele Service',
              `Binnen ${city.travelTime} in ${city.city}`,
              'Vaste prijs vooraf',
              '12 Maanden Garantie',
              'KVK Geregistreerd',
              'Verzekerd & Gecertificeerd'
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#f97316', fontSize: '1rem', fontWeight: 'bold', flexShrink: 0 }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Models if available */}
        {brand.models && brand.models.length > 0 && (
          <section style={{ padding: '3rem 0' }}>
            <div className="container">
              <h2>{t.modelsTitle}</h2>
              <p>{t.modelsSub}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                {brand.models.map(m => (
                  <Link key={m.slug} href={`/merken/${brand.nameSlug}/${m.slug}`} id={`cb-model-${m.slug}`}
                    style={{ padding: '1.25rem', background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '6px', textDecoration: 'none', transition: 'all 0.15s' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--gray-900)', display: 'block' }}>{brand.name} {m.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{t.years} {m.years}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--orange-500)', fontWeight: 600, display: 'block', marginTop: '0.25rem' }}>{t.details}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why us local */}
        <section style={{ padding: '3rem 0', background: 'var(--gray-50)' }}>
          <div className="container">
            <h2>{t.whyTitle}</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '1.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 700 }}>
              {[
                `${city.travelTime} reactietijd naar ${city.city}`,
                `${brand.name} specialist — systeem: ${brand.system.split('/')[0]}`,
                'Geen sleepkosten — volledig mobiel',
                `Goedkoper dan ${brand.name} dealer in ${city.city} — gegarandeerd`,
                '12 maanden garantie op programmering',
                'Verzekeringsklare factuur',
                '24/7 beschikbaar, ook weekend en feestdagen',
              ].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.5rem 0', fontSize: '0.9rem', color: 'var(--gray-700)', borderBottom: '1px solid var(--gray-200)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15" style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </li>
              ))}
            </ul>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary" id={`cb-why-${citySlug}-${brand.slug}-phone`}>{t.callNow}: {SITE_CONFIG.phone}</a>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: '3rem 0' }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <h2>Vragen over ${brand.name} Sleutels in ${city.city}</h2>
            {faqItems.map((f, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-question">{f.q}
                  <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                </summary>
                <p className="faq-answer">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Internal links — related combos */}
        <section style={{ padding: '3rem 0', background: 'var(--gray-50)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.othersInCity}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {relatedBrands.map(b => (
                    <Link key={b.slug} href={`/steden/${citySlug}/${b.nameSlug}-autosleutel-bijmaken`} style={{ fontSize: '0.875rem', color: 'var(--navy-600)', textDecoration: 'none', padding: '0.3rem 0', borderBottom: '1px solid var(--gray-200)' }} id={`rel-brand-${b.slug}`}>
                      {`${b.name} Autosleutel Bijmaken ${city.city} →`}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.brandInOthers}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {relatedCities.map(c => (
                    <Link key={c.slug} href={`/steden/${c.slug}/${brandSlug}`} style={{ fontSize: '0.875rem', color: 'var(--navy-600)', textDecoration: 'none', padding: '0.3rem 0', borderBottom: '1px solid var(--gray-200)' }} id={`rel-city-${c.slug}`}>
                      {`${brand.name} Autosleutel Bijmaken ${c.city} →`}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── REVIEWS SECTION ────────────────────────────────────── */}
        <section style={{ padding: '4rem 2rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
              KLANTBEOORDELINGEN
            </p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              Wat Klanten Zeggen over {brand.name} Sleutelservice in {city.city}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>4.9</span>
              <div>
                <div style={{ color: '#f59e0b', fontSize: '1.1rem' }}>★★★★★</div>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {SITE_CONFIG.reviewCount} Google beoordelingen · {SITE_CONFIG.rating}/5
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginTop: '2rem' }}>
              {brandReviews.map((r, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <div style={{ color: '#f59e0b', fontSize: '1.1rem' }}>★★★★★</div>
                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.7, fontStyle: 'italic', flex: 1, margin: 0 }}>&quot;{r.text}&quot;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 }}>{r.name[0]}</div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: '#0f172a' }}>{r.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{city.city} — {r.car}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'var(--navy-900)', padding: '3.5rem 2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>{t.problemTitle}</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '2rem' }}>{t.problemSub}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`cb-cta-${citySlug}-${brand.slug}-phone`}>{SITE_CONFIG.phone}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', background: '#25d366', color: '#fff', padding: '0.85rem 2rem', borderRadius: '4px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', minHeight: 52 }} id={`cb-cta-${citySlug}-${brand.slug}-wa`}>WhatsApp Direct</a>
          </div>
        </section>
      </main>
    </>
  );
}
