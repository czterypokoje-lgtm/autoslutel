import Link from 'next/link';
import Script from 'next/script';
import { BRANDS, type Brand } from '@/config/brands';
import { CITIES, type City } from '@/config/cities';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import styles from './service.module.css';

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
    years: 'Bouwjaren:',
    details: 'Details →',
  };

  const faqItems = [
    { q: `Hoe snel bent u bij mij in ${city.city} voor mijn ${brand.name}?`, a: `Vanuit onze centrale locaties bereiken wij ${city.city} gemiddeld in ${city.travelTime}. U belt of appt — onze mobiele servicebus rijdt direct.` },
    { q: `Kunt u een nieuwe ${brand.name} sleutel maken als ik alle sleutels kwijt ben?`, a: `Ja. All Keys Lost (AKL) noodprogrammering is onze specialiteit voor ${brand.name}. Wij ondersteunen direct het systeem: ${brand.system}. Wij komen naar uw auto in ${city.city} en programmeren op locatie.` },
    { q: `Wat is het prijsverschil met de officiële ${brand.name} dealer in ${city.city}?`, a: `Bij ons bespaart u gemiddeld 30% tot 50% vergeleken met de officiële merkdealer. Bovendien hoeft u uw voertuig niet naar de garage te slepen; wij doen al het werk ter plaatse op uw oprit of werkplek.` },
    { q: `Krijg ik garantie op de nieuwe ${brand.name} sleutel of smart key?`, a: `Zeker! U ontvangt van ons altijd 12 maanden schriftelijke garantie op zowel de elektronica (transponder en afstandsbediening) als het mechanische sleutelblad.` },
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
  const techNote = techNotes[brandSlug] || `Wij programmeren en maken de autosleutels van ${brand.name} direct op uw locatie in ${city.city} via moderne diagnose-apparatuur.`;

  const geoNote = city.subAreas.length > 0 
    ? `Onze mobiele bus is actief in heel ${city.city}, inclusief omliggende wijken en gebieden zoals ${city.subAreas.slice(0, 3).join(', ')}.`
    : `Onze mobiele bus bedient de gehele regio van ${city.city} direct aan huis of op het werk.`;

  const relatedBrands = BRANDS.filter(b => b.priority === 'P1' && b.slug !== brand.slug).slice(0, 5);
  const relatedCities = CITIES.filter(c => c.country === city.country && c.slug !== citySlug && c.priority !== 'P3').slice(0, 5);

  const trustItems = [
    '24/7 Mobiele Service',
    `Binnen ${city.travelTime} in ${city.city}`,
    'Vaste prijs vooraf',
    '12 Maanden Garantie',
    'KVK Geregistreerd',
    'Verzekerd & Gecertificeerd'
  ];

  const bulletItems = [
    { strong: `U wilt een reserve sleutel voor uw ${brand.name}:`, text: `Voorkom acute buitensluiting of wegsleepkosten in ${city.city} door tijdig een extra autosleutel met startonderbreker te laten maken.` },
    { strong: `Enige of alle ${brand.name} sleutels kwijt:`, text: `Geen paniek. Wij komen direct naar u toe met onze mobiele werkplaats, frezen een nieuw sleutelblad en inleren de chip ter plaatse.` },
    { strong: `Afstandsbediening of Smart Key defect:`, text: `De knoppen reageren niet meer of de behuizing is kapot. Wij herstellen of vervangen uw ${brand.name} sleutel direct.` },
    { strong: `${brand.name} sleutel in de auto laten liggen:`, text: `Is uw portier dichtgevallen of vergrendeld? Wij openen uw auto 100% schadevrij met speciaal Lishi lockpick gereedschap.` },
    { strong: `Startonderbreker of transponder storing:`, text: `De motor slaat niet aan en het sleutelsymbool brandt op uw dashboard. Wij herprogrammeren uw ECU of contactmodule.` }
  ];

  const pricingHeaders = ['Sleuteltype / Dienst', 'Specificaties', `Onze Prijs (${city.city})`, `${brand.name} Dealer Prijs`];
  const pricingRows = [
    [`${brand.name} mechanische sleutel`, 'Sleutelblad frezen + transponder chip inleren', 'Vanaf € 89,-', '€ 150,- t/m € 190,-'],
    [`${brand.name} sleutel met afstandsbediening`, 'Originele kwaliteit, incl. slijpen en programmeren', 'Vanaf € 135,-', '€ 240,- t/m € 350,-'],
    [`${brand.name} Smart Key / Keyless Go`, 'Volledig ingeleerd op contactslot & ECU', 'Vanaf € 175,-', '€ 360,- t/m € 490,-'],
    [`${brand.name} behuizing of batterij vervangen`, 'Nieuw knoppenhoesje, micro-switches of knoopcel', 'Vanaf € 35,-', 'Vaak hele sleutel (€ 200+)'],
    [`All Keys Lost (Alle sleutels kwijt)`, 'Spoedprogrammering ter plaatse zonder sleepkosten', 'Op aanvraag', '€ 800,-+ (incl. slepen)']
  ];

  const stepItems = [
    { title: 'Bel of WhatsApp Direct', text: `Neem contact op met onze spoedlijn. Geef door dat u in ${city.city} bent en om welk model ${brand.name} het gaat.` },
    { title: 'Monteur Snel Onderweg', text: `Vanuit onze centrale locaties rijdt onze mobiele servicebus direct naar uw oprit, werkplek of pechlocatie in ${city.city}.` },
    { title: 'Programmeren op Locatie', text: `Met geavanceerde OBD diagnose-apparatuur programmeren wij de nieuwe sleutel en frezen we het sleutelblad met CNC-precisie.` },
    { title: 'Testen & Garantie', text: `Samen controleren we de afstandsbediening, portieren en startmotor. U ontvangt een officiële factuur met 12 maanden garantie.` }
  ];

  return (
    <>
      <Script id={`combo-ls-${citySlug}-${brand.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id={`combo-faq-${citySlug}-${brand.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id={`combo-breadcrumb-${citySlug}-${brand.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span>
              <Link href="/steden">Steden</Link> <span>/</span>
              <Link href={`/steden/${citySlug}`}>{city.city}</Link> <span>/</span>
              <span>{brand.name}</span>
            </nav>

            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
              {city.city} · {city.region}
            </p>

            <h1>
              {brand.name} Autosleutel Bijmaken &amp; Programmeren in {city.city}
            </h1>

            <p className={styles.heroLead}>
              {brand.excerpt} {techNote} {geoNote} {t.heroSub} <strong>{city.travelTime}</strong>. Systeem: <strong>{brand.system}</strong>. {t.cheaper}
            </p>

            <div className={styles.heroCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id={`cb-${citySlug}-${brand.slug}-phone`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                Bel Direct: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id={`cb-${citySlug}-${brand.slug}-wa`}>WhatsApp Direct</a>
              <Link href="/contact" className={styles.btnOutline} id={`cb-${citySlug}-${brand.slug}-form`}>Direct Offerte</Link>
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ───────────────────────────────────────────── */}
        <div className={styles.trustBar}>
          <div className={styles.trustBarInner}>
            {trustItems.map((item, idx) => (
              <div key={idx} className={styles.trustItem}>
                <span className={styles.trustIcon}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CONTENT SECTION ─────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.contentGrid}>
              <div className={styles.mainContent}>

                {/* Section 1: Wanneer Heeft U Dienst Nodig */}
                <div>
                  <h2>Wanneer Heeft U een {brand.name} Sleutel Nodig in {city.city}?</h2>
                  <p>
                    Of u nu onderweg gestrand bent in {city.city} met een kapotte sleutel of preventief een reservesleutel wilt laten bijmaken; bij {SITE_CONFIG.name} regelen wij het direct op locatie. Wij helpen dagelijks bestuurders met de volgende {brand.name} situaties:
                  </p>
                  <ul className={styles.bulletList}>
                    {bulletItems.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.strong}</strong> {item.text}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 2: Prijzen Tabel */}
                <div>
                  <h2>Wat Kost een {brand.name} Autosleutel in {city.city}?</h2>
                  <p>
                    Transparantie in kosten is voor ons enorm belangrijk. Omdat wij niet met duren showrooms of tussenschakels werken en direct met mobiele servicebussen naar u toe rijden, bespaart u aanzienlijk ten opzichte van de merkdealer in {city.city}.
                  </p>
                  <div className={styles.tableWrapper}>
                    <table className={styles.pricingTable}>
                      <thead>
                        <tr>
                          {pricingHeaders.map((h, i) => (
                            <th key={i}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pricingRows.map((row, idx) => (
                          <tr key={idx}>
                            <td>{row[0]}</td>
                            <td>{row[1]}</td>
                            <td><strong>{row[2]}</strong></td>
                            <td>{row[3]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.callout}>
                    <strong>Vaste prijs vooraf:</strong> Neem contact op via telefoon of WhatsApp met uw kenteken of bouwjaar. Onze monteur berekent direct de exacte, vaste prijs voor uw {brand.name} in {city.city} zonder verrassingen achteraf.
                  </div>
                </div>

                {/* Section 2.5: Expert System Explanation */}
                <div>
                  <h2>Professionele {brand.name} Programmering — Zonder Wegslepen</h2>
                  <img 
                    src="/autosleutel24-sleutelbijmaken-utrecht.webp" 
                    alt={`Professionele mobiele service voor ${brand.name} autosleutel bijmaken in ${city.city} - direct op locatie`} 
                    style={{ width: '100%', borderRadius: '12px', margin: '1.25rem 0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', objectFit: 'cover', aspectRatio: '16/9' }}
                  />
                  <p>
                    Het bestellen en programmeren van een moderne autosleutel vereist specialistische apparatuur. {brand.name} maakt gebruik van het geavanceerde <strong>{brand.system}</strong> beveiligingssysteem. Waar u bij een traditionele garage vaak de auto moet laten wegslepen en dagenlang moet wachten op een fabriekssleutel, lossen wij dit ter plekke voor u op in {city.city}.
                  </p>
                  <p>
                    Onze servicewagens zijn uitgerust met hightech OBD-tools en computergestuurde CNC freesmachines. Hiermee lezen wij de benodigde encryptiecodes veilig uit de startonderbreker (immobiliser) of ECU van uw {brand.name}, zonder de originele software aan te tasten. Vervolgens slijpen we de sleutelbaard nauwkeurig op maat en wordt de afstandsbediening of smart key gesynchroniseerd met uw centrale vergrendeling.
                  </p>
                </div>

                {/* Section 3: Hoe Werkt Het */}
                <div>
                  <h2>Hoe Werkt Onze {brand.name} Sleutelservice in {city.city}?</h2>
                  <ol className={styles.stepList}>
                    {stepItems.map((step, idx) => (
                      <li key={idx} className={styles.stepItem}>
                        <span className={styles.stepNum}>{idx + 1}</span>
                        <div className={styles.stepText}>
                          <strong>Stap {idx + 1}: {step.title}</strong>
                          {step.text}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Section 4: Welke Modellen */}
                {brand.models && brand.models.length > 0 && (
                  <div>
                    <h2>{t.modelsTitle}</h2>
                    <p>{t.modelsSub}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '1rem', marginTop: '1rem' }}>
                      {brand.models.map(m => (
                        <Link key={m.slug} href={`/merken/${brand.nameSlug}/${m.slug}`} id={`cb-model-${m.slug}`}
                          style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.15s' }}>
                          <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>{brand.name} {m.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.years} {m.years}</span>
                          <span style={{ fontSize: '0.8rem', color: '#f97316', fontWeight: 600, display: 'block', marginTop: '0.35rem' }}>{t.details}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 5: FAQ Accordion */}
                <div>
                  <h2>Veelgestelde Vragen over {brand.name} Sleutels in {city.city}</h2>
                  {faqItems.map((f, i) => (
                    <details key={i} className={styles.faqItem}>
                      <summary className={styles.faqQuestion}>
                        {f.q}
                        <span className={styles.faqChevron}>+</span>
                      </summary>
                      <p className={styles.faqAnswer}>
                        {f.a}
                      </p>
                    </details>
                  ))}
                </div>

                {/* Section 6: Related Internal Links */}
                <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Andere Merken in {city.city}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {relatedBrands.map(b => (
                          <Link key={b.slug} href={`/steden/${citySlug}/${b.nameSlug}-autosleutel-bijmaken`} style={{ fontSize: '0.875rem', color: 'var(--navy-600)', textDecoration: 'none' }}>
                            {`${b.name} Autosleutel Bijmaken ${city.city} →`}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{brand.name} in Andere Steden</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {relatedCities.map(c => (
                          <Link key={c.slug} href={`/steden/${c.slug}/${brandSlug}`} style={{ fontSize: '0.875rem', color: 'var(--navy-600)', textDecoration: 'none' }}>
                            {`${brand.name} Autosleutel Bijmaken ${c.city} →`}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sidebar */}
              <aside className={styles.sidebar}>
                <div className={styles.sideCard}>
                  <h3>Direct {brand.name} Hulp?</h3>
                  <p>Bel of WhatsApp direct met onze monteur. Binnen {city.travelTime} bij uw auto in {city.city}.</p>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.sidePhone} id={`cb-sidebar-${citySlug}-${brand.slug}-phone`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                    Bel: {SITE_CONFIG.phone}
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.sideWa} id={`cb-sidebar-${citySlug}-${brand.slug}-wa`}>WhatsApp Direct</a>
                  <div className={styles.sideList}>
                    {['Geen sleepkosten', 'Vaste prijs vooraf', `${brand.name} dealer kwaliteit`, '12 maanden garantie', '24/7 beschikbaar in ' + city.city].map(item => (
                      <div key={item} className={styles.sideListItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ color: '#22c55e', flexShrink: 0 }} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.ratingCard}>
                  <div className={styles.ratingStars}>★★★★★</div>
                  <p className={styles.ratingText}>&ldquo;Binnen 30 minuten was de monteur in {city.city} om de sleutel van onze {brand.name} te programmeren. Topservice!&rdquo;</p>
                  <span className={styles.ratingMeta}>Geverifieerde klant — {brand.name}, {city.city}</span>
                  <span className={styles.ratingCount}>{SITE_CONFIG.reviewCount} Google beoordelingen · {SITE_CONFIG.rating}/5</span>
                </div>
              </aside>

            </div>

            {/* Bottom CTA block */}
            <div className={styles.ctaBlock}>
              <h2>{brand.name} Sleutel Probleem in {city.city}? Bel Onze Spoedservice</h2>
              <p>Geen lange wachttijden of dure wegsleepkosten naar de dealer. Wij zijn 24/7 mobiel bereikbaar en rijden direct naar u toe.</p>
              <div className={styles.ctaBtnsGrid}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPrimary} id={`cb-cta-${citySlug}-${brand.slug}-phone`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                  Bel: {SITE_CONFIG.phone}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWhatsapp} id={`cb-cta-${citySlug}-${brand.slug}-wa`}>WhatsApp Direct</a>
              </div>
              <div className={styles.microText}>
                <span>✓ Direct contact met monteur</span>
                <span>✓ Vaste prijs vooraf in {city.city}</span>
                <span>✓ 100% {brand.name} garantie</span>
              </div>
            </div>

            {/* ── REVIEWS SECTION ────────────────────────────────────── */}
            <section className={styles.reviews}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem', textAlign: 'center' }}>
                KLANTBEOORDELINGEN
              </p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2rem 0', textAlign: 'center' }}>
                Wat Klanten Zeggen over Onze {brand.name} Service in {city.city}
              </h2>
              <div className={styles.ratingBig}>
                <span className={styles.ratingNum}>4.9</span>
                <div>
                  <div className={styles.ratingStarsReview}>★★★★★</div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                    {SITE_CONFIG.reviewCount} Geverifieerde Google beoordelingen · {SITE_CONFIG.rating}/5
                  </span>
                </div>
              </div>
              <div className={styles.reviewGrid}>
                {brandReviews.map((r, i) => (
                  <div key={i} className={styles.reviewCardSection}>
                    <div className={styles.ratingStarsReview}>★★★★★</div>
                    <p className={styles.reviewText}>&quot;{r.text}&quot;</p>
                    <div className={styles.reviewMetaSection}>
                      <div className={styles.reviewAvatar}>{r.name[0]}</div>
                      <div>
                        <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.9rem' }}>{r.name}</strong>
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{city.city} — {r.car}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </section>
      </main>
    </>
  );
}
