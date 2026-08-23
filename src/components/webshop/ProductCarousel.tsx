import React from 'react';
import ProductCard from './ProductCard';
import { slugify } from '@/lib/utils';
import allScrapedProducts from '@/lib/scraped_products.json';

export default function ProductCarousel() {
  // Grab a few real products for the carousel
  const products = allScrapedProducts.slice(0, 8);

  return (
    <div className="snap-carousel">
      {products.map((p: any, i: number) => {
        const slug = slugify(p.title);
        const price = p.price || '0.00';
        const oldPrice = price !== '0.00' ? (parseFloat(price) * 1.3).toFixed(2) : '0.00';
        const image = p.imageLocalPath || p.imageOriginalUrl || 'https://placehold.co/600x600/transparent/121212?text=No+Image';

        return (
          <div key={p.id || i} className="snap-carousel-item" style={{ width: '280px', flexShrink: 0 }}>
            <ProductCard
              id={p.id}
              slug={slug}
              title={p.title}
              category="OEM Kwaliteit Auto-onderdeel"
              price={price}
              oldPrice={oldPrice}
              img={image}
              isBestOf={i === 0 || i === 3}
            />
          </div>
        );
      })}
    </div>
  );
}
