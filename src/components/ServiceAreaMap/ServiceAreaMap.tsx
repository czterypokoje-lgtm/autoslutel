'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './ServiceAreaMap.module.css';

// ── Coordinate transform ─────────────────────────────────────────
// viewBox 0 0 500 530
// x = (lng - 3.35) * 128
// y = (53.60 - lat) * 200

type City = { name: string; slug: string; x: number; y: number };

type Province = {
  id: string;
  label: string;
  path: string;
  labelX: number;
  labelY: number;
  isService: boolean;
  cities?: City[];
};

const PROVINCES: Province[] = [
  // ── Non-service (dim) ────────────────────────────────
  {
    id: 'groningen', label: 'Groningen', isService: false,
    path: 'M 342,12 L 432,12 L 490,36 L 490,80 L 450,130 L 380,130 L 342,100 Z',
    labelX: 415, labelY: 70,
  },
  {
    id: 'friesland', label: 'Friesland', isService: false,
    path: 'M 184,12 L 342,12 L 342,100 L 300,130 L 268,156 L 236,176 L 208,136 L 192,130 L 175,80 Z',
    labelX: 253, labelY: 72,
  },
  {
    id: 'drenthe', label: 'Drenthe', isService: false,
    path: 'M 380,130 L 450,130 L 460,220 L 390,220 L 370,190 L 364,160 Z',
    labelX: 418, labelY: 172,
  },
  {
    id: 'overijssel', label: 'Overijssel', isService: false,
    path: 'M 310,156 L 390,150 L 460,156 L 464,220 L 450,296 L 310,296 Z',
    labelX: 388, labelY: 228,
  },
  {
    id: 'zeeland', label: 'Zeeland', isService: false,
    path: 'M 44,384 L 110,380 L 140,420 L 120,450 L 68,460 L 28,440 L 18,415 Z',
    labelX: 80, labelY: 420,
  },
  {
    id: 'limburg', label: 'Limburg', isService: false,
    path: 'M 390,370 L 445,370 L 470,420 L 480,470 L 460,525 L 408,535 L 378,488 L 372,430 Z',
    labelX: 422, labelY: 452,
  },
  // ── Service provinces (highlighted) ──────────────────
  {
    id: 'noord-holland', label: 'Noord-Holland', isService: true,
    path: 'M 216,134 L 198,126 L 160,128 L 140,163 L 122,222 L 114,252 L 132,263 L 148,272 L 224,262 L 210,202 L 224,142 Z',
    labelX: 160, labelY: 182,
    cities: [
      { name: 'Amsterdam', slug: 'amsterdam', x: 198, y: 248 },
      { name: 'Haarlem', slug: 'haarlem', x: 162, y: 245 },
      { name: 'Amstelveen', slug: 'amstelveen', x: 190, y: 262 },
      { name: 'Almere', slug: 'almere', x: 237, y: 248 },
    ],
  },
  {
    id: 'flevoland', label: 'Flevoland', isService: true,
    path: 'M 234,174 L 294,169 L 284,240 L 250,254 L 228,229 Z',
    labelX: 262, labelY: 210,
    cities: [
      { name: 'Lelystad', slug: 'lelystad', x: 272, y: 218 },
    ],
  },
  {
    id: 'utrecht', label: 'Utrecht', isService: true,
    path: 'M 190,271 L 261,266 L 271,349 L 202,354 L 180,329 Z',
    labelX: 224, labelY: 313,
    cities: [
      { name: 'Utrecht', slug: 'utrecht', x: 226, y: 302 },
      { name: 'Amersfoort', slug: 'amersfoort', x: 260, y: 289 },
      { name: 'Woerden', slug: 'woerden', x: 196, y: 328 },
      { name: 'Houten', slug: 'houten', x: 232, y: 328 },
      { name: 'Zeist', slug: 'zeist', x: 242, y: 309 },
      { name: 'Nieuwegein', slug: 'nieuwegein', x: 218, y: 335 },
    ],
  },
  {
    id: 'gelderland', label: 'Gelderland', isService: true,
    path: 'M 269,220 L 310,208 L 390,220 L 454,294 L 440,370 L 385,390 L 294,385 L 264,349 Z',
    labelX: 360, labelY: 308,
    cities: [
      { name: 'Arnhem', slug: 'arnhem', x: 328, y: 325 },
      { name: 'Nijmegen', slug: 'nijmegen', x: 320, y: 354 },
      { name: 'Apeldoorn', slug: 'apeldoorn', x: 335, y: 278 },
      { name: 'Ede', slug: 'ede', x: 297, y: 314 },
      { name: 'Culemborg', slug: 'culemborg', x: 280, y: 344 },
    ],
  },
  {
    id: 'zuid-holland', label: 'Zuid-Holland', isService: true,
    path: 'M 74,268 L 184,258 L 200,354 L 178,385 L 100,390 L 62,365 L 52,330 Z',
    labelX: 118, labelY: 328,
    cities: [
      { name: 'Den Haag', slug: 'den-haag', x: 120, y: 308 },
      { name: 'Rotterdam', slug: 'rotterdam', x: 144, y: 337 },
      { name: 'Gouda', slug: 'gouda', x: 174, y: 320 },
      { name: 'Dordrecht', slug: 'dordrecht', x: 170, y: 360 },
      { name: 'Delft', slug: 'delft', x: 130, y: 318 },
    ],
  },
  {
    id: 'noord-brabant', label: 'Noord-Brabant', isService: true,
    path: 'M 62,385 L 292,380 L 395,390 L 395,435 L 299,460 L 168,460 L 88,455 L 56,430 Z',
    labelX: 218, labelY: 425,
    cities: [
      { name: 'Breda', slug: 'breda', x: 181, y: 404 },
      { name: 'Tilburg', slug: 'tilburg', x: 222, y: 409 },
      { name: 'Eindhoven', slug: 'eindhoven', x: 272, y: 432 },
    ],
  },
];

// Wadden Islands (simplified)
const ISLANDS = [
  'M 152,62 L 180,55 L 188,72 L 163,77 Z',
  'M 193,37 L 220,31 L 226,47 L 200,51 Z',
  'M 241,20 L 267,14 L 272,30 L 247,34 Z',
  'M 289,12 L 312,8 L 317,22 L 294,26 Z',
];

export default function ServiceAreaMap() {
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const activeProvince = PROVINCES.find(p => p.id === active && p.isService) ?? null;

  const handleClick = (p: Province) => {
    if (!p.isService) return;
    setActive(prev => (prev === p.id ? null : p.id));
  };

  return (
    <div className={styles.root}>
      <div className={styles.layout}>
        {/* ── SVG MAP ── */}
        <div className={styles.svgCol}>
          <svg viewBox="0 0 500 540" className={styles.svg} aria-label="Kaart werkgebied Autosleutel24">
            <defs>
              <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#cfe6f5" />
                <stop offset="100%" stopColor="#b8d8f0" />
              </linearGradient>
              <linearGradient id="activeProvince" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#c2540a" />
              </linearGradient>
              <filter id="provShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#00000030" />
              </filter>
              <filter id="dotGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Sea / background ── */}
            <rect width="500" height="540" fill="url(#sea)" rx="12" />

            {/* Subtle grid lines for map feel */}
            {[100, 200, 300, 400, 500].map(x => (
              <line key={`vg${x}`} x1={x} y1="0" x2={x} y2="540" stroke="#a8c8e0" strokeWidth="0.3" strokeDasharray="4 8" opacity="0.5" />
            ))}
            {[100, 200, 300, 400, 500].map(y => (
              <line key={`hg${y}`} x1="0" y1={y} x2="500" y2={y} stroke="#a8c8e0" strokeWidth="0.3" strokeDasharray="4 8" opacity="0.5" />
            ))}

            {/* ── IJsselmeer / Markermeer (inland water body) ── */}
            <path
              d="M 216,134 L 261,97 L 234,174 L 228,230 L 248,254 L 225,263 L 210,202 Z"
              fill="#b0d4ee"
              stroke="#a0c4de"
              strokeWidth="0.8"
            />

            {/* ── Province shapes ── */}
            {PROVINCES.map(p => {
              const isActive = active === p.id;
              const isHovered = hovered === p.id;
              let fill: string;
              if (p.isService) {
                if (isActive) fill = 'url(#activeProvince)';
                else if (isHovered) fill = '#2a6dbf';
                else fill = '#1e3a5fcc';
              } else {
                fill = isHovered ? '#b0bec9' : '#c8d5df';
              }
              return (
                <path
                  key={p.id}
                  d={p.path}
                  fill={fill}
                  stroke="#ffffff"
                  strokeWidth={isActive ? 2 : 1.2}
                  filter={isActive ? 'url(#provShadow)' : undefined}
                  style={{
                    cursor: p.isService ? 'pointer' : 'default',
                    transition: 'fill 0.2s ease',
                  }}
                  onClick={() => handleClick(p)}
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}

            {/* ── Afsluitdijk (the famous dike) ── */}
            <line x1="216" y1="134" x2="261" y2="97" stroke="#9ab0c0" strokeWidth="3" strokeLinecap="round" />
            <line x1="216" y1="134" x2="261" y2="97" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />

            {/* ── Wadden Islands ── */}
            {ISLANDS.map((path, i) => (
              <path key={i} d={path} fill="#c8d5df" stroke="#ffffff" strokeWidth="0.8" />
            ))}

            {/* ── Province labels ── */}
            {PROVINCES.map(p => (
              <text
                key={p.id + '-lbl'}
                x={p.labelX} y={p.labelY}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight={p.isService ? '700' : '500'}
                fontFamily="Inter, system-ui, sans-serif"
                fill={p.isService ? (active === p.id ? '#fff' : '#e8f0fb') : '#7a8fa0'}
                pointerEvents="none"
                style={{ userSelect: 'none' }}
              >
                {p.label}
              </text>
            ))}

            {/* ── City dots (service areas only) ── */}
            {PROVINCES.filter(p => p.isService && p.cities).flatMap(p =>
              p.cities!.map(c => (
                <g key={c.slug}>
                  <circle cx={c.x} cy={c.y} r="5" fill="#f97316" opacity="0.25" />
                  <circle cx={c.x} cy={c.y} r="3" fill="#f97316" stroke="#ffffff" strokeWidth="1.2" />
                </g>
              ))
            )}

            {/* ── HQ Beacon — Utrecht ── */}
            <circle cx="226" cy="302" r="14" fill="#f97316" fillOpacity="0.15" />
            <circle cx="226" cy="302" r="7" fill="#f97316" fillOpacity="0.35" />
            <circle cx="226" cy="302" r="4" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />

            {/* ── Scale / Legend strip ── */}
            <rect x="14" y="505" width="120" height="22" rx="4" fill="#ffffffcc" />
            <line x1="20" y1="519" x2="120" y2="519" stroke="#4a6080" strokeWidth="1.5" />
            <line x1="20" y1="514" x2="20" y2="524" stroke="#4a6080" strokeWidth="1.5" />
            <line x1="120" y1="514" x2="120" y2="524" stroke="#4a6080" strokeWidth="1.5" />
            <text x="70" y="512" textAnchor="middle" fontSize="8" fill="#4a6080" fontFamily="Inter, sans-serif">≈ 100 km</text>

            {/* ── "Service area" badge ── */}
            <rect x="340" y="505" width="148" height="22" rx="4" fill="#1e3a5fdd" />
            <circle cx="354" cy="516" r="4" fill="#f97316" />
            <text x="362" y="520" fontSize="8.5" fill="#ffffff" fontFamily="Inter, sans-serif" fontWeight="600">Ons werkgebied</text>
          </svg>
        </div>

        {/* ── INFO PANEL ── */}
        <div className={styles.panelCol}>
          {activeProvince ? (
            <div className={styles.cityPanel}>
              <div className={styles.panelHeader}>
                <div className={styles.panelHeaderLeft}>
                  <span className={styles.panelPin}>📍</span>
                  <h3 className={styles.panelTitle}>{activeProvince.label}</h3>
                </div>
                <button
                  className={styles.closeBtn}
                  onClick={() => setActive(null)}
                  aria-label="Sluit"
                >✕</button>
              </div>
              <ul className={styles.cityList}>
                {activeProvince.cities?.map(c => (
                  <li key={c.slug}>
                    <Link href={`/steden/${c.slug}`} className={styles.cityLink}>
                      <span className={styles.cityArrow}>→</span>
                      Autosleutel bijmaken {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className={styles.panelFooter}>
                <Link href={`/steden`} className={styles.ctaBtn}>
                  Alle steden in {activeProvince.label} →
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.defaultPanel}>
              <p className={styles.eyebrow}>📍 WERKGEBIED</p>
              <h3 className={styles.defaultTitle}>Direct bij u op locatie</h3>
              <p className={styles.defaultDesc}>
                Wij rijden dagelijks door <strong>7 provincies</strong> en <strong>46+ steden</strong>. Klik op een provincie voor directe links naar uw stad.
              </p>
              <div className={styles.provincePills}>
                {PROVINCES.filter(p => p.isService).map(p => (
                  <button
                    key={p.id}
                    className={styles.provincePill}
                    onClick={() => setActive(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className={styles.statsRow}>
                <div className={styles.stat}><strong>46+</strong><span>Steden</span></div>
                <div className={styles.stat}><strong>7</strong><span>Provincies</span></div>
                <div className={styles.stat}><strong>30–60</strong><span>Min ETA</span></div>
              </div>
              <Link href="/steden" className={styles.ctaBtn}>
                Alle steden bekijken →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
