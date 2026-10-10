'use client';

import { useState } from 'react';
import styles from './PartnerLocation.module.css';

/**
 * The static map, which removes itself when there is no map to show.
 *
 * /api/service-map answers 204 when it cannot produce an image — no API key,
 * Static Maps not enabled, Google having a bad day. The browser cannot decode
 * an empty body, so the <img> fires onError, and a broken-image icon under a
 * heading that promises a location is worse than no picture at all. Same
 * contract InstantServiceMap already relies on.
 *
 * A client component only for that one fallback; everything else about this
 * section renders on the server.
 */
export default function PartnerMap({ citySlug, address }: { citySlug: string; address: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${address} op Google Maps bekijken`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.map}
        src={`/api/service-map?partner=${encodeURIComponent(citySlug)}`}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </a>
  );
}
