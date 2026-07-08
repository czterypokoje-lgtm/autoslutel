'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './RealGalleryShowcase.module.css';

export interface GalleryProject {
  id: number;
  src: string;
  brand: string;
  title: string;
  city: string;
  gps: string;
  alt: string;
  category: string;
}

export const REAL_GALLERY_PROJECTS: GalleryProject[] = [
  {
    id: 1,
    src: '/images/gallery/autosleutel_bmw_reservesleutel_bijmaken_utrecht_amsterdam.webp',
    brand: 'BMW',
    title: 'BMW FEM/CAS Sleutel Bijmaken',
    city: 'Utrecht & Amsterdam',
    gps: '52.0907 N, 5.1214 E',
    category: 'BMW',
    alt: 'BMW autosleutel reservesleutel bijmaken en programmeren op locatie Utrecht en Amsterdam GPS 52.09 N'
  },
  {
    id: 2,
    src: '/images/gallery/autosleutel_mercedes_eis_reservesleutel_utrecht_amsterdam.webp',
    brand: 'Mercedes',
    title: 'Mercedes Chromen IR Sleutel',
    city: 'Utrecht & Amsterdam',
    gps: '52.3676 N, 4.9041 E',
    category: 'Mercedes',
    alt: 'Mercedes EIS contactslot chromen autosleutel bijmaken en inleren op locatie Amsterdam en Utrecht'
  },
  {
    id: 3,
    src: '/images/gallery/autosleutel_porsche_cayenne_sleutel_bijmaken_utrecht.webp',
    brand: 'Porsche',
    title: 'Porsche Cayenne Keyless Sleutel',
    city: 'Utrecht',
    gps: '52.0907 N, 5.1214 E',
    category: 'Porsche',
    alt: 'Porsche Cayenne smart key keyless entry autosleutel programmeren Utrecht en Amersfoort'
  },
  {
    id: 4,
    src: '/images/gallery/autosleutel_audi_reservesleutel_inleren_utrecht_amsterdam.webp',
    brand: 'Audi',
    title: 'Audi A4/A6 Keyless Sleutel',
    city: 'Utrecht & Amsterdam',
    gps: '52.0907 N, 5.1214 E',
    category: 'VW & Audi',
    alt: 'Audi smart key autosleutel inleren op locatie Utrecht Amsterdam Almere'
  },
  {
    id: 5,
    src: '/images/gallery/autosleutel_volkswagen_golf_reservesleutel_utrecht_amsterdam.webp',
    brand: 'Volkswagen',
    title: 'Volkswagen Golf SFD Sleutel',
    city: 'Utrecht & Amsterdam',
    gps: '52.0907 N, 5.1214 E',
    category: 'VW & Audi',
    alt: 'Volkswagen Golf reservesleutel bijmaken en programmeren met SFD beveiliging Utrecht'
  },
  {
    id: 6,
    src: '/images/gallery/autosleutel_ford_reservesleutel_bijmaken_utrecht_amsterdam.webp',
    brand: 'Ford',
    title: 'Ford Focus & Fiesta Reservesleutel',
    city: 'Utrecht & Amsterdam',
    gps: '52.0907 N, 5.1214 E',
    category: 'Ford & Opel',
    alt: 'Ford reservesleutel bijmaken en programmeren op locatie in Utrecht en Amsterdam'
  },
  {
    id: 7,
    src: '/images/gallery/autosleutel_bmw_sleutel_programmeren_op_locatie_utrecht.webp',
    brand: 'BMW',
    title: 'BMW Sleutel Programmeren Op Locatie',
    city: 'Utrecht',
    gps: '52.0907 N, 5.1214 E',
    category: 'BMW',
    alt: 'BMW sleutel programmeren op locatie mobiele service Utrecht'
  },
  {
    id: 8,
    src: '/images/gallery/autosleutel_mercedes_benz_sleutel_programmeren_utrecht.webp',
    brand: 'Mercedes',
    title: 'Mercedes-Benz Sleutel Inleren',
    city: 'Utrecht & Amersfoort',
    gps: '52.0907 N, 5.1214 E',
    category: 'Mercedes',
    alt: 'Mercedes-Benz autosleutel inleren en transponder kopiëren op locatie Utrecht'
  },
  {
    id: 9,
    src: '/images/gallery/autosleutel_porsche_911_macan_sleutel_programmeren_utrecht.webp',
    brand: 'Porsche',
    title: 'Porsche 911 & Macan Programmering',
    city: 'Utrecht & Hilversum',
    gps: '52.2292 N, 5.1703 E',
    category: 'Porsche',
    alt: 'Porsche 911 en Porsche Macan autosleutel bijmaken en keyless programmeren'
  },
  {
    id: 10,
    src: '/images/gallery/autosleutel_toyota_corolla_reservesleutel_utrecht_almere.webp',
    brand: 'Toyota',
    title: 'Toyota Corolla Smart Key',
    city: 'Utrecht & Almere',
    gps: '52.3702 N, 5.2141 E',
    category: 'Aziatisch',
    alt: 'Toyota Corolla smart key keyless go autosleutel bijmaken Utrecht en Almere'
  },
  {
    id: 11,
    src: '/images/gallery/autosleutel_audi_smartkey_programmeren_utrecht_almere.webp',
    brand: 'Audi',
    title: 'Audi Smart Key Programmering',
    city: 'Utrecht & Almere',
    gps: '52.0907 N, 5.1214 E',
    category: 'VW & Audi',
    alt: 'Audi smartkey reservesleutel programmeren en transponder inleren Almere Utrecht'
  },
  {
    id: 12,
    src: '/images/gallery/autosleutel_porsche_panamera_reservesleutel_utrecht_amsterdam.webp',
    brand: 'Porsche',
    title: 'Porsche Panamera Reservesleutel',
    city: 'Utrecht & Amsterdam',
    gps: '52.0907 N, 5.1214 E',
    category: 'Porsche',
    alt: 'Porsche Panamera autosleutel bijmaken op locatie Utrecht Amsterdam'
  },
  {
    id: 13,
    src: '/images/gallery/autosleutel_volkswagen_polo_sleutel_programmeren_utrecht.webp',
    brand: 'Volkswagen',
    title: 'Volkswagen Polo Transponder Sleutel',
    city: 'Utrecht',
    gps: '52.0907 N, 5.1214 E',
    category: 'VW & Audi',
    alt: 'Volkswagen Polo reservesleutel bijmaken en afstandsbediening inleren Utrecht'
  },
  {
    id: 14,
    src: '/images/gallery/autosleutel_nissan_qashqai_sleutel_bijmaken_utrecht.webp',
    brand: 'Nissan',
    title: 'Nissan Qashqai Smart Key',
    city: 'Utrecht',
    gps: '52.0907 N, 5.1214 E',
    category: 'Aziatisch',
    alt: 'Nissan Qashqai autosleutel bijmaken en keyless entry programmeren Utrecht'
  },
  {
    id: 15,
    src: '/images/gallery/autosleutel_opel_astra_reservesleutel_utrecht_almere.webp',
    brand: 'Opel',
    title: 'Opel Astra Sleutel Bijmaken',
    city: 'Utrecht & Almere',
    gps: '52.3702 N, 5.2141 E',
    category: 'Ford & Opel',
    alt: 'Opel Astra reservesleutel bijmaken op locatie Utrecht Almere'
  },
  {
    id: 16,
    src: '/images/gallery/autosleutel_porsche_reservesleutel_inleren_utrecht_almere.webp',
    brand: 'Porsche',
    title: 'Porsche Sportsleutel Inleren',
    city: 'Utrecht & Almere',
    gps: '52.0907 N, 5.1214 E',
    category: 'Porsche',
    alt: 'Porsche sportmodel autosleutel inleren en programmeren Utrecht Almere'
  },
  {
    id: 17,
    src: '/images/gallery/autosleutel_kia_smartkey_bijmaken_utrecht_almere.webp',
    brand: 'Kia',
    title: 'Kia Smart Key Bijmaken',
    city: 'Utrecht & Almere',
    gps: '52.0907 N, 5.1214 E',
    category: 'Aziatisch',
    alt: 'Kia smart key sleutel bijmaken en transponder inleren Utrecht en Almere'
  },
  {
    id: 18,
    src: '/images/gallery/autosleutel_ford_transit_focus_sleutel_bijmaken_utrecht.webp',
    brand: 'Ford',
    title: 'Ford Transit Bedrijfswagen Sleutel',
    city: 'Utrecht & Amersfoort',
    gps: '52.1561 N, 5.3878 E',
    category: 'Ford & Opel',
    alt: 'Ford Transit bedrijfswagen reservesleutel bijmaken Utrecht Amersfoort'
  },
  {
    id: 19,
    src: '/images/gallery/autosleutel_hyundai_reservesleutel_programmeren_utrecht_almere.webp',
    brand: 'Hyundai',
    title: 'Hyundai Smart Key Inleren',
    city: 'Utrecht & Almere',
    gps: '52.0907 N, 5.1214 E',
    category: 'Aziatisch',
    alt: 'Hyundai autosleutel bijmaken en smart key inleren Utrecht Almere'
  },
  {
    id: 20,
    src: '/images/gallery/autosleutel_porsche_smartkey_bijmaken_utrecht.webp',
    brand: 'Porsche',
    title: 'Porsche Smart Key Bijmaken',
    city: 'Utrecht',
    gps: '52.0907 N, 5.1214 E',
    category: 'Porsche',
    alt: 'Porsche smartkey en reservesleutel bijmaken Utrecht'
  },
  {
    id: 21,
    src: '/images/gallery/autosleutel_nissan_reservesleutel_programmeren_utrecht_amsterdam.webp',
    brand: 'Nissan',
    title: 'Nissan Reservesleutel Programmeren',
    city: 'Utrecht & Amsterdam',
    gps: '52.3676 N, 4.9041 E',
    category: 'Aziatisch',
    alt: 'Nissan reservesleutel programmeren en sleutelbaard slijpen Utrecht Amsterdam'
  },
  {
    id: 22,
    src: '/images/gallery/autosleutel_opel_corsa_sleutel_bijmaken_utrecht_amsterdam.webp',
    brand: 'Opel',
    title: 'Opel Corsa Klapsleutel Inleren',
    city: 'Utrecht & Amsterdam',
    gps: '52.0907 N, 5.1214 E',
    category: 'Ford & Opel',
    alt: 'Opel Corsa klapsleutel bijmaken en transponder inleren Utrecht Amsterdam'
  },
  {
    id: 23,
    src: '/images/gallery/autosleutel_skoda_octavia_reservesleutel_utrecht_amsterdam.webp',
    brand: 'Skoda',
    title: 'Skoda Octavia Sleutel Programmeren',
    city: 'Utrecht & Amsterdam',
    gps: '52.0907 N, 5.1214 E',
    category: 'VW & Audi',
    alt: 'Skoda Octavia autosleutel bijmaken en programmeren op locatie Utrecht'
  },
  {
    id: 24,
    src: '/images/gallery/autosleutel_volvo_xc60_v40_sleutel_bijmaken_utrecht.webp',
    brand: 'Volvo',
    title: 'Volvo XC60 / V40 Sleutel Inleren',
    city: 'Utrecht & Amersfoort',
    gps: '52.0907 N, 5.1214 E',
    category: 'Overig',
    alt: 'Volvo XC60 V40 autosleutel bijmaken en smart key inleren Utrecht'
  },
  {
    id: 25,
    src: '/images/gallery/autosleutel_jeep_reservesleutel_programmeren_utrecht_amsterdam.webp',
    brand: 'Jeep',
    title: 'Jeep Keyless Entry Reservesleutel',
    city: 'Utrecht & Amsterdam',
    gps: '52.0907 N, 5.1214 E',
    category: 'Overig',
    alt: 'Jeep autosleutel en keyless entry afstandsbediening programmeren Utrecht'
  },
  {
    id: 26,
    src: '/images/gallery/autosleutel_specialist_mobiele_werkplaats_utrecht_amsterdam.webp',
    brand: 'Mobiele Service',
    title: 'Mobiele Servicebus & Diagnose',
    city: 'Heel Nederland',
    gps: '52.0907 N, 5.1214 E',
    category: 'Overig',
    alt: 'Autosleutel24 mobiele servicebus met diagnoseapparatuur op locatie in heel Nederland'
  }
];

const FILTER_CATEGORIES = ['Alle Projecten (26)', 'BMW', 'Mercedes', 'Porsche', 'VW & Audi', 'Ford & Opel', 'Aziatisch', 'Overig'];

export default function RealGalleryShowcase() {
  const [activeTab, setActiveTab] = useState('Alle Projecten (26)');

  const filteredProjects = activeTab === 'Alle Projecten (26)'
    ? REAL_GALLERY_PROJECTS
    : REAL_GALLERY_PROJECTS.filter(p => p.category === activeTab);

  return (
    <div className={styles.showcaseWrapper}>
      {/* FILTER BUTTONS */}
      <div className={styles.filterBar}>
        {FILTER_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`${styles.filterBtn} ${activeTab === cat ? styles.filterBtnActive : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* HORIZONTAL CONTINUOUS SHOWCASE STRIP (SCROLLABLE & INTERACTIVE) */}
      <div className={styles.sliderContainer}>
        <div className={styles.grid}>
          {filteredProjects.map((project, index) => (
            <div key={project.id} className={styles.card}>
              <div className={styles.imageContainer}>
                <Image
                  src={project.src}
                  alt={project.alt}
                  fill
                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 340px"
                  loading={index < 4 ? "eager" : "lazy"}
                  style={{ objectFit: 'cover' }}
                />
                <div className={styles.topBadges}>
                  <span className={styles.brandBadge}>{project.brand}</span>
                  <span className={styles.gpsBadge}>📍 {project.city}</span>
                </div>
                <div className={styles.overlay}>
                  <div className={styles.overlayContent}>
                    <h3 className={styles.cardTitle}>{project.title}</h3>
                    <p className={styles.cardGps}>SEO GPS: {project.gps}</p>
                    <span className={styles.tag}>Op Locatie Geprogrammeerd</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
