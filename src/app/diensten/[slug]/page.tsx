import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { DIENSTEN } from '@/config/diensten';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { CITIES } from '@/config/cities';
import styles from './page.module.css';

export async function generateStaticParams() {
  return DIENSTEN.map(s => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = DIENSTEN.find(s => s.slug === slug);
  if (!service) return {};
  return {
    title: service.metaTitle,
    description: service.metaDesc,
    alternates: { canonical: `${SITE_CONFIG.domain}/diensten/${slug}` },
  };
}

export default async function DienstPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = DIENSTEN.find(s => s.slug === slug);
  if (!service) notFound();

  const related = DIENSTEN.filter(s => service.relatedSlugs.includes(s.slug));
  const p1Cities = CITIES.filter(c => c.priority === 'P1').slice(0, 8);

  const howToSchema = {
    '@context': 'https://schema.org', '@type': 'HowTo',
    name: service.h1, description: service.intro,
    step: service.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })),
  };
  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: service.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const serviceSchema = {
    '@context': 'https://schema.org', '@type': 'Service',
    name: service.title,
    provider: { '@type': 'Locksmith', name: SITE_CONFIG.fullName, telephone: SITE_CONFIG.phoneTel, url: SITE_CONFIG.domain },
    areaServed: [{ '@type': 'Country', name: 'NL' }, { '@type': 'Country', name: 'BE' }],
    description: service.metaDesc,
    ...(service.priceFrom && { offers: { '@type': 'Offer', priceCurrency: 'EUR', description: service.priceFrom } }),
  };

  return (
    <>
      <Script id={`howto-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <Script id={`faq-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id={`svc-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
              <Link href="/">Home</Link> <span>/</span>
              <Link href="/diensten">Diensten</Link> <span>/</span>
              <span>{service.title}</span>
            </nav>
            <h1>{service.h1}</h1>
            <p className={styles.heroLead}>{service.intro}</p>
            {(service.priceFrom || service.duration) && (
              <div className={styles.heroBadges}>
                {service.priceFrom && <span className={styles.badge}>{service.priceFrom}</span>}
                {service.duration && <span className={styles.badge}>Duur: {service.duration}</span>}
                <span className={styles.badge}>24/7 Beschikbaar</span>
                <span className={styles.badge}>Mobiel aan huis</span>
              </div>
            )}
            <div className={styles.heroCtas}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.btnPhone} id={`svc-${slug}-phone`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                Bel Nu: {SITE_CONFIG.phone}
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.btnWa} id={`svc-${slug}-wa`}>WhatsApp</a>
              <Link href="/contact" className={styles.btnOutline} id={`svc-${slug}-form`}>Offerte Aanvragen</Link>
            </div>
          </div>
        </section>

        {/* System info */}
        {service.system && (
          <div className={styles.systemBar}>
            <div className={styles.systemBarInner}>
              <strong>Ondersteunde systemen:</strong>
              <span>{service.system}</span>
            </div>
          </div>
        )}

        {/* Steps */}
        <section className={styles.section}>
          <div className="container">
            <div className={styles.contentGrid}>
              <div>
                <h2>Hoe Verloopt de Service?</h2>
                <ol className={styles.stepList}>
                  {service.steps.map((step, i) => (
                    <li key={i} className={styles.stepItem}>
                      <span className={styles.stepNum}>{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Side CTA */}
              <aside className={styles.sidebar}>
                <div className={styles.sideCard}>
                  <h3>Direct Hulp Nodig?</h3>
                  <p>Bel of WhatsApp ons. Wij zijn 24/7 bereikbaar en gemiddeld binnen {SITE_CONFIG.responseTime} bij u.</p>
                  <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.sidePhone} id={`svc-sidebar-${slug}-phone`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
                    {SITE_CONFIG.phone}
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.sideWa} id={`svc-sidebar-${slug}-wa`}>WhatsApp Direct</a>

                  <div className={styles.sideList}>
                    {['Geen sleepkosten','Vaste prijs afgesproken vóór aanvang','Verzekeringsklare factuur','12 maanden garantie','24/7 beschikbaar'].map(item => (
                      <div key={item} className={styles.sideListItem}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{color:'var(--color-success)',flexShrink:0}} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className={styles.ratingCard}>
                  <div className="stars">★★★★★</div>
                  <p className={styles.ratingText}>&ldquo;Vakkundig en snel. Prijs 40% lager dan BMW dealer.&rdquo;</p>
                  <small>M. van den Berg — BMW 5 Serie, Eindhoven</small>
                  <div style={{marginTop:'0.5rem', fontSize:'0.78rem', color:'var(--gray-400)'}}>{SITE_CONFIG.reviewCount} Google beoordelingen · {SITE_CONFIG.rating}/5</div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Gallery placeholder */}
        <section className="gallery-section">
          <div className="container">
            <h2>Galerij — {service.title}</h2>
            <div className="gallery-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="gallery-item">
                  <div className="gallery-placeholder">
                    <svg className="gallery-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span>{service.title} — foto {i+1}</span>
                    <small>Voeg WebP foto toe</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={styles.sectionAlt}>
          <div className="container">
            <h2>Veelgestelde Vragen — {service.title}</h2>
            <div style={{maxWidth:800}}>
              {service.faq.map((f, i) => (
                <details key={i} className="faq-item">
                  <summary className="faq-question">
                    {f.q}
                    <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                  </summary>
                  <p className="faq-answer">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Cities */}
        <section className={styles.section}>
          <div className="container">
            <h2>{service.title} — Per Stad</h2>
            <p>Wij komen mobiel naar u toe. Klik op uw stad voor specifieke info.</p>
            <div className={styles.cityGrid}>
              {p1Cities.map(city => (
                <Link key={city.slug} href={`/steden/${city.slug}`} id={`svc-city-${city.slug}`} className={styles.cityCard}>
                  <span>{city.city}</span>
                  <span className={styles.cityTime}>{city.travelTime}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Related services */}
        {related.length > 0 && (
          <section className={styles.sectionAlt}>
            <div className="container">
              <h2>Gerelateerde Diensten</h2>
              <div className={styles.relatedGrid}>
                {related.map(r => (
                  <Link key={r.slug} href={`/diensten/${r.slug}`} id={`related-${r.slug}`} className={styles.relatedCard}>
                    <strong>{r.title}</strong>
                    <p>{r.intro.substring(0, 100)}...</p>
                    <span className={styles.relatedArrow}>Meer info →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className={styles.cta}>
          <div className="container">
            <h2>{service.title} Nodig? Bel Direct — 24/7</h2>
            <p>Gemiddeld {SITE_CONFIG.responseTime} bij u ter plaatse. Vaste prijs vooraf.</p>
            <div className={styles.ctaBtns}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`svc-cta-${slug}-phone`}>{SITE_CONFIG.phone}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.waBtn} id={`svc-cta-${slug}-wa`}>WhatsApp Direct</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
