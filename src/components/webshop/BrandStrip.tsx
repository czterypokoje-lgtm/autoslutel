import React from 'react';
import Link from 'next/link';
import brandData from '@/lib/brands.json';

/**
 * "Zoek op uw automerk" — the makes we stock, with how many articles each has.
 *
 * Most people arrive knowing one thing: what they drive. The home page asked
 * them to pick a part type first, which is the wrong question for a customer
 * and the right one only for us.
 *
 * Counts come from the catalogue, so a tile can never promise a range that
 * turns out to be empty.
 */

const BRANDS = brandData as { make: string; count: number }[];

export default function BrandStrip({ limit = 14 }: { limit?: number }) {
  const top = [...BRANDS].sort((a, b) => b.count - a.count).slice(0, limit);
  if (top.length === 0) return null;

  return (
    <section style={{ padding: 'clamp(2rem, 6vw, 3.5rem) 0', background: 'var(--webshop-bg)' }}>
      <div className="container">
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', color: 'var(--webshop-dark)' }}>
            Zoek op uw automerk
          </h2>
          <Link
            href="/webshop/merken"
            style={{ color: '#c2410c', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', fontSize: '.9rem' }}
          >
            Alle merken →
          </Link>
        </div>

        <div className="brand-strip">
          {top.map(({ make, count }) => (
            <Link key={make} href={`/webshop/catalogus?make=${encodeURIComponent(make)}`} className="brand-chip">
              <span className="brand-chip-name">{make}</span>
              <span className="brand-chip-count">{count}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
