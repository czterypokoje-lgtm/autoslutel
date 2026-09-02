'use client';
import React from 'react';
import Link from 'next/link';
import { VEHICLE_DATA } from '@/lib/vehicleData';
import NewsletterModal from '@/components/webshop/NewsletterModal';
import MerkenHero from '@/components/webshop/MerkenHero';

export default function MerkenPage() {
  const brands = Object.keys(VEHICLE_DATA).sort();

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
          {brands.map(brand => (
            <Link 
              href={`/webshop/catalogus?make=${brand.toLowerCase()}`}
              key={brand}
              className="brand-square-card"
            >
              {/* Mock Brand Logo/Image */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <img 
                  src={`https://placehold.co/200x120/fff/cbd5e1?text=${brand}`} 
                  alt={`${brand} logo`} 
                  style={{ maxWidth: '80%', maxHeight: '100px', objectFit: 'contain' }}
                />
              </div>
              
              {/* Brand Title */}
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 800, 
                marginTop: '1.5rem', 
                marginBottom: 0,
                textAlign: 'center'
              }}>
                {brand}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem', textAlign: 'center' }}>
                Alle {brand} sleutels
              </p>
            </Link>
          ))}
        </div>
      </div>

      <NewsletterModal />
    </div>
  );
}
