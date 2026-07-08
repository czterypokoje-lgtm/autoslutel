import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { getRelatedBlogPosts } from '@/config/services';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import GoogleReviewCard, { SHARED_GOOGLE_REVIEWS } from '@/components/GoogleReviewCard/GoogleReviewCard';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Sleutel Bijmaken Ter Plaatse — Vaste Prijs | Autosleutel24',
  description: 'Autosleutel bijmaken door onze mobiele specialist. Reserve sleutel + programmering ter plaatse. Vaste prijs vanaf €95. 24/7. Bel 06 11 75 12 31.',
  alternates: { canonical: `${SITE_CONFIG.domain}/diensten/sleutel-bijmaken` },
};

export default function SleutelBijmakenPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Autosleutel Bijmaken",
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
    "serviceType": "Autosleutel bijmaken, transponder programmeren, smart key inleren",
    "priceRange": "€€",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Sleutel Bijmaken Diensten",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Standaard Sleutel Bijmaken",
            "description": "Reserve sleutel voor oudere modellen zonder chip"
          },
          "price": "95",
          "priceCurrency": "EUR"
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Transponder Sleutel Bijmaken",
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

  const trustItems = [
    '24/7 Beschikbaar',
    'Binnen 30 min in Utrecht',
    'Vaste prijs vanaf €95',
    '12 maanden garantie',
    'KVK Geregistreerd',
    'Verzekerd & Gecertificeerd'
  ];

  const reviews = [
    {
      text: "Geweldige service! Ik had binnen een half uur een nieuwe reservesleutel voor mijn Volkswagen Polo. De monteur was erg vriendelijk en kwam gewoon bij mij thuis in Utrecht langs.",
      name: "Marc van den Berg",
      city: "Utrecht",
      car: "Volkswagen Polo"
    },
    {
      text: "Een stuk goedkoper dan de dealer! Mijn sleutel was in het water fallen en deed niks meer. Autosleutel24 heeft ter plekke een nieuwe smart key ingeleerd. Zeer tevreden.",
      name: "Esther de Vries",
      city: "Hilversum",
      car: "BMW 1 Serie"
    },
    {
      text: "Snel, vakkundig en transparant. Geen sleepkosten en ik kon direct weer de weg op. De monteur had alle benodigde apparatuur bij zich in zijn mobiele werkplaats. Top!",
      name: "Koen Hendriks",
      city: "Amersfoort",
      car: "Ford Focus"
    }
  ];

  return (
    <>
      <Script id="sleutel-bijmaken-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span> <Link href="/diensten">Diensten</Link> <span>/</span> <span>Sleutel Bijmaken</span>
            </nav>
            <h1>Autosleutel Bijmaken — Mobiel Ter Plaatse in de Randstad</h1>
            <p className={styles.heroLead}>
              Uw autosleutel bijmaken zonder naar de dealer te hoeven? Autosleutel24 komt naar u toe — thuis, op het werk, 
              of waar u ook gestrand bent. Wij maken en programmeren reserve sleutels voor vrijwel elk merk en model, 
              terwijl u wacht. Geen sleepkosten. Geen afspraak bij de dealer. Geen dagen wachten.
            </p>
            <div className={styles.heroCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id="sb-hero-phone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                Bel: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id="sb-hero-wa">WhatsApp</a>
              <Link href="/contact" className={styles.btnOutline} id="sb-hero-form">Direct Offerte</Link>
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
                  <h2>Wanneer Heeft U een Reserve Sleutel Nodig?</h2>
                  <p>
                    Een reserve sleutel is geen luxe — het is voorkomen van een crisis. Wij maken reserve sleutels voor:
                  </p>
                  <ul className={styles.bulletList}>
                    <li><strong>Preventie:</strong> U heeft één sleutel en wilt een reserve voordat de eerste kwijt raakt of stuk gaat.</li>
                    <li><strong>Autosleutel kwijt:</strong> Uw enige sleutel is verloren. Wij maken een nieuwe op basis van het slot of het immobilizer systeem.</li>
                    <li><strong>Sleutel afgebroken:</strong> De sleutel is gebroken in het contactslot of de deur. Wij extraheren het fragment en maken een vervanger.</li>
                    <li><strong>Sleutel gestolen:</strong> Wij maken een nieuwe sleutel en wissen de oude uit het systeem zodat de gestolen sleutel niet meer werkt.</li>
                    <li><strong>Reserve voor partner/kind:</strong> Twee sleutels zijn het minimum. Wij maken een tweede, third of fourth sleutel tegen een gereduceerd tarief.</li>
                  </ul>
                </div>

                {/* Section 2 */}
                <div>
                  <h2>Wat Kost een Autosleutel Bijmaken? — Transparante Prijzen</h2>
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
                          <td>Standaard sleutel (zonder chip)</td>
                          <td>Oudere modellen tot 1995</td>
                          <td><strong>Vanaf €95</strong></td>
                          <td>15 min</td>
                        </tr>
                        <tr>
                          <td>Transponder sleutel</td>
                          <td>Volkswagen, Opel, Ford, Peugeot</td>
                          <td><strong>Vanaf €149</strong></td>
                          <td>20-30 min</td>
                        </tr>
                        <tr>
                          <td>Smart key / Keyless entry</td>
                          <td>BMW, Mercedes, Audi, Toyota</td>
                          <td><strong>Vanaf €199</strong></td>
                          <td>30-45 min</td>
                        </tr>
                        <tr>
                          <td>Smart key + programming</td>
                          <td>Mercedes FBS4, BMW G-series</td>
                          <td><strong>Vanaf €249</strong></td>
                          <td>45-60 min</td>
                        </tr>
                        <tr>
                          <td>Extra reserve sleutel (2e, 3e, 4e)</td>
                          <td>Alle merken</td>
                          <td><strong>€75 per stuk</strong></td>
                          <td>10 min per sleutel</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className={styles.callout}>
                    <strong>Dealer prijsvergelijking:</strong> Een Mercedes dealer rekent €350-€500 voor een nieuwe sleutel plus €150 inleerkosten. 
                    Wij doen dit ter plaatse voor €249, inclusief programmering.
                  </div>
                </div>

                {/* Section 2.5: Onze Professionele Werkplaats */}
                <div>
                  <h2>Professionele Autosleutel Werkplaats in Utrecht</h2>
                  <p>
                    Naast onze mobiele servicebussen beschikt Autosleutel24 over een volledig uitgeruste, fysieke werkplaats in Utrecht. Hier voeren wij complexe elektronische reparaties uit, zoals het solderen van microcomponenten op printplaten, het programmeren van startonderbrekers (transponders) en het herstellen van contactsloten.
                  </p>
                  <div style={{ margin: '1.5rem 0' }}>
                    <img 
                      src="/autosleutel24-sleutelbijmaken-utrecht.webp" 
                      alt="Autosleutel24 professionele werkplaats in Utrecht uitgerust met CNC sleutel-freesmachines, soldeerstations en programmeerapparatuur" 
                      style={{ width: '100%', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} 
                    />
                  </div>
                  <p>
                    Dankzij onze eigen fysieke werkplaats kunnen we een hoge mate van betrouwbaarheid en snelheid garanderen. U bent van harte welkom voor service op afspraak, of we sturen onze bus naar uw locatie voor directe service ter plaatse.
                  </p>
                </div>

                {/* Section 3 */}
                <div>
                  <h2>Hoe Werkt het Sleutel Bijmaken bij Autosleutel24?</h2>
                  <ol className={styles.stepList}>
                    <li className={styles.stepItem}>
                      <span className={styles.stepNum}>1</span>
                      <div className={styles.stepText}>
                        <strong>Bel of WhatsApp ons</strong>
                        Geef merk, model, bouwjaar en probleem door. Wij geven direct een prijsindicatie.
                      </div>
                    </li>
                    <li className={styles.stepItem}>
                      <span className={styles.stepNum}>2</span>
                      <div className={styles.stepText}>
                        <strong>Monteur komt naar u toe</strong>
                        Binnen 30 min in Utrecht, 45 min in Amersfoort, 60 min in Hilversum.
                      </div>
                    </li>
                    <li className={styles.stepItem}>
                      <span className={styles.stepNum}>3</span>
                      <div className={styles.stepText}>
                        <strong>Sleutel maken ter plaatse</strong>
                        Wij frezen de sleutel, programmeren de transponder, en testen het contactslot.
                      </div>
                    </li>
                    <li className={styles.stepItem}>
                      <span className={styles.stepNum}>4</span>
                      <div className={styles.stepText}>
                        <strong>Testen en garantie</strong>
                        U test de nieuwe sleutel. Wij geven 12 maanden garantie en een verzekeringsklare factuur.
                      </div>
                    </li>
                  </ol>
                </div>

                {/* Section 4 */}
                <div>
                  <h2>Welke Merken Bedienen Wij?</h2>
                  <p>
                    Wij maken en programmeren sleutels voor alle gangbare merken. Onze apparatuur ondersteunt:
                  </p>
                  <ul className={styles.bulletList}>
                    <li><Link href="/merken/volkswagen-autosleutel-bijmaken">Volkswagen</Link> — Golf, Polo, Tiguan, Transporter (MQB platform)</li>
                    <li><Link href="/merken/bmw-autosleutel-bijmaken">BMW</Link> — 1-serie, 3-serie, 5-serie, X3, X5 (CAS3/CAS4/FEM/BDC)</li>
                    <li><Link href="/merken/mercedes-autosleutel-bijmaken">Mercedes-Benz</Link> — A-Klasse, C-Klasse, E-Klasse, Sprinter (EIS/ESL, FBS3/FBS4)</li>
                    <li><Link href="/merken/audi-autosleutel-bijmaken">Audi</Link> — A3, A4, A6, Q5, Q7 (MLB platform)</li>
                    <li><Link href="/merken/ford-autosleutel-bijmaken">Ford</Link> — Focus, Fiesta, Transit, Kuga (PAT2/PAT3/PAT4)</li>
                    <li><Link href="/merken/toyota-autosleutel-bijmaken">Toyota</Link> — Corolla, Yaris, RAV4, Land Cruiser (G-chip/H-chip)</li>
                  </ul>
                  <p>
                    <Link href="/merken" style={{ fontWeight: 700, color: '#f97316' }}>Bekijk alle merken die wij bedienen →</Link>
                  </p>
                </div>

                {/* Section 5 */}
                <div>
                  <h2>Waar Komen Wij voor Sleutel Bijmaken?</h2>
                  <p>
                    Wij zijn mobiel actief in de regio Utrecht en omliggende steden. Populaire locaties:
                  </p>
                  <ul className={styles.bulletList}>
                    <li><Link href="/steden/utrecht">Utrecht</Link> — Centrum, Oudwijk, Wittevrouwen, Vleuten, De Meern (15-25 min)</li>
                    <li><Link href="/steden/amersfoort">Amersfoort</Link> — Centrum, Leusden, Soest (30-35 min)</li>
                    <li><Link href="/steden/utrecht">Zeist</Link> — Villawijken, winkelcentrum (20-25 min)</li>
                    <li><Link href="/steden/hilversum">Hilversum</Link> — Media Park, zakelijke lease (35-40 min)</li>
                    <li><Link href="/steden/utrecht">Nieuwegein</Link> — City Plaza, woonwijken (15-20 min)</li>
                  </ul>
                  <p>
                    <Link href="/steden" style={{ fontWeight: 700, color: '#f97316' }}>Bekijk ons volledige werkgebied →</Link>
                  </p>
                </div>

                {/* Section 6 - FAQ */}
                <div>
                  <h2>Veelgestelde Vragen over Sleutel Bijmaken</h2>

                  <details className={styles.faqItem}>
                    <summary className={styles.faqQuestion}>
                      Kan ik een sleutel bijmaken zonder de originele?
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
                      Een standaard transponder sleutel duurt 20-30 minuten. Een smart key met keyless entry duurt 30-45 minuten. 
                      Een Mercedes FBS4 sleutel met online component protection duurt 45-60 minuten.
                    </p>
                  </details>

                  <details className={styles.faqItem}>
                    <summary className={styles.faqQuestion}>
                      Is het goedkoper dan bij de dealer?
                      <span className={styles.faqChevron}>+</span>
                    </summary>
                    <p className={styles.faqAnswer}>
                      Ja, aanzienlijk. Een dealer rekent €250-€500 voor een reserve sleutel plus €100-€150 inleerkosten. 
                      Wij maken en programmeren ter plaatse voor €95-€249, inclusief alle kosten.
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

                <div className={styles.ratingCard}>
                  <div className={styles.ratingStars}>★★★★★</div>
                  <p className={styles.ratingText}>&ldquo;Sleutel van mijn Audi A4 kwijt. Dealer wachttijd 8 dagen. Autosleutel24 was binnen 40 min ter plaatse en de nieuwe sleutel werkte direct. Topservice!&rdquo;</p>
                  <span className={styles.ratingMeta}>Mark D. — Audi A4, Utrecht</span>
                  <span className={styles.ratingCount}>{SITE_CONFIG.reviewCount} Google beoordelingen · {SITE_CONFIG.rating}/5</span>
                </div>
              </aside>
            </div>

            {/* Bottom CTA block */}
            <div className={styles.ctaBlock}>
              <h2>Sleutel Bijmaken Nodig? Bel Direct</h2>
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
          const relatedPosts = getRelatedBlogPosts('sleutel-bijmaken');
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
