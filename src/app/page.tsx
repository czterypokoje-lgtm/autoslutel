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
import BrandsLogoGrid from '@/components/BrandsLogoGrid/BrandsLogoGrid';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
import HeroGoogleBadge from '@/components/HeroGoogleBadge/HeroGoogleBadge';
import FeatureCards from '@/components/FeatureCards/FeatureCards';


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
    src: '/images/service_kwijt.jpg',
    alt: 'Monteur programmeert autosleutel via OBD diagnostiek in de auto op locatie',
    btnText: 'Direct hulp bij kwijt'
  },
  { 
    title: 'Autosleutels Repareren & Behuizing Vervangen', 
    desc: 'Is de behuizing van uw autosleutel gescheurd, zijn de knoppen lam of werkt de afstandsbediening niet meer? Onze specialisten kunnen uw autosleutel repareren terwijl u wacht.',
    href: '/diensten/autosleutel-reparatie',
    src: '/images/seo/autosleutel_reparatie_hero.jpg',
    alt: 'Autosleutel behuizing vervangen en knoppen repareren op locatie',
    btnText: 'Meer over reparaties'
  },
  { 
    title: 'Contactslot Auto Vervangen & Repareren', 
    desc: 'Draait uw autosleutel niet meer in het contactslot of zit deze vast? Een defect contactslot komt vaak voor. Wij reviseren of vervangen uw contactslot direct bij u op de oprit.',
    href: '/diensten/contactslot-vervangen-reparatie',
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
      <section className={styles.heroSplit}>
        <div className={styles.heroSplitInner}>
          
          <div className={styles.heroTopContent}>
            <div style={{ marginBottom: '1.5rem' }}>
              <HeroGoogleBadge />
            </div>
            <div className={styles.heroSplitLabel}>NL — 24/7 Mobiele Service</div>
            <h1>
              Autosleutel Kwijt of Bijmaken?<br />
              <span style={{ color: 'var(--orange-500)' }}>Wij Helpen Direct op Locatie!</span>
            </h1>
            <p className={styles.heroSplitLead}>
              Staat u buitengesloten of is uw autosleutel defect? Geen paniek. Autosleutel24 komt met een volledig uitgeruste servicebus naar u toe. Geen wegsleepkosten, goedkoper dan de dealer en vaak binnen <strong>30 tot 60 minuten</strong> weer op weg!
            </p>
          </div>

          <div className={styles.heroImageContent}>
            <Image 
              src="/autosleutel-bijmaken-utrecht-amsterdam-mobiel.webp" 
              alt="Autosleutel bijmaken door mobiele specialist"
              width={800}
              height={450}
              style={{ width: '100%', height: 'auto', borderRadius: '12px', objectFit: 'cover' }}
              priority
              quality={80}
              sizes="(max-width: 992px) 100vw, 50vw"
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
          </div>

          <div className={styles.heroBottomContent}>
            <LeadCaptureForm phone={SITE_CONFIG.phone} theme="light" />
          </div>

        </div>
      </section>

      {/* ── TRUST FEATURE CARDS ───────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#f3f4f6', padding: '1px 0' }}>
        <FeatureCards 
          title="Reparatie. Vervanging. Programmeren."
          subtitle={<><span style={{ color: 'var(--orange-500)' }}>AutoSleutel24</span> doet het allemaal, waar u maar wilt.</>}
          features={[
            {
              id: 'feature-1',
              icon: <Image src="/images/icon_van.jpg" alt="Autosleutel Kwijt? Direct Hulp" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: 'Autosleutel Kwijt? Direct Hulp',
              description: 'We komen direct naar uw locatie voor reparatie of vervanging.',
              linkText: 'Meer over mobiele service',
              linkUrl: '/diensten'
            },
            {
              id: 'feature-2',
              icon: <Image src="/images/icon_map.jpg" alt="Auto Op Slot? Schadevrij openen" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: 'Auto Op Slot? Schadevrij openen',
              description: `Binnen ${SITE_CONFIG.responseTime} ter plaatse. Onze lokale monteur is altijd in de buurt.`,
              linkText: 'Vind een monteur',
              linkUrl: '#contact'
            },
            {
              id: 'feature-3',
              icon: <Image src="/images/icon_price.jpg" alt="Vaste prijs" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: 'Vaste prijs vooraf',
              description: 'Geen verrassingen achteraf. U weet direct wat u betaalt voordat we beginnen.',
              linkText: 'Bekijk onze tarieven',
              linkUrl: '/prijzen'
            },
            {
              id: 'feature-4',
              icon: <Image src="/images/icon_car_check.jpg" alt="Garantie" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: '12 Maanden Garantie',
              description: 'Wij bieden standaard 12 maanden volledige garantie op al onze sleutels.',
              linkText: 'Lees meer over garantie',
              linkUrl: '/garantie'
            },
            {
              id: 'feature-5',
              icon: <Image src="/images/icon_insurance.jpg" alt="24/7 Spoedhulp" width={90} height={90} style={{ borderRadius: '12px' }} />,
              title: '24/7 Spoedhulp Bel Nu',
              description: 'U bent 100% verzekerd. Dag en nacht bereikbaar voor alle noodgevallen.',
              linkText: 'Bel direct',
              linkUrl: `tel:${SITE_CONFIG.phoneTel}`
            }
          ]}
        />
      </div>


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
            Bekijk hieronder een selectie van onze afgeronde praktijkprojecten en tevreden klanten in Midden-Nederland en de Randstad. Als erkend autosleutel specialist zijn wij dagelijks actief met onze volledig uitgeruste mobiele servicebus in onder andere <Link href="/steden/utrecht" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Utrecht</Link>, <Link href="/steden/amsterdam" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Amsterdam</Link>, <Link href="/steden/den-haag" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Den Haag</Link>, <Link href="/steden/almere" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Almere</Link>, <Link href="/steden/amersfoort" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Amersfoort</Link>, <Link href="/steden/arnhem" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Arnhem</Link>, <Link href="/steden/nijmegen" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Nijmegen</Link>, <Link href="/steden/apeldoorn" style={{color: 'var(--orange-500)', textDecoration: 'underline'}}>Apeldoorn</Link> en omstreken. Of het nu gaat om het bijmaken van een reservesleutel, het vakkundig inleren van keyless entry smart keys, of spoedreparaties bij een verloren of defecte autosleutel ter plaatse: wij garanderen schadevrij werk met originele OEM-diagnoseapparatuur. Dankzij onze transparante tarieven, snelle responstijden en jarenlange expertise bespaart u onnodige wegsleepkosten en lange wachttijden bij de officiële merkdealer. Blader door onze recente klussen en ontdek direct waarom duizenden automobilisten vertrouwen op onze mobiele sleutelservice.
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
                      Autosleutel bijmaken {city.name}
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
            <span className={styles.ratingNum}>{SITE_CONFIG.rating}</span>
            <div>
              <div className="stars">★★★★★</div>
              
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
