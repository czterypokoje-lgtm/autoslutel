import React from 'react';
import ProductCard from './ProductCard';
import { formatPrice, facetLabel } from '@/lib/catalog';
import type { ShopProduct } from '@/lib/shopCatalog';

interface ProductCarouselProps {
  products: ShopProduct[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  return (
    <div className="snap-carousel">
      {products.map((p) => (
        <div key={p.id} className="snap-carousel-item" style={{ width: '280px', flexShrink: 0 }}>
          <ProductCard
            slug={p.slug}
            title={p.titleNl}
            category={p.category ? facetLabel('category', p.category) : 'Auto-onderdeel'}
            /*
             * The merged price, so a price the office corrected is the price on
             * the card. The struck-through "oldPrice" that used to sit next to
             * it was `price * 1.4` — a reference price nobody was ever charged.
             */
            price={formatPrice(p.price)}
            img={p.image ?? '/images/product-placeholder.svg'}
            inStock={p.inStock}
          />
        </div>
      ))}
    </div>
  );
}
