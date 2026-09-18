'use client';

import React, { useState } from 'react';
import styles from './InstantServiceMap.module.css';

/**
 * The service-area map, behind a facade.
 *
 * WHY
 *
 * The Google My Maps embed costs 1.4 MB decoded across 22 requests, 733 KB of
 * it JavaScript — measured by loading the embed on its own and reading its
 * resource timings. That is a Maps application booting up inside the page to
 * draw about twenty pins, and on a phone it is seconds of download and parse
 * for a section most visitors only glance at.
 *
 * So nothing from Google's Maps app loads until somebody asks for it. Until
 * then the section shows a real Google map — a single Static Maps image with
 * our service cities pinned, served through /api/service-map so the API key
 * stays on the server — and the interactive embed mounts on the first tap.
 *
 * For the visitor who never taps, which is most of them, the map now costs one
 * image instead of a megabyte and a half. This is the "third-party facade"
 * pattern Lighthouse asks for.
 *
 * WHY A TAP AND NOT A HOVER
 *
 * Hover does not exist on the phone this was reported from, and preloading on
 * hover hands the cost back to every desktop visitor who sweeps a mouse across
 * it. One deliberate tap.
 *
 * The facade is a real <button>, so it is keyboard reachable and announces what
 * it does. The map image is decorative beside that label, so it carries an
 * empty alt rather than repeating it.
 *
 * Plain <img>, not next/image: the source is an API route returning a remote
 * image, so there is nothing for the optimiser to pre-size or re-encode, and
 * routing it through /_next/image would only add a second hop.
 */
export default function InstantServiceMap() {
  const [showEmbed, setShowEmbed] = useState(false);

  /*
   * /api/service-map answers 204 when the static map cannot be produced —
   * most likely because the Maps Static API is not enabled on the Cloud
   * project. Rather than leave a broken image icon, the facade drops to its
   * own branded panel and the button still works.
   */
  const [imageFailed, setImageFailed] = useState(false);

  if (showEmbed) {
    return (
      <div className={styles.mapRoot}>
        <iframe
          className={styles.googleMapIframe}
          src="https://www.google.com/maps/d/embed?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4&ehbc=2E312F"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title="Autosleutel24 servicegebied — Utrecht, Randstad en omstreken"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.mapRoot} ${styles.facade}`}
      onClick={() => setShowEmbed(true)}
    >
      {!imageFailed && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src="/api/service-map"
          alt=""
          aria-hidden="true"
          className={styles.facadeImg}
          loading="lazy"
          decoding="async"
          width={1280}
          height={1280}
          onError={() => setImageFailed(true)}
        />
      )}

      <span className={`${styles.facadeOverlay} ${imageFailed ? styles.facadeOverlayPlain : ''}`}>
        <span className={styles.facadeCta}>
          <span aria-hidden="true">📍</span> Bekijk de interactieve kaart
        </span>
        <span className={styles.facadeHint}>
          Tik om te zoomen en alle servicelocaties te bekijken
        </span>
      </span>
    </button>
  );
}
