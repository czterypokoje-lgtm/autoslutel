'use client';

import { useState } from 'react';

/**
 * The partner garage on a real Google map, behind a tap.
 *
 * Same facade idea as InstantServiceMap: a Google Maps iframe boots a whole
 * Maps app and sets Google cookies, so nothing from Google loads until the
 * visitor asks for it. Until then the drawn preview shows where the garage
 * is; one tap mounts the embed, which shows Google's own place card for the
 * garage (name, address, rating, "Openen in Maps").
 *
 * The keyless `output=embed` URL needs no API key and no billing; the query
 * is the garage's name and full address so Google resolves the exact place.
 */
const PLACE_QUERY = 'Garage NRD, Draaierweg 10, 1032 KS Amsterdam';
const EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(PLACE_QUERY)}&hl=nl&output=embed`;

export default function PartnerGarageMap() {
  const [showEmbed, setShowEmbed] = useState(false);

  if (showEmbed) {
    return (
      <iframe
        src={EMBED_URL}
        title="Garage NRD op Google Maps — Draaierweg 10, Amsterdam-Noord"
        style={{ border: 0, display: 'block', width: '100%', height: '100%', minHeight: 280 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowEmbed(true)}
      aria-label="Toon Garage NRD op Google Maps"
      style={{ all: 'unset', cursor: 'pointer', display: 'block', position: 'relative', width: '100%', height: '100%', minHeight: 280 }}
    >
      <svg viewBox="0 0 400 280" width="100%" height="100%" style={{ display: 'block' }} aria-hidden="true">
        <rect width="400" height="280" fill="#eef1ea" />
        <path d="M-20 50 Q 120 5 260 60 T 440 50 L440 100 Q 300 135 180 100 T -20 105 Z" fill="#d7e8f2" />
        <g stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round">
          <path d="M0 130 L400 138" />
          <path d="M60 0 L90 280" />
          <path d="M230 0 L210 280" />
        </g>
        <text x="200" y="22" textAnchor="middle" fontSize="11" fontWeight="700" fill="#6b7280" opacity="0.8" fontFamily="var(--ff-body, sans-serif)">AMSTERDAM-NOORD</text>
        <text x="140" y="85" textAnchor="middle" fontSize="10" fill="#6b7280" opacity="0.6" fontStyle="italic" fontFamily="var(--ff-body, sans-serif)">het IJ</text>
        <g transform="translate(206 36)">
          <circle r="15" fill="var(--orange-500)" opacity="0.18" />
          <path d="M0 -22 C 11 -22 19 -14 19 -3 C 19 11 0 24 0 24 C 0 24 -19 11 -19 -3 C -19 -14 -11 -22 0 -22 Z" fill="var(--orange-500)" stroke="#fff" strokeWidth="2" />
          <circle cy="-3" r="6" fill="#fff" />
        </g>
      </svg>
      <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', color: '#0f172a', fontWeight: 700, fontSize: '0.92rem', padding: '0.7rem 1.1rem', borderRadius: 999, boxShadow: '0 4px 14px rgba(15,23,42,0.18)', whiteSpace: 'nowrap' }}>
        📍 Bekijk op Google Maps
      </span>
      <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.92)', borderTop: '1px solid #e5e7eb', padding: '0.6rem 0.9rem', fontSize: '0.72rem', color: '#6b7280' }}>
        Draaierweg 10, Amsterdam-Noord
      </span>
    </button>
  );
}
