import React from 'react';
import Link from 'next/link';

export default function HomeActionBanners() {
  return (
    <section style={{ padding: '4rem 0', background: '#fff' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2rem',
          textAlign: 'center',
          alignItems: 'end' // Aligns the text links at the bottom evenly
        }}>
          
          {/* Column 1: Locations */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '1.5rem', minHeight: '180px' }}>
              {/* Graphic Placeholder mimicking the Map */}
              <div style={{ position: 'relative', margin: '0 auto' }}>
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#65a30d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
                  <line x1="9" y1="3" x2="9" y2="18"></line>
                  <line x1="15" y1="6" x2="15" y2="21"></line>
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: 900, color: '#4d7c0f', fontSize: '1.5rem', whiteSpace: 'nowrap' }}>
                  60+
                </div>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '1rem', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Regio's<br/>in Nederland
              </h3>
            </div>
            <Link href="/steden" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1a1a1a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              Bekijk ons werkgebied <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Column 2: Contact Us */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '1.5rem', minHeight: '180px' }}>
              <div style={{ position: 'relative', margin: '0 auto 1rem auto' }}>
                {/* Back Bubble */}
                <svg width="80" height="80" viewBox="0 0 24 24" fill="#d9f99d" style={{ position: 'absolute', left: '-20px', top: '-10px', zIndex: 1 }}>
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                {/* Front Bubble */}
                <svg width="90" height="90" viewBox="0 0 24 24" fill="#84cc16" style={{ position: 'relative', zIndex: 2 }}>
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  <circle cx="8" cy="11" r="1.5" fill="#fff"></circle>
                  <circle cx="12" cy="11" r="1.5" fill="#fff"></circle>
                  <circle cx="16" cy="11" r="1.5" fill="#fff"></circle>
                </svg>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: '0 0 0.25rem 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kunt u niet vinden wat u zoekt?
              </p>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#65a30d', margin: 0, textTransform: 'uppercase' }}>
                Neem Contact Op
              </h3>
            </div>
            <Link href="/contact" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1a1a1a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              Neem contact op <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Column 3: Track Your Order */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '1.5rem', minHeight: '180px', position: 'relative' }}>
              <svg width="140" height="140" viewBox="0 0 24 24" fill="#f3f4f6" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 0 }}>
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1a1a1a', margin: '0', lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Volg
                </h3>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#4b5563', margin: '0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Je Bestelling
                </h3>
              </div>
              {/* Courier Logos Placeholder */}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#ef4444', color: '#fff', padding: '0.15rem 0.4rem', borderRadius: '2px' }}>POSTNL</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#fbbf24', color: '#b45309', padding: '0.15rem 0.4rem', borderRadius: '2px' }}>DHL</span>
              </div>
            </div>
            <Link href="/webshop/orders" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1a1a1a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              Volg je bestelling <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Column 4: Facebook */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '1.5rem', minHeight: '180px' }}>
              <div style={{ width: '100px', height: '140px', background: '#1877f2', borderRadius: '12px', padding: '0.5rem', margin: '0 auto', display: 'flex', flexDirection: 'column', color: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <div style={{ width: '12px', height: '12px', background: '#fff', borderRadius: '50%', display: 'inline-block' }}></div>
                  Autosleutel24
                </div>
                <div style={{ flexGrow: 1, background: '#fff', borderRadius: '4px', opacity: 0.9 }}>
                  {/* Mock content blocks */}
                  <div style={{ height: '30%', background: '#f1f5f9', borderTopLeftRadius: '4px', borderTopRightRadius: '4px', marginBottom: '4px' }}></div>
                  <div style={{ height: '10px', background: '#e2e8f0', margin: '4px', borderRadius: '2px', width: '60%' }}></div>
                  <div style={{ height: '10px', background: '#e2e8f0', margin: '4px', borderRadius: '2px', width: '80%' }}></div>
                </div>
                <div style={{ marginTop: '0.5rem', background: '#0c5cce', borderRadius: '4px', textAlign: 'center', fontSize: '0.6rem', padding: '0.2rem 0', fontWeight: 700 }}>
                  Follow
                </div>
              </div>
            </div>
            <a href="https://facebook.com/autosleutel24" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1a1a1a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              Volg ons op Facebook <span aria-hidden="true">→</span>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
