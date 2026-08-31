import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import dynamic from 'next/dynamic';
import GoogleReviewsCta from '@/components/GoogleReviewsCta/GoogleReviewsCta';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { BRANDS } from '../config/brands';
import FaqSection from '@/components/FaqSection/FaqSection';
import ServiceAreaMap from '@/components/ServiceAreaMap/ServiceAreaMap';
import LocalBusinessSchema from '@/components/Schema/LocalBusinessSchema';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import VehicleWizard from '@/components/VehicleWizard/VehicleWizard';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import BrandsLogoGrid from '@/components/BrandsLogoGrid/BrandsLogoGrid';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
import HeroTrustBadge from '@/components/HeroTrustBadge/HeroTrustBadge';
import FeatureCards from '@/components/FeatureCards/FeatureCards';

import GallerySlider from '@/components/GallerySlider/GallerySlider';
import { REAL_GALLERY_PROJECTS } from '@/config/gallery';

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
    desc: 'Wilt u een professionele reservesleutel laten bijmaken en programmeren zonder lange wachttijden of hoge dealerprijzen? Onze mobiele slotenmakers komen 24/7 naar u toe voor een voordelige prijs.',
    href: '/diensten/autosleutel-bijmaken',
    src: '/images/seo/autosleutel_bijmaken_utrecht_car_keys.webp',
    alt: 'Autosleutel bijmaken en programmeren in Utrecht en Midden-Nederland - klaar terwijl u wacht op locatie',
    btnText: 'Vind uw sleutel'
  },
  { 
    title: 'Alle Autosleutels Kwijt', 
    desc: 'Bent u al uw autosleutels kwijt of zijn deze gestolen? Wij komen naar uw locatie, openen de auto schadevrij, frezen een nieuwe sleutel en wissen oude sleutels uit het systeem.',
    href: '/diensten/alle-sleutels-kwijt-auto',
    src: '/images/service_kwijt.webp',
    alt: 'Monteur programmeert autosleutel via OBD diagnostiek in de auto op locatie',
    btnText: 'Direct hulp bij kwijt'
  },
  { 
    title: 'Autosleutels Repareren & Behuizing Vervangen', 
    desc: 'Is de behuizing van uw autosleutel gescheurd, zijn de knoppen lam of werkt de afstandsbediening niet meer? Onze specialisten kunnen uw autosleutel repareren terwijl u wacht.',
    href: '/diensten/autosleutels-repareren',
    src: '/images/seo/autosleutel_reparatie_hero.webp',
    alt: 'Autosleutel behuizing vervangen en knoppen repareren op locatie',
    btnText: 'Meer over reparaties'
  },
  { 
    title: 'Contactslot Auto Vervangen & Repareren', 
    desc: 'Draait uw autosleutel niet meer in het contactslot of zit deze vast? Een defect contactslot komt vaak voor. Wij reviseren of vervangen uw contactslot direct bij u op de oprit.',
    href: '/diensten/contactslot-auto-vervangen',
    src: '/images/seo/contactslot_reparatie_vervangen_utrecht_slotenmaker.webp',
    alt: 'Defect contactslot auto vervangen en repareren door monteur in Utrecht',
    btnText: 'Contactslot herstellen'
  },
  { 
    title: 'Auto Slotenmaker & Schadevrij Openen', 
    desc: 'Bent u buitengesloten omdat de sleutels nog in de auto liggen of de accu leeg is? Wij openen uw autodeur 100% schadevrij met speciaal gereedschap.',
    href: '/diensten/auto-openen-zonder-sleutel',
    src: '/images/seo/auto_deur_openen_slotenmaker_utrecht_schadevrij.webp',
    alt: 'Buitengesloten auto openen zonder sleutel, 100% schadevrij',
    btnText: 'Snel auto openen'
  },
  { 
    title: 'Smart Key / Keyless', 
    desc: 'Heeft u problemen met uw keyless entry of keyless go autosleutel, of wordt uw proximity smart key niet meer gedetecteerd door de sensoren van uw auto? Wij leveren, inleren en synchroniseren originele smart keys met geavanceerde codering direct op locatie.', 
    href: '/diensten/smart-key-programmeren',
    src: '/images/seo/smart-key-keyless-programmeren-autosleutel24-utrecht.webp',
    alt: 'Smart key en keyless entry autosleutels inleren en programmeren op locatie',
    btnText: 'Smart Key oplossingen'
  }
];


export default function HomePage() {
  return (
    <>
      <LocalBusinessSchema />
      <script id="home-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
      <section className={styles.heroSplit}>
        <div className={styles.heroSplitInner}>
          
          <div className={styles.heroTopContent}>
            <HeroTrustBadge />
            <h1>
              Autosleutel Kwijt of Bijmaken?<br />
              <span style={{ color: 'var(--orange-500)' }}>Wij Helpen Direct op Locatie!</span>
            </h1>
            <p className={styles.heroSplitLead}>
              Buitengesloten of sleutel kwijt? <strong>Binnen 30–60 min</strong> ter plaatse — goedkoper dan de dealer, geen wegsleepkosten.
            </p>
          </div>

          <div className={styles.heroImageContent}>
            <Image 
              src="/images/nl-map-orange.png" 
              alt="Werkgebied Autosleutel24 Nederland"
              width={800}
              height={450}
              style={{ width: '100%', height: 'auto', borderRadius: '12px', objectFit: 'contain', backgroundColor: '#ffffff' }}
              priority
              quality={80}
              sizes="(max-width: 992px) 100vw, 50vw"
            />
            <script id="hero-image-gps" type="application/ld+json" dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ImageObject",
                "contentUrl": "https://www.autosleutel24.nl/images/nl-map-orange.png",
                "name": "Werkgebied Autosleutel24 Nederland",
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
          </div>

          <div className={styles.heroBottomContent}>
            {/* Kenteken-first wizard: four one-decision steps instead of six
                fields. LeadCaptureForm stays as the fallback for anyone who
                does not have a Dutch plate to hand. */}
            <VehicleWizard
              fallback={<LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" />}
            />
          </div>

        </div>
      </section>

      {/* ── TRUST FEATURE CARDS ───────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#f3f4f6', padding: '1px 0' }}>
        <FeatureCards 
          title="Bijmaken. Vervanging. Programmeren."
          subtitle={<><span style={{ color: 'var(--orange-500)' }}>AutoSleutel24</span> doet het allemaal, waar u maar wilt.</>}
          features={[
            {
              id: 'feature-0',
              icon: <Image src="/images/icon_key_red.jpg" alt="Autosleutel Bijmaken" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: 'Autosleutel Bijmaken',
              description: 'Direct een nieuwe autosleutel bijmaken op locatie. Snel, vakkundig en inclusief programmeren.',
              linkText: 'Meer over sleutel bijmaken',
              linkUrl: '/diensten/autosleutel-bijmaken'
            },
            {
              id: 'feature-1',
              icon: <Image src="/images/icon_van.webp" alt="Autosleutel Kwijt? Direct Hulp" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: 'Autosleutel Kwijt? Direct Hulp',
              description: 'We komen direct naar uw locatie voor reparatie of vervanging.',
              linkText: 'Meer over mobiele service',
              linkUrl: '/diensten'
            },
            {
              id: 'feature-2',
              icon: <Image src="/images/icon_map.webp" alt="Auto Op Slot? Schadevrij openen" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: 'Auto Op Slot? Schadevrij openen',
              description: `Binnen ${SITE_CONFIG.responseTime} ter plaatse. Onze lokale monteur is altijd in de buurt.`,
              linkText: 'Vind een monteur',
              linkUrl: '#contact'
            },
            {
              id: 'feature-3',
              icon: <Image src="/images/icon_price.webp" alt="Vaste prijs" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: 'Vaste prijs vooraf',
              description: 'Geen verrassingen achteraf. U weet direct wat u betaalt voordat we beginnen.',
              linkText: 'Bekijk onze tarieven',
              linkUrl: '/prijzen'
            },
            {
              id: 'feature-4',
              icon: <Image src="/images/icon_car_check.webp" alt="Garantie" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: '12 Maanden Garantie',
              description: 'Wij bieden standaard 12 maanden volledige garantie op al onze sleutels.',
              linkText: 'Bekijk waar wij service verlenen',
              linkUrl: '/steden'
            },
            {
              id: 'feature-5',
              icon: <Image src="/images/icon_insurance.webp" alt="24/7 Spoedhulp" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: '24/7 Spoedhulp Bel Nu',
              description: 'U bent 100% verzekerd. Dag en nacht bereikbaar voor alle noodgevallen.',
              linkText: 'Bel direct',
              linkUrl: `tel:${SITE_CONFIG.phoneTel}`
            }
          ]}
        />
      </div>

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
                  <h3 className={styles.serviceTitle}>
                    <Link href={s.href} className={styles.serviceTitleLink}>{s.title}</Link>
                  </h3>
                  <p className={styles.serviceDesc}>{s.desc}</p>
                  <Link href={s.href} className={styles.serviceActionBtn}>
                    {s.btnText}
                  </Link>
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
        {/* ---- BRANDS SEO SECTION ---- */}
        <BrandsLogoGrid />
        </div>
      </section>

      {/* ===== GALLERY ===== */}
      <section className="gallery-section">
        <div className="container">
          <p className="section-eyebrow">GALERIJ</p>
          <h2 className="section-title">Ons Werk in Beelden</h2>
          <p className="section-lead" style={{ maxWidth: 880, margin: '0 auto 2.5rem', lineHeight: '1.75', fontSize: '0.98rem', color: 'var(--gray-600)' }}>
            Bekijk hieronder een selectie van onze afgeronde praktijkprojecten en tevreden klanten in Midden-Nederland en de Randstad. Als erkend autosleutel specialist zijn wij dagelijks actief met onze volledig uitgeruste mobiele servicebus in onder andere <Link href="/steden/utrecht" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Utrecht</Link>, <Link href="/steden/amsterdam" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Amsterdam</Link>, <Link href="/steden/den-haag" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Den Haag</Link>, <Link href="/steden/almere" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Almere</Link>, <Link href="/steden/amersfoort" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Amersfoort</Link>, <Link href="/steden/arnhem" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Arnhem</Link>, <Link href="/steden/nijmegen" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Nijmegen</Link>, <Link href="/steden/apeldoorn" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Apeldoorn</Link> en omstreken. Of het nu gaat om het bijmaken van een reservesleutel, het vakkundig inleren van keyless entry smart keys, of spoedreparaties bij een verloren of defecte autosleutel ter plaatse: wij garanderen schadevrij werk met originele OEM-diagnoseapparatuur. Dankzij onze transparante tarieven, snelle responstijden en jarenlange expertise bespaart u onnodige wegsleepkosten en lange wachttijden bij de officiële merkdealer. Blader door onze recente klussen en ontdek wat onze mobiele sleutelservice voor u kan betekenen.
          </p>
          <GallerySlider 
            images={REAL_GALLERY_PROJECTS.map(p => ({ src: p.src, caption: p.alt }))} 
            title="" 
          />        </div>
      </section>

      {/* ===== SERVICE AREA — Interactive SVG Map ===== */}
      <section className={styles.serviceAreaSection}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '2rem' }}>
            <p className="section-eyebrow">WERKGEBIED</p>
            <h2 className="section-title">Waar Wij Naartoe Komen</h2>
            <p className="section-lead">Klik op een provincie op de kaart voor directe links naar uw stad.</p>
          </div>
          <ServiceAreaMap />
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
          <GoogleReviewsCta />
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
