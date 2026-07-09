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
      <section style={{ background: 'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding: '4rem 2rem 5rem', textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--orange-400)', marginBottom: '0.75rem' }}>MERKEN</p>
          <h1 style={{ color: '#fff', marginBottom: '1rem' }}>38 Automerken — Alle Sleutelsystemen</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 650, margin: '0 auto 2rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Van BMW CAS4+ tot VW MQB SFD en Toyota G-chip. Dealer-niveau tools voor elk merk. Mobiel aan huis.
          </p>
          <div style={{ maxWidth: '800px', margin: '0 auto 2.5rem', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Image
              src="/images/seo/autosleutel_merken_bmw_mercedes_volkswagen_audi_toyota_ford_volvo_skoda_honda_nissan_smart_porsche.webp"
              alt="Autosleutel bijmaken en programmeren op locatie in Utrecht en Amsterdam voor alle automerken inclusief Volkswagen, BMW, Mercedes, Audi, Ford, Toyota, Honda, Volvo, Skoda, Nissan, Smart, Porsche (GPS Utrecht & Amsterdam)"
              width={1200}
              height={675}
              priority
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary" id="merken-hero-phone">{SITE_CONFIG.phone}</a>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container" style={{ padding: '3.5rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Intro copy for E-E-A-T & local context */}
        <div style={{ marginBottom: '3rem', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--gray-800)' }}>
          <p>
            Als gecertificeerde autosleutelspecialisten kunnen wij sleutels programmeren en dupliceren voor <strong>meer dan 38 automerken</strong>. Dankzij onze volledig uitgeruste mobiele servicebussen beschikken we over exact dezelfde programmeerapparatuur en databasecodes als de officiële dealers in Utrecht en omgeving.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            Hieronder vindt u ons volledige service-overzicht per merk. Klik op een van de onderstaande links om direct de tarieven, ondersteunde modellen en technische specificaties voor uw merk te bekijken.
          </p>
        </div>

        {/* 1. MEEST GEVRAAGD (P1 DETAILED HTML STYLE LIST) */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, paddingBottom: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray-300)', color: 'var(--navy-900)' }}>
            Meest Gevraagde Automerken (Mobiel Programmeren)
          </h2>
          
          {p1Brands.map(b => (
            <div key={b.slug} style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
              <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.5rem 0' }}>
                <Link 
                  href={`/merken/${b.nameSlug}-autosleutel-bijmaken`} 
                  id={`merk-${b.slug}`}
                  style={{ color: '#1a56db', textDecoration: 'underline', fontWeight: 700 }}
                >
                  {b.name} Autosleutel Bijmaken &amp; Coderen
                </Link>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                  — 12 maanden garantie
                </span>
              </h3>
              <p style={{ margin: '0 0 0.75rem 0', color: 'var(--gray-700)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                {b.excerpt || `Volledige mobiele service voor alle ${b.name} autosleutels, afstandsbedieningen en smart keys direct ter plaatse.`}
              </p>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', margin: 0, fontSize: '0.85rem', color: 'var(--gray-600)', lineHeight: 1.6 }}>
                <li><strong>Systemen:</strong> {b.system}</li>
                {b.models && b.models.length > 0 && (
                  <li>
                    <strong>Ondersteunde Modellen:</strong> {b.models.map(m => m.name).slice(0, 8).join(', ')}...
                  </li>
                )}
              </ul>
              <p style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                <Link 
                  href={`/merken/${b.nameSlug}-autosleutel-bijmaken`}
                  style={{ color: 'var(--orange-500)', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  Bekijk tarieven &amp; modellen voor {b.name} &rarr;
                </Link>
              </p>
            </div>
          ))}
        </div>

        {/* 2. POPULAIRE MERKEN (P2 LIST STYLE) */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, paddingBottom: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray-300)', color: 'var(--navy-900)' }}>
            Populaire Automerken
          </h2>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', margin: 0, fontSize: '0.9rem', color: 'var(--gray-700)', lineHeight: 1.8 }}>
            {p2Brands.map(b => (
              <li key={b.slug} style={{ marginBottom: '0.75rem' }}>
                <Link 
                  href={`/merken/${b.nameSlug}-autosleutel-bijmaken`}
                  id={`merk-${b.slug}`}
                  style={{ color: '#1a56db', textDecoration: 'underline', fontWeight: 700 }}
                >
                  {b.name}
                </Link>
                {' '} — Systeem: <strong>{b.system}</strong>.
                {b.models && b.models.length > 0 && (
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>
                    {' '} (Modellen: {b.models.map(m => m.name).slice(0, 5).join(', ')}...)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* 3. OVERIGE MERKEN (P3 LIST STYLE) */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, paddingBottom: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray-300)', color: 'var(--navy-900)' }}>
            Overige Automerken
          </h2>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', margin: 0, fontSize: '0.9rem', color: 'var(--gray-700)', lineHeight: 1.8 }}>
            {p3Brands.map(b => (
              <li key={b.slug} style={{ marginBottom: '0.75rem' }}>
                <Link 
                  href={`/merken/${b.nameSlug}-autosleutel-bijmaken`}
                  id={`merk-${b.slug}`}
                  style={{ color: '#1a56db', textDecoration: 'underline', fontWeight: 700 }}
                >
                  {b.name}
                </Link>
                {' '} — Systeem: <strong>{b.system}</strong>.
                {b.models && b.models.length > 0 && (
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>
                    {' '} (Modellen: {b.models.map(m => m.name).slice(0, 5).join(', ')}...)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </main>
  );
}
