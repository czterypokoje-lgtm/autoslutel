'use client';

import React from 'react';
import styles from './InstantServiceMap.module.css';

export default function InstantServiceMap() {
  return (
    <div className={styles.mapRoot}>
      <div className={styles.iframeWrapper}>
        <div className={styles.spinnerBehind}>
          <div className={styles.spinner}></div>
          <span>Kaart laden...</span>
        </div>
        <iframe
          src="https://www.google.com/maps/d/embed?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4&ehbc=2E312F"
          className={styles.googleMapIframe}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title="Autosleutel24 Mobiele Service Werkgebied en Servicegebieden Google My Maps"
        ></iframe>
      </div>
    </div>
  );
}
