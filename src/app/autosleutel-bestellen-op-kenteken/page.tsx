import type { Metadata } from 'next';
import Link from 'next/link';
import GoogleReviewsCta from '@/components/GoogleReviewsCta/GoogleReviewsCta';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import HorizontalKentekenForm from '@/components/KentekenForm/HorizontalKentekenForm';
import BrandsMarquee from '@/components/BrandsMarquee/BrandsMarquee';
import HeroTrustBadge from '@/components/HeroTrustBadge/HeroTrustBadge';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: {
    absolute: 'Autosleutel Bestellen op Kenteken? | Direct Prijs & Hulp op Locatie',
  },
  description: 'Wilt u een autosleutel bestellen op kenteken? Geen technisch gedoe! App uw kenteken naar Autosleutel24 en ontvang direct een vaste prijs. Wij komen op locatie in de Randstad.',
  alternates: { canonical: `${SITE_CONFIG.domain}/autosleutel-bestellen-op-kenteken` },
};

export default function KentekenBestellenPage() {
  const faqItems = [
    { q: 'Hoe snel heb ik een prijs als ik mijn kenteken doorstuur?', a: 'Tijdens onze openingstijden reageren wij via WhatsApp of telefoon vrijwel direct (vaak al binnen 5 tot 10 minuten). U weet direct waar u aan toe bent.' },
    { q: 'Maken jullie sleutels voor alle automerken?', a: 'Ja! Omdat we op kenteken zoeken, kunnen we voor vrijwel elk merk een sleutel leveren en inleren. Of het nu gaat om een Volkswagen, BMW, Ford, Renault, of zelfs Amerikaanse merken zoals Jeep en Dodge. Ook voor moderne Keyless Go (smart keys) bent u bij ons aan het juiste adres.' },
    { q: 'Moet ik vooraf betalen?', a: 'Nee, bij Autosleutel24 betaalt u nooit vooraf. U betaalt pas op locatie (via Pin of contant) nadat wij de sleutel succesvol hebben ingeleerd en getest op uw auto.' },
    { q: 'Wat als ik al mijn autosleutels kwijt ben? Werkt het dan ook via kenteken?', a: 'Absoluut. Zelfs als u helemaal geen sleutel meer heeft, kunnen wij aan de hand van het kenteken en het chassisnummer (VIN) een compleet nieuwe sleutel "vanaf nul" genereren, frezen en inleren op de boordcomputer van uw auto.' }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Autosleutel Bestellen op Kenteken', item: `${SITE_CONFIG.domain}/autosleutel-bestellen-op-kenteken` },
    ],
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "AutomotiveBusiness",
    "name": SITE_CONFIG.name,
    "description": "Specialist in autosleutels bijmaken, car key duplication en programmeren op locatie.",
    "url": `${SITE_CONFIG.domain}/autosleutel-bestellen-op-kenteken`,
    "telephone": SITE_CONFIG.phone,
    "image": `${SITE_CONFIG.domain}/images/autosleutel-bestellen-op-kenteken.webp`,
    "knowsAbout": ["Autosleutel bijmaken", "Car key duplication", "Autosleutel programmeren", "Sleutel kwijt"]
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Hoe bestel ik een autosleutel op kenteken?",
    "description": "Ontvang binnen 1 minuut de exacte prijs voor uw autosleutel via WhatsApp door deze 3 simpele stappen te volgen.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Stap 1: Wat is uw kenteken?",
        "text": "Vul uw kenteken in. Hiermee zoeken we de exacte technische gegevens van uw auto op in onze database.",
        "url": `${SITE_CONFIG.domain}/autosleutel-bestellen-op-kenteken#offerte-form`
      },
      {
        "@type": "HowToStep",
        "name": "Stap 2: Wat is de situatie?",
        "text": "Geef aan of u een extra reservesleutel wilt of dat u al uw autosleutels kwijt bent.",
        "url": `${SITE_CONFIG.domain}/autosleutel-bestellen-op-kenteken#offerte-form`
      },
      {
        "@type": "HowToStep",
        "name": "Stap 3: Waar staat de auto?",
        "text": "Vul in waar uw auto momenteel staat en vraag direct de offerte aan via WhatsApp.",
        "url": `${SITE_CONFIG.domain}/autosleutel-bestellen-op-kenteken#offerte-form`
      }
    ]
  };

  const trustItems = [
    '24/7 Beschikbaar',
    'Gemiddelde beoordeling 5.0/5',
    '100% Mobiele Service',
    '12 Maanden Garantie',
    'Verzekerd & Gecertificeerd'
  ];

  const whatsappMsg = "Hallo, wat kost een nieuwe sleutel voor mijn auto? Mijn kenteken is: ";
  const customWhatsAppUrl = `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <>
      <script id="kenteken-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script id="kenteken-bc-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script id="kenteken-business-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script id="kenteken-howto-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <main>
        {/* ── TIMPSON STYLE HERO ── */}
        <section style={{ backgroundColor: '#2563eb', padding: '4rem 2rem 5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb" style={{ marginBottom: '2rem', color: '#fff', opacity: 0.9 }}>
              <Link href="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link> 
              <span style={{ margin: '0 0.5rem' }}>/</span> 
              <span style={{ fontWeight: 600 }}>Autosleutel Bestellen op Kenteken</span>
            </nav>
            <div style={{ marginBottom: '1.25rem', marginTop: '0.25rem' }}>
              <HeroTrustBadge />
            </div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1 }}>
              Autosleutel Bestellen op Kenteken
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.25rem', marginBottom: '2.5rem', fontWeight: 500 }}>
              Binnen 1 minuut de exacte prijs. Geen technisch gedoe!
            </p>

            <HorizontalKentekenForm />

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
              <span style={{ fontSize: '1.1rem' }}>Uitstekend</span>
              <div style={{ display: 'flex', gap: '2px', backgroundColor: '#00b67a', padding: '2px 4px', borderRadius: '2px' }}>
                <span style={{ color: '#fff' }}>★</span><span style={{ color: '#fff' }}>★</span><span style={{ color: '#fff' }}>★</span><span style={{ color: '#fff' }}>★</span><span style={{ color: '#fff' }}>★</span>
              </div>
              
            </div>
          </div>
        </section>

        <BrandsMarquee />

        {/* Trust Bar */}
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

        {/* Content Section */}
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.contentGrid}>
              <div className={styles.mainContent}>
                
                {/* Intro Text moved here */}
                <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.7, marginBottom: '2rem' }}>
                  Heeft u met spoed een nieuwe autosleutel nodig, of wilt u een extra sleutel laten maken, maar weet u niet precies welk type sleutel, frequentie of sleutelprofiel uw auto gebruikt? Geen enkel probleem. Bij {SITE_CONFIG.name} kunt u eenvoudig uw autosleutel bestellen op kenteken. Wij regelen alles en komen direct naar uw locatie!
                </p>
                {/* Section 1 - How it works */}

                  
                  <div style={{ marginTop: '2rem', marginBottom: '3rem' }}>
                    <a href={customWhatsAppUrl} target="_blank" rel="noopener noreferrer nofollow" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      backgroundColor: '#25D366',
                      color: '#fff',
                      padding: '1.25rem 2rem',
                      borderRadius: '8px',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      width: '100%',
                      textAlign: 'center'
                    }}>
                      💬 Stuur direct uw kenteken via WhatsApp
                    </a>
                  </div>

                {/* Section 2 - Dealer vs Autosleutel24 */}
                <div>
                  <h2>Waarom Kiezen Voor {SITE_CONFIG.name} in plaats van de Dealer?</h2>
                  <p>
                    Veel mensen denken bij een verloren of defecte autosleutel direct aan de officiële merkdealer. Maar wist u dat dit vaak onnodig duur is en veel tijd kost?
                  </p>
                  <div className={styles.tableWrapper}>
                    <table className={styles.pricingTable}>
                      <thead>
                        <tr>
                          <th>Wat u verwacht</th>
                          <th>De Merkdealer ❌</th>
                          <th>{SITE_CONFIG.name} ✅</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Locatie</strong></td>
                          <td>U moet de auto (laten) wegslepen naar de garage.</td>
                          <td><strong>Wij komen met onze servicebus naar ú toe.</strong></td>
                        </tr>
                        <tr>
                          <td><strong>Snelheid</strong></td>
                          <td>Vaak 1 tot 2 weken wachttijd op de nieuwe sleutel.</td>
                          <td><strong>Meestal dezelfde dag of direct de volgende dag geregeld.</strong></td>
                        </tr>
                        <tr>
                          <td><strong>Prijs</strong></td>
                          <td>Hoofdprijzen plus verborgen inleerkosten.</td>
                          <td><strong>Tot 50% goedkoper met een transparante, vaste prijs vooraf.</strong></td>
                        </tr>
                        <tr>
                          <td><strong>Garantie</strong></td>
                          <td>Standaard fabrieksgarantie.</td>
                          <td><strong>12 maanden garantie én een officiële BTW-factuur.</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3 - Privacy */}
                <div>
                  <h2>Veilig & Vertrouwd: Wat doen wij met uw kenteken?</h2>
                  <p>
                    Privacy en veiligheid staan bij ons voorop. Wanneer u uw kenteken aan ons doorgeeft, gebruiken wij dit uitsluitend om technische voertuiggegevens op te vragen (zoals het bouwjaar, model en type startonderbreker/immobilizer).
                  </p>
                  <p>
                    <strong>Wij hebben geen inzicht in uw persoonlijke gegevens, NAW-gegevens of verzekeringsdetails.</strong> U loopt dus geen enkel risico.
                  </p>
                </div>

                <div style={{ marginTop: '3rem', marginBottom: '3rem', textAlign: 'center' }}>
                  <img 
                    src="/images/autosleutel-bestellen-op-kenteken.webp" 
                    alt="Autosleutel bestellen op kenteken via WhatsApp - direct prijs" 
                    style={{ borderRadius: '12px', width: '100%', height: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                </div>

                {/* Section 4 - FAQ */}
                <div>
                  <h2>💡 Veelgestelde Vragen (FAQ)</h2>
                  
                  {faqItems.map((f, i) => (
                    <details key={i} className={styles.faqItem}>
                      <summary className={styles.faqQuestion}>
                        {f.q}
                        <span className={styles.faqChevron}>+</span>
                      </summary>
                      <p className={styles.faqAnswer}>{f.a}</p>
                    </details>
                  ))}
                </div>

              </div>

              {/* Sidebar */}
              <aside className={styles.sidebar}>
                <div className={styles.sideCard}>
                  <h3>Direct Prijs Aanvragen?</h3>
                  <p>Stuur een appje met uw kenteken. Wij zijn 24/7 bereikbaar en reageren supersnel.</p>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.sidePhone} id="kb-side-phone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                    Bel: {SITE_CONFIG.phone}
                  </a>
                  <a href="#offerte-form" className={styles.sideWa} id="kb-side-wa">WhatsApp Direct</a>
                  <div className={styles.sideList}>
                    {['Geen sleepkosten', 'Vaste prijs vooraf', 'Geen NAW gegevens nodig', '12 maanden garantie', 'Direct antwoord'].map(item => (
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
              <h2>Weet U De Prijs Nog Niet? Vraag Het Direct Op!</h2>
              <p>Stuur simpelweg uw kenteken via WhatsApp en wij zoeken direct in onze database de exacte prijs op voor een nieuwe sleutel.</p>
              <div className={styles.ctaBtnsGrid}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPrimary} id="kb-bottom-phone">Bel: {SITE_CONFIG.phone}</a>
                <a href="#offerte-form" className={styles.btnWhatsapp} id="kb-bottom-wa">Stuur Kenteken via WhatsApp</a>
              </div>
              <span className={styles.microText}>Binnen 5 tot 10 minuten reactie (tijdens openingstijden)</span>
            </div>

          </div>
        </section>

        {/* ── REVIEWS SECTION ────────────────────────────────────── */}
        <section className={styles.reviews}>
          <div className={styles.container}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
              KLANTBEOORDELINGEN
            </p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              Wat Klanten Zeggen Over Onze Service
            </h2>
            <GoogleReviewsCta />
          </div>
        </section>

      </main>
    </>
  );
}
