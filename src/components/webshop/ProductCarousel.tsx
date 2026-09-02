import React from 'react';
import ProductCard from './ProductCard';
import { shelfPrice, formatPrice, type CatalogProduct } from '@/lib/catalog';

interface ProductCarouselProps {
  products: CatalogProduct[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  return (
    <div className="snap-carousel">
      {products.map((p, i) => {
        const price = shelfPrice(p.costPrice);
        const oldPrice = price ? price * 1.4 : null;
        const image = p.image ?? 'https://placehold.co/600x600/transparent/121212?text=No+Image';

        return (
          <div key={p.id} className="snap-carousel-item" style={{ width: '280px', flexShrink: 0 }}>
            <ProductCard
              id={0}
              slug={p.slug}
              title={p.titleNl}
              category={p.category ?? 'Auto-onderdeel'}
              price={formatPrice(price)}
              oldPrice={oldPrice ? formatPrice(oldPrice) : undefined}
              img={image}
              isBestOf={i === 0 || i === 3}
            />
          </div>
        );
      })}
    </div>
  );
}
