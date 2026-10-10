'use client';

import { useState } from 'react';
import styles from './PartnerLocation.module.css';

/**
 * The map beside the address, in three descending steps.
 *
 * 1. A STATIC IMAGE from /api/service-map?partner=<slug>. One request, no
 *    script, key on the server. This is what should normally be on screen.
 *
 * 2. A TAP-TO-LOAD EMBED when that image cannot be produced. The route answers
 *    204 with no GOOGLE_MAPS_API_KEY, with Static Maps not enabled on the Cloud
 *    project, or when Google is having a bad day — and the static map is the
 *    only one of the two that needs a key at all. `maps?q=…&output=embed` does
 *    not, so a deployment that has not got around to the key still shows a map
 *    rather than a gap where one was promised.
 *
 *    It stays behind a tap for the reason InstantServiceMap documents: that
 *    embed is about 1.4 MB across 22 requests, 733 KB of it JavaScript, which
 *    is a Maps application booting up to draw one pin. Nobody pays that on load
 *    and nobody pays it at all unless they ask to see the street.
 *
 * 3. NOTHING, if the facade itself cannot be drawn. A broken-image icon under a
 *    heading promising a location is worse than no picture.
 *
 * The caption lives in here rather than beside it so that it leaves with the
 * map. A line reading "Draaierweg 10, 1032 KS Amsterdam" floating alone in an
 * empty column is the broken-looking half of the failure this avoids.
 *
 * None of this carries SEO weight and it is not meant to: a crawler attributes
 * nothing inside an iframe to this page, and an image of a map says nothing
 * either. The address that search engines read is the <address> element and the
 * ServiceChannel.serviceLocation node next to it, both server-rendered. This is
 * for the reader.
 */
export default function PartnerMap({
  citySlug,
  address,
  caption,
}: {
  citySlug: string;
  address: string;
  caption: string;
}) {
  const [staticFailed, setStaticFailed] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&hl=nl&output=embed`;

  return (
    <figure className={styles.media}>
      {!staticFailed ? (
        <a href={mapsLink} target="_blank" rel="noopener noreferrer" aria-label={`${address} op Google Maps bekijken`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.map}
            src={`/api/service-map?partner=${encodeURIComponent(citySlug)}`}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setStaticFailed(true)}
          />
        </a>
      ) : showEmbed ? (
        <iframe
          className={styles.map}
          src={embedSrc}
          title={`Kaart: ${address}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ border: 0 }}
        />
      ) : (
        /*
         * A real <button>, so it is keyboard reachable and announces what it
         * does, rather than a div that only answers to a mouse.
         */
        <button type="button" className={styles.mapFacade} onClick={() => setShowEmbed(true)}>
          <span className={styles.mapFacadePin} aria-hidden="true">📍</span>
          <span className={styles.mapFacadeAddress}>{address}</span>
          <span className={styles.mapFacadeHint}>Kaart laden</span>
        </button>
      )}
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}
