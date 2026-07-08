import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import styles from './page.module.css';
import dynamic from 'next/dynamic';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { BRANDS } from '../config/brands';
import FaqSection from '@/components/FaqSection/FaqSection';
import GoogleReviewCard, { SHARED_GOOGLE_REVIEWS } from '@/components/GoogleReviewCard/GoogleReviewCard';

const InstantServiceMap = dynamic(() => import('@/components/InstantServiceMap'), { ssr: true });
const RealGalleryShowcase = dynamic(() => import('@/components/RealGalleryShowcase/RealGalleryShowcase'), { ssr: true });

export const metadata: Metadata = {
  title: 'Autosleutel Bijmaken & Programmeren Utrecht | Mobiele Sleutelmaker 24/7',
  description: `Autosleutel kwijt of defect? Mobiele autosleutelspecialist in Utrecht, Amsterdam & Almere. Alle merken. Zelfde dag ter plaatse. Goedkoper dan dealer. ⭐ 4.9/5. Bel direct: ${SITE_CONFIG.phone}`,
  alternates: {
    canonical: SITE_CONFIG.domain,
    languages: {
      'nl-NL': SITE_CONFIG.domain,
      'x-default': SITE_CONFIG.domain,
    },
  },
  openGraph: {
    url: SITE_CONFIG.domain,
    title: 'Autosleutel Bijmaken & Programmeren Utrecht | 24/7 Mobiel',
    description: 'Autosleutel kwijt? Mobiele specialist, alle merken, zelfde dag. Goedkoper dan dealer. ⭐ 4.9/5 Google. Bel 06 11 75 12 31',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Autosleutel bijmaken Utrecht — Autosleutel24 mobiele specialist' }],
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
    desc: 'Heeft u slechts één autosleutel of wilt u direct een professionele reservesleutel laten bijmaken en programmeren zonder lange wachttijden of hoge dealerprijzen? Onze gecertificeerde mobiele slotenmakers komen 24/7 naar uw locatie in heel Nederland, inclusief regio Utrecht, Amsterdam en Midden-Nederland. Wij snijden en slijpen mechanische sleutelbladen met uiterste precisie en leren transponderchips, afstandsbedieningen en moderne smart keys ter plaatse in via uw OBD2-poort. Zo voorkomt u dure wegsleepkosten naar de merkdealer en bent u binnen 30 tot 60 minuten weer veilig onderweg met een volledig werkende, geteste reservesleutel inclusief garantie.', 
    href: '/diensten/sleutel-bijmaken',
    src: '/images/seo/autosleutel_bijmaken_utrecht_car_keys.webp',
    alt: 'Autosleutel bijmaken en programmeren in Utrecht en heel Nederland - klaar terwijl u wacht op locatie'
  },
  { 
    title: 'Transponder Programmeren', 
    desc: 'Moderne personenauto\'s en bedrijfswagens zijn uitgerust met geavanceerde startonderbrekers en cryptografische transponders die communiceren met de ECU en immobilizer van uw voertuig. Wanneer uw transponderchip defect is, de sleutel niet meer wordt herkend of na een lege batterij de synchronisatie kwijt is, start uw motor niet meer. Met onze professionele dealer-niveau diagnose-apparatuur programmeren en herstellen wij transpondersleutels van alle merken ter plaatse op locatie. Wij uitlezen foutcodes, resetten de startblokkering en synchroniseren nieuwe crypto-transponders vakkundig en veilig. U bespaart tot wel honderden euro\'s vergeleken met officiële dealers en behoudt uw fabrieksbeveiliging.', 
    href: '/diensten/transponder-sleutel-programmeren',
    src: '/images/seo/reserve_autosleutel_transponder_programmeren_utrecht.webp',
    alt: 'Transponder sleutel programmeren en chip inleren voor alle automerken op locatie in Utrecht'
  },
  { 
    title: 'Autosleutels Repareren', 
    desc: (
      <>
        Is de behuizing van uw sleutel gescheurd, zijn de drukknoppen lam of werkt het klapmechanisme niet meer? In plaats van direct een dure nieuwe autosleutel aan te schaffen, kunnen onze specialisten in 90% van de gevallen uw huidige <strong style={{color: 'var(--navy-900)'}}>autosleutels repareren</strong>. Wij vervangen versleten behuizingen, solderen met uiterste precisie nieuwe micro-switches op de printplaat en plaatsen hoogwaardige Varta of Panasonic batterijen. Doordat wij mobiel werken, komen we naar u toe om uw autosleutel en afstandsbediening ter plekke te herstellen. Dit is aanzienlijk sneller en goedkoper dan via de officiële autodealer. Klaar terwijl u wacht, inclusief garantie!
      </>
    ),
    href: '/diensten/autosleutels-repareren',
    src: '/images/seo/autosleutel_reparatie_utrecht_amsterdam_mobiel.webp',
    alt: 'Autosleutel reparatie behuizing drukknoppen en transponder herstellen in Utrecht en Amsterdam mobiele service'
  },
  { 
    title: 'Contact Reparatie', 
    desc: 'Draait uw autosleutel niet meer soepel rond in het contactslot, zit het stuurwielslot muurvast of start uw auto niet door elektronische ontstekingsproblemen? Mechanische slijtage aan de interne slotplaatjes of storingen in elektronische contactsloten zoals Mercedes EIS (Elektronisch Ontstekingsslot) en ELV (Elektronisch Stuurslot) kunnen uw auto compleet blokkeren. Wij komen direct met onze servicewagen naar uw pechlocatie om uw kapotte contactslot vakkundig te repareren, reviseren of compleet te vervangen. Daarbij passen wij het nieuwe slot aan op uw bestaande sleutelcode, zodat u gewoon één sleutel blijft gebruiken voor alle portieren en het contactslot.', 
    href: '/diensten/contactslot-reparatie',
    src: '/images/seo/contactslot_reparatie_vervangen_utrecht_slotenmaker.webp',
    alt: 'Contactslot reparatie en vervangen voor alle merken auto\'s ter plaatse in Utrecht zonder sleepkosten'
  },
  { 
    title: 'Auto Slotenmaker', 
    desc: (
      <>
        Zoekt u met spoed een betrouwbare en erkende <strong style={{color: 'var(--navy-900)'}}>auto slotenmaker in de buurt</strong>? Of u nu uw complete sleutelbos kwijt bent, de sleutels nog in de kofferbak liggen (autodeur openen), of uw deurslot geforceerd is na een inbraakpoging: onze 24-uurs mobiele auto slotenmaker lost het direct op. Wij openen deuren van alle automerken 100% schadevrij met behulp van geavanceerde lockpick en Lishi-instrumenten. Daarnaast frezen en programmeren we direct op locatie een nieuwe chip of smart key in. Ervaar de snelste service van Nederland, zonder verborgen kosten of onnodige sleepdiensten naar een garage.
      </>
    ),
    href: '/diensten/auto-slotenmaker',
    src: '/images/seo/auto_deur_openen_slotenmaker_utrecht_schadevrij.webp',
    alt: 'Auto schadevrij openen bij sleutels in auto vergeten of autodeur op slot in Utrecht en omgeving'
  },
  { 
    title: 'Smart Key / Keyless', 
    desc: 'Heeft u problemen met uw keyless entry of keyless go autosleutel, of wordt uw proximity smart key niet meer gedetecteerd door de sensoren van uw auto? Moderne draadloze smart keys en comfort access sleutels vereisen uiterst gespecialiseerde programmering en beveiligde encryptiesleutels om naadloos te communiceren met het boordnet van uw wagen. Wij leveren, inleren en synchroniseren originele en hoogwaardige aftermarket smart keys voor onder andere BMW, Mercedes, Volkswagen, Audi, Ford en Renault direct bij u thuis of op locatie. Met geavanceerde cryptografische codering garanderen wij dat uw auto optimaal beveiligd blijft tegen elektronische diefstal en relay-attacks.', 
    href: '/diensten/smart-key-programmeren',
    src: '/images/seo/slotenmaker_voorraad_utrecht_sleutels.webp',
    alt: 'Smart key en keyless entry autosleutels inleren en programmeren met mobiele apparatuur in Utrecht'
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

export default function HomePage() {
  return (
    <>
      <Script id="home-locksmith-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(locksmithSchema) }} />
      <Script id="home-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <Image
          src="/images/seo/autosleutel_specialist_utrecht_amsterdam_background.webp"
          alt="Autosleutel specialist Utrecht en Amsterdam mobiele service - Sleutel bijmaken en auto openen op locatie"
          fill
          priority
          fetchPriority="high"
          quality={60}
          className={styles.heroBackground}
          sizes="100vw"
        />
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
                src="/hero-auto.webp" 
                alt="Mobiele Autoslotenmaker Service" 
                width={600} 
                height={400} 
                priority
                fetchPriority="high"
                quality={75}
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
              <article key={i} className={styles.serviceCard} id={`svc-${i}`}>
                <Link href={s.href} className={styles.serviceImgLink} aria-label={s.title}>
                  <div className={styles.serviceImgBox}>
                    <Image
                      src={s.src}
                      alt={s.alt}
                      width={400}
                      height={225}
                      className={styles.serviceImg}
                    />
                  </div>
                </Link>
                <div className={styles.serviceBody}>
                  <div className={styles.serviceTitleRow}>
                    <div className={styles.serviceIconBox}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
                        {i === 0 && <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>}
                        {i === 1 && <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>}
                        {i === 2 && <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>}
                        {i === 3 && <><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>}
                        {i === 4 && <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>}
                        {i === 5 && <><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>}
                      </svg>
                    </div>
                    <h3 className={styles.serviceTitle}>
                      <Link href={s.href} className={styles.serviceTitleLink}>{s.title}</Link>
                    </h3>
                  </div>
                  <p className={styles.serviceDesc}>{s.desc}</p>
                  <div className={styles.serviceFooter}>
                    <Link href={s.href} className={styles.serviceCardBtn}>
                      <span>Bekijk dienst &amp; tarieven</span>
                      <span className={styles.serviceArrow}>→</span>
                    </Link>
                  </div>
                </div>
              </article>
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
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/volvo-autosleutel-bijmaken" className={styles.brandLinkOrange}>Volvo</Link>
                <span className={styles.brandModelsText}> — V40, V60, V90, XC40, XC60, XC90 (CEM slot modules &amp; keyless go)</span>
              </div>
            </div>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/skoda-autosleutel-bijmaken" className={styles.brandLinkOrange}>Skoda</Link>
                <span className={styles.brandModelsText}> — Octavia, Fabia, Superb, Kodiaq, Karoq (MQB &amp; Immo IV/V systemen)</span>
              </div>
            </div>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/nissan-autosleutel-bijmaken" className={styles.brandLinkOrange}>Nissan</Link>
                <span className={styles.brandModelsText}> — Qashqai, Juke, Micra, Leaf, X-Trail (NATS &amp; Smart Key systemen)</span>
              </div>
            </div>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/honda-autosleutel-bijmaken" className={styles.brandLinkOrange}>Honda</Link>
                <span className={styles.brandModelsText}> — Civic, Jazz, CR-V, HR-V, Accord (Honda Smart Key &amp; ID46 transponder)</span>
              </div>
            </div>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/porsche-autosleutel-bijmaken" className={styles.brandLinkOrange}>Porsche</Link>
                <span className={styles.brandModelsText}> — 911, Cayenne, Macan, Panamera, Taycan (BCM &amp; Kessy transponders)</span>
              </div>
            </div>
            <div className={styles.brandsCheckItem}>
              <span className={styles.brandCheckIcon}>✓</span>
              <div>
                <Link href="/merken/smart-autosleutel-bijmaken" className={styles.brandLinkOrange}>Smart</Link>
                <span className={styles.brandModelsText}> — ForTwo, ForFour, #1, #3 (SAM unit &amp; sleutel inleren)</span>
              </div>
            </div>
          </div>
          <Link href="/merken" className={styles.brandsAllLink}>
            Bekijk alle merken die wij bedienen →
          </Link>
        </div>
      </section>

      {/* ===== GALLERY ===== */}
      <section className="gallery-section">
        <div className="container">
          <p className="section-eyebrow">GALERIJ</p>
          <h2 className="section-title">Ons Werk in Beelden</h2>
          <p className="section-lead" style={{ maxWidth: 880, margin: '0 auto 2.5rem', lineHeight: '1.75', fontSize: '0.98rem', color: 'var(--gray-600)' }}>
            Bekijk hieronder een selectie van onze afgeronde praktijkprojecten en tevreden klanten in heel Nederland. Als erkend autosleutel specialist zijn wij dagelijks actief met onze volledig uitgeruste mobiele servicebus in onder andere Utrecht, Amsterdam, Almere, Amersfoort en omstreken. Of het nu gaat om het bijmaken van een reservesleutel, het vakkundig inleren van keyless entry smart keys, of spoedreparaties bij een verloren of defecte autosleutel ter plaatse: wij garanderen schadevrij werk met originele OEM-diagnoseapparatuur. Dankzij onze transparante tarieven, snelle responstijden en jarenlange expertise bespaart u onnodige wegsleepkosten en lange wachttijden bij de officiële merkdealer. Blader door onze recente klussen en ontdek direct waarom duizenden automobilisten vertrouwen op onze mobiele sleutelservice.
          </p>
          <RealGalleryShowcase />
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
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginTop: '1.5rem', marginBottom: '1.5rem', lineHeight: '1.8', color: 'var(--gray-700)' }}>
                {serviceAreaCities.map((city) => (
                  <li key={city.slug} style={{ marginBottom: '0.25rem' }}>
                    <Link href={`/steden/${city.slug}`} style={{ color: 'var(--orange-500)', textDecoration: 'underline', fontWeight: 600 }}>
                      {city.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: '0.75rem' }}>
                <Link href="/steden" className="btn btn-navy">Bekijk alle 45+ steden in ons werkgebied</Link>
              </div>
            </div>

            <div className={styles.mapContainerWrap}>
              <InstantServiceMap />
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
          <h2 className="text-center" style={{ marginBottom: '1rem' }}>Ervaringen</h2>
          <div className={styles.reviewGrid}>
            {SHARED_GOOGLE_REVIEWS.map((r, i) => (
              <GoogleReviewCard key={i} review={r} />
            ))}
          </div>
        </div>
      </section>


      {/* ===== FAQ ===== */}
      <FaqSection />

    </main>
    </>
  );
}
