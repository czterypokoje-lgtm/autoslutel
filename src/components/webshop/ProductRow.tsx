import React from 'react';
import Link from 'next/link';
import ProductCarousel from '@/components/webshop/ProductCarousel';
import { facetLabel } from '@/lib/catalog';
import { getShopProducts, type ShopProduct } from '@/lib/shopCatalog';

/**
 * One shelf of the shop on the home page: a heading, a row of real products
 * and a way through to the rest of that category.
 *
 * The home page had a single row of eight products and then three blocks that
 * were either empty or editorial, so a shop with 924 articles read as though
 * it had eight. Each row here is a category someone actually arrives looking
 * for, and the "alles bekijken" link goes to that category filtered.
 */
export default async function ProductRow({
  category,
  title,
  limit = 10,
}: {
  category: string;
  /** Overrides the category's own name when a plainer word reads better. */
  title?: string;
  limit?: number;
}) {
  const all = await getShopProducts('public');

  const products: ShopProduct[] = all
    .filter((p) => p.category === category)
    // A row of placeholders sells nothing; photographed products first.
    .filter((p) => p.image && !p.image.includes('placeholder'))
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      // Then the ones we can say most about — specs answer the buying question.
      return (b.specs?.length ?? 0) - (a.specs?.length ?? 0);
    })
    .slice(0, limit);

  if (products.length < 4) return null;

  const heading = title ?? facetLabel('category', category);
  const href = `/webshop/catalogus?category=${category}`;

  return (
    <section style={{ padding: 'clamp(2rem, 6vw, 3.5rem) 0' }}>
      <div className="container">
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', color: 'var(--webshop-dark)' }}>
            {heading}
          </h2>
          <Link
            href={href}
            style={{ color: '#c2410c', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', fontSize: '.9rem' }}
          >
            Alles bekijken →
          </Link>
        </div>

        <ProductCarousel products={products} />
      </div>
    </section>
  );
}
