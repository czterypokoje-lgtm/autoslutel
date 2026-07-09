import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { getRelatedBlogPosts } from '@/config/services';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import GoogleReviewCard, { SHARED_GOOGLE_REVIEWS } from '@/components/GoogleReviewCard/GoogleReviewCard';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Auto Slotenmaker | 24/7 Mobiel & Schadevrij | Autosleutel24',
  description: 'Spoed auto slotenmaker nodig? Wij openen uw auto 100% schadevrij en maken direct een nieuwe sleutel ter plaatse. Vaste prijzen vanaf €95. Bel nu 24/7.',
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
      q: 'What is het verschil tussen Autosleutel24 en de autodealer?',
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
                    <li><strong>Sleutel in dichte auto vergeten:</strong> Uw deuren zijn in het slot fallen terwijl de sleutel nog in het contact of de kofferbak ligt. Wij openen uw auto volledig schadevrij.</li>
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
                  <h2>Hoe Werkt het Auto Slotenmaker Proces?</h2>
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
                <div>
                  <h2>Veelgestelde Vragen over de Auto Slotenmaker</h2>
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

              {/* Sidebar */}
              <aside className={styles.sidebar}>
                <div className={styles.sideCard}>
                  <h3>Direct Hulp Nodig?</h3>
                  <p>Bel of WhatsApp ons. Wij zijn 24/7 bereikbaar en gemiddeld binnen 30 minuten bij u.</p>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.sidePhone} id="asm-sidebar-phone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                    Bel: {SITE_CONFIG.phone}
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.sideWa} id="asm-sidebar-wa">WhatsApp Direct</a>
                  <div className={styles.sideList}>
                    {['Geen sleepkosten', 'Vaste prijs vooraf', 'Verzekeringsklare factuur', '12 maanden garantie', '24/7 beschikbaar'].map(item => (
                      <div key={item} className={styles.sideListItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{color:'#22c55e',flexShrink:0}} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.ratingCard}>
                  <div className={styles.ratingStars}>★★★★★</div>
                  <p className={styles.ratingText}>&ldquo;Mijn sleutels lagen nog in de kofferbak en de auto zat op slot. Autosleutel24 was binnen 30 min ter plaatse en opende de kofferbak 100% schadevrij. Super betrouwbare auto slotenmaker!&rdquo;</p>
                  <span className={styles.ratingMeta}>Daan K. — Volkswagen Golf, Utrecht</span>
                  <span className={styles.ratingCount}>{SITE_CONFIG.reviewCount} Google beoordelingen · {SITE_CONFIG.rating}/5</span>
                </div>
              </aside>

            </div>

            {/* Bottom CTA block */}
            <div className={styles.ctaBlock}>
              <h2>Auto Slotenmaker Nodig? Bel Direct</h2>
              <p>Onze mobiele specialist staat binnen 30 min bij u ter plaatse. Vaste prijs, geen verrassingen.</p>
              <div className={styles.ctaBtnsGrid}>
                <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPrimary} id="asm-bottom-phone">Bel: {SITE_CONFIG.phone}</a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWhatsapp} id="asm-bottom-wa">WhatsApp Direct</a>
              </div>
              <span className={styles.microText}>24/7 beschikbaar — ook &apos;s nachts en in het weekend</span>
            </div>

          </div>
        </section>

        {/* ── RELATED BLOGS SECTION ────────────────────────────────── */}
        {(() => {
          const relatedPosts = getRelatedBlogPosts('auto-beveiliging');
          if (!relatedPosts || relatedPosts.length === 0) return null;
          return (
            <section className={styles.relatedBlogsSection}>
              <div className={styles.relatedBlogsContainer}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#f97316', marginBottom: '0.5rem' }}>
                  GERELATEERDE KENNIS &amp; ADVIES
                </p>
                <h2 className={styles.relatedBlogsTitle}>
                  Handige artikelen over Auto Slotenmaker &amp; Beveiliging
                </h2>
                <div className={styles.relatedBlogsGrid}>
                  {relatedPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className={styles.blogPostCard}
                      id={`asm-related-blog-${post.slug}`}
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
              Wat Klanten Zeggen over de Auto Slotenmaker
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
              {SHARED_GOOGLE_REVIEWS.map((review, i) => (
                <GoogleReviewCard key={i} review={review} />
              ))}
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
