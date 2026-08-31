'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './ServiceAreaMap.module.css';
import { CITIES } from '@/config/cities';

type City = { name: string; slug: string };

type Province = {
  id: string;
  label: string;
  cities: City[];
};

/**
 * Provinces are derived from CITIES rather than hardcoded.
 *
 * This list used to be maintained by hand and had drifted out of sync: it
 * linked to Rotterdam, Eindhoven, Tilburg, Dordrecht and Delft, none of which
 * had a city page. Because the map renders on every page, that produced five
 * broken links on all ~300 pages. Deriving the list makes that impossible —
 * a city can only be linked here if it can actually be rendered.
 */
const PROVINCE_ORDER = [
  'Utrecht',
  'Noord-Holland',
  'Zuid-Holland',
  'Gelderland',
  'Flevoland',
  'Noord-Brabant',
];

const slugifyProvince = (region: string) =>
  region.toLowerCase().replace(/\s+/g, '-');

const SERVICE_PROVINCES: Province[] = PROVINCE_ORDER.map((region) => ({
  id: slugifyProvince(region),
  label: region,
  cities: CITIES.filter((c) => c.region === region)
    // Biggest search volume first, so the most valuable pages sit at the top.
    .sort((a, b) => b.nlSearches - a.nlSearches)
    .map((c) => ({ name: c.city, slug: c.slug })),
})).filter((p) => p.cities.length > 0);


export default function ServiceAreaMap() {
  const [activeProvince, setActiveProvince] = useState<string>('utrecht');

  const toggleProvince = (id: string) => {
    setActiveProvince(prev => (prev === id ? '' : id));
  };

  return (
    <div className={styles.root}>
      <div className={styles.layout}>
        
        {/* ── VISUAL MAP (IMAGE BASED) ── */}
        <div className={styles.imageCol}>
          <div className={styles.imageWrapper}>
            <Image 
              src="/images/nl-map-orange.png" 
              alt="Kaart werkgebied Autosleutel24 Nederland" 
              fill
              className={styles.mapImage}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          {/* Subtle trust badge overlay on map */}
          <div className={styles.mapBadge}>
            <div className={styles.badgePulse}></div>
            <span><strong>Actief</strong> in uw regio</span>
          </div>
        </div>

        {/* ── INTERACTIVE ACCORDION PANEL (SEO & MOBILE FIRST) ── */}
        <div className={styles.panelCol}>
          <div className={styles.panelHeader}>
            <p className={styles.eyebrow}>📍 WERKGEBIED</p>
            <h3 className={styles.title}>Kies uw provincie</h3>
            <p className={styles.desc}>
              Wij zijn dagelijks met meerdere servicebussen actief in de onderstaande regio&apos;s. Selecteer uw provincie voor directe lokale tarieven en aankomsttijden.
            </p>
          </div>

          <div className={styles.accordionGroup}>
            {SERVICE_PROVINCES.map(province => {
              const isActive = activeProvince === province.id;
              
              return (
                <div 
                  key={province.id} 
                  className={`${styles.accordionItem} ${isActive ? styles.active : ''}`}
                >
                  <button 
                    className={styles.accordionHeader}
                    onClick={() => toggleProvince(province.id)}
                    aria-expanded={isActive}
                  >
                    <span className={styles.accordionTitle}>{province.label}</span>
                    <span className={styles.accordionIcon}>{isActive ? '−' : '+'}</span>
                  </button>
                  
                  <div 
                    className={styles.accordionContent}
                    // Scales with the list: Utrecht alone has 24 cities, which
                    // a fixed 500px cap silently clipped.
                    style={{
                      maxHeight: isActive
                        ? `${province.cities.length * 44 + 24}px`
                        : '0',
                    }}
                  >
                    <ul className={styles.cityList}>
                      {province.cities.map(city => (
                        <li key={city.slug}>
                          <Link href={`/steden/${city.slug}`} className={styles.cityLink}>
                            <span className={styles.cityArrow}>→</span>
                            Autosleutel bijmaken {city.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.panelFooter}>
            <Link href="/steden" className={styles.ctaBtn}>
              Alle 46+ steden bekijken →
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
