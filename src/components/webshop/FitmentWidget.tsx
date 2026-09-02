'use client';
import React from 'react';

export default function FitmentWidget() {
  const bmBlack = '#1a1a1a';

  return (
    <div style={{ 
      background: '#f8fafc',
      border: '1px solid #e2e8f0', 
      borderRadius: '8px',
      padding: '1.25rem',
      marginBottom: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={bmBlack} strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 14v3c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: bmBlack, marginBottom: '0.25rem' }}>Passende onderdelen vinden</div>
            <div style={{ fontSize: '0.85rem', color: '#1a1a1a', lineHeight: 1.4 }}>
              Voeg nu je voertuig toe om zeker te weten dat de onderdelen passen. Ontspannen kopen met gratis retourneren voor de meeste artikelen.
            </div>
          </div>
        </div>
      </div>

      {/* Inputs & Tabs Row (Horizontal) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', paddingBottom: '0.5rem', cursor: 'pointer' }}>Zoeken op kenteken</div>
          <div style={{ fontSize: '0.85rem', color: bmBlack, fontWeight: 700, paddingBottom: '0.5rem', borderBottom: `2px solid ${bmBlack}`, cursor: 'pointer' }}>Voertuig handmatig toevoegen</div>
        </div>

        {/* Form Grid & Button (all in one row to save vertical space) */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flex: 1, gap: '0.5rem' }}>
            <div style={{ flex: 1, border: '1px solid #94a3b8', borderRadius: '4px', padding: '0.25rem 0.5rem', background: '#fff' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Merk</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: bmBlack }}>BMW</div>
            </div>
            <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.5rem', background: '#fff', color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>Model</div>
            <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.5rem', background: '#fff', color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>Bouwjaar</div>
            <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.5rem', background: '#fff', color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>Platform</div>
            <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.5rem', background: '#fff', color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>Type</div>
            <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.5rem', background: '#fff', color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>Motor</div>
          </div>

          <button style={{ background: '#cbd5e1', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '24px', fontWeight: 700, fontSize: '0.9rem', cursor: 'not-allowed', whiteSpace: 'nowrap' }}>
            Voertuig toevoegen
          </button>
        </div>

      </div>
    </div>
  );
}
