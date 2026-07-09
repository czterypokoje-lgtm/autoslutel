import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { BRANDS } from '@/config/brands';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: `Alle 38 Automerken | Sleutelprogrammering | ${SITE_CONFIG.name}`,
  description: 'Autosleutel programmering voor alle 38 merken. BMW, Mercedes, VW, Audi, Toyota, Ford, Volvo, Renault, Peugeot, Tesla en meer. Mobiel, 24/7.',
  alternates: { canonical: `${SITE_CONFIG.domain}/merken` },
};

const groups = [
  { title: 'Meest Gevraagd', brands: BRANDS.filter(b => b.priority === 'P1') },
  { title: 'Populaire Merken', brands: BRANDS.filter(b => b.priority === 'P2') },
  { title: 'Alle Overige Merken', brands: BRANDS.filter(b => b.priority === 'P3') },
];

export default function MerkenPage() {
  const p1Brands = BRANDS.filter(b => b.priority === 'P1');
  const p2Brands = BRANDS.filter(b => b.priority === 'P2');
  const p3Brands = BRANDS.filter(b => b.priority === 'P3');

  return (
    <main>
      {/* Hero */}
      <section style={{ background: 'var(--navy-900)', padding: '6rem 2rem', textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
        <Image
          src="/autosleutel-merken-bijmaken-utrecht-amsterdam.webp"
          alt="Autosleutel merken bijmaken Utrecht &amp; Amsterdam — Autosleutel24 mobiele specialist"
          fill
          priority
          fetchPriority="high"
          quality={70}
          style={{ objectFit: 'cover', opacity: 0.6, zIndex: 0 }}
          sizes="100vw"
        />
        {/* Dark overlay for text readability */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 1, pointerEvents: 'none' }} />
        
        <Script id="merken-image-gps" type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageObject",
            "contentUrl": "https://www.autosleutel24.nl/autosleutel-merken-bijmaken-utrecht-amsterdam.webp",
            "name": "Autosleutel merken bijmaken Utrecht & Amsterdam",
            "description": "Volledig overzicht van de 38 automerken waarvoor Autosleutel24 autosleutels programmeert en bijmaakt in Utrecht en Amsterdam.",
            "contentLocation": {
              "@type": "Place",
              "name": "Utrecht, Amsterdam",
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 52.0907,
                "longitude": 5.1214
              }
            }
          })
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--orange-400)', marginBottom: '0.75rem' }}>MERKEN</p>
          <h1 style={{ color: '#fff', marginBottom: '1rem' }}>38 Automerken — Alle Sleutelsystemen</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 650, margin: '0 auto 2.5rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Van BMW CAS4+ tot VW MQB SFD en Toyota G-chip. Dealer-niveau tools voor elk merk. Mobiel aan huis.
          </p>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary" id="merken-hero-phone">{SITE_CONFIG.phone}</a>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container" style={{ padding: '3.5rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Webmaster-style Services & SEO block */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--gray-200)',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '3.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem' }}>
            Onze Sleutelservices &amp; Programmering
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--gray-700)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
            Als mobiele autosleutelspecialist leveren wij een breed scala aan diensten ter plaatse. Wij programmeren uw transpondersleutel, dupliceren uw smart key of openen uw voertuig schadevrij bij buitensluiting. Onze gecertificeerde specialisten werken snel en vakkundig.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
              <div>
                <strong>Autosleutel bijmaken</strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '0.1rem' }}>Reservesleutels frezen en inleren voor alle merken.</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
              <div>
                <strong>Transponder programmeren</strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '0.1rem' }}>Immobilizer chips coderen en synchroniseren.</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
              <div>
                <strong>Smart key inleren</strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '0.1rem' }}>Keyless entry en comfortsleutels aanmelden op de ECU.</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
              <div>
                <strong>Schadevrij auto openen</strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '0.1rem' }}>Lishi lockpicking bij buitensluiting of sleutel in auto.</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
              <div>
                <strong>Sleutelbehuizing reparatie</strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '0.1rem' }}>Micro-switches solderen en knoopcelbatterijen vervangen.</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
              <div>
                <strong>Contactslot diagnose</strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: '0.1rem' }}>Defecte sloten uitlezen, repareren of deactiveren.</div>
              </div>
            </div>
          </div>
        </div>

        {/* 1. MEEST GEVRAAGD (GRID STYLE WITH CHECKMARKS & ORANGE LINKS) */}
        <div style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, paddingBottom: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray-300)', color: 'var(--navy-900)' }}>
            Meest Gevraagde Automerken (Mobiel Coderen)
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            gap: '1.5rem 1rem'
          }}>
            {p1Brands.map(b => (
              <div key={b.slug} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', lineHeight: '1.2' }}>✓</span>
                <div>
                  <Link 
                    href={`/merken/${b.nameSlug}-autosleutel-bijmaken`} 
                    id={`merk-${b.slug}`}
                    style={{ color: 'var(--orange-500)', textDecoration: 'underline', fontWeight: 700, fontSize: '0.95rem' }}
                  >
                    {b.name}
                  </Link>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '0.15rem', lineHeight: 1.35 }}>
                    {b.name} autosleutel bijmaken • {b.system}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. POPULAIRE MERKEN (GRID STYLE WITH CHECKMARKS & ORANGE LINKS) */}
        <div style={{ marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, paddingBottom: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray-300)', color: 'var(--navy-900)' }}>
            Populaire Automerken
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            gap: '1.5rem 1rem'
          }}>
            {p2Brands.map(b => (
              <div key={b.slug} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', lineHeight: '1.2' }}>✓</span>
                <div>
                  <Link 
                    href={`/merken/${b.nameSlug}-autosleutel-bijmaken`} 
                    id={`merk-${b.slug}`}
                    style={{ color: 'var(--orange-500)', textDecoration: 'underline', fontWeight: 700, fontSize: '0.95rem' }}
                  >
                    {b.name}
                  </Link>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '0.15rem', lineHeight: 1.35 }}>
                    {b.name} autosleutel programmeren • {b.system}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. OVERIGE MERKEN (GRID STYLE WITH CHECKMARKS & ORANGE LINKS) */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, paddingBottom: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray-300)', color: 'var(--navy-900)' }}>
            Overige Automerken
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            gap: '1.5rem 1rem'
          }}>
            {p3Brands.map(b => (
              <div key={b.slug} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', lineHeight: '1.2' }}>✓</span>
                <div>
                  <Link 
                    href={`/merken/${b.nameSlug}-autosleutel-bijmaken`} 
                    id={`merk-${b.slug}`}
                    style={{ color: 'var(--orange-500)', textDecoration: 'underline', fontWeight: 700, fontSize: '0.95rem' }}
                  >
                    {b.name}
                  </Link>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '0.15rem', lineHeight: 1.35 }}>
                    {b.name} sleutel inleren • {b.system}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
