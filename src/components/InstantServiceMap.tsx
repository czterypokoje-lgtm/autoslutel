'use client';

import React, { useState, useEffect } from 'react';

export default function InstantServiceMap() {
  const [showSpinner, setShowSpinner] = useState(true);

  // Hide the spinner after 3.5 seconds no matter what
  // This guarantees the iframe is always visible even if onLoad never fires
  useEffect(() => {
    const t = setTimeout(() => setShowSpinner(false), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '480px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        position: 'relative',
        background: '#e8eaf0',
      }}
    >
      {/* Spinner overlay — disappears after 3.5s or when iframe loads */}
      {showSpinner && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: '#f1f3f5',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid rgba(232,82,10,0.2)',
              borderTop: '4px solid #E8520A',
              borderRadius: '50%',
              animation: 'mapSpin 1s linear infinite',
            }}
          />
          <span style={{ fontSize: '0.9rem', color: '#555', fontWeight: 600 }}>
            Kaart laden…
          </span>
          <style>{`@keyframes mapSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* 
        The iframe is ALWAYS rendered immediately — no conditional rendering.
        We use the standard Google My Maps embed URL (no extra params).
        height=100% fills the 480px parent container.
      */}
      <iframe
        data-cmp-ab="1"
        src="https://www.google.com/maps/d/embed?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4&ehbc=2E312F"
        style={{
          border: 'none',
          width: '100%',
          height: '100%',
          display: 'block',
        }}
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        title="Autosleutel24 Servicegebied Utrecht en omstreken"
        onLoad={() => setShowSpinner(false)}
      />
    </div>
  );
}
