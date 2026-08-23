import React from 'react';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import ProductBundleSection from '@/components/webshop/ProductBundleSection';
import ProductBuyBox from '@/components/webshop/ProductBuyBox';
import FitmentWidget from '@/components/webshop/FitmentWidget';
import ProductAccordions from '@/components/webshop/ProductAccordions';
import { slugify, formatProductDescription } from '@/lib/utils';

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await props.params;
  
  const productsPath = path.join(process.cwd(), 'src/lib/scraped_products.json');
  const fileContents = fs.readFileSync(productsPath, 'utf8');
  const products = JSON.parse(fileContents);
  
  // Find product by slug
  const product = products.find((p: any) => slugify(p.title) === resolvedParams.slug);

  if (!product) {
    notFound();
  }

  // Load bundle mapping
  let bundleMapping: any = {};
  try {
    const mappingPath = path.join(process.cwd(), 'src/lib/bundle_mapping.json');
    bundleMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  } catch (e) {
    console.error('Could not load bundle_mapping.json');
  }

  const bundleData = bundleMapping[resolvedParams.slug] || {};
  const batteryData = bundleData.battery || null;

  const rawPrice = product.price || 24.95;
  const price = typeof rawPrice === 'string' ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) : parseFloat(rawPrice);
  const rawOldPrice = product.compareAtPrice;
  const oldPrice = rawOldPrice 
    ? (typeof rawOldPrice === 'string' ? parseFloat(rawOldPrice.replace(/[^0-9.]/g, '')) : parseFloat(rawOldPrice))
    : parseFloat((price * 1.4).toFixed(2));

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', padding: '2rem 0', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Fitment Widget Header */}
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', marginBottom: '1.5rem' }}>
        <FitmentWidget />
      </div>

      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Main 2-Col Layout (Left: Gallery & Bundles, Right: Buy Box) */}
        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '3rem', alignItems: 'start' }}>
          
          {/* Left: Gallery & Bundle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Main Image */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
               <img src={product.imageOriginalUrl || product.imageUrl || '/images/bmw-key-desktop.png'} alt={product.title} style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
            </div>

            {/* Dynamic Bundle Section */}
            <ProductBundleSection 
              mainProductTitle={product.title} 
              mainProductPrice={price} 
              mainProductImage={product.imageOriginalUrl || product.imageUrl || '/images/bmw-key-desktop.png'}
              batteryData={batteryData}
            />
          </div>

          {/* Right: Details (Crutchfield Style) */}
          <div style={{ paddingRight: '2rem' }}>
            <ProductBuyBox 
              title={product.title} 
              price={price} 
              oldPrice={oldPrice} 
              description={formatProductDescription(product.description)} 
            />
          </div>
        </div>
      </div>

      {/* Below the Fold: Product Highlights (Beige Background) */}
      <div style={{ background: '#f6f4eb', padding: '4rem 1rem', marginTop: '2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          
          <ProductAccordions product={product} />

        </div>
      </div>

    </div>
  );
}
