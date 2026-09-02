import React from 'react';
import Link from 'next/link';

export default function PromoBanner() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', background: '#f8fafc', borderRadius: '16px', overflow: 'hidden' }} className="md:grid-cols-2 grid-cols-1">
      
      {/* Left side: Lifestyle Image */}
      <div style={{ background: 'url(https://placehold.co/800x800/22543d/ffffff?text=Autosleutel+Promo) center center no-repeat', backgroundSize: 'cover', minHeight: '400px' }} />

      {/* Right side: Top products grid */}
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[1,2,3,4,5,6].map((i) => (
            <Link href="/webshop" key={i} style={{ background: '#fff', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', border: '1px solid #e2e8f0' }}>
              <div style={{ background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', alignSelf: 'flex-start', marginBottom: '0.5rem' }}>
                Prijsdaling
              </div>
              <img src={`https://placehold.co/100x100/transparent/121212?text=Sleutel+${i}`} alt={`Sleutel ${i}`} style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '1rem' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0f172a' }}>Behuizing {i}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', marginBottom: '0.5rem' }}>Heel goed • Zwart</div>
              <div style={{ fontWeight: 'bold', color: '#0f172a' }}>€14.<sup>00</sup></div>
            </Link>
          ))}
        </div>
      </div>
      
    </div>
  );
}
