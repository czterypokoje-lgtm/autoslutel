import React from 'react';
import Link from 'next/link';
import NewsletterModal from '@/components/webshop/NewsletterModal';
import MerkenHero from '@/components/webshop/MerkenHero';
import brandData from '@/lib/brands.json';

/*
 * The makes we stock, from the catalogue rather than from VEHICLE_DATA.
 *
 * VEHICLE_DATA is the list of cars we can drive out to and open — it is not
 * the list of keys we sell, and the two are not the same. Every make in it
 * without a product behind it opened an empty catalogue page.
 */
const BRANDS = brandData as { make: string; count: number }[];

export default function MerkenPage() {

  return (
    <div style={{ background: '#f6f4eb', minHeight: '100vh', paddingBottom: '6rem', fontFamily: 'Inter, sans-serif' }}>
      
      <MerkenHero />

      {/* Main Content Area (Beige background) */}
      <div className="container" style={{ paddingTop: '1.5rem' }}>
        
        {/* CSS for hover effects on these specific cards */}
        <style>{`
          .brand-square-card {
            background: #fff;
            border-radius: 12px;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: #0f172a;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease-in-out;
            aspect-ratio: 1 / 1;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          }
          .brand-square-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);
            border-color: #cbd5e1;
          }
          .brand-square-card img {
            transition: transform 0.2s;
          }
          .brand-square-card:hover img {
            transform: scale(1.05);
          }
        `}</style>

        {/* Brands Grid - 4 Columns */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          {BRANDS.map(({ make, count }) => (
            <Link
              href={`/webshop/catalogus?make=${encodeURIComponent(make)}`}
              key={make}
              className="brand-square-card"
            >
              {/*
                A wordmark, not a logo. The tiles used to load a placehold.co
                image per brand; the manufacturers' real logos are trademarks we
                have no licence to display.
              */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#cbd5e1', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center' }}>
                  {make}
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '1.5rem', marginBottom: 0, textAlign: 'center' }}>
                {make}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', textAlign: 'center' }}>
                {count} {count === 1 ? 'artikel' : 'artikelen'}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <NewsletterModal />
    </div>
  );
}
