'use client';

import { useState } from 'react';
import { MY_MAPS_ID } from '@/config/myMaps';
import styles from './ServiceAreaMyMap.module.css';

/*
 * The Google My Maps service-area map, behind a click.
 *
 * The embed is a Google iframe that sets cookies and pulls in a lot of script, so it is not
 * loaded with the page. It is a poster with a button, like the video: the map is built only
 * when somebody asks for it, which keeps it out of the cookie banner's way and out of the
 * page's load time. Renders nothing until MY_MAPS_ID is filled in (src/config/myMaps.ts).
 */
export default function ServiceAreaMyMap({ title = 'Waar wij komen' }: { title?: string }) {
  const [open, setOpen] = useState(false);
  if (!MY_MAPS_ID) return null;

  return (
    <section className={styles.wrap} aria-label={title}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.frame}>
        {open ? (
          <iframe
            title="Werkgebied van Autosleutel24 op Google Maps"
            src={`https://www.google.com/maps/d/embed?mid=${MY_MAPS_ID}&ehbc=2E312F`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <button type="button" className={styles.poster} onClick={() => setOpen(true)}>
            Bekijk ons werkgebied op de kaart
          </button>
        )}
      </div>
    </section>
  );
}
