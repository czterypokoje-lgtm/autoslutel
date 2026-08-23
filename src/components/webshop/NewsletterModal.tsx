'use client';
import React, { useState, useEffect } from 'react';

export default function NewsletterModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show the modal after 3 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: '#f8fafc',
        padding: '2.5rem 2rem',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '450px',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        fontFamily: 'Inter, sans-serif'
      }}>
        
        {/* Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            fontSize: '1.25rem',
            color: '#64748b',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          ✕
        </button>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', marginTop: 0 }}>
          Blijf op de hoogte
        </h3>
        
        <p style={{ fontSize: '1rem', color: '#475569', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Wees er als eerste bij voor nieuwe producten, exclusieve aanbiedingen en belangrijk nieuws.
        </p>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
          <input 
            type="email" 
            placeholder="E-mailadres" 
            style={{ 
              width: '100%', 
              padding: '0.75rem 1rem', 
              borderRadius: '6px', 
              border: '1px solid #cbd5e1', 
              fontSize: '1rem',
              outline: 'none'
            }} 
          />
          <button style={{ 
            background: '#0f172a', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            padding: '0.85rem 1.5rem', 
            fontWeight: 700, 
            cursor: 'pointer',
            fontSize: '1rem',
            width: '100%',
            marginTop: '0.5rem',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          onClick={() => setIsOpen(false)}
          >
            Aanmelden
          </button>
        </div>
      </div>
    </div>
  );
}
