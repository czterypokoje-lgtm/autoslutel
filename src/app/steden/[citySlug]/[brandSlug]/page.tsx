import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { BRANDS } from '@/config/brands';
import { CITIES } from '@/config/cities';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';

// Generate all city × brand combo pages
export async function generateStaticParams() {
  const params: { citySlug: string; brandSlug: string }[] = [];
  for (const city of CITIES) {
    for (const brand of BRANDS) {
      // P1 cities get all P1+P2 brands; P2 cities get P1 brands; P3 cities get P1 brands only
      if (
        (city.priority === 'P1' && (brand.priority === 'P1' || brand.priority === 'P2')) ||
        (city.priority === 'P2' && brand.priority === 'P1') ||
        (city.priority === 'P3' && brand.priority === 'P1')
      ) {
        params.push({ citySlug: city.slug, brandSlug: `${brand.nameSlug}-sleutel-programmeren` });
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ citySlug: string; brandSlug: string }> }): Promise<Metadata> {
  const { citySlug, brandSlug } = await params;
  const city = CITIES.find(c => c.slug === citySlug);
  const brand = BRANDS.find(b => `${b.nameSlug}-sleutel-programmeren` === brandSlug);
  if (!city || !brand) return {};
  return {
    title: `${brand.name} Sleutel Programmeren ${city.city} | Mobiel | ${SITE_CONFIG.name}`,
    description: `${brand.name} autosleutel programmering in ${city.city}. ${brand.system.split('/')[0]}. Mobiel aan huis. ${city.travelTime} reactietijd. Goedkoper dan dealer. Bel: ${SITE_CONFIG.phone}`,
    alternates: { canonical: `${SITE_CONFIG.domain}/steden/${citySlug}/${brandSlug}` },
  };
}

export default async function CityBrandPage({ params }: { params: Promise<{ citySlug: string; brandSlug: string }> }) {
  const { citySlug, brandSlug } = await params;
  const city = CITIES.find(c => c.slug === citySlug);
  const brand = BRANDS.find(b => `${b.nameSlug}-sleutel-programmeren` === brandSlug);
  if (!city || !brand) notFound();

  const isFR = city.lang === 'FR';

  const t = {
    heroSub: isFR ? `Nous arrivons à ${city.city} en moyenne en` : `Wij bereiken ${city.city} gemiddeld in`,
    cheaper: isFR ? `Moins cher que le concessionnaire ${brand.name} — garanti.` : `Goedkoper dan ${brand.name} dealer — gegarandeerd.`,
    responseTime: isFR ? 'Temps de réponse' : 'Reactietijd',
    available: isFR ? 'Disponible' : 'Beschikbaar',
    noTow: isFR ? 'Pas de remorquage' : 'Geen sleepkosten',
    modelsTitle: isFR ? `Modèles ${brand.name} à ${city.city}` : `${brand.name} Modellen in ${city.city}`,
    modelsSub: isFR ? `Nous programmons des clés pour les modèles ${brand.name} suivants à ${city.city} :` : `Wij programmeren sleutels voor de volgende ${brand.name} modellen in ${city.city}:`,
    whyTitle: isFR ? `Pourquoi choisir Autosleutel Expert à ${city.city} ?` : `Waarom Kiezen voor Autosleutel Expert in ${city.city}?`,
    details: isFR ? 'Détails →' : 'Details →',
    years: isFR ? 'Années :' : 'Bouwjaren:',
    callNow: isFR ? 'Appelez maintenant' : 'Bel Nu',
    problemTitle: isFR ? `Problème de clé ${brand.name} à ${city.city} ?` : `${brand.name} Sleutel Probleem in ${city.city}?`,
    problemSub: isFR ? `Appelez ou WhatsApp — moyenne ${city.travelTime} sur place.` : `Bel of WhatsApp — gemiddeld ${city.travelTime} bij u ter plaatse.`,
    othersInCity: isFR ? `Autres marques à ${city.city}` : `Andere Merken in ${city.city}`,
    brandInOthers: isFR ? `${brand.name} dans d'autres villes` : `${brand.name} in Andere Steden`,
  };

  const faqItems = isFR ? [
    { q: `À quelle vitesse arrivez-vous à ${city.city} ?`, a: `Depuis Eindhoven, nous atteignons ${city.city} en moyenne en ${city.travelTime}. Vous appelez — nous roulons immédiatement.` },
    { q: `Pouvez-vous programmer ma ${brand.name} sans la clé d'origine ?`, a: `Oui. Le service AKL (Toutes clés perdues) est notre spécialité pour ${brand.name}. Système : ${brand.system}. Appelez pour les possibilités exactes.` },
    { q: `La programmation de clé ${brand.name} à ${city.city} coûte-t-elle moins cher qu'au garage ?`, a: `En moyenne 30 à 50 % de moins. De plus, nous venons à vous — pas de frais de remorquage.` },
    { q: `Travaillez-vous aussi la nuit à ${city.city} ?`, a: `Oui. Disponible 24/7, y compris la nuit et le week-end. Un supplément de nuit de +25% s'applique.` },
  ] : [
    { q: `Hoe snel bent u bij mij in ${city.city}?`, a: `Vanuit Eindhoven bereiken wij ${city.city} gemiddeld in ${city.travelTime}. U belt — wij rijden direct.` },
    { q: `Kunt u mijn ${brand.name} programmeren zonder originele sleutel?`, a: `Ja. AKL (Alle Sleutels Kwijt) service is onze specialiteit voor ${brand.name}. Systeem: ${brand.system}. Bel voor exacte mogelijkheden.` },
    { q: `Kost ${brand.name} sleutelprogrammering in ${city.city} minder dan bij de dealer?`, a: `Gemiddeld 30–50% minder. Wij komen naar u toe — geen sleepkosten of vervoerskosten.` },
    { q: `Werkt u ook 's nachts in ${city.city}?`, a: `Ja. 24/7 beschikbaar, ook nacht en weekend. Nacht toeslag +25% van toepassing.` },
  ];

  const schema = {
    '@context': 'https://schema.org', '@type': 'Locksmith',
    name: isFR ? `Spécialiste clés ${brand.name} ${city.city} — ${SITE_CONFIG.name}` : `${brand.name} Sleutelspecialist ${city.city} — ${SITE_CONFIG.name}`,
    url: `${SITE_CONFIG.domain}/steden/${citySlug}/${brandSlug}`,
    telephone: SITE_CONFIG.phoneTel,
    address: { '@type': 'PostalAddress', addressLocality: city.city, addressRegion: city.region, addressCountry: city.country },
    geo: { '@type': 'GeoCoordinates', latitude: city.geo.lat, longitude: city.geo.lng },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: SITE_CONFIG.rating, reviewCount: SITE_CONFIG.reviewCount, bestRating: '5' },
  };
  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqItems.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  // Related combos: same city different brands + same brand different cities
  const relatedBrands = BRANDS.filter(b => b.priority === 'P1' && b.slug !== brand.slug).slice(0, 5);
  const relatedCities = CITIES.filter(c => c.country === city.country && c.slug !== citySlug && c.priority !== 'P3').slice(0, 5);

  return (
    <>
      <Script id={`combo-ls-${citySlug}-${brand.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id={`combo-faq-${citySlug}-${brand.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <main>
        {/* Hero */}
        <section style={{ background: 'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding: '4rem 2rem 3rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <nav style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.45)' }}>Home</Link> /
              <Link href="/steden" style={{ color: 'rgba(255,255,255,0.45)' }}>Steden</Link> /
              <Link href={`/steden/${citySlug}`} style={{ color: 'rgba(255,255,255,0.45)' }}>{city.city}</Link> /
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{brand.name}</span>
            </nav>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--orange-400)', marginBottom: '0.75rem' }}>
              {city.city} · {city.region}
            </p>
            <h1 style={{ color: '#fff', fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', marginBottom: '1rem' }}>
              {brand.name} {isFR ? 'Programmation Clé' : 'Sleutel Programmeren'} {city.city}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: 680 }}>
              {brand.excerpt} {t.heroSub} <strong style={{ color: '#fff' }}>{city.travelTime}</strong>.
              Systeem: <strong style={{ color: '#fff' }}>{brand.system}</strong>. {t.cheaper}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`cb-${citySlug}-${brand.slug}-phone`}>{SITE_CONFIG.phone}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', background: '#25d366', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: '4px', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }} id={`cb-${citySlug}-${brand.slug}-wa`}>WhatsApp</a>
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {[[city.travelTime, t.responseTime], ['24/7', t.available], [isFR ? 'Non' : 'Geen', t.noTow], [SITE_CONFIG.rating + '★', 'Google']].map(([v, l]) => (
                <div key={l} style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--orange-400)', lineHeight: 1 }}>{v}</strong>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.2rem' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Models if available */}
        {brand.models && brand.models.length > 0 && (
          <section style={{ padding: '3rem 0' }}>
            <div className="container">
              <h2>{t.modelsTitle}</h2>
              <p>{t.modelsSub}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                {brand.models.map(m => (
                  <Link key={m.slug} href={`/merken/${brand.nameSlug}/${m.slug}`} id={`cb-model-${m.slug}`}
                    style={{ padding: '1.25rem', background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '6px', textDecoration: 'none', transition: 'all 0.15s' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--gray-900)', display: 'block' }}>{brand.name} {m.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{t.years} {m.years}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--orange-500)', fontWeight: 600, display: 'block', marginTop: '0.25rem' }}>{t.details}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why us local */}
        <section style={{ padding: '3rem 0', background: 'var(--gray-50)' }}>
          <div className="container">
            <h2>{t.whyTitle}</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '1.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 700 }}>
              {(isFR ? [
                `${city.travelTime} de temps de réponse à ${city.city}`,
                `Spécialiste ${brand.name} — système: ${brand.system.split('/')[0]}`,
                'Pas de frais de remorquage — entièrement mobile',
                `Moins cher que le concessionnaire ${brand.name} à ${city.city}`,
                'Garantie de 12 mois sur la programmation',
                'Facture prête pour l\'assurance',
                'Disponible 24/7, même les week-ends et jours fériés',
              ] : [
                `${city.travelTime} reactietijd naar ${city.city}`,
                `${brand.name} specialist — systeem: ${brand.system.split('/')[0]}`,
                'Geen sleepkosten — volledig mobiel',
                `Goedkoper dan ${brand.name} dealer in ${city.city} — gegarandeerd`,
                '12 maanden garantie op programmering',
                'Verzekeringsklare factuur',
                '24/7 beschikbaar, ook weekend en feestdagen',
              ]).map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.5rem 0', fontSize: '0.9rem', color: 'var(--gray-700)', borderBottom: '1px solid var(--gray-200)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15" style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </li>
              ))}
            </ul>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary" id={`cb-why-${citySlug}-${brand.slug}-phone`}>{t.callNow}: {SITE_CONFIG.phone}</a>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: '3rem 0' }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <h2>{isFR ? `Questions sur les clés ${brand.name} à ${city.city}` : `Vragen over ${brand.name} Sleutels in ${city.city}`}</h2>
            {faqItems.map((f, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-question">{f.q}
                  <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                </summary>
                <p className="faq-answer">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Internal links — related combos */}
        <section style={{ padding: '3rem 0', background: 'var(--gray-50)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.othersInCity}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {relatedBrands.map(b => (
                    <Link key={b.slug} href={`/steden/${citySlug}/${b.nameSlug}-sleutel-programmeren`} style={{ fontSize: '0.875rem', color: 'var(--navy-600)', textDecoration: 'none', padding: '0.3rem 0', borderBottom: '1px solid var(--gray-200)' }} id={`rel-brand-${b.slug}`}>
                      {b.name} {isFR ? 'Programmation Clé' : 'Sleutel Programmeren'} {city.city} →
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--gray-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.brandInOthers}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {relatedCities.map(c => (
                    <Link key={c.slug} href={`/steden/${c.slug}/${brandSlug}`} style={{ fontSize: '0.875rem', color: 'var(--navy-600)', textDecoration: 'none', padding: '0.3rem 0', borderBottom: '1px solid var(--gray-200)' }} id={`rel-city-${c.slug}`}>
                      {brand.name} {isFR ? 'Programmation Clé' : 'Sleutel Programmeren'} {c.city} →
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'var(--navy-900)', padding: '3.5rem 2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>{t.problemTitle}</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '2rem' }}>{t.problemSub}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`cb-cta-${citySlug}-${brand.slug}-phone`}>{SITE_CONFIG.phone}</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', background: '#25d366', color: '#fff', padding: '0.85rem 2rem', borderRadius: '4px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', minHeight: 52 }} id={`cb-cta-${citySlug}-${brand.slug}-wa`}>WhatsApp Direct</a>
          </div>
        </section>
      </main>
    </>
  );
}
