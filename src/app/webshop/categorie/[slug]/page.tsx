import React from 'react';
import ProductCardList from '@/components/webshop/ProductCardList';
import NewsletterModal from '@/components/webshop/NewsletterModal';
import SidebarFilter from '@/components/webshop/SidebarFilter';
import VehicleFitmentWidget from '@/components/webshop/VehicleFitmentWidget';
import Link from 'next/link';

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;
  
  // Format slug to readable category title
  const categoryTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const fs = require('fs');
  const path = require('path');
  const productsPath = path.join(process.cwd(), 'src/lib/scraped_products.json');
  let products = [];
  try {
    const fileContents = fs.readFileSync(productsPath, 'utf8');
    const allProducts = JSON.parse(fileContents);
    
    let searchTerms = [slug.toLowerCase().replace(/-/g, ' ')];
    let excludeTerms: string[] = [];
    if (slug.toLowerCase() === 'batterijen') {
      searchTerms = ['batter'];
    } else if (slug.toLowerCase() === 'behuizingen') {
      searchTerms = ['case', 'shell', 'behuizing', 'empty fob'];
      excludeTerms = ['blade', 'tool', 'lishi', 'pick', 'storage', 'carry', 'bundle', 'cut', 'machine', 'blank'];
    } else if (slug.toLowerCase() === 'sleutelbaarden') {
      searchTerms = ['blade', 'blank'];
      excludeTerms = ['lishi', 'pick', 'case', 'shell', 'machine'];
    }
    products = allProducts.filter((p: any) => {
      const titleLower = (p.title || '').toLowerCase();
      const tagsLower = (p.tags || '').toLowerCase();
      const brandLower = (p.brand || '').toLowerCase();
      
      const hasSearchTerm = searchTerms.some(term => titleLower.includes(term) || tagsLower.includes(term) || brandLower.includes(term));
      const hasExcludeTerm = excludeTerms.length > 0 && excludeTerms.some(term => titleLower.includes(term) || tagsLower.includes(term) || brandLower.includes(term));
      
      return hasSearchTerm && !hasExcludeTerm;
    }).map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      oldPrice: p.compareAtPrice || (parseFloat(p.price || 0) * 1.4).toFixed(2),
      img: p.imageOriginalUrl || p.imageUrl || '/images/bmw-key-desktop.png'
    }));
  } catch (e) {
    console.error("Failed to load products for category", e);
  }

  return (
    <div style={{ background: '#f6f4eb', minHeight: '100vh', paddingBottom: '6rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top Header Section (White background) */}
      <div style={{ background: '#fff', padding: '1.5rem 0 2rem 0', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: '1600px', width: '95%', margin: '0 auto' }}>
          
          {/* Breadcrumbs */}
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
            <Link href="/" style={{ color: '#0f172a', textDecoration: 'none' }}>Home</Link> /{' '}
            <Link href="/webshop" style={{ color: '#0f172a', textDecoration: 'none' }}>Webshop</Link> /{' '}
            <span>{categoryTitle}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
                {categoryTitle}
              </h1>
              <div style={{ color: '#0f172a', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {products.length} total items
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
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1600px', width: '95%', margin: '0 auto', paddingTop: '2rem' }}>
        
        {/* Fitment Widget */}
        <VehicleFitmentWidget />

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left Sidebar */}
          <div>
            <SidebarFilter />
          </div>

          {/* Right Content - Single Column List */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {products.map((p, i) => (
              <ProductCardList
                key={i}
                id={p.id}
                title={p.title}
                category={categoryTitle}
                price={p.price}
                oldPrice={p.oldPrice}
                img={p.img}
                isBestOf={i === 0 || i === 1}
              />
            ))}
          </div>
        </div>
      </div>

      <NewsletterModal />
    </div>
  );
}
