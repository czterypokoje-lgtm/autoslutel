import React from 'react';
import ProductCardList from '@/components/webshop/ProductCardList';
import NewsletterModal from '@/components/webshop/NewsletterModal';
import SidebarFilter from '@/components/webshop/SidebarFilter';
import VehicleFitmentWidget from '@/components/webshop/VehicleFitmentWidget';
import { VEHICLE_DATA } from '@/lib/vehicleData';
import Link from 'next/link';

export default async function BrandShopPage(props: { 
  params: Promise<{ merk: string }>,
  searchParams: Promise<{ model?: string, year?: string }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams || {};
  const { merk } = params;
  const { model = '', year = '' } = searchParams;
  
  // Format the brand name for display (e.g. alfa-romeo -> Alfa Romeo)
  const displayBrand = Object.keys(VEHICLE_DATA).find(b => b.toLowerCase().replace(/ /g, '-') === merk) 
    || merk.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // IMPORT REAL SCRAPED DATA
  const allScrapedProducts = require('@/lib/scraped_products.json');

  let products = [];
  
  // Clean up the brand string for matching (e.g., 'bmw' -> 'BMW')
  const brandRegex = new RegExp(merk, 'i');
  
  // 1. Filter by Brand (e.g. BMW, Skoda)
  let brandProducts = allScrapedProducts.filter((p: any) => brandRegex.test(p.brand) || brandRegex.test(p.tags));
  
  // Fallback: If no products found for this specific brand, just show generic from first few items
  if (brandProducts.length === 0) {
    brandProducts = allScrapedProducts.slice(0, 12);
  }

  // 2. Filter by Model Suitability (if a model is selected in the widget)
  products = brandProducts.filter((p: any) => {
    if (!model) return true; // Show all if no model selected
    // Tags are stored as a comma separated string: "BMW-3-Series-2020, BMW-5-Series-2018"
    // We check if the selected model (e.g. "3 Series") exists anywhere in the tags
    const lowerTags = (p.tags || '').toLowerCase();
    const lowerModel = model.toLowerCase().replace(/ /g, '-');
    return lowerTags.includes(lowerModel) || lowerTags.includes(model.toLowerCase());
  });

  // Map to the format expected by ProductCardList
  const formattedProducts = products.map((p: any) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    oldPrice: (parseFloat(p.price) * 1.3).toFixed(2), // Mock old price since API only gives current price
    img: p.imageLocalPath || p.imageOriginalUrl || 'https://placehold.co/400x400/transparent/121212?text=No+Image',
  }));

  return (
    <div style={{ background: '#f6f4eb', minHeight: '100vh', paddingBottom: '6rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top Header Section (White background) */}
      <div style={{ background: '#fff', padding: '1.5rem 0 2rem 0', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: '1600px', width: '95%', margin: '0 auto' }}>
          
          {/* Breadcrumbs */}
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            <Link href="/" style={{ color: '#0f172a', textDecoration: 'none' }}>Home</Link> /{' '}
            <Link href="/webshop" style={{ color: '#0f172a', textDecoration: 'none' }}>Webshop</Link> /{' '}
            <Link href="/webshop/merken" style={{ color: '#0f172a', textDecoration: 'none' }}>Merken</Link> /{' '}
            <span>{displayBrand}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
                {displayBrand} Autosleutels
              </h1>
              <div style={{ color: '#0f172a', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {formattedProducts.length} total items
              </div>

              {/* Simple Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button style={{ background: '#fff', border: '1px solid #0f172a', borderRadius: '4px', padding: '0.5rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                  Sorted by Featured
                </button>
                <button style={{ background: '#fff', border: '1px solid #0f172a', borderRadius: '4px', padding: '0.5rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                  Explore articles & videos
                </button>
              </div>
            </div>
            <Link href={`/merken/${merk}-autosleutel-bijmaken`} style={{
              display: 'inline-block',
              padding: '0.6rem 1.25rem',
              border: '2px solid #0f172a',
              borderRadius: '4px',
              color: '#0f172a',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
              background: '#fff'
            }}>
              Sleutel laten bijmaken? &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1600px', width: '95%', margin: '0 auto', paddingTop: '2rem' }}>
        
        {/* Fitment Widget */}
        <VehicleFitmentWidget defaultBrand={displayBrand} defaultModel={model} defaultYear={year} />

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left Sidebar */}
          <div>
            <SidebarFilter />
          </div>

          {/* Right Content - Single Column List */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', color: '#1a1a1a' }}>
              {model ? `Resultaten voor ${displayBrand} ${model}` : `Alle ${displayBrand} Producten`} ({formattedProducts.length})
            </h2>
            
            {formattedProducts.length > 0 ? (
              formattedProducts.map((p: any, i: number) => (
                <ProductCardList
                  key={i}
                  id={p.id}
                  slug={require("@/lib/utils").slugify(p.title)}
                title={p.title}
                  category={`${displayBrand} Onderdeel`}
                  price={p.price}
                  oldPrice={p.oldPrice}
                  img={p.img}
                  isBestOf={i === 0 || i === 1}
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: 12, border: '1px solid #eee' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.5rem' }}>Geen producten gevonden</h3>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>Er zijn momenteel geen producten beschikbaar voor de geselecteerde filters.</p>
                <button 
                  onClick={() => {}}
                  style={{
                    background: '#1a1a1a', color: '#fff', border: 'none', padding: '0.75rem 1.5rem',
                    borderRadius: 8, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <Link href={`/webshop/merk/${merk}`} style={{color: '#fff', textDecoration: 'none'}}>Wis Filters</Link>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <NewsletterModal />
    </div>
  );
}
