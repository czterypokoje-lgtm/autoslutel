import React from 'react';

export default function DeliveryInfoBox() {
  return (
    <div style={{
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      overflow: 'hidden',
      marginTop: '1.5rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#f8fafc',
        padding: '0.75rem',
        textAlign: 'center',
        fontWeight: 800,
        fontSize: '0.9rem',
        color: '#334155',
        letterSpacing: '0.5px'
      }}>
        LEVERING
      </div>
      
      {/* Content */}
      <div style={{ padding: '1rem' }}>
        <div style={{
          color: '#16a34a',
          fontWeight: 700,
          fontSize: '1.05rem',
          marginBottom: '0.25rem'
        }}>
          Gratis Standaard Verzending & Retour
        </div>
        <div style={{
          color: '#475569',
          fontSize: '0.9rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          op bestellingen vanaf €75,-
        </div>
      </div>
    </div>
  );
}
