'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './InstantServiceMap.module.css';

interface CityPin {
  name: string;
  slug: string;
  time: string;
  x: number;
  y: number;
  isHQ?: boolean;
  desc: string;
}

const CITY_PINS: CityPin[] = [
  {
    name: 'Utrecht (Hoofdlocatie)',
    slug: 'utrecht',
    time: '15-20 min',
    x: 430,
    y: 330,
    isHQ: true,
    desc: 'Onze mobiele hoofdwerkplaats met alle apparatuur voor autosleutel programmeren en noodopeningen.',
  },
  {
    name: 'Zeist',
    slug: 'zeist',
    time: '18-22 min',
    x: 500,
    y: 325,
    desc: 'Directe hulp bij verlies of defecte autosleutel in Zeist en Heuvelrug.',
  },
  {
    name: 'Amsterdam',
    slug: 'amsterdam',
    time: '35-45 min',
    x: 275,
    y: 155,
    desc: 'Snelle service in heel Amsterdam voor nieuwe transponders en contactslotschade.',
  },
  {
    name: 'Amsterdam-Zuid',
    slug: 'amsterdam-zuid',
    time: '30-40 min',
    x: 285,
    y: 185,
    desc: '24/7 Mobiele sleutelmaker op locatie in Amsterdam-Zuid en Buitenveldert.',
  },
  {
    name: 'Amstelveen',
    slug: 'amstelveen',
    time: '30-40 min',
    x: 265,
    y: 215,
    desc: 'Autosleutel bijmaken of inleren zonder sleepkosten in Amstelveen.',
  },
  {
    name: 'Diemen',
    slug: 'diemen',
    time: '30-40 min',
    x: 335,
    y: 165,
    desc: 'Direct sleutel bijmaken of slot openen aan huis of onderweg in Diemen.',
  },
  {
    name: 'Almere',
    slug: 'almere',
    time: '35-45 min',
    x: 485,
    y: 150,
    desc: 'Mobiele service in heel Almere (Stad, Buiten, Poort en Haven).',
  },
  {
    name: 'Hilversum',
    slug: 'hilversum',
    time: '25-30 min',
    x: 410,
    y: 240,
    desc: 'Gespecialiseerde autosleutel service in Hilversum en regio ’t Gooi.',
  },
  {
    name: 'Bussum',
    slug: 'bussum',
    time: '25-35 min',
    x: 395,
    y: 200,
    desc: 'Schadevrij auto openen en transponder programmeren in Bussum.',
  },
  {
    name: 'Naarden',
    slug: 'naarden',
    time: '25-35 min',
    x: 410,
    y: 175,
    desc: 'Directe mobiele hulp voor alle merken personenauto’s en bedrijfswagens in Naarden.',
  },
  {
    name: 'Huizen',
    slug: 'huizen',
    time: '30-35 min',
    x: 460,
    y: 205,
    desc: 'Reservesleutel of smartkey programmering op locatie in Huizen.',
  },
  {
    name: 'Amersfoort',
    slug: 'amersfoort',
    time: '25-30 min',
    x: 585,
    y: 280,
    desc: 'Snelle interventie in Amersfoort bij kapot contactslot of verloren sleutels.',
  },
];

export default function InstantServiceMap() {
  const [activeTab, setActiveTab] = useState<'instant' | 'google'>('instant');
  const [selectedCity, setSelectedCity] = useState<CityPin | null>(CITY_PINS[0]); // Default to Utrecht HQ
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div className={styles.mapWrapper}>
      {/* Top Controls Bar */}
      <div className={styles.topBar}>
        <div className={styles.liveIndicatorWrap}>
          <span className={styles.liveDot}></span>
          <span>Live bussen actief in regio Utrecht &amp; Randstad</span>
        </div>

        <div className={styles.toggleGroup}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${activeTab === 'instant' ? styles.toggleBtnActive : ''}`}
            onClick={() => setActiveTab('instant')}
            aria-label="Toon snelle interactieve regiokaart"
          >
            ⚡ Live Regiokaart (Instant 0ms)
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${activeTab === 'google' ? styles.toggleBtnActive : ''}`}
            onClick={() => setActiveTab('google')}
            aria-label="Laad originele Google My Maps kaart"
          >
            🗺️ Google My Maps Weergave
          </button>
        </div>

        <a
          href="https://www.google.com/maps/d/u/0/edit?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4&usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.externalLink}
        >
          <span>📍 Open in Google Maps</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>

      {/* Map Content Viewport */}
      {activeTab === 'instant' ? (
        <div className={styles.mapViewport}>
          {/* SVG Regional Vector Map */}
          <svg viewBox="0 0 750 460" className={styles.svgMap} preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#081836" />
                <stop offset="100%" stopColor="#0D2554" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Map Contours */}
            <rect width="750" height="460" fill="url(#waterGrad)" />

            {/* Subtle Regional Grid Lines */}
            <g stroke="rgba(255,255,255,0.04)" strokeWidth="1">
              <line x1="0" y1="100" x2="750" y2="100" />
              <line x1="0" y1="200" x2="750" y2="200" />
              <line x1="0" y1="300" x2="750" y2="300" />
              <line x1="0" y1="400" x2="750" y2="400" />
              <line x1="150" y1="0" x2="150" y2="460" />
              <line x1="300" y1="0" x2="300" y2="460" />
              <line x1="450" y1="0" x2="450" y2="460" />
              <line x1="600" y1="0" x2="600" y2="460" />
            </g>

            {/* Water Bodies representation (IJsselmeer & Gooimeer area) */}
            <path
              d="M380 0 Q450 60 560 90 L750 90 L750 0 Z"
              fill="rgba(14, 165, 233, 0.12)"
              stroke="rgba(14, 165, 233, 0.25)"
              strokeWidth="1.5"
            />

            {/* Highway Corridors connecting cities */}
            <g stroke="rgba(255, 255, 255, 0.16)" strokeWidth="2.5" strokeDasharray="4 4">
              {/* A2: Amsterdam to Utrecht */}
              <path d="M275 155 Q350 240 430 330" fill="none" />
              {/* A27: Almere to Hilversum to Utrecht */}
              <path d="M485 150 Q450 200 410 240 Q420 285 430 330" fill="none" />
              {/* A1: Amsterdam to Diemen to Bussum to Amersfoort */}
              <path d="M275 155 L335 165 L395 200 L585 280" fill="none" />
              {/* A28: Utrecht to Zeist to Amersfoort */}
              <path d="M430 330 L500 325 L585 280" fill="none" />
            </g>

            {/* Highway Route Badges */}
            <g fill="rgba(255,255,255,0.18)" fontSize="10" fontWeight="700">
              <text x="340" y="240" fill="#93C5FD">A2</text>
              <text x="445" y="285" fill="#93C5FD">A27</text>
              <text x="490" y="225" fill="#93C5FD">A1</text>
              <text x="535" y="315" fill="#93C5FD">A28</text>
            </g>

            {/* Connection Lines to selected city */}
            {selectedCity && (
              <line
                x1="430"
                y1="330"
                x2={selectedCity.x}
                y2={selectedCity.y}
                stroke="#E8520A"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.8"
              />
            )}

            {/* City Pins */}
            {CITY_PINS.map((city) => {
              const isSelected = selectedCity?.slug === city.slug;
              return (
                <g
                  key={city.slug}
                  className={styles.pinGroup}
                  onClick={() => setSelectedCity(city)}
                  onMouseEnter={() => setSelectedCity(city)}
                  transform={`translate(${city.x}, ${city.y})`}
                >
                  {/* Outer pulse / ring */}
                  {city.isHQ ? (
                    <circle r="18" fill="rgba(232, 82, 10, 0.25)" filter="url(#glow)">
                      <animate attributeName="r" values="14;22;14" dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  ) : isSelected ? (
                    <circle r="14" fill="rgba(16, 185, 129, 0.3)" />
                  ) : null}

                  {/* Main Pin Dot */}
                  <circle
                    r={city.isHQ ? 8.5 : isSelected ? 7 : 5.5}
                    fill={city.isHQ ? '#E8520A' : isSelected ? '#10B981' : '#60A5FA'}
                    stroke="#ffffff"
                    strokeWidth={isSelected || city.isHQ ? 2.5 : 1.5}
                    className={styles.pinCircle}
                  />

                  {/* City Label */}
                  <text
                    x="12"
                    y="4"
                    className={styles.pinText}
                    style={{
                      fill: isSelected ? '#FBBF24' : city.isHQ ? '#ffffff' : 'rgba(255,255,255,0.9)',
                      fontWeight: isSelected || city.isHQ ? 800 : 600,
                    }}
                  >
                    {city.name.replace(' (Hoofdlocatie)', '')}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Selected City Card Overlay */}
          {selectedCity && (
            <div className={styles.popupCard} role="region" aria-label={`Details voor ${selectedCity.name}`}>
              <div className={styles.popupHeader}>
                <h3 className={styles.popupTitle}>
                  <span>📍 {selectedCity.name}</span>
                </h3>
                <span className={styles.popupTimeBadge}>⚡ {selectedCity.time}</span>
              </div>
              <p className={styles.popupDesc}>{selectedCity.desc}</p>
              <div className={styles.popupActions}>
                <Link href={`/steden/${selectedCity.slug}`} className={styles.btnCityLink}>
                  <span>Bekijk {selectedCity.name.split(' ')[0]} service &amp; tarieven</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </Link>
                <a href="tel:0611751231" className={styles.btnCallDirect}>
                  <span>📞 06 11 75 12 31</span>
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Google My Maps Embedded Iframe (Only loaded on demand) */
        <div className={styles.iframeContainer}>
          {!iframeLoaded && (
            <div className={styles.loadingSpinnerOverlay}>
              <div className={styles.spinner}></div>
              <span>Google My Maps laden...</span>
            </div>
          )}
          <iframe
            src="https://www.google.com/maps/d/embed?mid=1M3Pmk5vzguoPL4qS81XLU_gz5OiXDF4&ehbc=2E312F"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="eager"
            onLoad={() => setIframeLoaded(true)}
            referrerPolicy="no-referrer-when-downgrade"
            title="Autosleutel24 Mobiele Service Werkgebied en Servicegebieden Google My Maps"
          ></iframe>
        </div>
      )}

      {/* Bottom Legend Bar */}
      <div className={styles.bottomLegend}>
        <div className={styles.legendItem}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#E8520A' }}></span>
          <strong>Hoofdlocatie Utrecht</strong> (Binnen 15-20 min)
        </div>
        <div className={styles.legendItem}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></span>
          <strong>Mobiele Bussen</strong> (Amsterdam, Almere, Amersfoort, &apos;t Gooi)
        </div>
        <div className={styles.legendItem}>
          <span>📞 Direct contact: <strong>06 11 75 12 31</strong></span>
        </div>
      </div>
    </div>
  );
}
