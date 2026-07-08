'use client';

import React, { useState } from 'react';
import styles from './InstantServiceMap.module.css';

export default function InstantServiceMap() {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div className={styles.mapRoot}>
      <div className={styles.iframeWrapper}>
        {!iframeLoaded && (
          <div className={styles.loadingSpinnerOverlay}>
            <div className={styles.spinner}></div>
            <span>Kaart laden...</span>
          </div>
        )}
        <iframe
          src="https://www.google.com/maps/d/embed?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4&ehbc=2E312F"
          className={styles.googleMapIframe}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          onLoad={() => setIframeLoaded(true)}
          referrerPolicy="no-referrer-when-downgrade"
          title="Autosleutel24 Mobiele Service Werkgebied en Servicegebieden Google My Maps"
        ></iframe>
      </div>
    </div>
  );
}
