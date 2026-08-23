import React from 'react';
import Link from 'next/link';

export default function CategoryGrid() {
  const categories = [
    { name: 'Sleutelbehuizingen', slug: 'behuizingen', image: 'https://placehold.co/150x150/transparent/121212?text=Behuizing' },
    { name: 'Batterijen', slug: 'batterijen', image: 'https://placehold.co/150x150/transparent/121212?text=Batterij' },
    { name: 'OEM Sleutels', slug: 'oem-sleutels', image: 'https://placehold.co/150x150/transparent/121212?text=OEM+Sleutel' },
    { name: 'Smart Keys', slug: 'smart-keys', image: 'https://placehold.co/150x150/transparent/121212?text=Smart+Key' },
    { name: 'Accessoires', slug: 'accessoires', image: 'https://placehold.co/150x150/transparent/121212?text=Accessoires' },
    { name: 'Universal Keys', slug: 'universal-remotes', image: 'https://placehold.co/150x150/transparent/121212?text=Universal' },
    { name: 'Sleutelbaarden', slug: 'sleutelbaarden', image: 'https://placehold.co/150x150/transparent/121212?text=Blades' },
    { name: 'Goede deals', slug: 'aanbiedingen', image: 'https://placehold.co/150x150/transparent/121212?text=Deals' },
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
      {categories.map((cat, i) => (
        <Link href={`/webshop/categorie/${cat.slug}`} key={i} className="category-card">
          <div className="category-card-img-wrapper">
            <img src={cat.image} alt={cat.name} style={{ maxWidth: '120px', maxHeight: '120px', objectFit: 'contain' }} />
          </div>
          <div className="category-card-title">{cat.name}</div>
        </Link>
      ))}
    </div>
  );
}
