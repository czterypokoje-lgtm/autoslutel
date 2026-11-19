import React from 'react';
import styles from './InstantServiceMap.module.css';
import { MY_MAPS_EMBED_URL } from '@/config/myMaps';

/**
 * The service-area map: the Google My Maps embed, loaded by itself.
 *
 * It used to sit behind a "tap to load" facade (a static image and a button)
 * to save the ~1.4 MB the My Maps app costs. The owner wants every map to open
 * on its own, like the partner map on the Amsterdam page (25 Oct 2026), so the
 * embed is rendered straight away.
 *
 * `loading="lazy"` keeps most of that cost off the first paint: the browser
 * only fetches the embed when the section scrolls near the viewport.
 */
export default function InstantServiceMap() {
  return (
    <div className={styles.mapRoot}>
      <iframe
        className={styles.googleMapIframe}
        src={MY_MAPS_EMBED_URL}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Autosleutel24 servicegebied — Utrecht, Randstad en omstreken"
      />
    </div>
  );
}
