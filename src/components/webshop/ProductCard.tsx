import React from 'react';
import Link from 'next/link';

interface ProductCardProps {
  id: number;
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
      padding: '1.25rem',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Top Badges */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', zIndex: 10 }}>
        <span style={{ background: '#334155', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
          Top seller
        </span>
        {isBestOf && (
          <span style={{ background: '#0d9488', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px' }}>
            Best of 2026
          </span>
        )}
      </div>

      {/* Image */}
      <Link href={`/webshop/product/${slug}`} style={{ display: 'block', marginBottom: '1rem', textAlign: 'center', marginTop: '1.5rem' }}>
        <img 
          src={img} 
          alt={title} 
          width={160} 
          height={160} 
          style={{ objectFit: 'contain', margin: '0 auto', display: 'block' }}
        />
      </Link>

      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {category}
      </div>
      
      <Link href={`/webshop/product/${slug}`} style={{ textDecoration: 'none', color: '#0f172a' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
          {title}
        </h3>
      </Link>
      
      {/* Hollow Stars Mock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#eab308', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.9rem' }}>★★★★<span style={{color:'#cbd5e1'}}>★</span></span>
        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.2rem' }}>(59)</span>
      </div>

      {/* In Stock */}
      <div style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        In stock
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>€{price}</span>
        {oldPrice && (
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through' }}>
            €{oldPrice}
          </span>
        )}
      </div>

      {/* Bottom Button */}
      <Link href={`/webshop/product/${slug}`} style={{
        marginTop: 'auto',
        display: 'block',
        textAlign: 'center',
        background: '#b93c20',
        color: '#fff',
        padding: '0.75rem',
        borderRadius: '6px',
        fontWeight: 700,
        textDecoration: 'none',
        fontSize: '0.9rem',
        transition: 'background 0.2s',
      }}>
        Bekijk Product
      </Link>

    </div>
  );
}
