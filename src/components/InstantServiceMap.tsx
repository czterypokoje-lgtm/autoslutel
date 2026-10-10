'use client';

import React, { useState } from 'react';
import styles from './InstantServiceMap.module.css';
import { useNearViewport } from './useNearViewport';
import { MY_MAPS_EMBED_URL } from '@/config/myMaps';

/**
 * The service-area map, which arrives on its own when you reach it.
 *
 * WHY NOT SIMPLY EMBED IT
 *
 * The Google My Maps embed costs 1.4 MB decoded across 22 requests, 733 KB of
 * it JavaScript — measured by loading the embed on its own and reading its
 * resource timings. That is a Maps application booting up inside the page to
 * draw about twenty pins, and on a phone it is seconds of download and parse.
 * In the markup it is paid during page load by everyone, including the visitor
 * who never scrolls this far.
 *
 * WHY NOT A BUTTON EITHER
 *
 * This used to be a tap-to-load facade, and that did keep the page fast. But
 * it put a door in front of a map, and a map is something people expect to
 * simply be there. The button was the cost showing through to the reader.
 *
 * WHAT IT DOES NOW
 *
 * The embed mounts by itself once the section comes near the screen
 * (useNearViewport, which starts it a screen early). Nothing to press, and the
 * 1.4 MB still never lands during page load — which is the part LCP measures,
 * and the part someone who never reaches this section should not be charged
 * for.
 *
 * Underneath it, until the iframe has drawn, sits a real Google map: a single
 * Static Maps image with our service cities pinned, served through
 * /api/service-map so the API key stays on the server. So the box is never
 * empty and nothing shifts when the embed lands on top of it.
 *
 * Plain <img>, not next/image: the source is an API route returning a remote
 * image, so there is nothing for the optimiser to pre-size or re-encode, and
 * routing it through /_next/image would only add a second hop. It is
 * decorative once the embed is coming, so it carries an empty alt.
 */
export default function InstantServiceMap() {
  /*
   * The embed mounts by itself once the reader has scrolled to it, rather than
   * on a tap. See useNearViewport: the cost stays off page load, which is the
   * part LCP measures, without asking anybody to press anything first.
   */
  const { ref, near } = useNearViewport<HTMLDivElement>();

  /*
   * /api/service-map answers 204 when the static map cannot be produced —
   * most likely because the Maps Static API is not enabled on the Cloud
   * project. Rather than leave a broken image icon, the section falls back to
   * its own plain panel until the embed arrives.
   */
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div ref={ref} className={`${styles.mapRoot} ${near ? '' : styles.placeholder}`}>
      {/*
        * The static image sits underneath until the embed has drawn, so the
        * section is never an empty rectangle and nothing shifts when the
        * iframe arrives on top of it.
        */}
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

      {near && (
        <iframe
          className={styles.googleMapIframe}
          src={MY_MAPS_EMBED_URL}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title="Autosleutel24 servicegebied — Utrecht, Randstad en omstreken"
        />
      )}
    </div>
  );
}
