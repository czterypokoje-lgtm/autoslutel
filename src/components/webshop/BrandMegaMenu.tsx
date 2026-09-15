'use client';
import React from 'react';
import Link from 'next/link';
import brands from '@/lib/brands.json';

/**
 * The brand drop-down, from the makes we actually stock.
 *
 * The list here was hand-written and American: Acura, Eagle, Hummer,
 * Oldsmobile, Plymouth, Pontiac, Saturn, Scion, Tesla and an entry called
 * "Aftermarket" — none of which has a single product in this catalogue, so
 * most of the menu opened an empty page.
 *
 * The links were broken for the rest as well. They lowercased the make and
 * replaced spaces with hyphens ("Alfa Romeo" → `?make=alfa-romeo`), while the
 * catalogue filter matches the make as written — so every two-word brand,
 * Alfa Romeo and Land Rover among them, returned nothing.
 */

const BRANDS = brands as { make: string; count: number }[];

/** Four columns, split alphabetically over roughly equal lengths. */
function columns(items: typeof BRANDS, count = 4) {
  const size = Math.ceil(items.length / count);
  return Array.from({ length: count }, (_, i) => items.slice(i * size, (i + 1) * size))
    .filter((column) => column.length > 0);
}

export default function BrandMegaMenu() {
  const groups = columns(BRANDS);

  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: '1.5rem',
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '0 0 8px 8px',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      padding: '2rem',
      width: '800px',
      display: 'grid',
      gridTemplateColumns: `repeat(${groups.length}, 1fr)`,
      gap: '2rem',
      zIndex: 100,
      cursor: 'default',
    }}>
      {groups.map((group, idx) => (
        <div
          key={group[0].make}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            borderRight: idx !== groups.length - 1 ? '1px solid #f1f5f9' : 'none',
            paddingRight: idx !== groups.length - 1 ? '2rem' : '0',
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
            {group[0].make.charAt(0)} – {group.at(-1)!.make.charAt(0)}
          </h3>
          {group.map(({ make, count }) => (
            <Link
              href={`/webshop/catalogus?make=${encodeURIComponent(make)}`}
              key={make}
              style={{
                color: '#475569',
                textDecoration: 'none',
                fontSize: '0.92rem',
                fontWeight: 500,
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#b93c20')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#475569')}
            >
              {make}
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{count}</span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
