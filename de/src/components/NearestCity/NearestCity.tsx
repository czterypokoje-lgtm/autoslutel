'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CITIES } from '@/config/cities';
import { haversineKm } from '@/lib/cityTechnician';
import { SITE_CONFIG } from '@/config/site.config';
import styles from './NearestCity.module.css';

/*
 * "In der Nähe" ist eine Frage danach, wo der Leser steht, und der Browser ist
 * das Einzige auf der Seite, das es weiß.
 *
 * Mit Absicht hinter einer Schaltfläche und nicht beim Laden: ein
 * Standortdialog, der unaufgefordert erscheint, wird reflexhaft weggeklickt,
 * und ein weggeklickter Dialog lässt sich im selben Besuch nicht erneut
 * stellen. Die Städteliste darunter funktioniert, ohne dass jemand sie
 * drückt — nichts hängt an der Freigabe.
 *
 * haversineKm kommt aus cityTechnician statt hier noch einmal geschrieben zu
 * werden; es ist dieselbe Luftlinie, mit der auch die Auftragsvergabe rechnet.
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
            Nächstes Einsatzgebiet: <strong>{match.city}</strong>
            <span className={styles.km}> — {Math.round(match.km)} km Luftlinie</span>
          </p>
          <div className={styles.actions}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.call}>
              {SITE_CONFIG.phone} anrufen
            </a>
            <Link href={`/staedte/${match.slug}`} className={styles.secondary}>
              {match.city} ansehen →
            </Link>
          </div>
          <p className={styles.note}>
            Ihr Ort steht nicht dabei? Unsere Partner fahren weiter als diese Liste reicht — rufen
            Sie gern an, dann hören Sie sofort, ob jemand in Ihrer Nähe ist.
          </p>
        </>
      ) : (
        <>
          {/*
            * Hier stand "Wij werken door heel Nederland met vaste technici per
            * regio" — eine landesweite Zusage. Vier Partner decken kein Land
            * ab, also nennt der Satz die Städte aus der Konfiguration und
            * wächst mit dem Netzwerk mit.
            */}
          <p className={styles.lead}>
            In {SITE_CONFIG.serviceAreaString} sitzt je ein eigener Fachbetrieb. Geben Sie Ihren
            Standort frei, und Sie sehen sofort, welches Einsatzgebiet am nächsten liegt.
          </p>
          <div className={styles.actions}>
            <button type="button" onClick={locate} className={styles.call} disabled={state === 'asking'}>
              {state === 'asking' ? 'Wird gesucht…' : 'Nächstes Gebiet anzeigen'}
            </button>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.secondary}>
              Oder direkt anrufen: {SITE_CONFIG.phone}
            </a>
          </div>
          {state === 'denied' && (
            <p className={styles.note}>
              Kein Zugriff auf Ihren Standort — kein Problem. Wählen Sie unten Ihre Stadt, oder
              rufen Sie mit Ihrer Postleitzahl an.
            </p>
          )}
          {state === 'unsupported' && (
            <p className={styles.note}>
              Ihr Browser gibt keinen Standort weiter. Wählen Sie unten Ihre Stadt, oder rufen Sie
              mit Ihrer Postleitzahl an.
            </p>
          )}
        </>
      )}
    </div>
  );
}
