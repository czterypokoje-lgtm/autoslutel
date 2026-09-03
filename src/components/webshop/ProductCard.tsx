import React from 'react';
import Link from 'next/link';

interface ProductCardProps {
  slug: string;
  title: string;
  category: string;
  /** Already formatted by formatPrice — it carries its own euro sign. */
  price: string;
  img: string;
  inStock?: boolean;
}

export default function ProductCard({ slug, title, category, price, img, inStock = true }: ProductCardProps) {
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
      {/*
        Removed: a "Top seller" badge on every card and a "Best of 2026" badge
        on whichever two happened to be first and fourth in the carousel.
        Neither came from sales data.
      */}

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
      
      {/*
        No rating here on purpose. Every card used to show the same
        "★★★★☆ (59)" regardless of product — a fabricated review count is a
        misleidende handelspraktijk (BW 6:193c). Wire this to real, verified
        purchase reviews and it can come back.
      */}

      <div style={{ color: inStock ? '#16a34a' : '#b45309', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        {inStock ? 'Op voorraad' : 'Tijdelijk uitverkocht'}
      </div>

      {/*
        `price` arrives from formatPrice, which already writes the euro sign.
        The extra one here rendered every card as "€€12,95".
      */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{price}</span>
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
