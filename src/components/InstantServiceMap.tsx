'use client';

import React, { useState, useEffect } from 'react';
import styles from './InstantServiceMap.module.css';

export default function InstantServiceMap() {
  const [isLoading, setIsLoading] = useState(true);

  // Fallback timeout to ensure the map NEVER gets stuck loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.mapRoot}>
      <div className={styles.iframeWrapper}>
        {isLoading && (
          <div className={styles.spinnerBehind}>
            <div className={styles.spinner}></div>
            <span>Kaart laden...</span>
          </div>
        )}
        <iframe
          src="https://www.google.com/maps/d/embed?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4&ehbc=2E312F"
          className={styles.googleMapIframe}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title="Autosleutel24 Mobiele Service Werkgebied en Servicegebieden Google My Maps"
          onLoad={() => setIsLoading(false)}
        ></iframe>
      </div>
    </div>
  );
}
