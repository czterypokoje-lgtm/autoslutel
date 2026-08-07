import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import GoogleReviewCard from '@/components/GoogleReviewCard/GoogleReviewCard';
import { generateContextualReviews } from '@/utils/reviews';
import KentekenForm from '@/components/KentekenForm/KentekenForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: {
    absolute: 'Autosleutel Bestellen op Kenteken? | Direct Prijs & Hulp op Locatie',
  },
  description: 'Geen technisch gedoe! App uw kenteken naar Autosleutel24 en ontvang direct een vaste prijs. Wij komen op locatie in de Randstad. Inclusief 12 maanden garantie.',
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

  const trustItems = [
    '24/7 Beschikbaar',
    'Gemiddelde beoordeling 4.9/5',
    '100% Mobiele Service',
    '12 Maanden Garantie',
    'KVK Geregistreerd',
    'Verzekerd & Gecertificeerd'
  ];

  const whatsappMsg = "Hallo, wat kost een nieuwe sleutel voor mijn auto? Mijn kenteken is: ";
  const customWhatsAppUrl = `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <>
      <Script id="kenteken-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id="kenteken-bc-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span> <span>Autosleutel Bestellen op Kenteken</span>
            </nav>
            <h1>Autosleutel Bestellen op Kenteken: Binnen 1 Minuut de Exacte Prijs</h1>
            <p className={styles.heroLead}>
              Heeft u een nieuwe autosleutel, reservesleutel of smart key nodig, maar weet u niet precies welk type transponder, frequentie of sleutelprofiel uw auto gebruikt? Geen enkel probleem. Bij {SITE_CONFIG.name} maken we het u graag makkelijk. U kunt bij ons eenvoudig uw autosleutel bestellen op kenteken. Aan de hand van uw kenteken kunnen wij in onze dealerkaliber database exact zien welke sleutel bij uw voertuig hoort. U hoeft niets uit te zoeken, wij regelen alles en komen direct naar uw locatie!
            </p>
            <div className={styles.heroCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id="kb-hero-phone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                Bel: {SITE_CONFIG.phone}
              </a>
              <a href={customWhatsAppUrl} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id="kb-hero-wa">WhatsApp Kenteken</a>
              <Link href="/contact" className={styles.btnOutline} id="kb-hero-form">Direct Offerte</Link>
            </div>
          </div>
        </section>

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

                <KentekenForm />
                
                {/* Section 1 - How it works */}
                <div>
                  <h2>📱 Hoe Werkt Het? (Snel & Zonder Gedoe)</h2>
                  <ol className={styles.stepList}>
                    <li className={styles.stepItem}>
                      <span className={styles.stepNum}>1</span>
                      <div className={styles.stepText}>
                        <strong>Nummer opslaan of klikken</strong>
                        Sla ons nummer op of klik op de WhatsApp knop: <strong>{SITE_CONFIG.phone}</strong>
                      </div>
                    </li>
                    <li className={styles.stepItem}>
                      <span className={styles.stepNum}>2</span>
                      <div className={styles.stepText}>
                        <strong>Stuur een appje</strong>
                        Stuur een appje met uw kenteken (en eventueel een foto van uw huidige sleutel).
                      </div>
                    </li>
                    <li className={styles.stepItem}>
                      <span className={styles.stepNum}>3</span>
                      <div className={styles.stepText}>
                        <strong>Direct vaste prijsopgave</strong>
                        Wij kijken in onze database en sturen u direct een vaste, scherpe prijsopgave. Geen verborgen kosten!
                      </div>
                    </li>
                    <li className={styles.stepItem}>
                      <span className={styles.stepNum}>4</span>
                      <div className={styles.stepText}>
                        <strong>Wij komen naar u toe</strong>
                        Akkoord? Wij komen met onze mobiele servicebus naar uw locatie om de sleutel direct te frezen en in te leren.
                      </div>
                    </li>
                  </ol>
                  
                  <div style={{ marginTop: '2rem', marginBottom: '3rem' }}>
                    <a href={customWhatsAppUrl} target="_blank" rel="noopener noreferrer" style={{
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
                    src="/autosleutel_kenteken_1_1785882845475.jpg" 
                    alt="Autosleutel bestellen op kenteken via WhatsApp - direct prijs" 
                    style={{ borderRadius: '12px', width: '100%', height: 'auto' }}
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
                  <a href={customWhatsAppUrl} target="_blank" rel="noopener noreferrer" className={styles.sideWa} id="kb-side-wa">WhatsApp Direct</a>
                  <div className={styles.sideList}>
                    {['Geen sleepkosten', 'Vaste prijs vooraf', 'Geen NAW gegevens nodig', '12 maanden garantie', 'Direct antwoord'].map(item => (
                      <div key={item} className={styles.sideListItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{color:'#22c55e',flexShrink:0}} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.ratingCard}>
                  <div className={styles.ratingStars}>★★★★★</div>
                  <p className={styles.ratingText}>&ldquo;Super handig dit! Kenteken ge-appt, direct een prijs gekregen. De volgende ochtend stonden ze al voor de deur om de sleutel te programmeren. Aanrader!&rdquo;</p>
                  <span className={styles.ratingMeta}>Bas V. — Volkswagen Golf</span>
                  <span className={styles.ratingCount}>{SITE_CONFIG.reviewCount} Google beoordelingen · {SITE_CONFIG.rating}/5</span>
                </div>
              </aside>
            </div>

            {/* Bottom CTA block */}
            <div className={styles.ctaBlock}>
              <h2>Weet U De Prijs Nog Niet? Vraag Het Direct Op!</h2>
              <p>Stuur simpelweg uw kenteken via WhatsApp en wij zoeken direct in onze database de exacte prijs op voor een nieuwe sleutel.</p>
              <div className={styles.ctaBtnsGrid}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPrimary} id="kb-bottom-phone">Bel: {SITE_CONFIG.phone}</a>
                <a href={customWhatsAppUrl} target="_blank" rel="noopener noreferrer" className={styles.btnWhatsapp} id="kb-bottom-wa">Stuur Kenteken via WhatsApp</a>
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
              {generateContextualReviews('autosleutel', 'service').map((review, i) => (
                <GoogleReviewCard key={i} review={review} />
              ))}
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
