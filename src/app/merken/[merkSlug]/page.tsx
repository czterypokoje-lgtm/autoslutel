import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { BRANDS } from '../../../config/brands';
import { CITIES } from '@/config/cities';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';

export async function generateStaticParams() {
  return BRANDS.map(b => ({ merkSlug: `${b.nameSlug}-autosleutel-bijmaken` }));
}

export async function generateMetadata(props: { params: Promise<{ merkSlug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const merkSlug = params.merkSlug;
  const decodedSlug = decodeURIComponent(merkSlug).toLowerCase();
  
  const brand = BRANDS.find(b => {
    const base = b.nameSlug.toLowerCase();
    return decodedSlug === `${base}-autosleutel-bijmaken` || decodedSlug === base;
  });

  if (!brand) return {};
  const pageUrl = `${SITE_CONFIG.domain}/merken/${merkSlug}`;
  return {
    title: {
      absolute: `${brand.name} Autosleutel Bijmaken | 24/7 Mobiel | Autosleutel24`,
    },
    description: `${brand.name} autosleutel bijmaken & programmeren. ${brand.system}. Alle modellen. Autosleutel Specialist — tot 50% goedkoper dan ${brand.name} dealer. Mobiel aan huis. Bel: ${SITE_CONFIG.phone}`,
    alternates: {
      canonical: pageUrl,
      languages: {
        'nl-NL': pageUrl,
        'x-default': pageUrl,
      },
    },
    openGraph: {
      url: pageUrl,
      title: `${brand.name} Autosleutel Bijmaken & Programmeren | 24/7 Mobiel`,
      description: `${brand.name} autosleutel bijmaken & inleren op locatie. Goedkoper dan de dealer. Zelfde dag klaar met 12 maanden garantie. Bel direct!`,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${brand.name} reservesleutel bijmaken — Autosleutel24` }],
    },
  };
}

export default async function BrandPage(props: { params: Promise<{ merkSlug: string }> }) {
  const params = await props.params;
  const merkSlug = params.merkSlug;
  const decodedSlug = decodeURIComponent(merkSlug).toLowerCase();

  const brand = BRANDS.find(b => {
    const base = b.nameSlug.toLowerCase();
    return decodedSlug === `${base}-autosleutel-bijmaken` || decodedSlug === base;
  });

  if (!brand) notFound();

  const p1Cities = CITIES.filter(c => c.priority === 'P1').slice(0, 10);

  const schema = {
    '@context': 'https://schema.org', '@type': 'Service',
    name: `${brand.name} Autosleutel Bijmaken — Autosleutel Specialist`,
    description: `Professionele autosleutel bijmaken & programmeren voor alle ${brand.name} modellen. Autosleutel Specialist mobiele service op locatie.`,
    provider: { '@type': 'Locksmith', name: SITE_CONFIG.fullName, telephone: SITE_CONFIG.phoneTel },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_CONFIG.domain },
      { '@type': 'ListItem', position: 2, name: 'Merken', item: `${SITE_CONFIG.domain}/merken` },
      { '@type': 'ListItem', position: 3, name: brand.name, item: `${SITE_CONFIG.domain}/merken/${merkSlug}` },
    ],
  };

  return (
    <>
      <Script id={`brand-schema-${brand.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Script id={`brand-breadcrumb-${brand.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main>
        {/* Hero Section */}
        <section style={{ background: 'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding: '4rem 2rem 3rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <nav style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.45)' }}>Home</Link> /
              <Link href="/merken" style={{ color: 'rgba(255,255,255,0.45)' }}>Merken</Link> /
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{brand.name}</span>
            </nav>
            <h1 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)', marginBottom: '1rem' }}>
              {`${brand.name} Autosleutel Bijmaken & Programmeren`} <br />
              <span style={{ color: 'var(--orange-500)' }}>Autosleutel Specialist — Mobiel Ter Plaatse</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 700, fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Is uw {brand.name} autosleutel kwijt, gestolen of werkt de afstandsbediening niet meer?
              Wij programmeren alle {brand.name} modellen (CAS, FEM, BDC, MQB, Smart Key) direct aan huis.
              Bespaar tot 50% vergeleken met de dealer.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary btn-lg" id={`brand-hero-${brand.slug}-phone`}>{SITE_CONFIG.phone}</a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="wa-btn" style={{ background:'#25d366', color:'#fff', padding:'0.85rem 2rem', borderRadius:'6px', fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:'0.5rem' }} id={`brand-hero-${brand.slug}-wa`}>WhatsApp Direct</a>
            </div>
          </div>
        </section>

        {/* Models Grid */}
        {brand.models && brand.models.length > 0 && (
          <section style={{ padding: '4rem 0', background: 'var(--gray-50)' }}>
            <div className="container">
              <h2 style={{ marginBottom: '2rem' }}>Ondersteunde {brand.name} Modellen</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
                {brand.models.map(m => (
                  <Link key={m.slug} href={`/merken/${merkSlug}/${m.slug}`} 
                    style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--gray-200)', textDecoration: 'none', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                    className="model-card">
                    <strong style={{ fontSize: '1.1rem', color: 'var(--gray-900)' }}>{m.name}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Bouwjaren: {m.years}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--orange-500)', fontWeight: 600, marginTop: '0.5rem' }}>Details &amp; Prijs →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Technical Section */}
        <section style={{ padding: '5rem 0' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '4rem', alignItems: 'center' }}>
              <div>
                <h2>{brand.name} Specialist — Dealer Niveau</h2>
                <p style={{ marginBottom: '1.5rem', lineHeight: 1.8 }}>
                  Wij maken gebruik van exact dezelfde apparatuur als de {brand.name} dealer, maar dan volledig mobiel.
                  Met tools zoals <strong>{brand.system}</strong> kunnen wij direct in de computer van uw auto programmeren,
                  ook wanneer u <strong>alle sleutels kwijt</strong> bent.
                </p>
                <ul className="check-list" style={{ columns: 1 }}>
                  <li>Zelfde dag service (klaar terwijl u wacht)</li>
                  <li>Geen sleepkosten naar de garage</li>
                  <li>Originele OEM {brand.name} sleutels op voorraad</li>
                  <li>Inclusief slijpen van de noodsleutel</li>
                  <li>Verzekeringsklare facturen</li>
                </ul>
              </div>
              <div style={{ background: 'var(--navy-900)', color: '#fff', padding: '3rem', borderRadius: '16px' }}>
                <h3 style={{ color: 'var(--orange-400)', marginBottom: '1rem' }}>Direct een prijsopgave?</h3>
                <p style={{ marginBottom: '2rem', opacity: 0.8 }}>Geef uw {brand.name} model en bouwjaar door via WhatsApp en ontvang direct een vaste prijs.</p>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg" style={{ width: '100%', textAlign: 'center' }} id="brand-tech-wa">WhatsApp Nu</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── COMPREHENSIVE BRAND SEO GUIDE ARTICLE ── */}
        <section style={{ padding: '3.5rem 0', background: '#ffffff' }}>
          <div className="container">
            <div className="seo-article-block" style={{ marginTop: 0 }}>
              <h2>Alles over {brand.name} Autosleutels Bijmaken, Inleren en Vervangen</h2>
              <p>
                Het verliezen of beschadigen van uw {brand.name} autosleutel kan voor aanzienlijk ongemak zorgen. Of u nu rijdt in een compacte stadsauto, een hybride of een volledig elektrisch model, moderne {brand.name} voertuigen maken gebruik van geavanceerde elektronische beveiligingssystemen. Waar u bij een officiële {brand.name} merkdealer vaak dagen tot weken moet wachten en verplicht bent uw auto te laten wegslepen, biedt <strong>{SITE_CONFIG.name}</strong> een snelle, mobiele oplossing op locatie in heel Nederland.
              </p>
              <h3>Hoe programmeren wij uw {brand.name} sleutel ter plaatse?</h3>
              <p>
                Onze mobiele monteurs beschikken over geautoriseerde dealerapparatuur waarmee wij rechtstreeks verbinding maken met het diagnose- en beveiligingssysteem van uw voertuig (zoals <strong>{brand.system}</strong>). Via de OBD2-poort lezen wij de startonderbreker uit, programmeren we de transponderchip en synchroniseren we de centrale deurvergrendeling of Keyless Entry afstandsbediening.
              </p>
              <h3>Wat als u alle {brand.name} sleutels kwijt bent (All Keys Lost)?</h3>
              <p>
                Zelfs wanneer u al uw {brand.name} sleutels kwijt bent, kunnen wij u direct helpen. Wij openen uw auto 100% schadevrij met speciaal Lishi-gereedschap, decoderen het mechanische sleutelnummer en frezen direct een nieuwe noodsleutel met onze mobiele CNC-snijmachine. Vervolgens wissen wij alle verloren sleutels uit het geheugen van de auto, zodat uw voertuig optimaal beveiligd blijft tegen diefstal.
              </p>
              <h3>Garantie, Verzekering en Kostenvoordeel</h3>
              <p>
                Dankzij onze efficiënte mobiele werkwijze bespaart u bij ons gemiddeld <strong>30% tot 50%</strong> ten opzichte van de merkdealer. U ontvangt standaard 12 maanden volledige schriftelijke garantie op de geleverde {brand.name} sleutel en elektronica. Bovendien accepteren vrijwel alle autoverzekeraars (Beperkt Casco en Allrisk) onze officiële gespecificeerde facturen voor vergoeding na diefstal of verlies.
              </p>
            </div>
          </div>
        </section>

        {/* Local presence / City links */}
        <section style={{ padding: '4rem 0', background: 'var(--gray-50)' }}>
          <div className="container">
            <h3>Wij komen naar u toe in heel Nederland</h3>
            <p style={{ marginBottom: '1.5rem' }}>Alle steden &amp; regio&apos;s voor {brand.name} autosleutel service:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {CITIES.map(c => (
                <Link key={c.slug} href={`/steden/${c.slug}/${merkSlug}`} 
                  style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--gray-700)', textDecoration: 'none' }}>
                  {brand.name} in {c.city}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
