import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { getRelatedBlogPosts } from '@/config/services';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import GoogleReviewCard, { SHARED_GOOGLE_REVIEWS } from '@/components/GoogleReviewCard/GoogleReviewCard';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Auto Slotenmaker | 24/7 Mobiel & Schadevrij | Autosleutel24',
  description: 'Spoed auto slotenmaker nodig? Wij openen uw auto 100% schadevrij en maken direct een nieuwe sleutel ter plaatse. Vaste prijzen vanaf €75. Bel nu 24/7.',
  alternates: { canonical: `${SITE_CONFIG.domain}/diensten/auto-slotenmaker` },
};

export default function AutoSlotenmakerPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Auto Slotenmaker",
    "provider": {
      "@type": "Locksmith",
      "name": "Autosleutel24",
      "telephone": SITE_CONFIG.phoneTel,
      "url": SITE_CONFIG.domain
    },
    "areaServed": {
      "@type": "State",
      "name": "Utrecht"
    },
    "serviceType": "Auto slotenmaker, autodeur openen, autoslot reparatie, reservesleutel bijmaken",
    "priceRange": "€€",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Auto Slotenmaker Diensten",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Autodeur Schadevrij Openen",
            "description": "Auto openen zonder sleutel bij buitensluiting"
          },
          "price": "95",
          "priceCurrency": "EUR"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Autoslot Reparatie",
            "description": "Deurslot of contactslot repareren na inbraakschade of slijtage"
          },
          "price": "120",
          "priceCurrency": "EUR"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Nieuwe Autosleutel Maken",
            "description": "Autosleutel ter plaatse frezen en programmeren"
          },
          "price": "149",
          "priceCurrency": "EUR"
        }
      ]
    }
  };

  const trustItems = [
    '24/7 Spoedservice',
    'Binnen 30 min ter plaatse',
    'Schadevrij openen',
    'Direct nieuwe sleutel',
    'Vaste prijzen vooraf',
    'Gecertificeerde monteurs'
  ];

  const faqItems = [
    {
      q: 'Hoe vind ik een betrouwbare auto slotenmaker in de buurt?',
      a: 'Een betrouwbare autoslotenmaker werkt met vaste all-in tarieven die vooraf worden gecommuniceerd, en is gecertificeerd. Autosleutel24 is volledig mobiel actief in de regio Utrecht, Amsterdam, Almere, Amersfoort en Hilversum. Wij zijn binnen 30 tot 45 minuten op uw locatie met een compleet uitgeruste servicebus.'
    },
    {
      q: 'Wat kost een auto slotenmaker voor het openen van mijn auto?',
      a: 'Bij Autosleutel24 kost het schadevrij openen van uw autodeur bij een buitensluiting gemiddeld tussen de €95 en €125 (inclusief btw en voorrijkosten). Wij hanteren een vaste prijsgarantie: het tarief dat vooraf telefonisch of via WhatsApp is afgesproken, is de uiteindelijke prijs.'
    },
    {
      q: 'Kan een auto slotenmaker ook een nieuwe sleutel maken als ik alles kwijt ben?',
      a: 'Ja, absoluut. In tegenstelling tot reguliere slotenmakers die alleen sloten openen, beschikken onze auto slotenmakers over geavanceerde diagnoseapparatuur. Wij decoderen het slot mechanisch om een sleutelbaard te slijpen en programmeren de transponder direct in de computer van uw auto.'
    },
    {
      q: 'Wordt de auto slotenmaker gedekt door mijn verzekering?',
      a: 'In veel gevallen wel. Indien u WA+ (Beperkt Casco) of All-risk verzekerd bent en er sprake is van diefstal of inbraakschade aan uw autosloten, vergoeden verzekeraars de kosten. U ontvangt van ons altijd een officiële factuur met btw en specificatie voor uw verzekeringsmaatschappij.'
    },
    {
      q: 'Wat is het verschil tussen Autosleutel24 en de autodealer?',
      a: 'De autodealer vereist dat u uw auto laat wegslepen naar hun werkplaats en hanteert vaak leertijden van enkele dagen tot weken voor een nieuwe sleutel. Autosleutel24 komt naar u toe en regelt alles direct ter plaatse binnen 30-45 minuten, tegen een tarief dat tot wel 50% lager ligt dan bij de merkdealer.'
    }
  ];

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

  const steps = [
    {
      num: 1,
      title: 'Neem contact op',
      desc: 'Bel of stuur een WhatsApp-bericht. Geef uw automerk, model en exacte locatie door. U ontvangt direct een vaste all-in prijsopgave.'
    },
    {
      num: 2,
      title: 'Monteur onderweg',
      desc: 'Onze mobiele auto slotenmaker vertrekt direct naar uw locatie. Binnen 30-45 minuten is de bus bij u ter plaatse.'
    },
    {
      num: 3,
      title: 'Schadevrije opening',
      desc: 'Met behulp van Lishi lockpicks en specialistisch gereedschap openen we de autodeur of kofferbak 100% schadevrij.'
    },
    {
      num: 4,
      title: 'Direct weer op weg',
      desc: 'Indien nodig repareren we uw slot of programmeren we direct een nieuwe sleutel. U betaalt veilig per pin of contant.'
    }
  ];

  const relatedPosts = getRelatedBlogPosts('auto-beveiliging');

  return (
    <>
      <Script id="auto-slotenmaker-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id="auto-slotenmaker-faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }} />
      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span> <Link href="/diensten">Diensten</Link> <span>/</span> <span>Auto Slotenmaker</span>
            </nav>
            <h1>24/7 Mobiele Auto Slotenmaker — Snel &amp; Schadevrij op Locatie</h1>
            <p className={styles.heroLead}>
              Bent u buitengesloten van uw auto, sleutel in de auto laten liggen, of heeft u inbraakschade aan uw deurslot? 
              Als gecertificeerde auto slotenmaker openen wij uw auto 100% schadevrij en programmeren we direct ter plaatse nieuwe reservesleutels. 
              Onze mobiele servicebussen rijden direct uit in regio Utrecht, Amsterdam, Almere, Amersfoort en Hilversum.
            </p>
            <div className={styles.heroCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id="asm-hero-phone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                Bel Spoedhulp: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id="asm-hero-wa">WhatsApp Spoed</a>
              <Link href="/contact" className={styles.btnOutline} id="asm-hero-form">Offerte Aanvragen</Link>
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
                
                {/* Section 1 */}
                <div>
                  <h2>Wanneer Heeft U een Auto Slotenmaker Nodig?</h2>
                  <p>
                    Een buitensluiting of defect autoslot komt altijd ongelegen. Gelukkig hoeft u uw auto niet te laten wegslepen. Onze gespecialiseerde automotive slotenmaker komt direct naar u toe voor de volgende problemen:
                  </p>
                  <ul className={styles.bulletList}>
                    <li><strong>Sleutel in dichte auto vergeten:</strong> Uw deuren zijn in het slot gevallen terwijl de sleutel nog in het contact of de kofferbak ligt. Wij openen uw auto volledig schadevrij.</li>
                    <li><strong>Autosleutel kwijt of gestolen:</strong> Als u al uw sleutels verloren bent, maken en programmeren wij ter plekke een nieuwe werkende sleutel. De oude sleutel programmeren we direct uit de startonderbreker.</li>
                    <li><strong>Afgebroken autosleutel:</strong> Uw sleutelbaard is afgebroken in de deur of het contactslot. Wij verwijderen het fragment en slijpen ter plekke een nieuwe sleutel.</li>
                    <li><strong>Vastgelopen of defect contactslot:</strong> De sleutel draait niet meer om in het contactslot. Wij demonteren en reviseren uw contactslot direct op locatie.</li>
                  </ul>
                </div>

                {/* Section 2 */}
                <div>
                  <h2>Tarieven Auto Slotenmaker — Eerlijk &amp; Transparant</h2>
                  <div className={styles.tableWrapper}>
                    <table className={styles.pricingTable}>
                      <thead>
                        <tr>
                          <th>Dienst</th>
                          <th>Toelichting</th>
                          <th>Prijs (Vanaf)</th>
                          <th>Tijdsduur</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Autodeur schadevrij openen</td>
                          <td>Bij buitensluiting, sleutel in auto</td>
                          <td><strong>€95</strong></td>
                          <td>10-15 min</td>
                        </tr>
                        <tr>
                          <td>Nieuwe reservesleutel maken</td>
                          <td>Inclusief programmeren transponder</td>
                          <td><strong>€149</strong></td>
                          <td>20-30 min</td>
                        </tr>
                        <tr>
                          <td>Alle sleutels kwijt (All Keys Lost)</td>
                          <td>Genereren van een nieuwe sleutelbaard</td>
                          <td><strong>€190</strong></td>
                          <td>30-45 min</td>
                        </tr>
                        <tr>
                          <td>Contactslot / Deurslot reparatie</td>
                          <td>Demonteren, reviseren en reinigen</td>
                          <td><strong>€120</strong></td>
                          <td>45 min</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.callout}>
                    <strong>Geen Verborgen Kosten:</strong> In tegenstelling tot schimmige slotenmakersdiensten die met loktarieven werken en achteraf honderden euro's rekenen, krijgt u bij ons vooraf telefonisch of via WhatsApp een vaste all-in prijsopgave inclusief btw en voorrijkosten.
                  </div>
                </div>

                {/* Section 2.5: Onze Service Galerij */}
                <div>
                  <h2>Onze Auto Slotenmakersdienst aan het Werk — Galerij</h2>
                  <p>
                    Wij zijn trots op ons vakmanschap. Hieronder ziet u een greep uit onze recente werkzaamheden, van het schadevrij openen van deuren tot complexe transponderreparaties:
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem',
                    margin: '1.5rem 0'
                  }}>
                    <img 
                      src="/images/seo/auto_deur_openen_slotenmaker_utrecht_schadevrij.webp" 
                      alt="Auto slotenmaker Utrecht - schadevrij openen van autodeur bij buitensluiting" 
                      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                    />
                    <img 
                      src="/images/seo/contactslot-reparatie-mobiel-amsterdam.webp" 
                      alt="Auto slotenmaker Amsterdam - mobiele revisie en herstel van vastgelopen contactslot" 
                      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                    />
                    <img 
                      src="/images/seo/autosleutels-repareren-werkplaats-utrecht.webp" 
                      alt="Auto slotenmaker werkplaats Utrecht - elektronische printplaat reparaties en transponder programmeren" 
                      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                    />
                    <img 
                      src="/images/seo/autosleutel-bijmaken-porsche.webp" 
                      alt="Auto slotenmaker Almere - inleren van nieuwe smart key voor Porsche ter plaatse" 
                      style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', objectFit: 'cover', aspectRatio: '4/3' }} 
                    />
                  </div>
                </div>

                {/* Section 3 */}
                <div>
                  <h2>Hoe Werkt Onze Auto Slotenmakers Spoedservice?</h2>
                  <div className={styles.stepsWrapper}>
                    {steps.map((step, idx) => (
                      <div key={idx} className={styles.stepCard}>
                        <div className={styles.stepHeader}>
                          <span className={styles.stepBadge}>{step.num}</span>
                          <h3>{step.title}</h3>
                        </div>
                        <p>{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 4 */}
                <div>
                  <h2>Waarom Kiezen voor Autosleutel24 als Uw Auto Slotenmaker?</h2>
                  <p>
                    Wanneer u met pech staat, wilt u snel, betrouwbaar en zonder extra rompslomp geholpen worden. Autosleutel24 biedt grote voordelen ten opzichte van reguliere garages of autodealers:
                  </p>
                  <ul className={styles.bulletList}>
                    <li><strong>100% Mobiele Service:</strong> U hoeft uw auto niet te laten wegslepen naar een dealer. Wij komen met onze mobiele bus naar uw huis, werk, of langs de snelweg.</li>
                    <li><strong>Schadevrij Openen:</strong> Dankzij geavanceerd Lishi lockpick-gereedschap manipuleren wij het deurslot via de cilinder. Dit laat geen enkele kras of schade achter op uw lak of de rubbers.</li>
                    <li><strong>Direct Nieuwe Sleutels Slijpen:</strong> Onze servicebussen zijn uitgerust met computergestuurde CNC-lasersleutelmachines en inleersoftware om direct een nieuwe sleutel te programmeren.</li>
                    <li><strong>Beschikbaar in Heel Midden-Nederland:</strong> Wij rijden snel uit in Utrecht, Amsterdam, Almere, Amersfoort en Hilversum. Gemiddeld zijn we binnen 30-45 minuten ter plaatse.</li>
                  </ul>
                </div>

                {/* FAQ Section */}
                <div className={styles.faqSection}>
                  <h2>Veelgestelde Vragen over de Auto Slotenmaker</h2>
                  <div className={styles.faqContainer}>
                    {faqItems.map((item, idx) => (
                      <details key={idx} className={styles.faqDetails}>
                        <summary className={styles.faqSummary}>{item.q}</summary>
                        <p className={styles.faqAnswer}>{item.a}</p>
                      </details>
                    ))}
                  </div>
                </div>

              </div>

              {/* Sidebar */}
              <aside className={styles.sidebar}>
                <div className={styles.sidebarBox}>
                  <h3>Spoed Auto Slotenmaker</h3>
                  <p>Direct contact met onze monteur op locatie:</p>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.sidebarBtnCall} id="asm-sidebar-phone">
                    Bel: {SITE_CONFIG.phone}
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.sidebarBtnWa} id="asm-sidebar-wa">
                    WhatsApp Sturen
                  </a>
                </div>

                <div className={styles.sidebarBox}>
                  <h3>Garanties &amp; Zekerheden</h3>
                  <ul className={styles.sidebarList}>
                    <li>✓ 24/7 Bereikbaar</li>
                    <li>✓ Geen Sleepkosten</li>
                    <li>✓ 12 Maanden Garantie</li>
                    <li>✓ Vaste Prijsvooraf</li>
                    <li>✓ PIN/Tikkie Betaling</li>
                  </ul>
                </div>

                {/* Real Google Reviews */}
                <div className={styles.sidebarBox}>
                  <h3>Wat Klanten Zeggen</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {SHARED_GOOGLE_REVIEWS.slice(0, 2).map((rev, idx) => (
                      <GoogleReviewCard key={idx} {...rev} />
                    ))}
                  </div>
                </div>

                {/* Related Blog Posts */}
                {relatedPosts.length > 0 && (
                  <div className={styles.sidebarBox}>
                    <h3>Gerelateerde Artikelen</h3>
                    <ul className={styles.relatedPostsList}>
                      {relatedPosts.slice(0, 3).map((post, idx) => (
                        <li key={idx}>
                          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>

            </div>
          </div>
        </section>

        {/* Bottom Call Strip */}
        <section className={styles.bottomStrip}>
          <div className={styles.bottomStripInner}>
            <h2>Buitengesloten of Autosleutel Kwijt? Wij Helpen Direct!</h2>
            <p>Geen verborgen toeslagen, 100% betrouwbare en gecertificeerde service.</p>
            <div className={styles.bottomCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id="asm-bottom-phone">
                Bel Spoedhulp
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id="asm-bottom-wa">
                WhatsApp Direct
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
