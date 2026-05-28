import type { Metadata } from 'next';
import Link from 'next/link';
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
      <section style={{ background: 'linear-gradient(160deg, var(--navy-900), var(--navy-800))', padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--orange-400)', marginBottom: '0.75rem' }}>MERKEN</p>
        <h1 style={{ color: '#fff', marginBottom: '1rem' }}>38 Automerken — Alle Sleutelsystemen</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 580, margin: '0 auto 1.5rem' }}>
          Van BMW CAS4+ tot VW MQB SFD en Toyota G-chip. Dealer-niveau tools voor elk merk. Mobiel aan huis.
        </p>
        <a href={`tel:${SITE_CONFIG.phoneTel}`} className="btn btn-primary" id="merken-hero-phone">{SITE_CONFIG.phone}</a>
      </section>

      <div className="container" style={{ padding: '3.5rem 2rem' }}>
        {groups.map(g => (
          <div key={g.title} style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, paddingBottom: '0.75rem', marginBottom: '1rem', borderBottom: '2px solid var(--gray-200)', color: 'var(--gray-900)' }}>{g.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {g.brands.map(b => (
                <Link key={b.slug} href={`/merken/${b.nameSlug}-sleutel-programmeren`} id={`merk-${b.slug}`}
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
