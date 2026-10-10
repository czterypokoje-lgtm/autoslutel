import { ImageResponse } from 'next/og';
import { SITE_CONFIG } from '@/config/site.config';

/*
 * Das Vorschaubild, das WhatsApp, Facebook und LinkedIn zeigen, wenn jemand
 * einen Link auf diese Seite teilt.
 *
 * Vorher lag dort public/og-image.png: ein niederländischer Entwurf, auf dem
 * groß "Premium Marketing Banner — OpenGraph" und darunter "Autosleutel24 —
 * 24/7 Mobiele Service" steht. Das ist die Mustervorlage eines Bildgenerators,
 * die nie ersetzt wurde — und sie war quadratisch (1024×1024), während das
 * Markup 1200×630 versprach. Beim ersten geteilten Link wäre das der erste
 * Eindruck der deutschen Seite gewesen.
 *
 * Jetzt wird es gebaut statt gepflegt: aus SITE_CONFIG, in Deutsch, in der
 * richtigen Größe, und es ändert sich mit, wenn Name, Einsatzgebiet oder
 * Telefonnummer sich ändern. Kein Foto, keine Behauptung — nur was auch im
 * Titel der Seite steht. Die Telefonnummer erscheint erst, wenn sie
 * eingetragen ist (siehe isReady), damit kein "__TBD__" geteilt wird.
 */

export const alt = 'Autoschlüssel24 — mobiler Autoschlüssel-Service';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TBD = '__TBD__';
const ready = (v: string) => typeof v === 'string' && v.length > 0 && v !== TBD;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#0b1626',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 34, color: '#f97316', fontWeight: 700, letterSpacing: 2 }}>
          {SITE_CONFIG.name.toUpperCase()}
        </div>

        <div style={{ display: 'flex', marginTop: 28, fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>
          Autoschl&#252;ssel verloren oder nachmachen?
        </div>

        <div style={{ display: 'flex', marginTop: 28, fontSize: 40, color: '#f97316', fontWeight: 700 }}>
          Festpreis vorab &#8212; unser Partner kommt zu Ihnen
        </div>

        <div style={{ display: 'flex', marginTop: 44, fontSize: 30, color: '#cbd5e1' }}>
          {SITE_CONFIG.serviceAreaString}
        </div>

        <div style={{ display: 'flex', marginTop: 14, fontSize: 30, color: '#cbd5e1' }}>
          24/7 erreichbar{ready(SITE_CONFIG.phone) ? ` · ${SITE_CONFIG.phone}` : ''}
        </div>
      </div>
    ),
    size,
  );
}
