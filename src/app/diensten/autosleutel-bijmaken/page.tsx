import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { getRelatedBlogPosts } from '@/config/services';
import GoogleReviewsCta from '@/components/GoogleReviewsCta/GoogleReviewsCta';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { CITIES } from '@/config/cities';
import { BRANDS } from '@/config/brands';
import BrandsLogoGrid from '@/components/BrandsLogoGrid/BrandsLogoGrid';
import LeadCaptureForm from '@/components/LeadCaptureForm/LeadCaptureForm';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
import FeatureCards from '@/components/FeatureCards/FeatureCards';
import Image from 'next/image';
import { getBaseLocalBusinessSchema } from '@/utils/schema';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: {
    absolute: 'Autosleutel Bijmaken vanaf €149 | Autosleutel24',
  },
  description: 'Autosleutel bijmaken nodig? 24/7 op locatie, vaste prijs vanaf €149 — goedkoper dan de dealer. Binnen 30 min ter plaatse. Bel of WhatsApp nu!',
  alternates: { canonical: `${SITE_CONFIG.domain}/diensten/autosleutel-bijmaken` },
  openGraph: {
    title: 'Autosleutel Bijmaken vanaf €149 | Autosleutel24',
    url: `${SITE_CONFIG.domain}/diensten/autosleutel-bijmaken`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Autosleutel Bijmaken vanaf €149 | Autosleutel24',
  },
};

export default function SleutelBijmakenPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Autosleutel Bijmaken",
    "provider": getBaseLocalBusinessSchema(),
    "serviceType": "Autosleutel bijmaken, transponder programmeren, smart key inleren",
    "priceRange": "€149 - €500",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Autosleutel Bijmaken Diensten",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Standaard Autosleutel Bijmaken",
            "description": "Reserve sleutel voor oudere modellen zonder chip"
          },
          "price": "149",
          "priceCurrency": "EUR"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Transponder Autosleutel Bijmaken",
            "description": "Sleutel met chip voor merken als Volkswagen, Opel, Ford"
          },
          "price": "149",
          "priceCurrency": "EUR"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Smart Key Programmeren",
            "description": "Keyless entry sleutel voor BMW, Mercedes, Audi, Toyota"
          },
          "price": "199",
          "priceCurrency": "EUR"
        }
      ]
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Kan ik een autosleutel bijmaken als ik alle sleutels kwijt ben?",
        "acceptedAnswer": { "@type": "Answer", "text": "Ja. Wij hebben apparatuur om een nieuwe sleutel te genereren op basis van het contactslot of het immobilizer systeem. Dit geldt voor de meeste merken vanaf bouwjaar 1995. Voor sommige nieuwe modellen (2020+) is een originele sleutel vereist." }
      },
      {
        "@type": "Question",
        "name": "Hoe lang duurt het om een autosleutel bij te maken?",
        "acceptedAnswer": { "@type": "Answer", "text": "Een standaard transponder sleutel duurt 20-30 minuten. Een smart key met keyless entry duurt 30-60 minuten. Een Mercedes FBS4 sleutel met online component protection duurt 45-60 minuten." }
      },
      {
        "@type": "Question",
        "name": "Is het goedkoper dan bij de dealer?",
        "acceptedAnswer": { "@type": "Answer", "text": "Ja, aanzienlijk! Een dealer is gemiddeld 50% duurder. Voor een reservesleutel betaalt u bij ons €149 tot €299. Bij \"alle sleutels kwijt\" rekenen we €299 tot €500. Bij de dealer lopen deze kosten in de duizenden euro's, mede omdat ze vaak de hele slotenset willen vervangen en u verplicht bent de auto te laten wegslepen (bij ons heeft u géén wegsleepkosten!)." }
      },
      {
        "@type": "Question",
        "name": "Wat als mijn sleutel is gestolen?",
        "acceptedAnswer": { "@type": "Answer", "text": "Wij maken een nieuwe sleutel en wissen de gestolen sleutel uit het voertuig systeem. De gestolen sleutel kan de auto niet meer starten of openen." }
      },
      {
        "@type": "Question",
        "name": "Krijg ik garantie op de nieuwe sleutel?",
        "acceptedAnswer": { "@type": "Answer", "text": "Ja, 12 maanden garantie op alle sleutels en programmering. Daarnaast ontvangt u een verzekeringsklare factuur." }
      },
      {
        "@type": "Question",
        "name": "Kan ik op locatie een autosleutel bijmaken met afstandsbediening?",
        "acceptedAnswer": { "@type": "Answer", "text": "Zeker! Wij komen met onze volledig uitgeruste mobiele servicewagen naar uw locatie om een complete autosleutel bijmaken met afstandsbediening uit te voeren. Of u nu een extra exemplaar wilt laten bijmaken of direct een reservesleutel wilt laten maken, wij programmeren alle autosleutels met afstandsbediening vakkundig via de OBD2-poort terwijl u wacht." }
      },
      {
        "@type": "Question",
        "name": "Programmeren jullie ook een autosleutel met keyless entry?",
        "acceptedAnswer": { "@type": "Answer", "text": "Ja, wij zijn gespecialiseerd in het inleren van moderne smart keys en elk type autosleutel met keyless entry (proximity start). U hoeft uw auto niet weg te slepen; wij kunnen ter plaatse een extra autosleutel of keyless fob programmeren met behoud van uw fabrieksgarantie." }
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_CONFIG.domain },
      { "@type": "ListItem", "position": 2, "name": "Diensten", "item": `${SITE_CONFIG.domain}/diensten` },
      { "@type": "ListItem", "position": 3, "name": "Autosleutel Bijmaken", "item": `${SITE_CONFIG.domain}/diensten/autosleutel-bijmaken` }
    ]
  };

  const trustItems = [
    '24/7 Beschikbaar',
    'Binnen 30 min in Utrecht',
    'Vaste prijs vanaf €149',
    'Vaste prijs vooraf',
    'Verzekerd & Gecertificeerd'
  ];
return (
    <>
      <Script id="sleutel-bijmaken-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id="sleutel-bijmaken-faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="sleutel-bijmaken-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span> <Link href="/diensten">Diensten</Link> <span>/</span> <span>Autosleutel Bijmaken</span>
            </nav>
            <h1>Autosleutel Bijmaken — Reservesleutel Auto Laten Maken Op Locatie</h1>
            <p className={styles.heroLead}>
              Nieuwe sleutel nodig? Wij komen <strong>24/7 naar u toe</strong> en programmeren ter plaatse — goedkoper dan de dealer, zonder wachttijd.
            </p>
            <div style={{ marginTop: '2rem' }}>
              <LeadCaptureForm phone={SITE_CONFIG.phoneTel} />
            </div>
          </div>
        </section>

        <BrandsMarquee />



        {/* ── TRUST FEATURE CARDS ───────────────────────────────────────────── */}
        <FeatureCards 
          title="Nieuwe Autosleutel Laten Maken."
          subtitle={<>Goedkoper en sneller dan de autodealer, <span style={{ color: '#f97316' }}>direct op locatie.</span></>}
          features={[
              {
                id: 'feature-1',
                icon: <Image src="/images/icon_van.webp" alt="Mobiele Service" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: 'Mobiele Service',
                description: 'Waarom naar de dealer slepen? Wij komen naar u toe en maken uw sleutel direct ter plaatse.',
                linkText: 'Meer over mobiele service',
                linkUrl: '/diensten'
              },
              {
                id: 'feature-2',
                icon: <Image src="/images/icon_map.webp" alt="Alle Merken" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: 'Inclusief Programmeren',
                description: 'Elke nieuwe sleutel wordt direct ingeleerd in het systeem van uw auto. Startklaar!',
                linkText: 'Vind een monteur',
                linkUrl: '#contact'
              },
              {
                id: 'feature-3',
                icon: <Image src="/images/icon_price.webp" alt="Vaste prijs" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: 'Vaste prijs vooraf',
                description: 'Onze tarieven zijn gemiddeld 30-50% goedkoper dan de officiële merkdealer.',
                linkText: 'Bekijk onze tarieven',
                linkUrl: '/prijzen'
              },
              {
                id: 'feature-4',
                icon: <Image src="/images/icon_car_check.webp" alt="Garantie" width={90} height={90} style={{ borderRadius: '12px' }} />,
                title: '12 Maanden Garantie',
                description: 'Wij bieden standaard 12 maanden volledige garantie op de hardware en het inleren van uw nieuwe sleutels.',
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

        {/* 3 steps HowTo */}
        <div style={{ padding: '3.5rem 0', background: '#ffffff' }}>
          <div className="container">
            <HowItWorks />
          </div>
        </div>

        {/* Content Section */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.contentGrid}>
              <div className={styles.mainContent}>
                
                {/* Section 1 */}
                <div>
                  <h2>Wanneer Heeft U een Extra Autosleutel of Reservesleutel Nodig?</h2>
                  <p>
                    Een professioneel geteste <strong>extra autosleutel</strong> is geen overbodige luxe — het voorkomt dure noodsituaties. Veel bestuurders kiezen ervoor om tijdig een tweede sleutel te <strong>laten bijmaken</strong> of een complete <strong>autosleutel bijmaken met afstandsbediening</strong> in de volgende situaties:
                  </p>
                  <ul className={styles.bulletList}>
                    <li><strong>Preventie &amp; Gemak:</strong> U heeft momenteel slechts één sleutel en wilt preventief een <strong>extra sleutel</strong> laten bijmaken voordat u hem verliest of beschadigt.</li>
                    <li><strong>Autosleutel kwijt bent:</strong> Als u uw enige sleutel <strong>kwijt bent</strong>, kunnen wij direct op locatie een gloednieuwe <strong>autosleutel met keyless entry</strong> of reguliere transpondersleutel programmeren.</li>
                    <li><strong>Reservesleutel auto laten maken:</strong> Wilt u een <strong>reserve sleutel auto maken</strong> voordat u er een kwijtraakt? Dat is een slimme keuze. Wij maken een complete reservesleutel op locatie.</li>
                    <li><strong>Versleten knoppen of behuizing:</strong> Wanneer oudere <strong>autosleutels met afstandsbediening</strong> haperen, is het vaak slimmer om direct een nieuwe klapsleutel te <strong>laten bijmaken</strong> met garantie.</li>
                    <li><strong>Sleutel gestolen:</strong> Wij leveren een nieuwe sleutel en wissen de oude sleutels direct uit de autocomputer (ECU) voor maximale diefstalbeveiliging.</li>
                    <li><strong>Meerdere bestuurders:</strong> Deelt u de auto met uw partner of gezin? Wij kunnen meerdere <strong>autosleutels met afstandsbediening</strong> voordelig op locatie inleren.</li>
                  </ul>
                </div>

                {/* Section 2 */}
                <div>
                  <h2>Wat Kost een Autosleutel Bijmaken? — Transparante Prijzen</h2>
                  <p>
                    Wilt u vooraf exact weten wat de tarieven zijn om een <strong>extra autosleutel</strong> te <strong>laten maken</strong>? Of u nu een standaard transpondersleutel, een klapsleutel of een luxe <strong>autosleutel met keyless entry</strong> wilt <strong>laten bijmaken</strong>, wij hanteren transparante all-in tarieven inclusief slijpen en inleren:
                  </p>
                  <div className={styles.tableWrapper}>
                    <table className={styles.pricingTable}>
                      <thead>
                        <tr>
                          <th>Sleutel Type</th>
                          <th>Merk / Model</th>
                          <th>Prijs</th>
                          <th>Tijdsduur</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Standaard sleutel (met transponder chip)</td>
                          <td>Oudere auto's, basis modellen</td>
                          <td><strong>€149 - €249</strong></td>
                          <td>15 min</td>
                        </tr>
                        <tr>
                          <td>Klapsleutel / Flip Key</td>
                          <td>VW, Toyota, Ford, Opel, etc.</td>
                          <td><strong>€199 - €349</strong></td>
                          <td>20-30 min</td>
                        </tr>
                        <tr>
                          <td>Smart Key / Keyless</td>
                          <td>Proximity sleutel, Push-to-start</td>
                          <td><strong>€249 - €349</strong></td>
                          <td>30-60 min</td>
                        </tr>
                        <tr>
                          <td>Alle sleutels kwijt (geen werkende sleutel)</td>
                          <td>Auto openen & sleutel inleren</td>
                          <td><strong>Vanaf €299</strong></td>
                          <td>45-60 min</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <ul className={styles.bulletList}>
                    <li>
                      <strong>Wat kost een sleutel bijmaken?</strong> Een nieuwe reservesleutel kost bij ons tussen de €149 en €299, afhankelijk van het merk en of het een smart key is. Bent u alle sleutels kwijt? Dan liggen de kosten tussen de €299 en €500. Dit is altijd inclusief programmeren op locatie!
                    </li>
                    <li>
                      <strong>Dealer vs. Slotenmaker:</strong> De dealer is gemiddeld 50% duurder dan Autosleutel24 voor exact dezelfde sleutel. Bovendien bespaart u bij ons op wegsleepkosten, want wij komen naar u toe (geen wegsleepkosten!). U ontvangt altijd <strong>gecertificeerde sleutels</strong> met 12 maanden garantie.
                    </li>
                  </ul>
                </div>

                {/* Section 2.5: Onze Service Galerij */}
                <div>
                  <h2>Onze Service in Heel Nederland — Galerij</h2>
                  <p>
                    Of u nu op onze werkplaats in Utrecht langskomt of dat we onze mobiele bussen naar u toe sturen op locatie in heel Nederland; wij garanderen een vakkundige service. Bekijk hier een impressie van onze werkplaats, apparatuur en recent voltooide opdrachten.
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem',
                    margin: '1.5rem 0'
                  }}>
                    <img 
                      src="/images/seo/autosleutel-bijmaken-porsche.webp" 
                      alt="Professionele reservesleutel programmering op locatie" 
                      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                    />
                    <img 
                      src="/images/seo/autosleutel-bijmaken-bmw.webp" 
                      alt="Smart key inleren en contactslot reparatie" 
                      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                    />
                    <img 
                      src="/images/seo/autosleutel-bijmaken-workshop.webp" 
                      alt="Werkplaats uitgerust met CNC-freesmachines en soldeerapparatuur" 
                      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                    />
                    <img 
                      src="/images/seo/autosleutel-bijmaken-equipment.webp" 
                      alt="OBD2 programmeercomputers en transponder tools" 
                      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                    />
                  </div>
                  <p>
                    Dankzij onze geavanceerde apparatuur en eigen fysieke werkplaats kunnen we reservesleutels maken voor meer dan 95% van de voertuigen in Nederland. Wij zijn 24/7 bereikbaar voor mobiele service op locatie.
                  </p>
                </div>



                {/* Section 4 */}
                <div style={{ margin: '3rem 0' }}>
                  <BrandsLogoGrid
                    title="Welke Merken Bedienen Wij?"
                    subtitle="Wij maken en programmeren sleutels voor alle gangbare merken. Onze apparatuur ondersteunt:"
                  />
                </div>

                {/* Section 5 */}
                <div>
                  <h2>Waar Komen Wij voor Autosleutel Bijmaken?</h2>
                  <p>
                    Wij zijn mobiel actief in de regio Utrecht en in heel Nederland. Ontdek onze service in de volgende steden:
                  </p>
                  <ul className={styles.bulletList} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    {CITIES.map(city => (
                      <li key={city.slug}>
                        <Link href={`/steden/${city.slug}`}>{city.city}</Link>
                      </li>
                    ))}
                  </ul>
                  <p>
                    <Link href="/steden" style={{ fontWeight: 700, color: '#f97316' }}>Bekijk ons volledige werkgebied →</Link>
                  </p>
                </div>

                {/* Section 6 - FAQ */}
                <div>
                  <h2>Veelgestelde Vragen over Autosleutel Bijmaken</h2>

                  <details className={styles.faqItem}>
                    <summary className={styles.faqQuestion}>
                      Kan ik een autosleutel bijmaken zonder de originele?
                      <span className={styles.faqChevron}>+</span>
                    </summary>
                    <p className={styles.faqAnswer}>
                      Ja. Wij hebben apparatuur om een nieuwe sleutel te genereren op basis van het contactslot of het immobilizer systeem. 
                      Dit geldt voor de meeste merken vanaf bouwjaar 1995. Voor sommige nieuwe modellen (2020+) is een originele sleutel vereist.
                    </p>
                  </details>

                  <details className={styles.faqItem}>
                    <summary className={styles.faqQuestion}>
                      Hoe lang duurt het om een autosleutel bij te maken?
                      <span className={styles.faqChevron}>+</span>
                    </summary>
                    <p className={styles.faqAnswer}>
                      Een standaard transponder sleutel duurt 20-30 minuten. Een smart key met keyless entry duurt 30-60 minuten. 
                      Een Mercedes FBS4 sleutel met online component protection duurt 45-60 minuten.
                    </p>
                  </details>

                  <details className={styles.faqItem}>
                    <summary className={styles.faqQuestion}>
                      Is het goedkoper dan bij de dealer?
                      <span className={styles.faqChevron}>+</span>
                    </summary>
                    <p className={styles.faqAnswer}>
                      Ja, aanzienlijk! Een dealer is gemiddeld 50% duurder. Voor een reservesleutel betaalt u bij ons €149 tot €299. Bij "alle sleutels kwijt" rekenen we €299 tot €500. Bij de dealer lopen deze kosten in de duizenden euro's, mede omdat ze vaak de hele slotenset willen vervangen en u verplicht bent de auto te laten wegslepen (bij ons heeft u géén wegsleepkosten!).
                    </p>
                  </details>

                  <details className={styles.faqItem}>
                    <summary className={styles.faqQuestion}>
                      Wat als mijn sleutel is gestolen?
                      <span className={styles.faqChevron}>+</span>
                    </summary>
                    <p className={styles.faqAnswer}>
                      Wij maken een nieuwe sleutel en wissen de gestolen sleutel uit het voertuig systeem. 
                      De gestolen sleutel kan de auto niet meer starten of openen.
                    </p>
                  </details>

                  <details className={styles.faqItem}>
                    <summary className={styles.faqQuestion}>
                      Krijg ik garantie op de nieuwe sleutel?
                      <span className={styles.faqChevron}>+</span>
                    </summary>
                    <p className={styles.faqAnswer}>
                      Ja, 12 maanden garantie op alle sleutels en programmering. Daarnaast ontvangt u een verzekeringsklare factuur.
                    </p>
                  </details>

                  <details className={styles.faqItem}>
                    <summary className={styles.faqQuestion}>
                      Kan ik op locatie een autosleutel bijmaken met afstandsbediening?
                      <span className={styles.faqChevron}>+</span>
                    </summary>
                    <p className={styles.faqAnswer}>
                      Zeker! Wij komen met onze volledig uitgeruste mobiele servicewagen naar uw locatie om een complete <strong>autosleutel bijmaken met afstandsbediening</strong> uit te voeren. Of u nu een extra exemplaar wilt <strong>laten bijmaken</strong> of direct een reservesleutel wilt <strong>laten maken</strong>, wij programmeren alle <strong>autosleutels met afstandsbediening</strong> vakkundig via de OBD2-poort terwijl u wacht.
                    </p>
                  </details>

                  <details className={styles.faqItem}>
                    <summary className={styles.faqQuestion}>
                      Programmeren jullie ook een autosleutel met keyless entry?
                      <span className={styles.faqChevron}>+</span>
                    </summary>
                    <p className={styles.faqAnswer}>
                      Ja, wij zijn gespecialiseerd in het inleren van moderne smart keys en elk type <strong>autosleutel met keyless entry</strong> (proximity start). U hoeft uw auto niet weg te slepen; wij kunnen ter plaatse een <strong>extra autosleutel</strong> of keyless fob programmeren met behoud van uw fabrieksgarantie.
                    </p>
                  </details>
                </div>

              </div>

              {/* Sidebar */}
              <aside className={styles.sidebar}>
                <div className={styles.sideCard}>
                  <h3>Direct Hulp Nodig?</h3>
                  <p>Bel of WhatsApp ons. Wij zijn 24/7 bereikbaar en gemiddeld binnen 30 minuten bij u.</p>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.sidePhone} id="sb-side-phone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                    Bel: {SITE_CONFIG.phone}
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.sideWa} id="sb-side-wa">WhatsApp Direct</a>
                  <div className={styles.sideList}>
                    {['Geen sleepkosten', 'Vaste prijs vooraf', 'Verzekeringsklare factuur', '12 maanden garantie', '24/7 beschikbaar'].map(item => (
                      <div key={item} className={styles.sideListItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{color:'#22c55e',flexShrink:0}} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            {/* Bottom CTA block */}
            <div className={styles.ctaBlock}>
              <h2>Autosleutel Bijmaken Nodig? Bel Direct</h2>
              <p>Onze mobiele specialist staat binnen 30 min bij u in Utrecht. Vaste prijs, geen verrassingen.</p>
              <div className={styles.ctaBtnsGrid}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPrimary} id="sb-bottom-phone">Bel: {SITE_CONFIG.phone}</a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWhatsapp} id="sb-bottom-wa">WhatsApp Direct</a>
              </div>
              <span className={styles.microText}>24/7 beschikbaar — ook &apos;s nachts en in het weekend</span>
            </div>

          </div>
        </section>

        {/* ── RELATED BLOGS SECTION ────────────────────────────────── */}
        {(() => {
          const relatedPosts = getRelatedBlogPosts('autosleutel-bijmaken');
          if (!relatedPosts || relatedPosts.length === 0) return null;
          return (
            <section className={styles.relatedBlogsSection}>
              <div className={styles.relatedBlogsContainer}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
                  GERELATEERDE KENNIS &amp; ADVIES
                </p>
                <h2 className={styles.relatedBlogsTitle}>
                  Handige artikelen over Autosleutel Bijmaken
                </h2>
                <div className={styles.relatedBlogsGrid}>
                  {relatedPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className={styles.blogPostCard}
                      id={`sb-related-blog-${post.slug}`}
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
          <div className={styles.container}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
              KLANTBEOORDELINGEN
            </p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              Wat Klanten Zeggen over Autosleutel Bijmaken
            </h2>
            <GoogleReviewsCta />
          </div>
        </section>

      </main>
    </>
  );
}
