import React from 'react';
import styles from './InstantServiceMap.module.css';

/**
 * The Google My Maps embed of the service area.
 *
 * It used to size itself with inline `height: 100%` on a box whose parent had
 * no definite height. On desktop that worked by accident — the column is a
 * stretched flex item in a row, so its height is definite and the percentage
 * resolved. On a phone the layout stacks, the column's height comes from its
 * content, and a percentage height against an indefinite parent is simply
 * dropped: the iframe fell back to its intrinsic ~150px while `minHeight: 480px`
 * held the box open, which is the sliver of map above 300px of grey.
 *
 * So the height is definite here at every width. On a phone it comes from an
 * aspect ratio, which is a width the box always has; from 900px up it goes back
 * to filling the column beside the province list, which is the layout that made
 * it look right on desktop in the first place.
 *
 * No longer a client component: it was marked 'use client' but has no state,
 * no effects and no handlers, so it was shipping a component to the browser to
 * render an iframe the server can emit on its own.
 */
export default function InstantServiceMap() {
  return (
    <div className={styles.mapRoot}>
      <iframe
        className={styles.googleMapIframe}
        src="https://www.google.com/maps/d/embed?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4&ehbc=2E312F"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Autosleutel24 servicegebied — Utrecht, Randstad en omstreken"
      />
    </div>
  );
}
