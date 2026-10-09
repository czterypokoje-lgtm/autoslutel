'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CITIES } from '@/config/cities';
import { haversineKm } from '@/lib/cityTechnician';
import { SITE_CONFIG } from '@/config/site.config';
import styles from './NearestCity.module.css';

/*
 * "In de buurt" is a question about where the reader is, and the browser is
 * the only thing on the page that knows.
 *
 * Deliberately behind a button rather than on load: a geolocation prompt
 * that appears unasked is the kind of thing people dismiss on reflex, and a
 * dismissed prompt cannot be asked again on that visit. The city list below
 * it works without ever pressing it, so nothing is gated on consent.
 *
 * haversineKm comes from cityTechnician rather than being written again here;
 * it is the same straight-line distance the dispatch scoring uses.
 */
export default function NearestCity() {
  const [state, setState] = useState<'idle' | 'asking' | 'denied' | 'unsupported'>('idle');
  const [match, setMatch] = useState<{ slug: string; city: string; km: number } | null>(null);

  function locate() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState('unsupported');
      return;
    }
    setState('asking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let best: { slug: string; city: string; km: number } | null = null;
        for (const c of CITIES) {
          const km = haversineKm(latitude, longitude, Number(c.geo.lat), Number(c.geo.lng));
          if (!best || km < best.km) best = { slug: c.slug, city: c.city, km };
        }
        setMatch(best);
        setState('idle');
      },
      () => setState('denied'),
      { timeout: 8000, maximumAge: 300000 },
    );
  }

  return (
    <div className={styles.box}>
      {match ? (
        <>
          <p className={styles.result}>
            Dichtstbijzijnde servicegebied: <strong>{match.city}</strong>
            <span className={styles.km}> — hemelsbreed {Math.round(match.km)} km</span>
          </p>
          <div className={styles.actions}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.call}>
              Bel {SITE_CONFIG.phone}
            </a>
            <Link href={`/steden/${match.slug}`} className={styles.secondary}>
              Bekijk {match.city} →
            </Link>
          </div>
          <p className={styles.note}>
            Staat uw plaats er niet bij? Wij rijden verder dan deze lijst — bel gerust, dan hoort u
            direct of er iemand in de buurt is.
          </p>
        </>
      ) : (
        <>
          <p className={styles.lead}>
            Wij werken door heel Nederland met vaste technici per regio. Laat uw browser uw locatie
            doorgeven, dan ziet u meteen welk servicegebied het dichtstbij is.
          </p>
          <div className={styles.actions}>
            <button type="button" onClick={locate} className={styles.call} disabled={state === 'asking'}>
              {state === 'asking' ? 'Even zoeken…' : 'Toon het dichtstbijzijnde gebied'}
            </button>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.secondary}>
              Of bel direct: {SITE_CONFIG.phone}
            </a>
          </div>
          {state === 'denied' && (
            <p className={styles.note}>
              Geen toegang tot uw locatie — geen probleem. Kies hieronder uw stad, of bel ons met uw
              postcode.
            </p>
          )}
          {state === 'unsupported' && (
            <p className={styles.note}>
              Uw browser deelt geen locatie. Kies hieronder uw stad, of bel ons met uw postcode.
            </p>
          )}
        </>
      )}
    </div>
  );
}
