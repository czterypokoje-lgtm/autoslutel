import React from 'react';
import Link from 'next/link';
import { shelfPrice, formatPrice } from '@/lib/catalog';
import { getShopProducts } from '@/lib/shopCatalog';

/**
 * The offers block on the webshop home.
 *
 * It used to render six placeholder tiles — "Behuizing 1" through "Behuizing
 * 6", all at €14,00, all labelled "Prijsdaling", all illustrated with
 * placehold.co images and all linking back to /webshop. Six products that do
 * not exist, each carrying a price-drop claim.
 *
 * An article is on offer here on the same rule as /webshop/aanbiedingen: the
 * office set a price below what the margin rule asks, and the difference is
 * real. With nothing discounted the block does not render — an offers section
 * with no offers in it is the thing that produced the fake tiles in the first
 * place.
 */
export default async function PromoBanner() {
  const products = await getShopProducts('public');

  const offers = products
    .map((product) => {
      const normal = shelfPrice(product.costPrice);
      const discount =
        product.priceIsManual && product.price != null && normal != null && product.price < normal
          ? (normal - product.price) / normal
          : 0;
      return { product, normal, discount };
    })
    .filter((o) => o.discount > 0)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 6);

  if (offers.length === 0) return null;

  return (
    <div style={{ background: '#f8fafc', borderRadius: 16, padding: '2rem' }}>
      {/* The heading lives here, not on the page: with nothing discounted the
          page used to keep "Bekijk onze beste aanbiedingen" above an empty
          block. */}
      <h2 style={{ marginBottom: '2rem', fontSize: '1.75rem', color: 'var(--webshop-dark)' }}>
        Bekijk onze beste aanbiedingen
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
          gap: '1rem',
        }}
      >
        {offers.map(({ product, normal, discount }) => (
          <Link
            href={`/webshop/product/${product.slug}`}
            key={product.slug}
            style={{
              background: '#fff', borderRadius: 12, padding: '1rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textDecoration: 'none', border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 700,
                padding: '0.2rem 0.5rem', borderRadius: 4, alignSelf: 'flex-start',
                marginBottom: '0.5rem',
              }}
            >
              −{Math.round(discount * 100)}%
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image ?? '/images/product-placeholder.svg'}
              alt={product.titleNl}
              style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: '1rem' }}
            />

            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>
              {product.titleNl}
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'baseline', marginTop: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatPrice(product.price)}</span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                {formatPrice(normal)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link href="/webshop/aanbiedingen" style={{ color: '#c2410c', fontWeight: 700, textDecoration: 'none' }}>
          Alle aanbiedingen bekijken →
        </Link>
      </div>
    </div>
  );
}
