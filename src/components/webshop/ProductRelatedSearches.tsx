import React from 'react';
import Link from 'next/link';
import type { ShopProduct } from '@/lib/shopCatalog';
import { facetLabel } from '@/lib/catalog';

export default function ProductRelatedSearches({ product }: { product: ShopProduct }) {
  const searches = [];

  if (product.makes && product.makes.length > 0) {
    const primaryMake = product.makes[0];
    searches.push({
      label: `${primaryMake} autosleutels`,
      href: `/webshop/merk/${primaryMake.toLowerCase()}`
    });
    
    if (product.category) {
      searches.push({
        label: `${primaryMake} ${facetLabel('category', product.category).toLowerCase()}`,
        href: `/webshop/catalogus?makes=${primaryMake}&category=${product.category}`
      });
    }
  }

  if (product.category) {
    searches.push({
      label: `Alle ${facetLabel('category', product.category).toLowerCase()}`,
      href: `/webshop/catalogus?category=${product.category}`
    });
  }

  if (searches.length === 0) return null;

  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
        Gerelateerde zoekopdrachten
      </h2>
      <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1.5rem' }}>
        Zoekopdrachten gerelateerd aan {product.titleNl.toLowerCase()}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem' }}>
        {searches.map((search) => (
          <Link
            key={search.label}
            href={search.href}
            className="related-search-link"
          >
            {search.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
