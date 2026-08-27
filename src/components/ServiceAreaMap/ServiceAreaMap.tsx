'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './ServiceAreaMap.module.css';

type City = { name: string; slug: string };

type Province = {
  id: string;
  label: string;
  cities: City[];
};

const SERVICE_PROVINCES: Province[] = [
  {
    id: 'noord-holland', 
    label: 'Noord-Holland',
    cities: [
      { name: 'Amsterdam', slug: 'amsterdam' },
      { name: 'Haarlem', slug: 'haarlem' },
      { name: 'Amstelveen', slug: 'amstelveen' },
      { name: 'Almere', slug: 'almere' }, // Technically Flevoland, but grouped for SEO historically if needed, actually let's move Almere to Flevoland properly
    ],
  },
  {
    id: 'flevoland', 
    label: 'Flevoland',
    cities: [
      { name: 'Lelystad', slug: 'lelystad' },
      { name: 'Almere', slug: 'almere' },
    ],
  },
  {
    id: 'utrecht', 
    label: 'Utrecht',
    cities: [
      { name: 'Utrecht', slug: 'utrecht' },
      { name: 'Amersfoort', slug: 'amersfoort' },
      { name: 'Woerden', slug: 'woerden' },
      { name: 'Houten', slug: 'houten' },
      { name: 'Zeist', slug: 'zeist' },
      { name: 'Nieuwegein', slug: 'nieuwegein' },
    ],
  },
  {
    id: 'gelderland', 
    label: 'Gelderland',
    cities: [
      { name: 'Arnhem', slug: 'arnhem' },
      { name: 'Nijmegen', slug: 'nijmegen' },
      { name: 'Apeldoorn', slug: 'apeldoorn' },
      { name: 'Ede', slug: 'ede' },
      { name: 'Culemborg', slug: 'culemborg' },
    ],
  },
  {
    id: 'zuid-holland', 
    label: 'Zuid-Holland',
    cities: [
      { name: 'Den Haag', slug: 'den-haag' },
      { name: 'Rotterdam', slug: 'rotterdam' },
      { name: 'Gouda', slug: 'gouda' },
      { name: 'Dordrecht', slug: 'dordrecht' },
      { name: 'Delft', slug: 'delft' },
    ],
  },
  {
    id: 'noord-brabant', 
    label: 'Noord-Brabant',
    cities: [
      { name: 'Breda', slug: 'breda' },
      { name: 'Tilburg', slug: 'tilburg' },
      { name: 'Eindhoven', slug: 'eindhoven' },
    ],
  },
];

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
              src="/images/nl-map-colorful.png" 
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
                    style={{ maxHeight: isActive ? '500px' : '0' }}
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
