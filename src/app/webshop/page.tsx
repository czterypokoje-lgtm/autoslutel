import React from 'react';
import WebshopHero from '@/components/webshop/WebshopHero';
import TrustBar from '@/components/webshop/TrustBar';
import CategoryGrid from '@/components/webshop/CategoryGrid';
import ProductCarousel from '@/components/webshop/ProductCarousel';
import PromoBanner from '@/components/webshop/PromoBanner';
import TrustSection from '@/components/webshop/TrustSection';
import ArticlesSection from '@/components/webshop/ArticlesSection';
import { getProducts } from '@/lib/catalog';

export const metadata = {
  title: 'Autosleutel24 Webshop - OEM Sleutels & Behuizingen',
  description: 'Vind de juiste autosleutel, batterij of behuizing voor uw auto. Bestel direct online voor minder dan de dealer prijs.',
};

export default function WebshopPage() {
  const featuredProducts = getProducts('public').slice(0, 8);

  return (
    <div>
      <WebshopHero />
      <TrustBar />

      <section className="section" id="categorieen">
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '2rem', color: 'var(--webshop-dark)' }}>
            Meest gezochte categorieën
          </h2>
          <CategoryGrid />
        </div>
      </section>

      <section style={{ padding: '4rem 0', background: 'var(--webshop-bg)' }}>
        <div className="container">
          <h2 style={{ marginBottom: '2.5rem', fontSize: '1.75rem', color: 'var(--webshop-dark)' }}>
            Aanbevolen voor jou
          </h2>
          <ProductCarousel products={featuredProducts} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ marginBottom: '2.5rem', fontSize: '1.75rem', color: 'var(--webshop-dark)' }}>
            Bekijk onze beste aanbiedingen
          </h2>
          <PromoBanner />
        </div>
      </section>

      <ArticlesSection />

      <TrustSection />

    </div>
  );
}

