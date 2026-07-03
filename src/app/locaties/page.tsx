import type { Metadata } from 'next';
import Link from 'next/link';
import { LOCATIONS } from '@/config/locations';
import { SITE_CONFIG } from '@/config/site.config';

export const metadata: Metadata = {
  title: `Alle Locaties | ${SITE_CONFIG.name}`,
  description: 'Autosleutel specialist in heel Nederland. Utrecht, Tilburg, Breda, Amsterdam, Rotterdam en meer. Mobiele service 24/7.',
  alternates: { canonical: `${SITE_CONFIG.domain}/locaties` },
};

const groups = [
  { title: 'Noord-Brabant & Limburg', locs: LOCATIONS.filter(l => ['Tilburg','Breda','Den Bosch','Helmond','Weert','Venlo','Roermond','Maastricht'].includes(l.city)) },
  { title: 'Midden & West Nederland', locs: LOCATIONS.filter(l => ['Utrecht','Arnhem','Nijmegen','Rotterdam','Den Haag','Amsterdam'].includes(l.city)) },
];

export default function LocatiesPage() {
  return (
    <main>
      <section style={{ background: 'linear-gradient(135deg, #070e1a 0%, #0a1628 100%)', padding: '5rem 2rem', textAlign: 'center' }}>
        <span className="section-label">DEKKING</span>
        <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Alle {LOCATIONS.length} Locaties</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: 640, margin: '0 auto' }}>
          Vanuit Utrecht bedienen wij heel Nederland. Mobiel, 24/7.
        </p>
      </section>

      <div className="container" style={{ padding: '4rem 2rem' }}>
        {groups.map((group) => (
          <div key={group.title} style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--color-border)' }}>{group.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {group.locs.map((loc) => (
                <Link
                  key={loc.slug}
                  href={`/locaties/${loc.slug}`}
                  id={`all-loc-${loc.city.toLowerCase()}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem 1.25rem',
                    background: '#fff',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    fontSize: '0.95rem',
                  }}
                >
                  <span>📍 {loc.city}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>{loc.travelTime}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
