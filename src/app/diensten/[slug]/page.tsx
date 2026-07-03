import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { DIENSTEN } from '@/config/diensten';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { CITIES } from '@/config/cities';
import styles from './page.module.css';

export async function generateStaticParams() {
  return DIENSTEN.map(s => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = DIENSTEN.find(s => s.slug === slug);
  if (!service) return {};
  return {
    title: service.metaTitle,
    description: service.metaDesc,
    alternates: {
      canonical: `${SITE_CONFIG.domain}/diensten/${slug}`,
      languages: {
        'nl-NL': `${SITE_CONFIG.domain}/diensten/${slug}`,
        'x-default': `${SITE_CONFIG.domain}/diensten/${slug}`,
      },
    },
  };
}

// Helper for stable hashing
function getStableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateServiceReviews(serviceTitle: string, slug: string) {
  const hash = getStableHash(slug);
  const titleLower = serviceTitle.toLowerCase();
  const templates = [
    {
      text: `Geweldige ervaring met ${titleLower}! De monteur was snel ter plaatse en loste het professioneel op. Stukken goedkoper dan de officiële dealer.`,
      name: 'Johan de Boer',
      city: 'Utrecht',
      car: 'Volkswagen Golf'
    },
    {
      text: `Onze reserve autosleutel was kapot. Autosleutel24 heeft ter plekke de service ${titleLower} uitgevoerd. Snelle en transparante communicatie. Zeer aan te bevelen!`,
      name: 'Marieke van Leeuwen',
      city: 'Amersfoort',
      car: 'Ford Fiesta'
    },
    {
      text: `Buitengewoon tevreden over de service voor ${titleLower}. De monteur kwam naar mijn werk en deed alles ter plaatse. Helemaal top en inclusief 12 maanden garantie!`,
      name: 'Sven Peters',
      city: 'Hilversum',
      car: 'BMW 3 Serie'
    },
    {
      text: `Zeer deskundige monteur die snel ter plaatse was voor ${titleLower}. Netjes vooraf een prijs gekregen en direct een officiële factuur ontvangen voor de verzekering.`,
      name: 'Annelies Bakker',
      city: 'Almere',
      car: 'Opel Corsa'
    },
    {
      text: `Sleutelprobleem snel opgelost met ${titleLower}. Erg handig dat ze mobiel langskomen, dat scheelt een hoop sleepkosten naar de dealer. Bedankt!`,
      name: 'Daan van Dijk',
      car: 'Peugeot 208',
      city: 'Nieuwegein'
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

export default async function DienstPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = DIENSTEN.find(s => s.slug === slug);
  if (!service) notFound();

  const related = DIENSTEN.filter(s => service.relatedSlugs.includes(s.slug));
  const p1Cities = CITIES.filter(c => c.priority === 'P1').slice(0, 8);
  const serviceReviews = generateServiceReviews(service.title, slug);

  const isOpening = ['autodeur-openen', 'sleutel-in-auto', 'deur-dichtgevallen', 'kofferbak-openen', 'sleutel-afgebroken-in-slot', 'noodopening-auto'].includes(slug);

  const trustItems = [
    '24/7 Mobiele Service',
    'Zelfde dag ter plaatse',
    isOpening ? '100% Schadevrij Openen' : (service.priceFrom ? service.priceFrom : 'Vaste prijzen vooraf'),
    '12 Maanden Garantie',
    'KVK Geregistreerd',
    'Verzekerd & Gecertificeerd'
  ];


  const howToSchema = {
    '@context': 'https://schema.org', '@type': 'HowTo',
    name: service.h1, description: service.intro,
    step: service.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })),
  };
  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: service.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const serviceSchema = {
    '@context': 'https://schema.org', '@type': 'Service',
    name: service.title,
    provider: { '@type': 'Locksmith', name: SITE_CONFIG.fullName, telephone: SITE_CONFIG.phoneTel, url: SITE_CONFIG.domain },
    areaServed: [{ '@type': 'Country', name: 'NL' }, { '@type': 'Country', name: 'BE' }],
    description: service.metaDesc,
    ...(service.priceFrom && { offers: { '@type': 'Offer', priceCurrency: 'EUR', description: service.priceFrom } }),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Diensten', item: `${SITE_CONFIG.domain}/diensten` },
      { '@type': 'ListItem', position: 3, name: service.title, item: `${SITE_CONFIG.domain}/diensten/${slug}` },
    ],
  };

  return (
    <>
      <Script id={`howto-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <Script id={`faq-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id={`svc-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id={`bc-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span>
              <Link href="/diensten">Diensten</Link> <span>/</span>
              <span>{service.title}</span>
            </nav>
            <h1>{service.h1}</h1>
            <p className={styles.heroLead}>{service.intro}</p>
            {(service.priceFrom || service.duration) && (
              <div className={styles.heroBadges}>
                {service.priceFrom && <span className={styles.badge}>{service.priceFrom}</span>}
                {service.duration && <span className={styles.badge}>Duur: {service.duration}</span>}
                <span className={styles.badge}>24/7 Beschikbaar</span>
                <span className={styles.badge}>Mobiel aan huis</span>
              </div>
            )}
            <div className={styles.heroCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id={`svc-${slug}-phone`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                Bel Nu: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id={`svc-${slug}-wa`}>WhatsApp</a>
              <Link href="/contact" className={styles.btnOutline} id={`svc-${slug}-form`}>Offerte Aanvragen</Link>
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

        {/* System info */}
        {service.system && (
          <div className={styles.systemBar}>
            <div className={styles.systemBarInner}>
              <strong>Ondersteunde systemen:</strong>
              <span>{service.system}</span>
            </div>
          </div>
        )}

        {/* Steps */}
        <section className={styles.section}>
          <div className="container">
            <div className={styles.contentGrid}>
              <div>
                <h2>Hoe Verloopt de Service?</h2>
                <ol className={styles.stepList}>
                  {service.steps.map((step, i) => (
                    <li key={i} className={styles.stepItem}>
                      <span className={styles.stepNum}>{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>

                <div className={styles.seoContent}>
                  <h2>24/7 {service.title} in Uw Regio</h2>
                  
                  {slug === 'autodeur-openen' && (
                    <img 
                      src="/images/seo/auto_deur_openen_slotenmaker_utrecht_schadevrij.webp" 
                      alt="Auto deur schadevrij openen door professionele mobiele slotenmaker in Utrecht - 24/7 service" 
                      style={{ width: '100%', borderRadius: '12px', margin: '1rem 0 2rem 0', boxShadow: 'var(--shadow-md)', objectFit: 'cover', aspectRatio: '16/9' }}
                    />
                  )}

                  <p>Bent u op zoek naar een betrouwbare en ervaren specialist voor {service.title.toLowerCase()}? Zoek niet verder dan de 24/7 service van {SITE_CONFIG.name}. Wij leveren een breed scala aan diensten om u te helpen met al uw autosleutel en vergrendelingsproblemen. Of u nu hulp nodig heeft met uw autosleutels, contactslot, een nieuwe autosleutel bijmaken of het vervangen van een verloren sleutel, wij kunnen helpen. Wij bieden ook een spoedservice als u bent buitengesloten uit uw auto.</p>
                  
                  <p>Ons ervaren en gecertificeerde team van mobiele autosleutel specialisten staat klaar om u zo snel mogelijk weer op weg te helpen. Wij zijn vastberaden om direct een oplossing te vinden en houden u binnen enkele minuten op de hoogte van onze aankomsttijd.</p>
                  
                  <p>Door ons te bellen bent u verzekerd van de kwaliteit en betrouwbaarheid van onze diensten. Bel ons vandaag nog om meer te weten te komen over onze {service.title.toLowerCase()} diensten!</p>

                  <h3>Veilige & Efficiënte Voertuig Toegang</h3>
                  <p>Als een van de toonaangevende mobiele autosleutel specialisten dekken wij al uw behoeften op het gebied van voertuigtoegang. Wanneer u voor ons kiest, krijgt u in een mum van tijd weer veilig toegang tot uw voertuig en ons doel is om u binnen enkele minuten weer op weg te helpen. Wij streven ernaar om bij alle spoedgevallen binnen {SITE_CONFIG.responseTime} ter plaatse te zijn. Al het werk wordt uitgevoerd door volledig gekwalificeerde en zeer ervaren specialisten, zodat u in veilige handen bent.</p>

                  <h3>Autosleutelmaker Bij U in de Buurt</h3>
                  <p>Als u ooit een autosleutel specialist nodig heeft, hoeft u zich geen zorgen te maken! Wij zijn betrouwbare slotenmakers in de regio die u altijd kunnen helpen. {SITE_CONFIG.name} levert betaalbare service; we kunnen op elk moment van de dag op uw locatie zijn en hebben uw auto zo weer open. Het grootste voordeel is dat onze autosleutel specialist naar u toe komt! Dit bespaart u wachttijd en dure sleepkosten. En als u zich zorgen maakt over de kosten, wees gerust – bij {SITE_CONFIG.name} bieden we de meest concurrerende tarieven in de regio.</p>

                  <h3>Spoed Autosleutel Diensten</h3>
                  <p>Ons bedrijf biedt deskundige specialisten die u uit elke noodsituatie helpen. Bovendien, of u nu thuis staat, op het werk of langs de weg, we zijn altijd beschikbaar om u te helpen. Bel ons voor spoed autosleutel diensten. Ons team is getraind om uw probleem efficiënt af te handelen en we begrijpen volkomen dat dergelijke situaties stressvol kunnen zijn.</p>

                  <h3>Professionele Autosleutel Diensten:</h3>
                  <p>Geniet van onze professionele, vriendelijke en probleemloze autosleutel diensten. Onze specialisten en technici zijn gecertificeerd en betrouwbaar. Ons bedrijf biedt 24-uurs service bij u aan de deur. Wij repareren, vervangen en openen elk autoslot.</p>

                  <h3>Betrouwbare Service voor Betaalbare Prijzen:</h3>
                  <p>Bij {SITE_CONFIG.name} zijn we toegewijd aan het leveren van snelle, betrouwbare diensten tegen betaalbare prijzen aan onze klanten. We begrijpen dat noodgevallen op elk moment van de dag of nacht kunnen gebeuren, daarom leveren we een 24-uurs autosleutel spoedservice, elke dag van de week.</p>

                  <h3>Onze Autosleutel Specialist zal:</h3>
                  <ul className={styles.checkList}>
                    <li>Binnen {SITE_CONFIG.responseTime} bij u op locatie zijn.</li>
                    <li>Bij spoed direct naar u toe komen.</li>
                    <li>Ter plaatse een nieuwe sleutel voor u leveren (en een reserve als u dat wilt).</li>
                    <li>Uw sleutel opnieuw programmeren indien nodig.</li>
                    <li>Een beschadigde sleutel vervangen.</li>
                  </ul>

                  <h3>Waarom Kiezen Voor Onze Service?</h3>
                  <ul className={styles.checkList}>
                    <li>Gecertificeerde specialisten.</li>
                    <li>24/7 beschikbaarheid.</li>
                    <li>Professionele service.</li>
                    <li>Gebruik van geavanceerde en gespecialiseerde apparatuur.</li>
                    <li>Eerlijke en vaste prijzen vooraf.</li>
                    <li>Snelle service & tevredenheidsgarantie.</li>
                  </ul>
                </div>
              </div>

              {/* Side CTA */}
              <aside className={styles.sidebar}>
                <div className={styles.sideCard}>
                  <h3>Direct Hulp Nodig?</h3>
                  <p>Bel of WhatsApp ons. Wij zijn 24/7 bereikbaar en gemiddeld binnen {SITE_CONFIG.responseTime} bij u.</p>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.sidePhone} id={`svc-sidebar-${slug}-phone`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                    {SITE_CONFIG.phone}
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.sideWa} id={`svc-sidebar-${slug}-wa`}>WhatsApp Direct</a>

                  <div className={styles.sideList}>
                    {['Geen sleepkosten','Vaste prijs afgesproken vóór aanvang','Verzekeringsklare factuur','12 maanden garantie','24/7 beschikbaar'].map(item => (
                      <div key={item} className={styles.sideListItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{color:'var(--color-success)',flexShrink:0}} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className={styles.ratingCard}>
                  <div className="stars">★★★★★</div>
                  <p className={styles.ratingText}>&ldquo;Vakkundig en snel. Prijs 40% lager dan BMW dealer.&rdquo;</p>
                  <small>M. van den Berg — BMW 5 Serie, Eindhoven</small>
                  <div style={{marginTop:'0.5rem', fontSize:'0.78rem', color:'var(--gray-400)'}}>{SITE_CONFIG.reviewCount} Google beoordelingen · {SITE_CONFIG.rating}/5</div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Gallery placeholder */}
        <section className="gallery-section">
          <div className="container">
            <h2>Galerij — {service.title}</h2>
            <div className="gallery-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="gallery-item">
                  <div className="gallery-placeholder">
                    <svg className="gallery-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span>{service.title} — foto {i+1}</span>
                    <small>Voeg WebP foto toe</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <h2>Veelgestelde Vragen — {service.title}</h2>
            <div style={{maxWidth:800}}>
              {service.faq.map((f, i) => (
                <details key={i} className="faq-item">
                  <summary className="faq-question">
                    {f.q}
                    <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                  </summary>
                  <p className="faq-answer">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Cities */}
        <section className={styles.section}>
          <div className="container">
            <h2>{service.title} — Per Stad</h2>
            <p>Wij komen mobiel naar u toe. Klik op uw stad voor specifieke info.</p>
            <div className={styles.cityGrid}>
              {p1Cities.map(city => (
                <Link key={city.slug} href={`/steden/${city.slug}`} id={`svc-city-${city.slug}`} className={styles.cityCard}>
                  <span>{city.city}</span>
                  <span className={styles.cityTime}>{city.travelTime}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Related services */}
        {related.length > 0 && (
          <section className={styles.sectionAlt}>
            <div className="container">
              <h2>Gerelateerde Diensten</h2>
              <div className={styles.relatedGrid}>
                {related.map(r => (
                  <Link key={r.slug} href={`/diensten/${r.slug}`} id={`related-${r.slug}`} className={styles.relatedCard}>
                    <strong>{r.title}</strong>
                    <p>{r.intro.substring(0, 100)}...</p>
                    <span className={styles.relatedArrow}>Meer info →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── REVIEWS SECTION ────────────────────────────────────── */}
        <section className={styles.reviews}>
          <div className="container">
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
              KLANTBEOORDELINGEN
            </p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              Wat Klanten Zeggen over {service.title}
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
              {serviceReviews.map((r, i) => (
                <div key={i} className={styles.reviewCardSection}>
                  <div className={styles.ratingStarsReview}>★★★★★</div>
                  <p className={styles.reviewText}>&quot;{r.text}&quot;</p>
                  <div className={styles.reviewMetaSection}>
                    <div className={styles.reviewAvatar}>{r.name[0]}</div>
                    <div>
                      <strong>{r.name}</strong>
                      <span>{r.city} — {r.car}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className="container">
            <h2>{service.title} Nodig? Bel Direct — 24/7</h2>
            <p>Gemiddeld {SITE_CONFIG.responseTime} bij u ter plaatse. Vaste prijs vooraf.</p>
            <div className={styles.ctaBtns}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`svc-cta-${slug}-phone`}>{SITE_CONFIG.phone}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.waBtn} id={`svc-cta-${slug}-wa`}>WhatsApp Direct</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
