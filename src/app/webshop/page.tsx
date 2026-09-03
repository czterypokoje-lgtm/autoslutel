import React from 'react';
import WebshopHero from '@/components/webshop/WebshopHero';
import TrustBar from '@/components/webshop/TrustBar';
import CategoryGrid from '@/components/webshop/CategoryGrid';
import ProductCarousel from '@/components/webshop/ProductCarousel';
import PromoBanner from '@/components/webshop/PromoBanner';
import TrustSection from '@/components/webshop/TrustSection';
import ArticlesSection from '@/components/webshop/ArticlesSection';
import { getShopProducts } from '@/lib/shopCatalog';

export const metadata = {
  // Not "OEM": this catalogue is aftermarket throughout, and the title is
  // the first place a customer is told what they are buying.
  title: 'Autosleutel24 Webshop — autosleutels, behuizingen & printplaten',
  description:
    'Vind de juiste autosleutel, behuizing of printplaat voor uw auto. Filter op frequentie, ' +
    'transponder en sleutelbaard. Bestel online voor minder dan de dealerprijs.',
};

export default async function WebshopPage() {
  /*
   * Through the merged catalogue, not the raw feed: a product the office took
   * offline was still on this carousel, and a corrected price was not.
   * Products marked featured in the CRM lead; the rest fills up the row.
   */
  const all = await getShopProducts('public');
  const withPhoto = all.filter((p) => p.image && !p.image.includes('placeholder'));
  const featuredProducts = [
    ...withPhoto.filter((p) => p.featured),
    ...withPhoto.filter((p) => !p.featured),
  ].slice(0, 8);

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
          <PromoBanner />
        </div>
      </section>

      <ArticlesSection />

      <TrustSection />

    </div>
  );
}

