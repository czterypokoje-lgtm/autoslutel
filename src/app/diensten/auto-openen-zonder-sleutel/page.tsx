import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { getRelatedBlogPosts } from '@/config/services';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import GoogleReviewCard from '@/components/GoogleReviewCard/GoogleReviewCard';
import { generateContextualReviews } from '@/utils/reviews';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: {
    absolute: 'Auto Openen Zonder Sleutel | 24/7 Schadevrij | Autosleutel24',
  },
  description: 'Auto openen zonder sleutel nodig? Onze mobiele locksmith opent uw auto 100% schadevrij binnen 30 min. Vaste prijs vanaf €95. Actief in Utrecht, Amsterdam, Almere & Amersfoort. Bel 24/7!',
  alternates: { canonical: `${SITE_CONFIG.domain}/diensten/auto-openen-zonder-sleutel` },
  keywords: [
    'auto openen zonder sleutel',
    'sleutel in auto vergeten',
    'autodeur openen schadevrij',
    'auto openen locksmith',
    'buitensluiting auto',
    'auto openen zonder sleutel kosten',
    'auto openen zonder sleutel utrecht',
    'auto openen amsterdam'
  ]
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Auto Openen Zonder Sleutel",
  "provider": {
    "@type": "Locksmith",
    "name": "Autosleutel24",
    "telephone": SITE_CONFIG.phoneTel,
    "url": SITE_CONFIG.domain,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Utrecht",
      "addressRegion": "Utrecht",
      "addressCountry": "NL"
    }
  },
  "areaServed": [
    { "@type": "City", "name": "Utrecht" },
    { "@type": "City", "name": "Amsterdam" },
    { "@type": "City", "name": "Almere" },
    { "@type": "City", "name": "Amersfoort" }
  ],
  "serviceType": "Auto openen zonder sleutel, schadevrij buitensluiting, kofferbak openen",
  "offers": {
    "@type": "Offer",
    "price": "95",
    "priceCurrency": "EUR",
    "priceSpecification": {
      "@type": "PriceSpecification",
      "description": "All-in prijs inclusief btw en voorrijkosten"
    }
  }
};

const faqItems = [
  {
    q: "Hoe werkt een auto openen zonder sleutel?",
    a: "Een mobiele auto-slotenmaker gebruikt gespecialiseerd Lishi lockpick-gereedschap dat precies is ontworpen voor uw slotcilinder. De technicus schuift de tool in het sleutelgat en tast de inwendige pennen (wafers/stackers) mechanisch af. Zodra alle pennen zijn uitgelijnd, draait de cilinder open — zonder kracht, zonder schade. Bij modernere auto's met elektronisch vergrendelde portieren wordt tevens een OBD-tool of long-range decoder gebruikt om het CAN-bus netwerk te ontgrendelen."
  },
  {
    q: "Mijn autosleutels liggen in de auto, wat nu?",
    a: "Bel Autosleutel24 direct op 06 11 75 12 31. Wij vragen uw automerk, model en exacte locatie. Onze mobiele slotenmaker rijdt onmiddellijk naar u toe en is gemiddeld binnen 30 minuten ter plaatse. U hoeft geen sleepwagen, dealer of garage te bellen. Wij openen de auto ter plekke schadevrij en u ontvangt een officiële verzekeringsklare factuur."
  },
  {
    q: "Welke systemen vergelijken voor auto openen zonder sleutel?",
    a: "Er zijn drie hoofdtechnieken: (1) Mechanische opening via Lishi decoders — het meest schadevrije en betrouwbare systeem voor het overgrote deel van de markt; (2) OBD-poort bypass voor auto's met elektronische deadlock zoals BMW en Mercedes; (3) Slim-Jim/long-reach tools voor oudere voertuigen. Autosleutel24 gebruikt uitsluitend gecertificeerde methode (1) en (2) en nooit destructieve technieken."
  },
  {
    q: "Wat zijn de kosten voor het openen van mijn auto (buitensluiting)?",
    a: "Bij Autosleutel24 betaalt u een vaste all-in prijs van €95 (inclusief btw en voorrijkosten) voor het schadevrij openen van uw autodeur bij een buitensluiting overdag. Het tarief voor 's nachts (22:00–07:00) of weekenddienst is €115. U ontvangt de prijsopgave altijd vóór wij uitrijden — geen verborgen kosten achteraf."
  },
  {
    q: "Welke auto merken kunnen worden geopend zonder sleutel?",
    a: "Wij kunnen vrijwel alle gangbare personenautomerken schadevrij openen: Volkswagen, BMW, Mercedes-Benz, Audi, Toyota, Ford, Opel, Renault, Peugeot, Citroën, Nissan, Hyundai, Kia, Seat, Skoda, Volvo, Porsche en meer. Zelfs auto's met een dubbel vergrendelingssysteem (deadlock) of keyless-only systemen zijn voor onze specialisten geen probleem."
  },
  {
    q: "Hoe snel kan mijn auto worden geopend als de sleutels erbinnen liggen?",
    a: "Na uw telefonische melding rijdt de dichtstbijzijnde mobiele slotenmaker direct uit. In de regio Utrecht, Amsterdam, Almere en Amersfoort zijn wij gemiddeld binnen 25–40 minuten ter plaatse. Op rustige uren (overdag doordeweeks) kan dit zelfs korter zijn. Nooit meer dan 60 minuten in het gebied dat wij bedienen."
  },
  {
    q: "Zijn er auto openen zonder sleutel apps die het mogelijk maken?",
    a: "Sommige moderne auto's (Tesla, bepaalde BMW's/Mercedes met Connected App) bieden een fabrieksapp waarmee u het voertuig op afstand kunt ontgrendelen via uw smartphone — mits u de app vooraf heeft ingesteld en actief abonnement heeft. Als die mogelijkheid ontbreekt of de app niet werkt, is een gecertificeerde mobiele locksmith de snelste en veiligste oplossing. Let op: onbekende third-party apps die beweren sloten te openen zijn oplichting."
  },
  {
    q: "Kan ik mijn auto openen als ik geen reservesleutel heb?",
    a: "Ja, absoluut. U hebt geen reservesleutel nodig. Via mechanische decoding kan de cilinder worden geopend. Als u daarna ook een nieuwe reservesleutel wilt, kunnen wij die direct ter plaatse programmeren. Zo rijdt u dezelfde dag weg met een reserve en laat u nooit meer een sleutel in de auto achter."
  },
  {
    q: "Welke installatiebedrijven voor auto openen zonder sleutel zijn actief in Nederland?",
    a: "In Nederland zijn meerdere mobiele locksmith-bedrijven actief, maar de kwaliteit verschilt sterk. Let op gecertificeerde vakmannen die werken met professioneel Lishi-gereedschap en vaste transparante tarieven communiceren vóór aankomst. Autosleutel24 is actief in de regio Utrecht, Amsterdam, Almere en Amersfoort en staat bekendom schadevrij openen en eerlijke all-in prijzen — controleerbaar via 247 Google reviews met een 4.9-sterren beoordeling."
  },
  {
    q: "Wordt auto openen zonder sleutel vergoed door mijn verzekering?",
    a: "Bij WA+ (Beperkt Casco) of All-risk dekking worden kosten voor een buitensluiting soms vergoed als onderdeel van uw pechhulpdekking — check uw polis. Verzekeringsmaatschappijen vragen altijd een originele factuur met btw en specificatie. Deze ontvangt u direct van ons. Sommige pechhulpabonnementen (ANWB, Wegenwacht) dekken dit ook — bel hen eerst als u die dekking heeft."
  },
  {
    q: "Diensten voor auto openen met sleutel erin — wat biedt een mobiele slotenmaker?",
    a: "Een gecertificeerde mobiele auto-slotenmaker biedt: (1) Schadevrije opening van portieren en kofferbak; (2) Correcte identiteitsverificatie vóór opening (kopie rijbewijs + kentekenbewijs); (3) Een officiële factuur voor uw verzekeraar; (4) Optioneel: direct een nieuwe reservesleutel programmeren ter plaatse. Dit is volledig anders dan 'glasbrekers' of amateurs die met een kleerhanger of koevoet werken en schade veroorzaken."
  }
];

const steps = [
  {
    num: 1,
    title: "Bel of WhatsApp direct",
    desc: "Geef uw locatie, automerk en model door. Wij geven u direct een vaste all-in prijs."
  },
  {
    num: 2,
    title: "Mobiele slotenmaker onderweg",
    desc: "De dichtstbijzijnde specialist rijdt onmiddellijk uit. Gemiddeld binnen 30 minuten bij u."
  },
  {
    num: 3,
    title: "Identiteitscontrole",
    desc: "Wij vragen uw rijbewijs + kentekenpapieren. Dit is verplicht voor uw veiligheid én de onze."
  },
  {
    num: 4,
    title: "Schadevrije opening",
    desc: "Via Lishi decoder wordt de cilinder mechanisch geopend. 0% schade, 100% betrouwbaar."
  },
  {
    num: 5,
    title: "Direct op weg + eventueel reservesleutel",
    desc: "U betaalt de afgesproken prijs. Wij programmeren op verzoek direct een reservesleutel ter plaatse."
  }
];

const trustItems = [
  '24/7 Spoedhulp',
  'Binnen 30 min ter plaatse',
  '100% Schadevrij',
  'Vaste prijs vooraf',
  'Gecertificeerde locksmith',
  'Verzekeringsklare factuur'
];

export default function AutoOpenenZonderSleutelPage() {
  const faqPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_CONFIG.domain },
      { "@type": "ListItem", "position": 2, "name": "Diensten", "item": `${SITE_CONFIG.domain}/diensten` },
      { "@type": "ListItem", "position": 3, "name": "Auto Openen Zonder Sleutel", "item": `${SITE_CONFIG.domain}/diensten/auto-openen-zonder-sleutel` }
    ]
  };

  return (
    <>
      <Script id="aozs-service-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id="aozs-faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }} />
      <Script id="aozs-breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span>
              <Link href="/diensten">Diensten</Link> <span>/</span>
              <span>Auto Openen Zonder Sleutel</span>
            </nav>
            <h1>Auto Openen Zonder Sleutel — 100% Schadevrij &amp; 24/7 Mobiel</h1>
            <p className={styles.heroLead}>
              Sleutel in de auto laten liggen? Deur dichtgevallen? Buitengesloten van uw auto?
              Als gecertificeerde mobiele locksmith openen wij uw auto 100% schadevrij — zonder ruit intrappen,
              zonder sleepwagen. Wij zijn gemiddeld binnen 30 minuten bij u ter plaatse in
              Utrecht, Amsterdam, Almere en Amersfoort.
            </p>
            <div className={styles.heroCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id="aozs-hero-phone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                </svg>
                Bel Spoedhulp: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id="aozs-hero-wa">
                WhatsApp Spoed
              </a>
              <Link href="/contact" className={styles.btnOutline} id="aozs-hero-form">
                Offerte Aanvragen
              </Link>
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ────────────────────────────────────────────── */}
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

        {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.contentGrid}>
              <div className={styles.mainContent}>

                {/* Section 1: Wanneer nodig */}
                <div>
                  <h2>Wanneer Heeft U Auto Openen Zonder Sleutel Nodig?</h2>
                  <p>
                    Er zijn meerdere situaties waarbij u uw auto moet openen zonder uw eigen sleutel. In al deze gevallen is Autosleutel24 uw snelste en meest schadevrije optie:
                  </p>
                  <ul className={styles.bulletList}>
                    <li><strong>Sleutel in de auto laten liggen:</strong> U heeft de auto verlaten, de deuren vielen in het slot en de sleutel ligt nog op de stoel of in het contact. Bel ons — wij openen de portieren schadevrij.</li>
                    <li><strong>Deur dichtgevallen met sleutel erin:</strong> U deed de deur dicht en de auto vergrendelde automatisch. Ook dit lossen wij op zonder een ruit in te slaan.</li>
                    <li><strong>Kofferbak zit op slot met sleutel erin:</strong> De kofferbak of haatchback-deur is dicht en de sleutel ligt van binnen. Wij openen via het portierslot of de kofferbalklok.</li>
                    <li><strong>Alle sleutels kwijt (buitensluiting):</strong> U heeft geen enkele sleutel meer — verloren of gestolen. Wij openen de auto en programmeren dezelfde dag een nieuwe sleutel.</li>
                    <li><strong>Gebroken of vastgelopen sleutel in het slot:</strong> De sleutelbaard is afgebroken in de cilinder. Wij verwijderen het fragment en openen de auto.</li>
                  </ul>
                </div>

                {/* Section 2: Hoe werkt het */}
                <div>
                  <h2>Hoe Werkt Auto Openen Zonder Sleutel? — De Techniek Uitgelegd</h2>
                  <p>
                    Veel mensen denken dat een auto openen zonder sleutel altijd schade veroorzaakt. Dit is een hardnekkig misverstand. Een gecertificeerde locksmith gebruikt gespecialiseerde Lishi-tools:
                  </p>
                  <ol className={styles.stepList}>
                    <li className={styles.stepItem}>
                      <span className={styles.stepNum}>1</span>
                      <div className={styles.stepText}>
                        <strong>Decodering via sleutelgat</strong>
                        De Lishi decoder wordt in het sleutelgat ingebracht en voelt de exacte positie van alle inwendige pennen (wafers) af.
                      </div>
                    </li>
                    <li className={styles.stepItem}>
                      <span className={styles.stepNum}>2</span>
                      <div className={styles.stepText}>
                        <strong>Mechanisch uitlijnen</strong>
                        De specialist lijnt de pennen stuk voor stuk uit totdat de cilinder in de open stand staat — identiek aan wat uw originele sleutel doet.
                      </div>
                    </li>
                    <li className={styles.stepItem}>
                      <span className={styles.stepNum}>3</span>
                      <div className={styles.stepText}>
                        <strong>Elektronisch ontgrendelen</strong>
                        Bij modernere auto's met centrale vergrendeling (CAN-bus) wordt via de OBD-poort of een specifieke bypass-tool het elektronische slot geopend.
                      </div>
                    </li>
                  </ol>
                  <div className={styles.callout}>
                    <strong>Waarom nooit een kleerhanger gebruiken?</strong> Klassieke &quot;slim-jim&quot; methodes beschadigen de deurrubbers, de deurpanelen of de kabelgeleiders van uw raam — schade die honderden euro&apos;s kost om te repareren. Professionele Lishi-tools laten nul schade achter.
                  </div>
                </div>

                {/* Section 3: Systemen vergelijken */}
                <div>
                  <h2>Auto Openen Zonder Sleutel Systemen Vergelijken</h2>
                  <div className={styles.tableWrapper}>
                    <table className={styles.pricingTable}>
                      <thead>
                        <tr>
                          <th>Methode</th>
                          <th>Schade</th>
                          <th>Snelheid</th>
                          <th>Kosten</th>
                          <th>Aanbevolen?</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Lishi Decoder (professioneel)</strong></td>
                          <td>❌ Geen</td>
                          <td>✅ 10–20 min</td>
                          <td>€95–€115</td>
                          <td>✅ Ja</td>
                        </tr>
                        <tr>
                          <td>Fabrieksapp (Tesla/BMW/Mercedes)</td>
                          <td>❌ Geen</td>
                          <td>✅ Direct</td>
                          <td>€0 (mits actief)</td>
                          <td>✅ Als beschikbaar</td>
                        </tr>
                        <tr>
                          <td>ANWB / Pechhulp</td>
                          <td>❌ Geen</td>
                          <td>⏱ 45–90 min</td>
                          <td>€0 (mits lid)</td>
                          <td>✅ Als lid</td>
                        </tr>
                        <tr>
                          <td>Slim-Jim / Kleerhanger</td>
                          <td>⚠️ Hoog risico</td>
                          <td>❌ Onbetrouwbaar</td>
                          <td>DIY</td>
                          <td>❌ Nee</td>
                        </tr>
                        <tr>
                          <td>Ruit Inslaan</td>
                          <td>🔴 Zeer hoog</td>
                          <td>✅ Direct</td>
                          <td>€200–€600 reparatie</td>
                          <td>❌ Noodsituatie enkel</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 4: Tarieven */}
                <div>
                  <h2>Kosten Auto Openen Zonder Sleutel — Transparante Tarieven</h2>
                  <div className={styles.tableWrapper}>
                    <table className={styles.pricingTable}>
                      <thead>
                        <tr>
                          <th>Dienst</th>
                          <th>Tijdstip</th>
                          <th>Prijs (All-in)</th>
                          <th>Duur</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Autodeur / kofferbak schadevrij openen</td>
                          <td>Overdag (07:00–22:00)</td>
                          <td><strong>€95</strong></td>
                          <td>10–20 min</td>
                        </tr>
                        <tr>
                          <td>Autodeur / kofferbak schadevrij openen</td>
                          <td>Nacht &amp; weekend</td>
                          <td><strong>€115</strong></td>
                          <td>10–20 min</td>
                        </tr>
                        <tr>
                          <td>Openen + nieuwe reservesleutel programmeren</td>
                          <td>Alle tijden</td>
                          <td><strong>€199</strong></td>
                          <td>30–45 min</td>
                        </tr>
                        <tr>
                          <td>Openen bij deadlock systeem (BMW, Audi, VW)</td>
                          <td>Alle tijden</td>
                          <td><strong>€125</strong></td>
                          <td>20–30 min</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.callout}>
                    <strong>Prijsgarantie:</strong> U ontvangt altijd telefonisch of via WhatsApp een vaste all-in prijsopgave vóór onze specialist uitrijdt. Wat wij opgeven, is wat u betaalt. Geen nachtclubpraktijken waarbij de prijs na aankomst verdubbelt.
                  </div>
                </div>

                {/* Gallery */}
                <div>
                  <h2>Onze Mobiele Locksmith in Actie — Galerij</h2>
                  <p>Wij openen dagelijks tientallen auto&apos;s schadevrij in de regio. Hieronder een greep uit recente werkzaamheden:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', margin: '1.5rem 0' }}>
                    <img
                      src="/images/seo/auto-slotenmaker-bmw-openen-amsterdam.webp"
                      alt="Schadevrij openen van een autodeur bij buitensluiting"
                      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }}
                    />
                    <img
                      src="/images/seo/auto-slotenmaker-werkplaats-utrecht.webp"
                      alt="Lishi decoder gebruikt door gecertificeerde monteur"
                      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }}
                    />
                    <img
                      src="/images/seo/auto-slotenmaker-volkswagen-golf-almere.webp"
                      alt="Autodeur schadevrij geopend na buitensluiting"
                      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }}
                    />
                    <img
                      src="/images/seo/auto-slotenmaker-audi-inleren-amersfoort.webp"
                      alt="Buitensluiting opgelost en reservesleutel geprogrammeerd"
                      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }}
                    />
                  </div>
                </div>

                {/* Section 5: Stappenplan */}
                <div>
                  <h2>Stappenplan: Auto Openen Zonder Sleutel — Zo Werkt Het</h2>
                  <ol className={styles.stepList}>
                    {steps.map((step, idx) => (
                      <li key={idx} className={styles.stepItem}>
                        <span className={styles.stepNum}>{step.num}</span>
                        <div className={styles.stepText}>
                          <strong>{step.title}</strong>
                          {step.desc}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* FAQ Section */}
                <div>
                  <h2>Veelgestelde Vragen over Auto Openen Zonder Sleutel</h2>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                    Antwoorden op de meest gezochte vragen — zodat u snel en goed geïnformeerd een beslissing kunt nemen.
                  </p>
                  {faqItems.map((item, idx) => (
                    <details key={idx} className={styles.faqItem}>
                      <summary className={styles.faqQuestion}>
                        {item.q}
                        <span className={styles.faqChevron}>+</span>
                      </summary>
                      <p className={styles.faqAnswer}>{item.a}</p>
                    </details>
                  ))}
                </div>

              </div>

              {/* ── SIDEBAR ──────────────────────────────────────────── */}
              <aside className={styles.sidebar}>
                <div className={styles.sideCard}>
                  <h3>Auto Op Slot? Bel Direct</h3>
                  <p>Wij zijn 24/7 bereikbaar. Gemiddeld binnen 30 minuten bij u — ook &apos;s nachts.</p>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.sidePhone} id="aozs-sidebar-phone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                    </svg>
                    Bel: {SITE_CONFIG.phone}
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.sideWa} id="aozs-sidebar-wa">
                    WhatsApp Direct
                  </a>
                  <div className={styles.sideList}>
                    {[
                      '100% schadevrij',
                      'Vaste prijs vooraf',
                      'Verzekeringsklare factuur',
                      'Binnen 30 min ter plaatse',
                      '24/7 beschikbaar',
                      'Gecertificeerde locksmith'
                    ].map(item => (
                      <div key={item} className={styles.sideListItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ color: '#22c55e', flexShrink: 0 }} aria-hidden="true">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.ratingCard}>
                  <div className={styles.ratingStars}>★★★★★</div>
                  <p className={styles.ratingText}>&ldquo;Sleutel in mijn VW Golf achtergelaten. Belde Autosleutel24 en ze waren binnen 25 minuten ter plaatse. Auto open zonder één krasje. Geweldig!&rdquo;</p>
                  <span className={styles.ratingMeta}>Lars V. — Volkswagen Golf, Utrecht</span>
                  <span className={styles.ratingCount}>{SITE_CONFIG.reviewCount} Google beoordelingen · {SITE_CONFIG.rating}/5</span>
                </div>

                <div className={styles.sideCard} style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <h3 style={{ color: '#166534' }}>Geen Sleutel Meer?</h3>
                  <p style={{ color: '#15803d', fontSize: '0.88rem' }}>
                    Na het openen kunnen wij direct ter plaatse een nieuwe reservesleutel programmeren. Nooit meer buitengesloten.
                  </p>
                  <Link href="/diensten/autosleutel-bijmaken" className={styles.btnOutline} id="aozs-side-bijmaken" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
                    Reservesleutel Bijmaken →
                  </Link>
                </div>
              </aside>
            </div>

            {/* ── BOTTOM CTA ────────────────────────────────────────── */}
            <div className={styles.ctaBlock}>
              <h2>Auto Openen Zonder Sleutel — Bel Direct</h2>
              <p>Onze mobiele locksmith staat binnen 30 min bij u. Vaste prijs, nul schade, verzekeringsklare factuur.</p>
              <div className={styles.ctaBtnsGrid}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPrimary} id="aozs-bottom-phone">
                  Bel: {SITE_CONFIG.phone}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWhatsapp} id="aozs-bottom-wa">
                  WhatsApp Direct
                </a>
              </div>
              <span className={styles.microText}>24/7 beschikbaar — ook &apos;s nachts en in het weekend</span>
            </div>
          </div>
        </section>

        {/* ── RELATED BLOGS ────────────────────────────────────────── */}
        {(() => {
          const relatedPosts = getRelatedBlogPosts('autodeur-openen');
          if (!relatedPosts || relatedPosts.length === 0) return null;
          return (
            <section className={styles.relatedBlogsSection}>
              <div className={styles.relatedBlogsContainer}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
                  GERELATEERDE KENNIS &amp; ADVIES
                </p>
                <h2 className={styles.relatedBlogsTitle}>
                  Handige Artikelen over Auto Openen &amp; Buitensluiting
                </h2>
                <div className={styles.relatedBlogsGrid}>
                  {relatedPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className={styles.blogPostCard}
                      id={`aozs-related-blog-${post.slug}`}
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

        {/* ── REVIEWS ──────────────────────────────────────────────── */}
        <section className={styles.reviews}>
          <div className={styles.container}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
              KLANTBEOORDELINGEN
            </p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              Wat Klanten Zeggen over Auto Openen Zonder Sleutel
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
              {generateContextualReviews('auto openen', 'service').map((review, i) => (
                <GoogleReviewCard key={i} review={review} />
              ))}
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
