'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './ServiceAreaMap.module.css';

// Grouped by province — each region has representative cities with slugs
const REGIONS = [
  {
    id: 'utrecht',
    label: 'Utrecht',
    color: '#1e3a5f',
    cities: [
      { name: 'Utrecht', slug: 'utrecht' },
      { name: 'Amersfoort', slug: 'amersfoort' },
      { name: 'Nieuwegein', slug: 'nieuwegein' },
      { name: 'IJsselstein', slug: 'ijsselstein' },
      { name: 'Woerden', slug: 'woerden' },
      { name: 'Zeist', slug: 'zeist' },
      { name: 'Soest', slug: 'soest' },
      { name: 'Houten', slug: 'houten' },
    ],
    // SVG path — stylized Utrecht province shape
    svgPath: 'M 340 195 L 365 178 L 400 172 L 430 185 L 448 200 L 445 228 L 430 248 L 405 260 L 378 258 L 352 248 L 335 228 Z',
    labelX: 388,
    labelY: 218,
  },
  {
    id: 'noord-holland',
    label: 'Noord-Holland',
    color: '#2563a8',
    cities: [
      { name: 'Amsterdam', slug: 'amsterdam' },
      { name: 'Haarlem', slug: 'haarlem' },
      { name: 'Almere', slug: 'almere' },
      { name: 'Amstelveen', slug: 'amstelveen' },
      { name: 'Diemen', slug: 'diemen' },
    ],
    svgPath: 'M 270 80 L 300 60 L 330 58 L 355 72 L 368 100 L 360 130 L 340 155 L 315 168 L 285 162 L 258 145 L 248 120 L 255 98 Z',
    labelX: 308,
    labelY: 118,
  },
  {
    id: 'gooi',
    label: '\'t Gooi',
    color: '#1e5c8a',
    cities: [
      { name: 'Hilversum', slug: 'hilversum' },
      { name: 'Bussum', slug: 'bussum' },
      { name: 'Naarden', slug: 'naarden' },
      { name: 'Huizen', slug: 'huizen' },
    ],
    svgPath: 'M 370 148 L 395 138 L 418 148 L 428 168 L 418 185 L 395 192 L 372 184 L 362 168 Z',
    labelX: 395,
    labelY: 165,
  },
  {
    id: 'flevoland',
    label: 'Flevoland',
    color: '#1a6b8a',
    cities: [
      { name: 'Lelystad', slug: 'lelystad' },
      { name: 'Almere', slug: 'almere' },
    ],
    svgPath: 'M 420 65 L 460 52 L 495 65 L 508 95 L 500 128 L 472 142 L 442 135 L 420 112 L 415 85 Z',
    labelX: 462,
    labelY: 100,
  },
  {
    id: 'gelderland',
    label: 'Gelderland',
    color: '#0f4c75',
    cities: [
      { name: 'Arnhem', slug: 'arnhem' },
      { name: 'Nijmegen', slug: 'nijmegen' },
      { name: 'Apeldoorn', slug: 'apeldoorn' },
      { name: 'Ede', slug: 'ede' },
      { name: 'Culemborg', slug: 'culemborg' },
    ],
    svgPath: 'M 450 200 L 510 185 L 560 195 L 580 225 L 572 260 L 545 278 L 510 282 L 472 270 L 448 248 L 442 222 Z',
    labelX: 512,
    labelY: 235,
  },
  {
    id: 'zuid-holland',
    label: 'Zuid-Holland',
    color: '#1a5276',
    cities: [
      { name: 'Den Haag', slug: 'den-haag' },
      { name: 'Rotterdam', slug: 'rotterdam' },
      { name: 'Dordrecht', slug: 'dordrecht' },
      { name: 'Gouda', slug: 'gouda' },
      { name: 'Delft', slug: 'delft' },
    ],
    svgPath: 'M 205 215 L 245 205 L 280 210 L 305 228 L 318 255 L 308 282 L 282 295 L 248 295 L 215 280 L 200 255 L 198 232 Z',
    labelX: 258,
    labelY: 252,
  },
  {
    id: 'noord-brabant',
    label: 'Noord-Brabant',
    color: '#154360',
    cities: [
      { name: 'Breda', slug: 'breda' },
    ],
    svgPath: 'M 215 300 L 280 298 L 335 308 L 370 325 L 360 358 L 325 372 L 280 375 L 240 362 L 210 342 L 205 318 Z',
    labelX: 285,
    labelY: 335,
  },
];

export default function ServiceAreaMap() {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const active = REGIONS.find(r => r.id === activeRegion);

  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        {/* SVG MAP */}
        <div className={styles.mapCol}>
          <svg
            viewBox="0 0 660 420"
            className={styles.svg}
            aria-label="Kaart van het werkgebied van Autosleutel24"
            role="img"
          >
            {/* Background outline — Netherlands rough shape */}
            <path
              d="M 248 55 L 280 40 L 330 38 L 375 50 L 415 42 L 462 32 L 510 48 L 545 70 L 560 100 L 552 138 L 530 165 L 510 178 L 510 200 L 558 192 L 600 205 L 615 238 L 600 272 L 565 292 L 530 300 L 505 318 L 490 348 L 462 372 L 425 385 L 382 388 L 335 382 L 295 368 L 258 355 L 218 355 L 185 340 L 172 312 L 178 278 L 198 258 L 192 228 L 198 200 L 218 182 L 235 158 L 232 128 L 242 100 L 248 75 Z"
              fill="#e8f0f8"
              stroke="#c5d5e8"
              strokeWidth="1.5"
            />

            {/* Province shapes */}
            {REGIONS.map(region => {
              const isActive = activeRegion === region.id;
              const isHovered = hoveredRegion === region.id;
              return (
                <g key={region.id}>
                  <path
                    d={region.svgPath}
                    fill={isActive ? region.color : isHovered ? `${region.color}cc` : `${region.color}88`}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className={styles.regionPath}
                    onClick={() => setActiveRegion(isActive ? null : region.id)}
                    onMouseEnter={() => setHoveredRegion(region.id)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    style={{ cursor: 'pointer', transition: 'fill 0.2s ease' }}
                  />
                  <text
                    x={region.labelX}
                    y={region.labelY}
                    textAnchor="middle"
                    className={styles.regionLabel}
                    fill={isActive || isHovered ? '#ffffff' : '#1e3a5f'}
                    fontSize="11"
                    fontWeight={isActive ? '700' : '600'}
                    pointerEvents="none"
                    style={{ transition: 'fill 0.2s ease' }}
                  >
                    {region.label}
                  </text>
                </g>
              );
            })}

            {/* Center dot — Utrecht headquarters */}
            <circle cx="388" cy="218" r="6" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <circle cx="388" cy="218" r="12" fill="#f97316" fillOpacity="0.25" />
          </svg>

          <p className={styles.mapHint}>
            Klik op een provincie voor steden &amp; directe links →
          </p>
        </div>

        {/* CITY LIST PANEL */}
        <div className={styles.listCol}>
          {active ? (
            <div className={styles.cityPanel}>
              <div className={styles.panelHeader} style={{ background: active.color }}>
                <span className={styles.panelIcon}>📍</span>
                <h3 className={styles.panelTitle}>{active.label}</h3>
                <button
                  className={styles.panelClose}
                  onClick={() => setActiveRegion(null)}
                  aria-label="Sluit regio"
                >✕</button>
              </div>
              <ul className={styles.cityList}>
                {active.cities.map(c => (
                  <li key={c.slug}>
                    <Link href={`/steden/${c.slug}`} className={styles.cityLink}>
                      <span className={styles.cityArrow}>→</span>
                      Autosleutel bijmaken {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/steden" className={styles.allCitiesBtn}>
                Alle steden in {active.label} bekijken
              </Link>
            </div>
          ) : (
            <div className={styles.defaultPanel}>
              <p className={styles.defaultEyebrow}>📍 WERKGEBIED</p>
              <h3 className={styles.defaultTitle}>Direct bij u op locatie</h3>
              <p className={styles.defaultText}>
                Wij zijn dagelijks actief in <strong>7 provincies</strong> en <strong>46+ steden</strong> door heel Midden-Nederland en de Randstad. Klik op een provincie op de kaart voor alle steden en directe links.
              </p>
              <ul className={styles.regionQuickList}>
                {REGIONS.map(r => (
                  <li key={r.id}>
                    <button
                      className={styles.regionBtn}
                      style={{ borderColor: r.color, color: r.color }}
                      onClick={() => setActiveRegion(r.id)}
                    >
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
              <Link href="/steden" className={styles.allCitiesBtn}>
                Alle 46+ steden bekijken →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
