import React from 'react';
import type { Metadata } from 'next';
import CartView from '@/components/webshop/CartView';
import { getProducts } from '@/lib/catalog';

export const metadata: Metadata = {
  title: { absolute: 'Winkelmand | Autosleutel24' },
  robots: { index: false, follow: false },
};

export default function CartPage() {
  // Only the fields the basket needs, so the full catalogue stays on the
  // server instead of shipping ~2 MB of JSON to the browser.
  const slim = getProducts('public').map((p) => ({
    slug: p.slug,
    titleNl: p.titleNl,
    costPrice: p.costPrice,
    image: p.image,
    category: p.category,
  }));

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.5rem' }}>
        Winkelmand
      </h1>
      <CartView products={slim} />
    </div>
  );
}
