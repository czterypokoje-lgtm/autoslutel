'use client';
import React from 'react';

export default function ProductTrustBanner() {
  return (
    <div style={{
      background: '#0f172a', // Dark slate background to match their theme
      borderTop: '4px solid #b93c20', // Signature orange top border
      padding: '2.5rem 0',
      marginTop: '4rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div className="container" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '2rem',
        color: '#fff'
      }}>
        
        {/* 1. Shipping Offers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ color: '#b93c20' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="21 16 12 21 3 16 3 8 12 3 21 8 21 16"></polygon>
              <polyline points="3 8 12 13 21 8"></polyline>
              <line x1="12" y1="13" x2="12" y2="21"></line>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.15rem' }}>Gratis Verzending</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Bij bestellingen vanaf €50</div>
          </div>
        </div>

        {/* 2. Money Guarantee */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ color: '#b93c20' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.15rem' }}>Niet Goed, Geld Terug</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>14 dagen bedenktijd</div>
          </div>
        </div>

        {/* 3. Online Support */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ color: '#b93c20' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.15rem' }}>Klantenservice</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Erkend technisch support</div>
          </div>
        </div>

        {/* 4. Flexible Payment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ color: '#b93c20' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.15rem' }}>Veilig Betalen</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>iDeal, Bancontact & Creditcard</div>
          </div>
        </div>

      </div>
    </div>
  );
}
