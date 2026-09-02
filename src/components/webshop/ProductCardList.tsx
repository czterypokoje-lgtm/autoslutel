import React from 'react';
import Link from 'next/link';
import { slugify } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  category: string; 
  price: string;
  oldPrice?: string;
  img: string;
  isBestOf?: boolean;
}

export default function ProductCard({ id, slug, title, category, price, oldPrice, img, isBestOf }: ProductCardProps) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '8px',
      padding: '1.5rem',
      position: 'relative',
      display: 'flex',
      gap: '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
      fontFamily: 'Inter, sans-serif',
      marginBottom: '1rem',
      alignItems: 'stretch'
    }}>
      
      {/* Left Column: Badges & Image */}
      <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
          <span style={{ background: '#334155', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
            Top seller
          </span>
          {isBestOf && (
            <span style={{ background: '#0d9488', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
              Best of 2026
            </span>
          )}
        </div>
        
        <Link href={`/webshop/product/${slug}`} style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: '1.5rem' }}>
          <img 
            src={img} 
            alt={title} 
            style={{ width: '100%', maxWidth: '240px', objectFit: 'contain' }}
          />
        </Link>
      </div>

      {/* Middle Column: Details */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Link href={`/webshop/product/${slug}`} style={{ textDecoration: 'none', color: '#0f172a' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.25rem' }}>{title}</h2>
          <div style={{ fontSize: '1rem', color: '#475569', marginBottom: '0.75rem' }}>High quality OEM replacement part</div>
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          In stock
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#0f172a', marginBottom: '0.4rem' }}>Option: <strong>Zwart</strong></div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Mock Swatches */}
            <div style={{ width: '36px', height: '24px', border: '2px solid #dc2626', borderRadius: '4px', background: '#1e293b' }}></div>
            <div style={{ width: '36px', height: '24px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#94a3b8' }}></div>
            <div style={{ width: '36px', height: '24px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#ef4444' }}></div>
          </div>
        </div>

        <ul style={{ paddingLeft: '1.2rem', margin: 0, color: '#0f172a', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', listStyleType: 'disc' }}>
          <li>Perfecte pasvorm voor originele behuizing</li>
          <li>Inclusief ongeslepen sleutelblad (indien van toepassing)</li>
          <li>Eenvoudig overzetten van de interne elektronica</li>
        </ul>
      </div>

      {/* Right Column: Price & Action */}
      <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderLeft: '1px solid #f1f5f9', paddingLeft: '2rem' }}>
        {/* Fabricated rating removed — see ProductCard.tsx */}

        <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.75rem' }}>
          Free shipping
        </div>

        {oldPrice && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '0.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', textDecoration: 'line-through' }}>
              €{oldPrice} ⓘ
            </div>
            <div style={{ background: '#16a34a', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '0.2rem' }}>
              Save €{(parseFloat(oldPrice) - parseFloat(price)).toFixed(2)}
            </div>
          </div>
        )}

        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.5px' }}>
          €{price}
        </div>

        <button style={{
          width: '100%',
          background: '#c2410c', // Crutchfield orange/red
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: 'pointer',
          padding: '0.75rem 0',
          marginBottom: '1rem'
        }}>
          Add to cart
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', fontSize: '0.75rem', color: '#0f172a', fontWeight: 600, marginBottom: 'auto' }}>
          <div>Open Box: <span style={{fontWeight: 400}}>€{(parseFloat(price) * 0.85).toFixed(2)}</span></div>
          <div>Scratch & Dent: <span style={{fontWeight: 400}}>€{(parseFloat(price) * 0.8).toFixed(2)}</span></div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#0f172a' }}>
          <input type="checkbox" style={{ width: '14px', height: '14px' }} />
          Compare
        </div>

      </div>

    </div>
  );
}
