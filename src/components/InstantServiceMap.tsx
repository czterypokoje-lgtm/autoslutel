'use client';

import React from 'react';
import styles from './InstantServiceMap.module.css';

export default function InstantServiceMap() {
  return (
    <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', background: '#f8fafc' }}>
      <div style={{ position: 'relative', width: '100%', height: '500px', overflow: 'hidden' }}>
        <iframe
          src="https://www.google.com/maps/d/embed?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4&ehbc=2E312F"
          style={{ border: 0, width: '100%', height: '570px', marginTop: '-65px', position: 'absolute' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Autosleutel24 Mobiele Service Werkgebied en Servicegebieden Google My Maps"
        ></iframe>
      </div>
    </div>
  );
}
