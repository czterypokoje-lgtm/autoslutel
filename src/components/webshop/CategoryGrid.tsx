import React from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { name: 'Afstandsbedieningen', slug: 'afstandsbedieningen', emoji: '📡' },
  { name: 'Smart Keys / Keyless', slug: 'smart-keys', emoji: '🔑' },
  { name: 'Sloten & Cilinders', slug: 'sloten', emoji: '🔒' },
  { name: 'Sleutelbaarden', slug: 'sleutelbaarden', emoji: '🗝️' },
  { name: 'Transponders', slug: 'transponders', emoji: '📶' },
  { name: 'Sleutelbehuizingen', slug: 'behuizingen', emoji: '🧩' },
  { name: 'Batterijen', slug: 'batterijen', emoji: '🔋' },
  { name: 'Gereedschap', slug: 'gereedschap', emoji: '🔧' },
  { name: 'Accessoires', slug: 'accessoires', emoji: '🛒' },
];

export default function CategoryGrid() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
      {CATEGORIES.map((cat) => (
        <Link
          href={`/webshop/catalogus?category=${cat.slug}`}
          key={cat.slug}
          className="category-card"
          style={{ textDecoration: 'none' }}
        >
          <div className="category-card-img-wrapper" style={{ fontSize: '2.5rem', textAlign: 'center', padding: '1rem' }}>
            {cat.emoji}
          </div>
          <div className="category-card-title">{cat.name}</div>
        </Link>
      ))}
    </div>
  );
}
