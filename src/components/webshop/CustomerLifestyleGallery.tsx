import React from 'react';

export default function CustomerLifestyleGallery() {
  const images = [
    '/images/lifestyle/lifestyle_1.jpg',
    '/images/lifestyle/lifestyle_2.jpg',
    '/images/lifestyle/lifestyle_3.jpg',
  ];

  return (
    <section style={{ background: '#fff', borderTop: '1px solid #e5e5e5' }}>
      <div style={{ textAlign: 'center', padding: '3rem 1.5rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Sinds 2014 honderden tevreden klanten geholpen
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem', marginBottom: '2rem' }}>
          Jouw autosleutel is bij ons in goede handen
        </p>
      </div>

      <div style={{ display: 'flex', width: '100%', overflowX: 'auto', gap: '2px' }}>
        {images.map((src, i) => (
          <div key={i} style={{ flex: '1 0 33%', minWidth: '250px', aspectRatio: '1/1', position: 'relative' }}>
            <img 
              src={src} 
              alt={`Tevreden klant ${i + 1}`} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
