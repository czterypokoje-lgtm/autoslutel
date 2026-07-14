'use client';

import React, { useRef, useEffect, useState } from 'react';

export default function InstantServiceMap() {
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Only start loading the iframe once this div is actually in the viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Failsafe: after 6 seconds force-show whatever is loaded
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setLoaded(true), 6000);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '480px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        background: '#e8eaf0',
        position: 'relative',
      }}
    >
      {/* Loading spinner shown until the iframe fires onLoad */}
      {!loaded && (
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

      {/* Only render the iframe once it is visible in viewport */}
      {visible && (
        <iframe
          src="https://www.google.com/maps/d/embed?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4"
          width="100%"
          height="100%"
          style={{ border: 0, display: 'block', width: '100%', height: '100%' }}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title="Autosleutel24 Servicegebied"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
    </div>
  );
}
