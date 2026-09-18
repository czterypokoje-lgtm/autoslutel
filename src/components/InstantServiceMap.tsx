'use client';

import React from 'react';

export default function InstantServiceMap() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '480px',
        position: 'relative',
        background: '#e8eaf0',
      }}
    >
      <iframe
        data-cmp-ab="1"
        src="https://www.google.com/maps/d/embed?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4&ehbc=2E312F"
        style={{
          border: 'none',
          width: '100%',
          height: 'calc(100% + 65px)',
          marginTop: '-65px',
          display: 'block',
        }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Autosleutel24 Servicegebied Utrecht en omstreken"
      />
    </div>
  );
}
