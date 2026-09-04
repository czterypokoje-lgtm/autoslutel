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

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '1px solid #cbd5e1',
    background: 'rgba(255,255,255,.92)',
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
  };

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
          Arrows on the photo itself. The thumbnail strip is 60px on a phone —
          a fiddly target — and swiping a static <img> does nothing.
        */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Vorige foto"
              onClick={() => setActiveIndex((i) => (i - 1 + photos.length) % photos.length)}
              style={{ ...arrowStyle, left: '.6rem' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              type="button"
              aria-label="Volgende foto"
              onClick={() => setActiveIndex((i) => (i + 1) % photos.length)}
              style={{ ...arrowStyle, right: '.6rem' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>

            <span
              style={{
                position: 'absolute', bottom: '.6rem', right: '.75rem',
                background: 'rgba(15,23,42,.72)', color: '#fff', borderRadius: 999,
                fontSize: '.72rem', fontWeight: 600, padding: '.15rem .55rem',
              }}
            >
              {activeIndex + 1} / {photos.length}
            </span>
          </>
        )}
        
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
