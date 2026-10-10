'use client';

import { useState } from 'react';
import { useNearViewport } from '../useNearViewport';
import styles from './PartnerLocation.module.css';

/**
 * The map beside the address, in three descending steps.
 *
 * 1. A STATIC IMAGE from /api/service-map?partner=<slug>. One request, no
 *    script, key on the server. This is what should normally be on screen.
 *
 * 2. AN EMBED when that image cannot be produced. The route answers 204 with
 *    no GOOGLE_MAPS_API_KEY, with Static Maps not enabled on the Cloud
 *    project, or when Google is having a bad day — and the static map is the
 *    only one of the two that needs a key at all. `maps?q=…&output=embed` does
 *    not, so a deployment that has not got around to the key still shows a map
 *    rather than a gap where one was promised.
 *
 *    It mounts by itself once the reader has scrolled to it (useNearViewport),
 *    not on a button and not during page load. That embed is about 1.4 MB
 *    across 22 requests, which nobody should pay while the page is still
 *    drawing; waiting for the scroll keeps it off the critical path without
 *    putting a door in front of a map.
 *
 * 3. NOTHING, if neither can be drawn. A broken-image icon under a heading
 *    promising a location is worse than no picture.
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
  const { ref, near } = useNearViewport<HTMLDivElement>();

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
      ) : (
        /*
         * The wrapper keeps the map's footprint before the iframe arrives, so
         * the caption and everything under it do not jump when it mounts.
         */
        <div ref={ref} className={styles.mapSlot}>
          {near && (
            <iframe
              className={styles.map}
              src={embedSrc}
              title={`Kaart: ${address}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ border: 0 }}
            />
          )}
        </div>
      )}
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}
