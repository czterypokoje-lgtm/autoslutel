'use client';
import React, { useState } from 'react';

export default function ProductGallery({ images }: { images?: string[] }) {
  const dummyImages = images || [
    'https://placehold.co/400x300/f8fafc/121212?text=Thumb+1',
    'https://placehold.co/400x300/f8fafc/121212?text=Thumb+2',
    'https://placehold.co/400x300/f8fafc/121212?text=Thumb+3',
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      
      {/* Main Image Container (Crutchfield style: wide, border, white bg) */}
      <div style={{ 
        width: '100%', 
        background: '#fff', 
        border: '1px solid #e2e8f0',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        aspectRatio: '16/11', // Wide format
        position: 'relative',
        padding: '2rem'
      }}>
        <img 
          src={dummyImages[activeIndex]} 
          alt="Main Product" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
        
        {/* Sticker/Badge (OEM Kwaliteit) */}
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          width: '70px',
          height: '70px',
          background: 'var(--webshop-lime-light)',
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          transform: 'rotate(15deg)'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--webshop-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.15rem' }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--webshop-dark)', textTransform: 'uppercase', lineHeight: 1.1 }}>OEM<br/>Kwaliteit</span>
        </div>
      </div>

      {/* Thumbnail Strip (Horizontal underneath, like Crutchfield) */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        {dummyImages.map((src, i) => (
          <div 
            key={i} 
            style={{ 
              width: '60px', 
              height: '60px', 
              border: i === activeIndex ? '2px solid #b93c20' : '1px solid #cbd5e1', 
              padding: '0.2rem',
              cursor: 'pointer',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setActiveIndex(i)}
          >
            <img src={src} alt={`Thumb ${i}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        ))}
      </div>

    </div>
  );
}
