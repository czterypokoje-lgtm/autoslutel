import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import styles from './page.module.css';
import dynamic from 'next/dynamic';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { BRANDS } from '../config/brands';
import FaqSection from '@/components/FaqSection/FaqSection';
import GoogleReviewCard from '@/components/GoogleReviewCard/GoogleReviewCard';
import { generateContextualReviews } from '@/utils/reviews';
import InstantServiceMap from '@/components/InstantServiceMap';
import LocalBusinessSchema from '@/components/Schema/LocalBusinessSchema';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import HowItWorks from '@/components/HowItWorks/HowItWorks';

const RealGalleryShowcase = dynamic(() => import('@/components/RealGalleryShowcase/RealGalleryShowcase'), { ssr: true });

export const metadata: Metadata = {
  title: {
    absolute: 'Autosleutel Bijmaken of Kwijt? 24/7 Mobiele Service | Autosleutel24',
  },
  description: `Autosleutel bijmaken of alle sleutels kwijt? Onze mobiele monteurs komen direct naar u toe in de Randstad. Schadevrij openen & inleren. Bel direct!`,
  alternates: {
    canonical: SITE_CONFIG.domain,
    languages: {
      'nl-NL': SITE_CONFIG.domain,
      'x-default': SITE_CONFIG.domain,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE_CONFIG.domain,
    title: 'Autosleutel Bijmaken of Kwijt? 24/7 Mobiele Service | Autosleutel24',
    description: 'Autosleutel bijmaken of alle sleutels kwijt? Onze mobiele monteurs komen direct naar u toe in de Randstad. Schadevrij openen & inleren. Bel direct!',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Autosleutel24 mobiele autosleutelspecialist' }],
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
    title: 'Autosleutel Bijmaken & Reservesleutel', 
    desc: (
      <>
        Wilt u een professionele reservesleutel laten bijmaken en programmeren zonder lange wachttijden of hoge dealerprijzen? Onze mobiele slotenmakers komen 24/7 naar u toe voor een autosleutel bijmaken prijs die tot 50% voordeliger is. Wij frezen mechanische sleutelbladen en leren smart keys direct in via de OBD2-poort.<br/><br/>
        <span style={{display: 'block', paddingLeft: '0.5rem', color: 'var(--navy-900)'}}>
          • Klaar in 30 tot 60 minuten op locatie<br/>
          • Geen dure wegsleepkosten naar de merkdealer<br/>
          • Geteste reservesleutel inclusief 12 maanden garantie
        </span>
      </>
    ), 
    href: '/diensten/autosleutel-bijmaken',
    src: '/images/seo/autosleutel_bijmaken_utrecht_car_keys.webp',
    alt: 'Autosleutel bijmaken en programmeren in Utrecht en heel Nederland - klaar terwijl u wacht op locatie'
  },
  { 
    title: 'Transponder Programmeren & Startonderbreking', 
    desc: (
      <>
        Start uw motor niet meer doordat de transponderchip defect is of niet wordt herkend? Wij lossen storingen in de ECU en startonderbreker direct ter plaatse op. Met onze dealer-niveau apparatuur kunnen wij uw transpondersleutel programmeren, foutcodes uitlezen en de startblokkering resetten.<br/><br/>
        <span style={{display: 'block', paddingLeft: '0.5rem', color: 'var(--navy-900)'}}>
          • Veilig synchroniseren van nieuwe crypto-transponders<br/>
          • Volledig behoud van de fabrieksbeveiliging<br/>
          • Direct geholpen bij startproblemen door elektronica
        </span>
      </>
    ), 
    href: '/diensten/transponder-programmeren',
    src: '/images/seo/reserve_autosleutel_transponder_programmeren_utrecht.webp',
    alt: 'Transponder sleutel programmeren en chip inleren voor alle automerken op locatie in Utrecht'
  },
  { 
    title: 'Autosleutels Repareren & Behuizing Vervangen', 
    desc: (
      <>
        Is de behuizing van uw autosleutel gescheurd, zijn de knoppen lam of werkt de afstandsbediening niet meer? In 90% van de gevallen hoeft u geen dure nieuwe autosleutel te kopen. Onze specialisten kunnen uw autosleutel repareren terwijl u wacht.<br/><br/>
        <span style={{display: 'block', paddingLeft: '0.5rem', color: 'var(--navy-900)'}}>
          • Vervangen van versleten sleutelbehuizingen<br/>
          • Precisie-solderen van micro-switches op de printplaat<br/>
          • Inclusief nieuwe Varta of Panasonic batterij
        </span>
      </>
    ),
    href: '/diensten/autosleutels-repareren',
    src: '/images/seo/autosleutel_reparatie_utrecht_amsterdam_mobiel.webp',
    alt: 'Autosleutel reparatie behuizing drukknoppen en transponder herstellen in Utrecht en Amsterdam mobiele service'
  },
  { 
    title: 'Contactslot Auto Vervangen & Reparatie', 
    desc: (
      <>
        Draait uw sleutel niet meer soepel rond in het contactslot of is uw stuurwielslot muurvast? Mechanische slijtage of elektronische storingen in systemen zoals Mercedes EIS en ELV blokkeren uw auto volledig. Wij reviseren en vervangen kapotte contactsloten op locatie.<br/><br/>
        <span style={{display: 'block', paddingLeft: '0.5rem', color: 'var(--navy-900)'}}>
          • Aangepast op uw bestaande sleutelcode<br/>
          • Eén sleutel behouden voor alle portieren en het contact<br/>
          • Vakkundige revisie bij ontstekingsproblemen
        </span>
      </>
    ), 
    href: '/diensten/contactslot-auto-vervangen',
    src: '/images/seo/contactslot_reparatie_vervangen_utrecht_slotenmaker.webp',
    alt: 'Contactslot reparatie en vervangen voor alle merken auto\'s ter plaatse in Utrecht zonder sleepkosten'
  },
  { 
    title: 'Auto Slotenmaker & Schadevrij Openen', 
    desc: (
      <>
        Heeft u uzelf buitengesloten, de sleutel in de kofferbak laten liggen, of is uw auto op slot gegaan? Onze 24-uurs auto slotenmaker lost het direct op. Wij kunnen elke autodeur 100% schadevrij openen met geavanceerde Lishi-lockpick instrumenten.<br/><br/>
        <span style={{display: 'block', paddingLeft: '0.5rem', color: 'var(--navy-900)'}}>
          • 24/7 spoedhulp bij buitensluiting of verloren sleutel<br/>
          • Geen enkele schade aan lak of portierrubbers<br/>
          • Direct op locatie een nieuwe chip of smart key inleren
        </span>
      </>
    ),
    href: '/diensten/auto-slotenmaker',
    src: '/images/seo/auto_deur_openen_slotenmaker_utrecht_schadevrij.webp',
    alt: 'Auto schadevrij openen bij sleutels in auto vergeten of autodeur op slot in Utrecht en omgeving'
  },
  { 
    title: 'Smart Key / Keyless Go Systeem', 
    desc: (
      <>
        Heeft u problemen met uw keyless entry sleutel of wordt uw smart key niet meer gedetecteerd? Moderne draadloze systemen vereisen specialistische encryptie en programmering om communicatieproblemen met het boordnet te verhelpen.<br/><br/>
        <span style={{display: 'block', paddingLeft: '0.5rem', color: 'var(--navy-900)'}}>
          • Inleren van originele en aftermarket smart keys<br/>
          • Ondersteuning voor o.a. BMW, Mercedes, Audi, VW en Ford<br/>
          • Optimale bescherming tegen relay-attacks en diefstal
        </span>
      </>
    ), 
    href: '/diensten/smart-key-programmeren',
    src: '/images/seo/smart-key-keyless-programmeren-autosleutel24-utrecht.webp',
    alt: 'Smart key en keyless-go start-stop knop programmeren en inleren door Autosleutel24 mobiele specialist Utrecht'
  },
];

const serviceAreaCities = [
  { name: 'Utrecht', slug: 'utrecht', time: '15-20 min' },
  { name: 'Amsterdam', slug: 'amsterdam', time: '40-55 min' },
  { name: 'Amsterdam-Zuid', slug: 'amsterdam-zuid', time: '35-45 min' },
  { name: 'Almere', slug: 'almere', time: '35-45 min' },
  { name: 'Amersfoort', slug: 'amersfoort', time: '25-35 min' },
  { name: 'Arnhem', slug: 'arnhem', time: '45-55 min' },
  { name: 'Nijmegen', slug: 'nijmegen', time: '55-65 min' },
  { name: 'Apeldoorn', slug: 'apeldoorn', time: '40-50 min' },
  { name: 'Hilversum', slug: 'hilversum', time: '30-40 min' },
  { name: 'Bussum', slug: 'bussum', time: '30-40 min' },
  { name: 'Naarden', slug: 'naarden', time: '30-40 min' },
  { name: 'Amstelveen', slug: 'amstelveen', time: '35-45 min' },
  { name: 'Zeist', slug: 'zeist', time: '18-22 min' },
  { name: 'Huizen', slug: 'huizen', time: '35-45 min' },
  { name: 'Diemen', slug: 'diemen', time: '35-45 min' },
  { name: 'Den Haag', slug: 'den-haag', time: '45-60 min' },
];

export default function HomePage() {
  return (
    <>
      <LocalBusinessSchema />
      <Script id="home-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <Image
          src="/autosleutel-bijmaken-utrecht-amsterdam-mobiel.webp"
          alt="Autosleutel bijmaken door mobiele specialist"
          fill
          priority
          fetchPriority="high"
          quality={70}
          className={styles.heroBackground}
          sizes="100vw"
        />
        <Script id="hero-image-gps" type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageObject",
            "contentUrl": "https://www.autosleutel24.nl/autosleutel-bijmaken-utrecht-amsterdam-mobiel.webp",
            "name": "Autosleutel bijmaken Utrecht & Amsterdam mobiele specialist",
            "description": "Sleutel ter plaatse bijmaken en programmeren in Utrecht, Amsterdam en Midden-Nederland door Autosleutel24.",
            "contentLocation": {
              "@type": "Place",
              "name": "Utrecht, Amsterdam",
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 52.0907,
                "longitude": 5.1214
              }
            }
          })
        }} />
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>Dé Mobiele Autosleutelspecialist — Randstad & Midden-Nederland</p>
            <h1 className={styles.heroTitle}>
              Autosleutel Kwijt of Bijmaken?<br />
              <span className={styles.heroOrange}>Wij Helpen Direct op Locatie!</span>
            </h1>
            <p className={styles.heroLead}>
              Staat u buitengesloten of is uw autosleutel defect? Geen paniek. Autosleutel24 komt met een volledig uitgeruste servicebus naar u toe. Geen wegsleepkosten, goedkoper dan de dealer en vaak binnen 30 tot 60 minuten weer op weg!
            </p>
            {/* Interactive Lead Capture Form */}
            <div style={{ marginTop: '2rem' }}>
              <LeadCaptureForm phone={SITE_CONFIG.phone} />
            </div>
            
            <Link href="/autosleutel-kwijt" className={styles.heroUrgentBtn}>Alle Sleutels Kwijt? →</Link>
            <div className={styles.heroTrust} style={{marginTop: '1.5rem'}}>
              <span className={styles.trustPill}>✓ KVK {SITE_CONFIG.kvk}</span>
              <span className={styles.trustPill}>✓ {SITE_CONFIG.rating} / 5 Google ({SITE_CONFIG.reviewCount} reviews)</span>
              <span className={styles.trustPill}>✓ Verzekerd & Gecertificeerd</span>
              <span className={styles.trustPill}>✓ 24/7 Bereikbaar</span>
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

      {/* ===== HOW IT WORKS ===== */}
      <HowItWorks />

      {/* ===== SERVICES ===== */}
      <section className={styles.services}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className="section-eyebrow">ONZE DIENSTEN</p>
            <h2 className="section-title">Alles voor Uw Autosleutel — Snel & Betrouwbaar</h2>
            <p className="section-lead">Direct ter plaatse geprogrammeerd in onze mobiele werkplaats. Geen verborgen kosten en altijd vooraf een vaste prijs.</p>
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
          <div className={styles.servicesCta} style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/autosleutel-bestellen-op-kenteken" className="btn btn-green">Autosleutel Bestellen op Kenteken</Link>
            <Link href="/diensten" className="btn btn-navy">Alle diensten bekijken</Link>
          </div>
        </div>
      </section>

      {/* ===== BRANDS (VISUAL LOGO GRID) ===== */}
      <section className={styles.brandsSection}>
        <div className="container">
          <div className={styles.brandsSeoHeader}>
            <h2 className={styles.brandsHeading}>Autosleutel Bijmaken — Alle Merken</h2>
            <p className={styles.brandsLead}>
              Wij maken en programmeren autosleutels voor alle gangbare merken direct ter plaatse. Selecteer uw merk:
            </p>
          </div>

          <div className={styles.brandsLogoGrid}>
            {[
              { name: 'Volkswagen', slug: 'volkswagen-autosleutel-bijmaken', models: 'Golf, Polo, Tiguan, Passat', svg: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg' },
              { name: 'BMW', slug: 'bmw-autosleutel-bijmaken', models: '1-, 3-, 5-Serie, X1, X3, X5', svg: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg' },
              { name: 'Mercedes-Benz', slug: 'mercedes-autosleutel-bijmaken', models: 'A/C/E-Klasse, Sprinter, Vito', svg: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg' },
              { name: 'Audi', slug: 'audi-autosleutel-bijmaken', models: 'A1, A3, A4, A6, Q3, Q5, Q7', svg: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Audi_logo_detail.svg' },
              { name: 'Opel', slug: 'opel-autosleutel-bijmaken', models: 'Corsa, Astra, Mokka, Vivaro', svg: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Opel_logo.svg' },
              { name: 'Ford', slug: 'ford-autosleutel-bijmaken', models: 'Focus, Fiesta, Transit, Kuga', svg: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ford_logo_flat.svg' },
              { name: 'Renault', slug: 'renault-autosleutel-bijmaken', models: 'Clio, Captur, Megane, Trafic', svg: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_Text.svg' },
              { name: 'Peugeot', slug: 'peugeot-autosleutel-bijmaken', models: '208, 308, 2008, 3008, Partner', svg: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Peugeot_2021_Logo.svg' },
              { name: 'Toyota', slug: 'toyota-autosleutel-bijmaken', models: 'Aygo, Yaris, Corolla, RAV4', svg: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Toyota_logo_%28Red%29.svg' },
              { name: 'Seat', slug: 'seat-autosleutel-bijmaken', models: 'Ibiza, Leon, Arona, Ateca', svg: 'https://upload.wikimedia.org/wikipedia/commons/3/38/SEAT_Logo.svg' },
              { name: 'Skoda', slug: 'skoda-autosleutel-bijmaken', models: 'Fabia, Octavia, Superb, Kodiaq', svg: 'https://upload.wikimedia.org/wikipedia/commons/7/77/%C5%A0koda_logo.svg' },
              { name: 'Volvo', slug: 'volvo-autosleutel-bijmaken', models: 'V40, V60, XC40, XC60, XC90', svg: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Volvo_logo_2021.svg' },
              { name: 'Nissan', slug: 'nissan-autosleutel-bijmaken', models: 'Micra, Qashqai, Juke, Leaf', svg: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Nissan_2020_logo.svg' },
              { name: 'Hyundai', slug: 'hyundai-autosleutel-bijmaken', models: 'i10, i20, i30, Tucson, Kona', svg: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Hyundai_Motor_Company_logo.svg' },
              { name: 'Kia', slug: 'kia-autosleutel-bijmaken', models: 'Picanto, Rio, Ceed, Sportage', svg: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Kia-logo.svg' },
              { name: 'Citroën', slug: 'citroen-autosleutel-bijmaken', models: 'C1, C3, C4, Berlingo, Jumper', svg: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Citro%C3%ABn_2022_logo.svg' },
              { name: 'Fiat', slug: 'fiat-autosleutel-bijmaken', models: '500, Panda, Ducato, Tipo', svg: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/FIAT_logo_%282020%29.svg' },
              { name: 'Honda', slug: 'honda-autosleutel-bijmaken', models: 'Civic, Jazz, CR-V, HR-V', svg: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Honda_Logo.svg' },
              { name: 'Mazda', slug: 'mazda-autosleutel-bijmaken', models: 'Mazda2, Mazda3, CX-5, MX-5', svg: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Mazda_logo.svg' },
              { name: 'Land Rover', slug: 'land-rover-autosleutel-bijmaken', models: 'Range Rover, Discovery, Evoque', svg: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Land_Rover_logo.svg' },
              { name: 'Porsche', slug: 'porsche-autosleutel-bijmaken', models: 'Cayenne, Macan, 911, Panamera', svg: 'https://upload.wikimedia.org/wikipedia/de/e/e3/Porsche_Logo.svg' },
              { name: 'Mini', slug: 'mini-autosleutel-bijmaken', models: 'Cooper, One, Countryman', svg: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Mini_logo_2018.svg' },
            ].map((brand) => (
              <Link
                key={brand.slug}
                href={`/merken/${brand.slug}`}
                className={styles.brandLogoCard}
                title={`${brand.name} autosleutel bijmaken — ${brand.models}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.svg}
                  alt={`${brand.name} logo`}
                  className={styles.brandLogoImg}
                  loading="lazy"
                  width={80}
                  height={48}
                />
                <span className={styles.brandLogoName}>{brand.name} sleutel bijmaken</span>
                {/* Hidden SEO text for crawlers */}
                <span className={styles.brandSeoHidden}>{brand.models}</span>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/merken" className={styles.brandsAllLink}>
              Bekijk alle {BRANDS.length} merken die wij bedienen &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ===== GALLERY ===== */}
      <section className="gallery-section">
        <div className="container">
          <p className="section-eyebrow">GALERIJ</p>
          <h2 className="section-title">Ons Werk in Beelden</h2>
          <p className="section-lead" style={{ maxWidth: 880, margin: '0 auto 2.5rem', lineHeight: '1.75', fontSize: '0.98rem', color: 'var(--gray-600)' }}>
            Bekijk hieronder een selectie van onze afgeronde praktijkprojecten en tevreden klanten in heel Nederland. Als erkend autosleutel specialist zijn wij dagelijks actief met onze volledig uitgeruste mobiele servicebus in onder andere <Link href="/steden/utrecht" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Utrecht</Link>, <Link href="/steden/amsterdam" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Amsterdam</Link>, <Link href="/steden/den-haag" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Den Haag</Link>, <Link href="/steden/almere" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Almere</Link>, <Link href="/steden/amersfoort" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Amersfoort</Link>, <Link href="/steden/arnhem" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Arnhem</Link>, <Link href="/steden/nijmegen" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Nijmegen</Link>, <Link href="/steden/apeldoorn" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Apeldoorn</Link> en omstreken. Of het nu gaat om het bijmaken van een reservesleutel, het vakkundig inleren van keyless entry smart keys, of spoedreparaties bij een verloren of defecte autosleutel ter plaatse: wij garanderen schadevrij werk met originele OEM-diagnoseapparatuur. Dankzij onze transparante tarieven, snelle responstijden en jarenlange expertise bespaart u onnodige wegsleepkosten en lange wachttijden bij de officiële merkdealer. Blader door onze recente klussen en ontdek direct waarom duizenden automobilisten vertrouwen op onze mobiele sleutelservice.
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
                <strong>Autosleutel24</strong> bedient een uitgebreid servicegebied in Midden-Nederland en de Randstad. Of u nu uw autosleutel bent verloren in <strong>Utrecht</strong>, <strong>Arnhem</strong> of <strong>Nijmegen</strong>, met een defect contactslot staat in <strong>Amersfoort</strong> of <strong>Apeldoorn</strong>, of met spoed een transpondersleutel wilt laten inleren in &apos;t Gooi (<strong>Hilversum</strong>, <strong>Bussum</strong>, <strong>Naarden</strong>) of <strong>Amsterdam</strong> — wij komen direct naar uw thuis- of strandinglocatie.
              </p>
              <p className={styles.serviceAreaSub}>
                Dankzij onze geavanceerde GPS-gestuurde routeplanning zijn onze monteurs meestal binnen <strong>20 tot 60 minuten</strong> ter plaatse. Geen wegsleepkosten naar de dealer en altijd 100% schadevrij geopend en geprogrammeerd. Klik op uw regio voor lokale tarieven en aankomsttijden:
              </p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginTop: '1.5rem', marginBottom: '1.5rem', lineHeight: '1.8', color: 'var(--gray-700)' }}>
                {serviceAreaCities.map((city) => (
                  <li key={city.slug} style={{ marginBottom: '0.25rem' }}>
                    <Link href={`/steden/${city.slug}`} style={{ color: 'var(--orange-700)', textDecoration: 'underline', fontWeight: 600 }}>
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

      {/* ===== E-E-A-T MEET THE OWNER ===== */}
      <section style={{ padding: '4rem 0', background: 'var(--color-bg-alt)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            gap: '2.5rem',
            alignItems: 'start'
          }}>
            <div>
              <p className="section-eyebrow" style={{ color: 'var(--color-primary)' }}>LOKALE EXPERTISE &amp; VERTROUWEN</p>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
                Ontmoet Berkan Acarol
              </h2>
              <p style={{ fontWeight: 600, color: 'var(--orange-700)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                Gecertificeerd Hoofdtechnicus van Autosleutel24
              </p>
              <p style={{ color: 'var(--gray-700)', lineHeight: 1.6, marginBottom: '1.25rem', fontSize: '0.92rem' }}>
                Wanneer u belt voor een autosleutelprobleem, krijgt u direct te maken met een specialist. Als hoofdtechnicus sta ik, Berkan Acarol, persoonlijk garant voor de kwaliteit van onze service. Met jarenlange actieve ervaring in de automotive slotenmakerij en gecertificeerd door marktleiders zoals Autel, programmeren wij elke sleutel snel, veilig en ter plaatse.
              </p>
              <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: 'var(--gray-700)', lineHeight: '1.7' }}>
                <li style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Gecertificeerd Expert:</strong> Specialist in Autel IM608 Pro II &amp; AVDI Abrites.</span>
                </li>
                <li style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Ruime Ervaring:</strong> Jarenlange ervaring met alle automerken en systemen.</span>
                </li>
                <li style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> <span><strong>Betrouwbaar &amp; Lokaal:</strong> Eerlijke, vooraf gecommuniceerde vaste prijzen zonder verrassingen.</span>
                </li>
              </ul>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary" id="meet-owner-phone">
                  📞 Bel Direct: {SITE_CONFIG.phone}
                </a>
                <Link href="/over-ons" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  Lees meer over ons →
                </Link>
              </div>
            </div>
            <div>
              <img
                src="/images/team/berkan-acarol-autosleutelspecialist-utrecht.webp"
                alt="Berkan Acarol — Autosleutelspecialist"
                style={{
                  width: '100%',
                  maxWidth: '340px',
                  height: '220px',
                  objectFit: 'cover',
                  objectPosition: 'top',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  display: 'block'
                }}
              />
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
              <Link href="/diensten/autosleutel-bijmaken" className="btn btn-primary btn-lg">Autosleutel Bijmaken</Link>
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
              <span style={{fontSize: '0.8rem', color: 'var(--gray-500)'}}>{SITE_CONFIG.reviewCount} Google beoordelingen</span>
            </div>
          </div>
          <h3 className="text-center" style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--gray-600)' }}>Ervaringen van klanten</h3>
          <div className={styles.reviewGrid}>
            {generateContextualReviews('autosleutel', 'general').map((r, i) => (
              <GoogleReviewCard key={i} review={r} />
            ))}
          </div>
        </div>
      </section>




      {/* ── COMPREHENSIVE HOMEPAGE SEO GUIDE ARTICLE ── */}
      <section style={{ padding: '3.5rem 0', background: '#ffffff' }}>
        <div className="container">
          <div className="seo-article-block" style={{ marginTop: 0 }}>
            <h2>Autosleutelservice op Locatie — Sleutel Bijmaken in Utrecht en Omgeving</h2>
            <p>
              Heeft u een nieuwe autosleutel nodig? Of wilt u een <strong>extra sleutel</strong> laten bijmaken zodat u altijd een reserve heeft?
              Bij <strong>{SITE_CONFIG.name}</strong> kunt u terecht voor een complete <strong>autosleutelservice</strong>.
              <strong>Wij maken</strong> sleutels voor <strong>vrijwel alle</strong> automerken en modellen —
              van een eenvoudige transpondersleutel tot een moderne smart key met afstandsbediening.
            </p>
            <p>
              Ons werkgebied is groot. Wij zijn actief in Utrecht, Amsterdam, Almere, Amersfoort
              <strong> en omgeving</strong>. Wilt u een autosleutel <strong>bijmaken in Utrecht</strong>?
              Dan zijn wij er gemiddeld binnen 15 tot 20 minuten. Staat u ergens anders geparkeerd? Geen probleem.
              Wij komen direct naar uw locatie toe.
            </p>

            <h3>Autosleutels met Afstandsbediening Laten Bijmaken</h3>
            <p>
              Moderne auto&apos;s rijden niet meer met een gewone metalen sleutel. Ze hebben
              <strong> autosleutels met afstandsbediening</strong> nodig — ook wel klapsleutels, smart keys
              of keyless go sleutels genoemd. Wij leveren en programmeren <strong>gecertificeerde sleutels</strong>
              die exact werken zoals de originele fabriekssleutel. U hoeft niet naar de dealer.
              Wij doen alles ter plekke, bij u thuis of op het werk.
            </p>

            <h3>Autosleutels Gestolen? Wij Lossen Het Op</h3>
            <p>
              Zijn uw <strong>autosleutels gestolen</strong>? Dan moet u snel handelen.
              Een gestolen sleutel is een veiligheidsrisico. Wij wissen de gestolen sleutel uit het
              geheugen van uw auto en maken direct een nieuwe aan. Zo kan niemand anders meer met uw
              voertuig rijden. Dit is een spoedklus die wij 24 uur per dag, 7 dagen per week uitvoeren.
            </p>

            <h3>Goedkoper dan de Dealer, met 12 Maanden Garantie</h3>
            <p>
              Doordat wij direct bij u op locatie werken, bespaart u gemiddeld <strong>30% tot 50%</strong>
              ten opzichte van de merkdealer. U betaalt geen sleepkosten en geen dure showroomtarieven.
              Op elke nieuwe sleutel en reparatie geven wij standaard 12 maanden schriftelijke garantie.
              Veel verzekeraars vergoeden onze factuur onder uw Beperkt Casco of Allrisk polis.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <FaqSection />

    </main>
    </>
  );
}
