'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './RealGalleryShowcase.module.css';

export interface GalleryProject {
  id: number;
  src: string;
  brand: string;
  title: string;
  category: string;
  alt: string;
}

export const REAL_GALLERY_PROJECTS: GalleryProject[] = [
  {
    id: 1,
    src: '/images/gallery/autosleutel_ford_reservesleutel_bijmaken_utrecht_centrum.webp',
    brand: 'Ford',
    title: 'Ford Reservesleutel Programmeren',
    category: 'Ford & Opel',
    alt: 'Ford autosleutel reservesleutel bijmaken en programmeren op locatie in Utrecht Centrum'
  },
  {
    id: 2,
    src: '/images/gallery/autosleutel_hyundai_reservesleutel_programmeren_utrecht_zuid.webp',
    brand: 'Hyundai',
    title: 'Hyundai Smart Key Inleren',
    category: 'Aziatisch',
    alt: 'Hyundai autosleutel bijmaken en keyless smart key inleren in Utrecht Zuid'
  },
  {
    id: 3,
    src: '/images/gallery/autosleutel_specialist_mobiele_werkplaats_utrecht_leidsche_rijn.webp',
    brand: 'Mobiele Service',
    title: 'Mobiele Servicebus & Diagnose',
    category: 'Overig',
    alt: 'Autosleutel24 mobiele servicebus met diagnoseapparatuur op locatie in Utrecht Leidsche Rijn'
  },
  {
    id: 4,
    src: '/images/gallery/autosleutel_audi_reservesleutel_inleren_utrecht_overvecht.webp',
    brand: 'Audi',
    title: 'Audi A4/A6 Keyless Sleutel',
    category: 'VW & Audi',
    alt: 'Audi smart key autosleutel inleren op locatie Utrecht Overvecht'
  },
  {
    id: 5,
    src: '/images/gallery/autosleutel_audi_smartkey_programmeren_utrecht_west.webp',
    brand: 'Audi',
    title: 'Audi Smart Key Programmering',
    category: 'VW & Audi',
    alt: 'Audi smartkey reservesleutel programmeren en transponder inleren Utrecht West'
  },
  {
    id: 6,
    src: '/images/gallery/autosleutel_bmw_reservesleutel_bijmaken_utrecht_oost.webp',
    brand: 'BMW',
    title: 'BMW FEM/CAS Sleutel Bijmaken',
    category: 'BMW',
    alt: 'BMW autosleutel reservesleutel bijmaken en programmeren op locatie Utrecht Oost'
  },
  {
    id: 7,
    src: '/images/gallery/autosleutel_bmw_sleutel_programmeren_amsterdam_centrum.webp',
    brand: 'BMW',
    title: 'BMW Sleutel Programmeren Op Locatie',
    category: 'BMW',
    alt: 'BMW sleutel programmeren op locatie mobiele service Amsterdam Centrum'
  },
  {
    id: 8,
    src: '/images/gallery/autosleutel_ford_transit_focus_sleutel_amsterdam_zuid.webp',
    brand: 'Ford',
    title: 'Ford Transit Bedrijfswagen Sleutel',
    category: 'Ford & Opel',
    alt: 'Ford Transit bedrijfswagen reservesleutel bijmaken Amsterdam Zuid'
  },
  {
    id: 9,
    src: '/images/gallery/autosleutel_jeep_reservesleutel_amsterdam_noord.webp',
    brand: 'Jeep',
    title: 'Jeep Keyless Entry Reservesleutel',
    category: 'Overig',
    alt: 'Jeep autosleutel en keyless entry afstandsbediening programmeren Amsterdam Noord'
  },
  {
    id: 10,
    src: '/images/gallery/autosleutel_kia_smartkey_bijmaken_amsterdam_west.webp',
    brand: 'Kia',
    title: 'Kia Smart Key Bijmaken',
    category: 'Aziatisch',
    alt: 'Kia smart key sleutel bijmaken en transponder inleren Amsterdam West'
  },
  {
    id: 11,
    src: '/images/gallery/autosleutel_mercedes_eis_reservesleutel_amsterdam_oost.webp',
    brand: 'Mercedes',
    title: 'Mercedes Chromen IR Sleutel',
    category: 'Mercedes',
    alt: 'Mercedes EIS contactslot chromen autosleutel bijmaken en inleren Amsterdam Oost'
  },
  {
    id: 12,
    src: '/images/gallery/autosleutel_mercedes_benz_sleutel_programmeren_almere_centrum.webp',
    brand: 'Mercedes',
    title: 'Mercedes-Benz Sleutel Inleren',
    category: 'Mercedes',
    alt: 'Mercedes-Benz autosleutel inleren en transponder kopiëren Almere Centrum'
  },
  {
    id: 13,
    src: '/images/gallery/autosleutel_nissan_qashqai_sleutel_bijmaken_almere_stad.webp',
    brand: 'Nissan',
    title: 'Nissan Qashqai Smart Key',
    category: 'Aziatisch',
    alt: 'Nissan Qashqai autosleutel bijmaken en keyless entry programmeren Almere Stad'
  },
  {
    id: 14,
    src: '/images/gallery/autosleutel_nissan_reservesleutel_almere_poort.webp',
    brand: 'Nissan',
    title: 'Nissan Reservesleutel Programmeren',
    category: 'Aziatisch',
    alt: 'Nissan reservesleutel programmeren en sleutelbaard slijpen Almere Poort'
  },
  {
    id: 15,
    src: '/images/gallery/autosleutel_opel_astra_reservesleutel_almere_buiten.webp',
    brand: 'Opel',
    title: 'Opel Astra Sleutel Bijmaken',
    category: 'Ford & Opel',
    alt: 'Opel Astra reservesleutel bijmaken op locatie Almere Buiten'
  },
  {
    id: 16,
    src: '/images/gallery/autosleutel_opel_corsa_sleutel_bijmaken_almere_haven.webp',
    brand: 'Opel',
    title: 'Opel Corsa Klapsleutel Inleren',
    category: 'Ford & Opel',
    alt: 'Opel Corsa klapsleutel bijmaken en transponder inleren Almere Haven'
  },
  {
    id: 17,
    src: '/images/gallery/autosleutel_porsche_cayenne_sleutel_bijmaken_amersfoort_centrum.webp',
    brand: 'Porsche',
    title: 'Porsche Cayenne Keyless Sleutel',
    category: 'Porsche',
    alt: 'Porsche Cayenne smart key keyless entry autosleutel programmeren Amersfoort Centrum'
  },
  {
    id: 18,
    src: '/images/gallery/autosleutel_porsche_911_macan_sleutel_amersfoort_vathorst.webp',
    brand: 'Porsche',
    title: 'Porsche 911 & Macan Programmering',
    category: 'Porsche',
    alt: 'Porsche 911 en Porsche Macan autosleutel bijmaken Amersfoort Vathorst'
  },
  {
    id: 19,
    src: '/images/gallery/autosleutel_porsche_panamera_reservesleutel_amersfoort_noord.webp',
    brand: 'Porsche',
    title: 'Porsche Panamera Reservesleutel',
    category: 'Porsche',
    alt: 'Porsche Panamera autosleutel bijmaken op locatie Amersfoort Noord'
  },
  {
    id: 20,
    src: '/images/gallery/autosleutel_porsche_reservesleutel_amersfoort_zuid.webp',
    brand: 'Porsche',
    title: 'Porsche Sportsleutel Inleren',
    category: 'Porsche',
    alt: 'Porsche sportmodel autosleutel inleren en programmeren Amersfoort Zuid'
  },
  {
    id: 21,
    src: '/images/gallery/autosleutel_porsche_smartkey_bijmaken_amersfoort_west.webp',
    brand: 'Porsche',
    title: 'Porsche Smart Key Bijmaken',
    category: 'Porsche',
    alt: 'Porsche smartkey en reservesleutel bijmaken Amersfoort West'
  },
  {
    id: 22,
    src: '/images/gallery/autosleutel_skoda_octavia_reservesleutel_hilversum.webp',
    brand: 'Skoda',
    title: 'Skoda Octavia Sleutel Programmeren',
    category: 'VW & Audi',
    alt: 'Skoda Octavia autosleutel bijmaken en programmeren op locatie Hilversum'
  },
  {
    id: 23,
    src: '/images/gallery/autosleutel_toyota_corolla_reservesleutel_zeist.webp',
    brand: 'Toyota',
    title: 'Toyota Corolla Smart Key',
    category: 'Aziatisch',
    alt: 'Toyota Corolla smart key keyless go autosleutel bijmaken Zeist'
  },
  {
    id: 24,
    src: '/images/gallery/autosleutel_volvo_xc60_v40_sleutel_bijmaken_nieuwegein.webp',
    brand: 'Volvo',
    title: 'Volvo XC60 / V40 Sleutel Inleren',
    category: 'Overig',
    alt: 'Volvo XC60 V40 autosleutel bijmaken en smart key inleren Nieuwegein'
  },
  {
    id: 25,
    src: '/images/gallery/autosleutel_volkswagen_golf_reservesleutel_maarssen.webp',
    brand: 'Volkswagen',
    title: 'Volkswagen Golf SFD Sleutel',
    category: 'VW & Audi',
    alt: 'Volkswagen Golf reservesleutel bijmaken en programmeren Maarssen'
  },
  {
    id: 26,
    src: '/images/gallery/autosleutel_volkswagen_polo_sleutel_programmeren_houten.webp',
    brand: 'Volkswagen',
    title: 'Volkswagen Polo Transponder Sleutel',
    category: 'VW & Audi',
    alt: 'Volkswagen Polo reservesleutel bijmaken en afstandsbediening inleren Houten'
  }
];

const FILTER_CATEGORIES = ['Alle Projecten (26)', 'BMW', 'Mercedes', 'Porsche', 'VW & Audi', 'Ford & Opel', 'Aziatisch', 'Overig'];

export default function RealGalleryShowcase() {
  const [activeTab, setActiveTab] = useState('Alle Projecten (26)');
  const [currentPage, setCurrentPage] = useState(0);

  const filteredProjects = activeTab === 'Alle Projecten (26)'
    ? REAL_GALLERY_PROJECTS
    : REAL_GALLERY_PROJECTS.filter(p => p.category === activeTab);

  const itemsPerPage = 4;
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const handleTabChange = (cat: string) => {
    setActiveTab(cat);
    setCurrentPage(0);
  };

  const handlePrev = () => {
    setCurrentPage(prev => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const currentSlice = filteredProjects.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className={styles.showcaseWrapper}>
      {/* FILTER BUTTONS */}
      <div className={styles.filterBar}>
        {FILTER_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleTabChange(cat)}
            className={`${styles.filterBtn} ${activeTab === cat ? styles.filterBtnActive : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* STABLE HIGH-IMPACT 4-CARD SLIDER */}
      <div className={styles.sliderContainer}>
        <div className={styles.grid}>
          {currentSlice.map((project, index) => (
            <div key={project.id} className={styles.card}>
              <div className={styles.imageContainer}>
                <Image
                  src={project.src}
                  alt={project.alt}
                  fill
                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 340px"
                  loading={index < 2 ? "eager" : "lazy"}
                  style={{ objectFit: 'cover' }}
                />
                <div className={styles.topBadges}>
                  <span className={styles.brandBadge}>{project.brand}</span>
                </div>
                <div className={styles.overlay}>
                  <h3 className={styles.cardTitle}>{project.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SLIDER NAVIGATION ARROWS & DOTS */}
        {totalPages > 1 && (
          <div className={styles.sliderNav}>
            <button onClick={handlePrev} className={styles.arrowBtn} aria-label="Vorige foto's">
              &#8592;
            </button>
            <div className={styles.dots}>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`${styles.dot} ${currentPage === idx ? styles.dotActive : ''}`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
            <button onClick={handleNext} className={styles.arrowBtn} aria-label="Volgende foto's">
              &#8594;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
