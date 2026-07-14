'use client';

import React, { useState, useEffect } from 'react';

export default function InstantServiceMap() {
  const [loaded, setLoaded] = useState(false);

  // Safety timeout: force show map after 3s even if onLoad never fires
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      width: '100%',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
      background: '#e8eaf0',
      position: 'relative',
    }}>
      {/* Loading shimmer shown until iframe fires onLoad */}
      {!loaded && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: '#f1f3f5',
          zIndex: 2,
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(232,82,10,0.2)',
            borderTop: '4px solid #E8520A',
            borderRadius: '50%',
            animation: 'mapSpin 1s linear infinite',
          }} />
          <span style={{ fontSize: '0.9rem', color: '#555', fontWeight: 600 }}>Kaart laden…</span>
          <style>{`@keyframes mapSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Google My Maps embed — no negative margin hack that breaks in modern browsers */}
      <iframe
        src="https://www.google.com/maps/d/embed?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4&ehbc=2E312F&noprof=1"
        width="100%"
        height="480"
        style={{ border: 0, display: 'block' }}
        allowFullScreen
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
        title="Autosleutel24 Servicegebied"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  );
}
