import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { DIENSTEN } from '@/config/diensten';
import { getRelatedBlogPosts } from '@/config/services';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { CITIES } from '@/config/cities';
import { BRANDS } from '@/config/brands';
import styles from './page.module.css';

export async function generateStaticParams() {
  return DIENSTEN.map(s => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = DIENSTEN.find(s => s.slug === slug);
  if (!service) return {};
  const pageUrl = `${SITE_CONFIG.domain}/diensten/${slug}`;
  return {
    title: `${service.title} | Mobiel & 100% Schadevrij | Bel 06 11 75 12 31`,
    description: service.metaDesc,
    alternates: {
      canonical: pageUrl,
      languages: {
        'nl-NL': pageUrl,
        'x-default': pageUrl,
      },
    },
    openGraph: {
      url: pageUrl,
      title: `${service.title} | Mobiel & Schadevrij ter Plaatse`,
      description: service.metaDesc,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${service.title} — Autosleutel24` }],
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
      text: `Geweldige ervaring met ${titleLower}! De monteur was binnen 20 minuten ter plaatse in Utrecht en loste het professioneel en volledig schadevrij op. Stukken goedkoper dan de officiële dealer.`,
      name: 'Johan de Boer',
      city: 'Utrecht',
      car: 'Volkswagen Golf'
    },
    {
      text: `Onze reserve autosleutel reageerde niet meer. Autosleutel24 heeft ter plekke de service ${titleLower} uitgevoerd. Snelle, eerlijke en transparante communicatie vooraf. Zeer aan te bevelen!`,
      name: 'Marieke van Leeuwen',
      city: 'Amersfoort',
      car: 'Ford Fiesta'
    },
    {
      text: `Buitengewoon tevreden over de snelle hulp bij ${titleLower}. De monteur kwam direct naar mijn werkplek en pakt het grondig aan. Helemaal top en netjes inclusief 12 maanden schriftelijke garantie!`,
      name: 'Sven Peters',
      city: 'Hilversum',
      car: 'BMW 3 Serie'
    },
    {
      text: `Zeer deskundige slotenmaker die direct ter plaatse was voor ${titleLower}. Netjes vooraf een vaste prijs afgesproken en achteraf direct een officiële factuur ontvangen voor mijn verzekering.`,
      name: 'Annelies Bakker',
      city: 'Almere',
      car: 'Opel Corsa'
    },
    {
      text: `Sleutelprobleem vakkundig en zonder schade opgelost via ${titleLower}. Erg handig dat hun mobiele servicebus direct naar je toe komt, dat scheelt een hoop wachttijd én dure sleepkosten naar de garage.`,
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

  const p1Cities = CITIES.filter(c => c.priority === 'P1').slice(0, 8);
  const popularBrands = BRANDS.filter(b => b.priority === 'P1').slice(0, 8);
  const serviceReviews = generateServiceReviews(service.title, slug);

  const isOpening = ['autodeur-openen', 'sleutel-in-auto', 'deur-dichtgevallen', 'kofferbak-openen', 'sleutel-afgebroken-in-slot', 'noodopening-auto'].includes(slug);
  const isKey = ['sleutel-bijmaken', 'autosleutel-kwijt', 'alle-sleutels-kwijt-auto', 'reserve-autosleutel', 'transponder-programmeren', 'smart-key-programmeren'].includes(slug);

  const trustItems = [
    '24/7 Mobiele Service',
    `Binnen ${SITE_CONFIG.responseTime} ter plaatse`,
    isOpening ? '100% Schadevrij Openen' : (service.priceFrom ? service.priceFrom : 'Vaste prijs vooraf'),
    '12 Maanden Garantie',
    'KVK Geregistreerd',
    'Verzekerd & Gecertificeerd'
  ];

  // Dynamic scenarios for better SEO & human tone
  const bulletItems = isOpening ? [
    { strong: 'Sleutel op de autostoel of in het contact laten liggen:', text: 'U stapt even uit en de centrale deurvergrendeling springt automatisch dicht terwijl de sleutel nog binnen ligt.' },
    { strong: 'Sleutel in de kofferbak beland:', text: 'Tijdens het inladen van boodschappen, sportspullen of bagage klapt de klep dicht terwijl uw sleutel nog in de laadruimte ligt.' },
    { strong: 'Batterij afstandsbediening of smart key leeg:', text: 'De auto reageert niet meer op het signaal en de mechanische noodsleutel in de portiergreep draait niet door vuil of vorst.' },
    { strong: 'Kind of huisdier per ongeluk ingesloten:', text: 'Een acute noodsituatie waarin wij direct met de hoogste prioriteit én gegarandeerd schadevrij ingrijpen.' },
    { strong: 'Elektronische storing in de centrale vergrendeling:', text: 'Het slot weigert dienst of de keyless-entry module detecteert de sleutel niet meer na een spanningsdip.' }
  ] : isKey ? [
    { strong: 'U heeft slechts één werkende sleutel over:', text: 'Voorkom acute stress en hoge wegsleepkosten door tijdig een reserve autosleutel met startonderbreker te laten bijmaken.' },
    { strong: 'Sleutel kwijtgeraakt of gestolen:', text: 'Wij wissen direct de verloren of gestolen sleutels uit de boordcomputer (ECU) zodat uw auto 100% beveiligd blijft tegen diefstal.' },
    { strong: 'Behuizing versleten of knoppen ingedrukt:', text: 'Het sleutelblad is krom of de rubberen drukknoppen zijn kapot waardoor vocht de printplaat kan beschadigen.' },
    { strong: 'Transponder of chip wordt niet meer herkend:', text: 'De startmotor draait wel, maar de motor slaat niet aan omdat het startblokkeringssignaal niet doorkomt.' },
    { strong: 'Extra sleutel nodig voor partner of gezinslid:', text: 'Direct ter plaatse ingeleerd en getest op alle portieren en het contactslot.' }
  ] : [
    { strong: 'Contactslot draait niet of zit muurvast:', text: 'De sleutel wil niet meer draaien in het stuurslot door interne slijtage van de cilinder of het stuurkolomscharnier.' },
    { strong: 'Sleutel afgebroken in het contact of portierslot:', text: 'Wij verwijderen het afgebroken sleutelstuk met speciale extractietools zonder het slot te beschadigen.' },
    { strong: 'Elektronische storing of communicatiefout:', text: 'De startonderbreker of BCM-module blokkeert de startvrijgave van uw voertuig.' },
    { strong: 'Slijtage aan sleutelblad of sleutelbaard:', text: 'Door jarenlang gebruik is het metaal afgesleten waardoor de sleutel hakt of blijft hangen.' }
  ];

  const pricingHeaders = ['Dienst / Sleuteltype', 'Kenmerken', 'Onze Tarieven', 'Dealer Prijs'];
  const pricingRows = [
    ['Standaard autosleutel (mechanisch)', 'Zonder afstandsbediening, incl. transponder chip', 'Vanaf € 89,-', '€ 140,- t/m € 180,-'],
    ['Autosleutel met afstandsbediening', 'Originele kwaliteit, incl. inleren & slijpen', 'Vanaf € 135,-', '€ 220,- t/m € 320,-'],
    ['Smart Key / Keyless Entry', 'Proximity start, volledig geprogrammeerd', 'Vanaf € 175,-', '€ 350,- t/m € 480,-'],
    ['Sleutel behuizing / batterij vervangen', 'Nieuwe behuizing, micro-switches & batterij', 'Vanaf € 35,-', 'Vaak hele sleutel (€ 200+)'],
    ['All Keys Lost (alle sleutels kwijt)', 'Gespecialiseerde noodprogrammering op locatie', 'Op aanvraag', '€ 800,-+ (incl. wegsleepkosten)']
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
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span>
              <Link href="/diensten">Diensten</Link> <span>/</span>
              <span>{service.title}</span>
            </nav>

            <h1>{service.h1}</h1>

            <p className={styles.heroLead}>{service.intro}</p>

            <div className={styles.heroCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id={`svc-${slug}-phone`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                Bel Direct: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id={`svc-${slug}-wa`}>WhatsApp Direct</a>
              <Link href="/contact" className={styles.btnOutline} id={`svc-${slug}-form`}>Direct Offerte</Link>
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
                  <h2>Wanneer Heeft U {service.title} Nodig?</h2>
                  <p>
                    Problemen met autovergrendeling of autosleutels doen zich altijd op een ongelegen moment voor. Bij {SITE_CONFIG.name} begrijpen wij hoe frustrerend en stressvol dit is. Onze gespecialiseerde monteurs staan dag en nacht voor u klaar en lossen onderstaande situaties dagelijks schadevrij voor u op:
                  </p>
                  <ul className={styles.bulletList}>
                    {bulletItems.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.strong}</strong> {item.text}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 2: Prijzen Tabel of Openingsmethoden */}
                {isOpening ? (
                  <div>
                    <h2>Schadevrije Openingsmethoden & Garantie</h2>
                    <p>
                      Onze monteurs maken uitsluitend gebruik van geavanceerd, merkspecifiek slotenmakersgereedschap. In tegenstelling tot traditionele garages of bergingdiensten openen wij uw voertuig 100% schadevrij. Wij verbuigen geen deurstijlen, veroorzaken geen lakbeschadigingen en breken nooit ruiten in.
                    </p>
                    <div className={styles.tableWrapper} style={{ marginBottom: '2rem' }}>
                      <table className={styles.pricingTable}>
                        <thead>
                          <tr>
                            <th>Techniek / Gereedschap</th>
                            <th>Toepassing & Situatie</th>
                            <th>Schadevrij Garantie</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong>Air Wedge + Long Reach Tool</strong></td>
                            <td>Standaard bij 95% van alle moderne personenauto&apos;s</td>
                            <td>100% schadevrij, geen druk op lak of rubber</td>
                          </tr>
                          <tr>
                            <td><strong>Lishi 2-in-1 Pick / Decoder</strong></td>
                            <td>Rechtstreeks via het portierslot lockpicken en uitlezen</td>
                            <td>100% mechanische precisie zonder geweld</td>
                          </tr>
                          <tr>
                            <td><strong>Turbo Decoder</strong></td>
                            <td>Hoogbeveiligde sloten (zoals BMW, VAG en Porsche)</td>
                            <td>Veilig en bliksemsnel zonder braaksporen</td>
                          </tr>
                          <tr>
                            <td><strong>Extractie & Cilinder Bypass</strong></td>
                            <td>Bij afgebroken sleutelstukjes in het contact of portierslot</td>
                            <td>Behoud van uw originele slotcilinder</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className={styles.callout}>
                      <strong>Schadevrije garantie:</strong> Wij garanderen 100% schadevrije opening of herstel. Mocht er in een uitzonderlijk geval vooraf een risico zijn, dan bespreekt onze monteur dit altijd transparant met u vóór aanvang van de werkzaamheden.
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2>Wat Kost {service.title}? — Transparante Prijzen</h2>
                    <p>
                      Wij geloven in eerlijke en heldere tarieven zonder verborgen kosten achteraf. Omdat wij rechtstreeks vanuit onze volledig uitgeruste mobiele servicebussen werken, bespaart u bij ons tot wel 50% vergeleken met de officiële merkdealer — én u hoeft geen dure wegsleepkosten te betalen!
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
                      <strong>Transparantie vooraf:</strong> De exacte prijs is afhankelijk van uw automerk, model, bouwjaar en sleuteltype. Neem direct contact op via telefoon of WhatsApp en u ontvangt van ons direct een vaste prijsopgave zonder verrassingen achteraf.
                    </div>
                  </div>
                )}

                {/* Section 2.5: SEO Image & Expert Description */}
                <div>
                  <h2>Professionele Mobiele Service — Direct Ter Plaatse</h2>
                  {slug === 'autodeur-openen' ? (
                    <img 
                      src="/images/seo/auto_deur_openen_slotenmaker_utrecht_schadevrij.webp" 
                      alt="Auto deur schadevrij openen door professionele mobiele slotenmaker in Utrecht - 24/7 service" 
                      style={{ width: '100%', borderRadius: '12px', margin: '1.25rem 0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', objectFit: 'cover', aspectRatio: '16/9' }}
                    />
                  ) : (
                    <img 
                      src="/autosleutel24-sleutelbijmaken-utrecht.webp" 
                      alt={`Professionele mobiele service voor ${service.title.toLowerCase()} - direct ter plaatse en 100% schadevrij`} 
                      style={{ width: '100%', borderRadius: '12px', margin: '1.25rem 0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', objectFit: 'cover', aspectRatio: '16/9' }}
                    />
                  )}
                  <p>
                    Wanneer u te maken krijgt met een autovergrendelingsprobleem of een kapotte sleutel, is een snelle en deskundige oplossing van vitaal belang. Onze mobiele servicebussen fungeren als rijdende high-tech werkplaatsen. Ze zijn uitgerust met dezelfde geavanceerde diagnoseapparatuur en sleutelslijpmachines als de officiële merkdealers. Hierdoor hoeft u uw voertuig niet op te laten slepen; wij voeren de volledige service direct op uw eigen oprit, op uw werkplek of langs de snelweg uit.
                  </p>
                  <p>
                    Onze werkwijze is gebaseerd op snelheid, vakmanschap en betrouwbaarheid. Waar een garage vaak meerdere werkdagen tot zelfs weken levertijd heeft voor het bestellen en inleren van een nieuwe autosleutel of contactslot, regelen wij dit in vrijwel alle gevallen dezelfde dag nog. Wij lezen de beveiligingscodes uit via de OBD2-diagnosepoort, frezen het sleutelblad met laserprecisie en programmeren de startonderbreker (transponder) direct in het motorregelsysteem van uw auto.
                  </p>
                </div>

                {/* Section 3: Hoe Werkt Het */}
                <div>
                  <h2>Hoe Werkt {service.title} bij Autosleutel24?</h2>
                  <ol className={styles.stepList}>
                    {service.steps.map((stepText, idx) => (
                      <li key={idx} className={styles.stepItem}>
                        <span className={styles.stepNum}>{idx + 1}</span>
                        <div className={styles.stepText}>
                          <strong>Stap {idx + 1}: {idx === 0 ? 'Neem Direct Contact Op' : idx === 1 ? 'Monteur Snel Onderweg' : idx === 2 ? 'Schadevrije Uitvoering' : 'Garantiestelling & Factuur'}</strong>
                          {stepText}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Section 4: Welke Merken Bedienen Wij */}
                <div>
                  <h2>Voor Welke Merken Bieden Wij {service.title}?</h2>
                  <p>
                    Onze programmeerapparatuur en Lishi-openingsgereedschappen ondersteunen meer dan 95% van alle automerken op de Nederlandse wegen. Wij zijn specialist in onder andere:
                  </p>
                  <ul className={styles.bulletList}>
                    {popularBrands.map(b => (
                      <li key={b.slug}>
                        <Link href={`/steden/utrecht/${b.nameSlug}-autosleutel-bijmaken`}>
                          {b.name}
                        </Link>
                        {' '}— Systeem: {b.system}
                      </li>
                    ))}
                  </ul>
                  <p>
                    <Link href="/merken" style={{ fontWeight: 700, color: '#f97316' }}>Bekijk alle automerken en modellen die wij bedienen →</Link>
                  </p>
                </div>

                {/* Section 5: Waar Komen Wij */}
                <div>
                  <h2>In Welke Regio&apos;s Bieden Wij {service.title}?</h2>
                  <p>
                    Met onze centrale ligging en meerdere mobiele service-eenheden bedienen wij dagelijks een groot werkgebied in Nederland. Wij zijn razendsnel ter plaatse in onder meer:
                  </p>
                  <ul className={styles.bulletList}>
                    {p1Cities.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/steden/${c.slug}/${slug}`}>
                          {c.city}
                        </Link>
                        {` — Directe mobiele noodservice ter plaatse binnen ${c.travelTime}`}
                      </li>
                    ))}
                  </ul>
                  <p>
                    <Link href="/steden" style={{ fontWeight: 700, color: '#f97316' }}>Bekijk ons volledige werkgebied per provincie en stad →</Link>
                  </p>
                </div>

                {/* Section 6: FAQ Accordion */}
                <div>
                  <h2>Veelgestelde Vragen over {service.title}</h2>
                  {service.faq.map((f, i) => (
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

              </div>

              {/* Sidebar */}
              <aside className={styles.sidebar}>
                <div className={styles.sideCard}>
                  <h3>Direct Hulp Nodig?</h3>
                  <p>Bel of WhatsApp ons direct. Wij zijn 24/7 bereikbaar en gemiddeld binnen {SITE_CONFIG.responseTime} bij u op locatie.</p>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.sidePhone} id={`svc-sidebar-${slug}-phone`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                    Bel: {SITE_CONFIG.phone}
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.sideWa} id={`svc-sidebar-${slug}-wa`}>WhatsApp Direct</a>
                  <div className={styles.sideList}>
                    {['Geen sleepkosten', 'Vaste prijs vooraf', 'Verzekeringsklare factuur', '12 maanden garantie', '24/7 beschikbaar'].map(item => (
                      <div key={item} className={styles.sideListItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ color: '#22c55e', flexShrink: 0 }} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.ratingCard}>
                  <div className={styles.ratingStars}>★★★★★</div>
                  <p className={styles.ratingText}>&ldquo;Razendsnel geholpen! Binnen 25 minuten stond de monteur er en de deur was in 3 minuten schadevrij open.&rdquo;</p>
                  <span className={styles.ratingMeta}>Mark van den Berg — BMW 5 Serie, Utrecht</span>
                  <span className={styles.ratingCount}>{SITE_CONFIG.reviewCount} Google beoordelingen · {SITE_CONFIG.rating}/5</span>
                </div>
              </aside>

            </div>

            {/* Bottom CTA block */}
            <div className={styles.ctaBlock}>
              <h2>{service.title} Nodig? Bel Onze Mobiele Spoedservice</h2>
              <p>Geen lange wachttijden, geen dure sleepkosten naar de garage. Wij zijn 24 uur per dag, 7 dagen per week beschikbaar en komen direct naar u toe.</p>
              <div className={styles.ctaBtnsGrid}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPrimary} id={`svc-cta-${slug}-phone`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                  Bel: {SITE_CONFIG.phone}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWhatsapp} id={`svc-cta-${slug}-wa`}>WhatsApp Direct</a>
              </div>
              <div className={styles.microText}>
                <span>✓ Direct contact met monteur</span>
                <span>✓ Vaste prijs vooraf, geen verrassingen</span>
                <span>✓ 100% Schadevrije garantie</span>
              </div>
            </div>

            {/* ── RELATED BLOGS SECTION ────────────────────────────────── */}
            {(() => {
              const relatedPosts = getRelatedBlogPosts(slug);
              if (!relatedPosts || relatedPosts.length === 0) return null;
              return (
                <section className={styles.relatedBlogsSection} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                  <div className={styles.relatedBlogsContainer} style={{ padding: 0 }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
                      GERELATEERDE KENNIS &amp; ADVIES
                    </p>
                    <h2 className={styles.relatedBlogsTitle}>
                      Handige artikelen over {service.title}
                    </h2>
                    <div className={styles.relatedBlogsGrid}>
                      {relatedPosts.map((post) => (
                        <Link
                          key={post.slug}
                          href={`/blog/${post.slug}`}
                          className={styles.blogPostCard}
                          id={`related-blog-${post.slug}`}
                        >
                          <div className={styles.blogPostMeta}>
                            <span className={styles.blogPostReadTime}>{post.readTime} lezen</span>
                            <span className={styles.blogPostDate}>
                              {new Date(post.publishDate).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                          <h3 className={styles.blogPostTitle}>{post.title}</h3>
                          <p className={styles.blogPostExcerpt}>{post.excerpt}</p>
                          <span className={styles.blogPostLink}>Lees artikel →</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* ── REVIEWS SECTION ────────────────────────────────────── */}
            <section className={styles.reviews}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem', textAlign: 'center' }}>
                KLANTBEOORDELINGEN
              </p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2rem 0', textAlign: 'center' }}>
                Wat Onze Klanten Zeggen over {service.title}
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
                {serviceReviews.map((r, i) => (
                  <div key={i} className={styles.reviewCardSection}>
                    <div className={styles.ratingStarsReview}>★★★★★</div>
                    <p className={styles.reviewText}>&quot;{r.text}&quot;</p>
                    <div className={styles.reviewMetaSection}>
                      <div className={styles.reviewAvatar}>{r.name[0]}</div>
                      <div>
                        <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.9rem' }}>{r.name}</strong>
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{r.city} — {r.car}</span>
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
