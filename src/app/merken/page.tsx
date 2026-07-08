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
  return (
    <main>
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

      <div className="container" style={{ padding: '3.5rem 2rem' }}>
        {groups.map(g => (
          <div key={g.title} style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, paddingBottom: '0.75rem', marginBottom: '1rem', borderBottom: '2px solid var(--gray-200)', color: 'var(--gray-900)' }}>{g.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '0.75rem' }}>
              {g.brands.map(b => (
                <Link key={b.slug} href={`/merken/${b.nameSlug}-autosleutel-bijmaken`} id={`merk-${b.slug}`}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1rem 1.25rem', background: '#fff', border: '1px solid var(--gray-200)', borderRadius: '4px', textDecoration: 'none', transition: 'all 0.15s' }}>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--gray-900)' }}>{b.name}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>{b.system}</span>
                  {b.models && b.models.length > 0 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--navy-400)', marginTop: '0.1rem' }}>
                      {b.models.map(m => m.name).slice(0, 4).join(' · ')}...
                    </span>
                  )}
                  <span style={{ fontSize: '0.78rem', color: 'var(--orange-500)', fontWeight: 600, marginTop: '0.25rem' }}>Bekijk →</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
