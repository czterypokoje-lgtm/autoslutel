'use client';
import React, { useState } from 'react';

export default function ProductGallery({ images }: { images?: string[] }) {
  /*
   * A product with no photo shows our own placeholder, not three
   * "Thumb 1 / Thumb 2 / Thumb 3" tiles fetched from placehold.co — which is
   * an external host the page does not need and which reads as a broken shop
   * when it is slow.
   */
  const photos = images && images.length > 0 ? images : ['/images/product-placeholder.svg'];

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
          src={photos[activeIndex]} 
          alt="Main Product" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
        
        {/*
          Removed: an "OEM Kwaliteit" seal stamped on every photo. These parts
          are aftermarket — the supplier's own listings say so — and a quality
          seal is not something a shop awards itself.
        */}
      </div>

      {/* Thumbnail Strip (Horizontal underneath, like Crutchfield) */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        {photos.length > 1 && photos.map((src, i) => (
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
