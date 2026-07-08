import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import styles from './page.module.css';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { BRANDS } from '../config/brands';

export const metadata: Metadata = {
  title: 'Autosleutel24 | Dé Autosleutelspecialist | Alle Merken | 24/7',
  description: `Professionele autosleutelspecialist voor alle merken. Mobiele service in Utrecht en omstreken, zelfde dag ter plaatse. Goedkoper dan de dealer. Bel direct: ${SITE_CONFIG.phone}`,
  alternates: {
    canonical: SITE_CONFIG.domain,
    languages: {
      'nl-NL': SITE_CONFIG.domain,
      'x-default': SITE_CONFIG.domain,
    },
  },
};

const locksmithSchema = {
  '@context': 'https://schema.org',
  '@type': 'Locksmith',
  '@id': `${SITE_CONFIG.domain}/#locksmith`,
  name: SITE_CONFIG.fullName,
  url: SITE_CONFIG.domain,
  telephone: SITE_CONFIG.phoneTel,
  email: SITE_CONFIG.email,
  priceRange: '€€',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Mobiele Service',
    addressLocality: SITE_CONFIG.address.city,
    addressRegion: SITE_CONFIG.address.region,
    postalCode: SITE_CONFIG.address.postal,
    addressCountry: SITE_CONFIG.address.country,
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: SITE_CONFIG.geo.lat,
    longitude: SITE_CONFIG.geo.lng,
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
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
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

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_CONFIG.domain,
    },
  ],
};

const services = [
  { 
    title: 'Sleutel Bijmaken', 
    desc: 'Reserve sleutel laten programmeren voor alle merken en modellen ter plaatse.', 
    href: '/diensten/sleutel-bijmaken',
    src: '/images/seo/autosleutel_bijmaken_utrecht_car_keys.webp',
    alt: 'Autosleutel bijmaken en programmeren in Utrecht en heel Nederland - klaar terwijl u wacht op locatie'
  },
  { 
    title: 'Transponder Programmeren', 
    desc: 'Chip-sleutels en transponders voor alle systemen met mobiele apparatuur ingeleerd.', 
    href: '/diensten/transponder-sleutel-programmeren',
    src: '/images/seo/reserve_autosleutel_transponder_programmeren_utrecht.webp',
    alt: 'Transponder sleutel programmeren en chip inleren voor alle automerken op locatie in Utrecht'
  },
  { 
    title: 'Smart Key / Keyless', 
    desc: 'Proximity keys, comfort access en keyless entry systemen storingen oplossen en inleren.', 
    href: '/diensten/smart-key-programmeren',
    src: '/images/seo/slotenmaker_voorraad_utrecht_sleutels.webp',
    alt: 'Smart key en keyless entry autosleutels inleren en programmeren met mobiele apparatuur in Utrecht'
  },
  { 
    title: 'Contact Reparatie', 
    desc: 'Contactslot defect of beschadigd? Wij repareren of vervangen direct op uw locatie.', 
    href: '/diensten/contact-reparatie',
    src: '/images/seo/contactslot_reparatie_vervangen_utrecht_slotenmaker.webp',
    alt: 'Contactslot reparatie en vervangen voor alle merken auto\'s ter plaatse in Utrecht zonder sleepkosten'
  },
  { 
    title: 'Auto Openen', 
    desc: 'Sleutels in auto vergeten of autodeur in het slot? Wij openen uw auto 100% schadevrij.', 
    href: '/auto-op-slot',
    src: '/images/seo/auto_deur_openen_slotenmaker_utrecht_schadevrij.webp',
    alt: 'Auto schadevrij openen bij sleutels in auto vergeten of autodeur op slot in Utrecht en omgeving'
  },
  { 
    title: 'Alarm Programmeren', 
    desc: 'Autoalarm installatie, programmering en storingsoplossing door gecertificeerde specialisten.', 
    href: '/diensten/alarm-programmeren',
    src: '/images/seo/slotenmaker_gereedschap_utrecht_spoed.webp',
    alt: 'Autoalarm installeren, storingen oplossen en afstandsbediening programmeren door autosleutelspecialist'
  },
];

const serviceAreaCities = [
  { name: 'Utrecht (Hoofdlocatie)', slug: 'utrecht', time: '15-20 min' },
  { name: 'Amsterdam', slug: 'amsterdam', time: '40-55 min' },
  { name: 'Amsterdam-Zuid', slug: 'amsterdam-zuid', time: '35-45 min' },
  { name: 'Almere', slug: 'almere', time: '35-45 min' },
  { name: 'Amersfoort', slug: 'amersfoort', time: '25-35 min' },
  { name: 'Hilversum', slug: 'hilversum', time: '30-40 min' },
  { name: 'Bussum', slug: 'bussum', time: '30-40 min' },
  { name: 'Naarden', slug: 'naarden', time: '30-40 min' },
  { name: 'Amstelveen', slug: 'amstelveen', time: '35-45 min' },
  { name: 'Zeist', slug: 'zeist', time: '18-22 min' },
  { name: 'Huizen', slug: 'huizen', time: '35-45 min' },
  { name: 'Diemen', slug: 'diemen', time: '35-45 min' },
];

const galleryItems = [
  { title: 'Professionele Werkplaats Utrecht', src: '/autosleutel24-sleutelbijmaken-utrecht.jpg', alt: 'Autosleutel24 professionele werkplaats in Utrecht voor autosleutel bijmaken en programmeren' },
  { title: 'Sleutel Programmering', src: '/gallery/1.png', alt: 'Autosleutel programmering ter plaatse door specialist' },
  { title: 'Gereedschappen', src: '/gallery/2.png', alt: 'Diagnoseapparatuur en programmeertools voor autosleutels' },
  { title: 'Mercedes EIS bench', src: '/gallery/2.png', alt: 'Mercedes EIS contactslot reparatie op testbank' },
  { title: 'VW Golf 8 SFD', src: '/gallery/1.png', alt: 'Volkswagen Golf 8 smart key programmering met SFD bypass' },
  { title: 'Toyota bypass kabel', src: '/gallery/2.png', alt: 'Toyota OBD-kabel bypass voor sleutels inleren' },
  { title: 'Voor/na sleutel', src: '/gallery/1.png', alt: 'Autosleutel behuizing reparatie voor en na resultaat' },
  { title: 'Klantmoment', src: '/hero-auto.png', alt: 'Tevreden klant met nieuw geprogrammeerde reservesleutel' },
];

export default function HomePage() {
  return (
    <>
      <Script id="home-locksmith-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(locksmithSchema) }} />
      <Script id="home-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>Dé Mobiele Autosleutelspecialist — Heel Nederland</p>
            <h1 className={styles.heroTitle}>
              Autosleutel Kwijt of Defect?<br />
              <span className={styles.heroOrange}>Wij Zijn Er Binnen 30–60 Minuten</span>
            </h1>
            <p className={styles.heroLead}>
              Professionele sleutelprogrammering voor alle merken. Geen sleepkosten. 
              Goedkoper dan de dealer. Dealer-niveau apparatuur. 24/7 bereikbaar.
            </p>
            <div className={styles.heroCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.heroPhoneBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                Bel: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.heroWaBtn}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
            <Link href="/autosleutel-kwijt" className={styles.heroUrgentBtn}>Alle Sleutels Kwijt? →</Link>
            <div className={styles.heroTrust} style={{marginTop: '1.5rem'}}>
              <span className={styles.trustPill}>✓ KVK Geregistreerd</span>
              <span className={styles.trustPill}>✓ 4.9 / 5 Google (247 reviews)</span>
              <span className={styles.trustPill}>✓ Verzekerd & Gecertificeerd</span>
              <span className={styles.trustPill}>✓ 24/7 Bereikbaar</span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroImg}>
              <Image 
                src="/hero-auto.png" 
                alt="Mobiele Autoslotenmaker Service" 
                width={600} 
                height={400} 
                className={styles.heroImgFull}
                style={{objectFit: 'cover', width: '100%', height: '100%'}}
              />
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}><strong>30 min</strong><span>Gem. Reactietijd</span></div>
              <div className={styles.heroStatDiv}></div>
              <div className={styles.heroStat}><strong>247</strong><span>Klanten Geholpen</span></div>
              <div className={styles.heroStatDiv}></div>
              <div className={styles.heroStat}><strong>38</strong><span>Merken</span></div>
              <div className={styles.heroStatDiv}></div>
              <div className={styles.heroStat}><strong>24/7</strong><span>Service</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EMERGENCY STRIP ===== */}
      <section className={styles.emergencyStrip}>
        <div className={styles.emergencyInner}>
          <div className={styles.emergencyItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span><strong>Autosleutel Kwijt?</strong> Direct hulp</span>
          </div>
          <div className={styles.emergencyItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <span><strong>Auto Op Slot?</strong> Schadevrij openen</span>
          </div>
          <div className={styles.emergencyItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span><strong>24/7 Spoedhulp</strong> Bel nu</span>
          </div>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.emergencyPhone}>{SITE_CONFIG.phone}</a>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className={styles.services}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className="section-eyebrow">ONZE DIENSTEN</p>
            <h2 className="section-title">Alles voor Uw Autosleutel</h2>
            <p className="section-lead">Ter plaatse geprogrammeerd in onze volledig uitgeruste bus. Geen verborgen kosten.</p>
          </div>
          <div className={styles.servicesGrid}>
            {services.map((s, i) => (
              <Link key={i} href={s.href} className={styles.serviceCard} id={`svc-${i}`}>
                <div className={styles.serviceImgBox}>
                  <Image
                    src={s.src}
                    alt={s.alt}
                    width={400}
                    height={225}
                    className={styles.serviceImg}
                  />
                </div>
                <div className={styles.serviceBody}>
                  <div className={styles.serviceTitleRow}>
                    <div className={styles.serviceIconBox}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
                        {i === 0 && <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>}
                        {i === 1 && <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>}
                        {i === 2 && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>}
                        {i === 3 && <><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>}
                        {i === 4 && <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>}
                        {i === 5 && <><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>}
                      </svg>
                    </div>
                    <h3 className={styles.serviceTitle}>{s.title}</h3>
                  </div>
                  <p className={styles.serviceDesc}>{s.desc}</p>
                  <div className={styles.serviceFooter}>
                    <span className={styles.serviceLinkText}>Bekijk dienst</span>
                    <span className={styles.serviceArrow}>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className={styles.servicesCta}>
            <Link href="/diensten" className="btn btn-navy">Alle diensten bekijken</Link>
          </div>
        </div>
      </section>

      {/* ===== BRANDS (SEO CHECKMARK LIST) ===== */}
      <section className={styles.brandsSection}>
        <div className="container">
          <div className={styles.brandsSeoHeader}>
            <h2 className={styles.brandsHeading}>Welke Merken Bedienen Wij?</h2>
            <p className={styles.brandsLead}>
              Wij maken en programmeren autosleutels voor alle gangbare merken direct ter plaatse. Onze mobiele apparatuur ondersteunt:
            </p>
          </div>
          <div className={styles.brandsCheckList}>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/volkswagen-autosleutel-bijmaken" className={styles.brandLinkOrange}>Volkswagen</Link>
                <span className={styles.brandModelsText}> — Golf, Polo, Tiguan, Transporter, Passat, Caddy (MQB &amp; PQ35 platform)</span>
              </div>
            </div>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/bmw-autosleutel-bijmaken" className={styles.brandLinkOrange}>BMW</Link>
                <span className={styles.brandModelsText}> — 1-serie, 3-serie, 5-serie, X1, X3, X5 (CAS3 / CAS4 / FEM / BDC systemen)</span>
              </div>
            </div>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/mercedes-autosleutel-bijmaken" className={styles.brandLinkOrange}>Mercedes-Benz</Link>
                <span className={styles.brandModelsText}> — A-Klasse, C-Klasse, E-Klasse, Sprinter, Vito (EIS / ESL / FBS3 / FBS4)</span>
              </div>
            </div>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/audi-autosleutel-bijmaken" className={styles.brandLinkOrange}>Audi</Link>
                <span className={styles.brandModelsText}> — A1, A3, A4, A6, Q3, Q5, Q7 (MLB &amp; MQB platform)</span>
              </div>
            </div>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/ford-autosleutel-bijmaken" className={styles.brandLinkOrange}>Ford</Link>
                <span className={styles.brandModelsText}> — Focus, Fiesta, Transit, Kuga, Puma (PAT2 / PAT3 / PAT4 smartkey)</span>
              </div>
            </div>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/toyota-autosleutel-bijmaken" className={styles.brandLinkOrange}>Toyota</Link>
                <span className={styles.brandModelsText}> — Aygo, Yaris, Corolla, RAV4, C-HR (G-chip / H-chip / Smart Entry)</span>
              </div>
            </div>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/peugeot-autosleutel-bijmaken" className={styles.brandLinkOrange}>Peugeot</Link>
                <span className={styles.brandModelsText}> — 208, 308, 2008, 3008, Partner, Boxer (BSI &amp; PIN-code uitlezen)</span>
              </div>
            </div>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/renault-autosleutel-bijmaken" className={styles.brandLinkOrange}>Renault</Link>
                <span className={styles.brandModelsText}> — Clio, Captur, Megane, Trafic, Master (Keycard &amp; Smartkey systemen)</span>
              </div>
            </div>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/opel-autosleutel-bijmaken" className={styles.brandLinkOrange}>Opel</Link>
                <span className={styles.brandModelsText}> — Corsa, Astra, Mokka, Vivaro (ID46 / ID48 transponder &amp; keyless)</span>
              </div>
            </div>
          </div>
          <Link href="/merken" className={styles.brandsAllLink}>
            Bekijk alle merken die wij bedienen →
          </Link>
        </div>
      </section>

      {/* ===== SERVICE AREA & MAP PREVIEW (SEO) ===== */}
      <section className={styles.serviceAreaSection}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '2rem' }}>
            <p className="section-eyebrow">MOBIELE SERVICE WERKGEBIED</p>
            <h2 className="section-title">Direct Op Locatie in Uw Regio</h2>
            <p className="section-lead">Onze mobiele bussen patrouilleren dagelijks in Midden-Nederland en de Randstad.</p>
          </div>
          
          <div className={styles.serviceAreaGrid}>
            <div className={styles.serviceAreaText}>
              <p className={styles.serviceAreaLead}>
                <strong>Autosleutel24</strong> bedient een uitgebreid servicegebied vanuit onze hoofdlocatie in <strong>Utrecht</strong>. Of u nu uw autosleutel bent verloren in <strong>Utrecht</strong> of <strong>Amsterdam-Zuid</strong>, met een defect contactslot staat in <strong>Amersfoort</strong> of <strong>Almere</strong>, of met spoed een transpondersleutel wilt laten inleren in &apos;t Gooi (<strong>Hilversum</strong>, <strong>Bussum</strong>, <strong>Naarden</strong>) of <strong>Amstelveen</strong> — wij komen direct naar uw thuis- of strandinglocatie.
              </p>
              <p className={styles.serviceAreaSub}>
                Dankzij onze geavanceerde GPS-gestuurde routeplanning zijn onze monteurs meestal binnen <strong>20 tot 60 minuten</strong> ter plaatse. Geen wegsleepkosten naar de dealer en altijd 100% schadevrij geopend en geprogrammeerd. Klik op uw regio voor lokale tarieven en aankomsttijden:
              </p>
              <div className={styles.serviceAreaPills}>
                {serviceAreaCities.map((city) => (
                  <Link key={city.slug} href={`/steden/${city.slug}`} className={styles.cityPill}>
                    <span>📍 {city.name}</span>
                    <span className={styles.cityPillTime}>{city.time}</span>
                  </Link>
                ))}
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <Link href="/steden" className="btn btn-navy">Bekijk alle 45+ steden in ons werkgebied</Link>
              </div>
            </div>

            <div className={styles.mapContainerWrap}>
              <div className={styles.mapLiveBanner}>
                <span className={styles.liveIndicator}>
                  <span className={styles.liveDot}></span>
                  <strong>Live bussen actief</strong> in regio Utrecht &amp; Randstad
                </span>
                <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>24/7 Noodhulp</span>
              </div>
              <div className={styles.mapBox}>
                <iframe
                  src="https://www.google.com/maps/d/embed?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4&ehbc=2E312F"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Autosleutel24 Mobiele Service Werkgebied en Servicegebieden Google Map"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMPARE ===== */}
      <section className={styles.compare}>
        <div className="container">
          <div className={styles.compareGrid}>
            <div>
              <p className="section-eyebrow">WAAROM ONS?</p>
              <h2 className="section-title">Bespaar 30–50% vs Dealer</h2>
              <p>Dealer-niveau apparatuur, transparante prijzen, dezelfde dag service. Wij komen naar u toe.</p>
              <ul className={styles.checkList}>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Goedkoper dan dealer — gegarandeerd</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Geen sleepkosten — wij komen naar u</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Zelfde dag service — ook weekend</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Dealer-niveau tools: Autel, VVDI, AVDI, ACDP</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> 12 maanden garantie</li>
                <li className={styles.checkItem}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" className={styles.checkIcon}><polyline points="20 6 9 17 4 12"/></svg> Verzekeringsklare facturen</li>
              </ul>
              <Link href="/prijzen" className="btn btn-primary">Bekijk alle prijzen</Link>
            </div>
            <div className={styles.compareTableWrap}>
              <table className="price-table">
                <thead>
                  <tr><th>Vergelijking</th><th>Dealer</th><th>Wij ✓</th></tr>
                </thead>
                <tbody>
                  <tr><td>Prijs</td><td>€300–€900</td><td><strong>€150–€500</strong></td></tr>
                  <tr><td>Wachttijd</td><td>3–14 dagen</td><td><strong>Zelfde dag</strong></td></tr>
                  <tr><td>Sleepkosten</td><td>€100–€150</td><td><strong>Geen</strong></td></tr>
                  <tr><td>Locatie</td><td>U rijdt erheen</td><td><strong>Wij komen</strong></td></tr>
                  <tr><td>Openingstijden</td><td>Ma-Vr 8–17</td><td><strong>24/7</strong></td></tr>
                  <tr><td>Garantie</td><td>Ja</td><td><strong>12 maanden</strong></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      <section className={styles.reviews}>
        <div className="container">
          <p className="section-eyebrow">KLANTBEOORDELINGEN</p>
          <h2 className="section-title">Wat Onze Klanten Zeggen</h2>
          <div className={styles.ratingBig}>
            <span className={styles.ratingNum}>4.9</span>
            <div>
              <div className="stars">★★★★★</div>
              <span style={{fontSize: '0.8rem', color: 'var(--gray-500)'}}>247 Google beoordelingen</span>
            </div>
          </div>
          <div className={styles.reviewGrid}>
            {[
              { text: 'Alle BMW sleutels kwijt. Dealer: 2 weken en €1.400. Autosleutel24: zelfde dag, €580. Aanrader.', name: 'Mark V.', city: 'Utrecht', car: 'BMW X5' },
              { text: 'Golf 8 SFD probleem. Geen enkele andere specialist kon het oplossen. Binnen 3 uur gereed.', name: 'Peter D.', city: 'Tilburg', car: 'VW Golf 8' },
              { text: 'Mercedes Sprinter vloot — vaste prijsafspraken, prioriteit service. Perfecte B2B partner.', name: 'R. Jacobs', city: 'Breda', car: 'Mercedes Sprinter' },
            ].map((r, i) => (
              <div key={i} className={styles.reviewCard}>
                <div className="stars">★★★★★</div>
                <p className={styles.reviewText}>&quot;{r.text}&quot;</p>
                <div className={styles.reviewMeta}>
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

      {/* ===== GALLERY ===== */}
      <section className="gallery-section">
        <div className="container">
          <p className="section-eyebrow">GALERIJ</p>
          <h2 className="section-title">Ons Werk in Beelden</h2>
          <p className="section-lead">Recente projecten en mobiele service in actie.</p>
          <div className="gallery-grid">
            {galleryItems.map((item, i) => (
              <div key={i} className="gallery-item" style={{position: 'relative'}}>
                <Image 
                  src={item.src} 
                  alt={item.alt} 
                  fill 
                  style={{objectFit: 'cover'}}
                />
                <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '0.5rem', color: '#fff', fontSize: '0.7rem', fontWeight: 600}}>
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <h2>Autosleutel Probleem? Bel Nu — 24/7</h2>
          <p>Gemiddeld binnen 30–60 minuten bij u. Alle merken. Heel Nederland.</p>
          <div className={styles.finalCtaBtns}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg">{SITE_CONFIG.phone}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.waBtn}>WhatsApp Direct</a>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
