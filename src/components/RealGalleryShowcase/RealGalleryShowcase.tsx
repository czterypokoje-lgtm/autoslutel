'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './RealGalleryShowcase.module.css';

export interface GalleryProject {
  id: number;
  src: string;
  alt: string;
}

export const REAL_GALLERY_PROJECTS: GalleryProject[] = [
  {
    id: 1,
    src: '/images/gallery/autosleutel_ford_reservesleutel_bijmaken_utrecht_centrum.webp',
    alt: 'Ford autosleutel reservesleutel bijmaken en programmeren op locatie in Utrecht Centrum'
  },
  {
    id: 2,
    src: '/images/gallery/autosleutel_hyundai_reservesleutel_programmeren_utrecht_zuid.webp',
    alt: 'Hyundai autosleutel bijmaken en keyless smart key inleren in Utrecht Zuid'
  },
  {
    id: 3,
    src: '/images/gallery/autosleutel_specialist_mobiele_werkplaats_utrecht_leidsche_rijn.webp',
    alt: 'Autosleutel24 mobiele servicebus met diagnoseapparatuur op locatie in Utrecht Leidsche Rijn'
  },
  {
    id: 4,
    src: '/images/gallery/autosleutel_audi_reservesleutel_inleren_utrecht_overvecht.webp',
    alt: 'Audi smart key autosleutel inleren op locatie Utrecht Overvecht'
  },
  {
    id: 5,
    src: '/images/gallery/autosleutel_audi_smartkey_programmeren_utrecht_west.webp',
    alt: 'Audi smartkey reservesleutel programmeren en transponder inleren Utrecht West'
  },
  {
    id: 6,
    src: '/images/gallery/autosleutel_bmw_reservesleutel_bijmaken_utrecht_oost.webp',
    alt: 'BMW autosleutel reservesleutel bijmaken en programmeren op locatie Utrecht Oost'
  },
  {
    id: 7,
    src: '/images/gallery/autosleutel_bmw_sleutel_programmeren_amsterdam_centrum.webp',
    alt: 'BMW sleutel programmeren op locatie mobiele service Amsterdam Centrum'
  },
  {
    id: 8,
    src: '/images/gallery/autosleutel_ford_transit_focus_sleutel_amsterdam_zuid.webp',
    alt: 'Ford Transit bedrijfswagen reservesleutel bijmaken Amsterdam Zuid'
  },
  {
    id: 9,
    src: '/images/gallery/autosleutel_jeep_reservesleutel_amsterdam_noord.webp',
    alt: 'Jeep autosleutel en keyless entry afstandsbediening programmeren Amsterdam Noord'
  },
  {
    id: 10,
    src: '/images/gallery/autosleutel_kia_smartkey_bijmaken_amsterdam_west.webp',
    alt: 'Kia smart key sleutel bijmaken en transponder inleren Amsterdam West'
  },
  {
    id: 11,
    src: '/images/gallery/autosleutel_mercedes_eis_reservesleutel_amsterdam_oost.webp',
    alt: 'Mercedes EIS contactslot chromen autosleutel bijmaken en inleren Amsterdam Oost'
  },
  {
    id: 12,
    src: '/images/gallery/autosleutel_mercedes_benz_sleutel_programmeren_almere_centrum.webp',
    alt: 'Mercedes-Benz autosleutel inleren en transponder kopiëren Almere Centrum'
  },
  {
    id: 13,
    src: '/images/gallery/autosleutel_nissan_qashqai_sleutel_bijmaken_almere_stad.webp',
    alt: 'Nissan Qashqai autosleutel bijmaken en keyless entry programmeren Almere Stad'
  },
  {
    id: 14,
    src: '/images/gallery/autosleutel_nissan_reservesleutel_almere_poort.webp',
    alt: 'Nissan reservesleutel programmeren en sleutelbaard slijpen Almere Poort'
  },
  {
    id: 15,
    src: '/images/gallery/autosleutel_opel_astra_reservesleutel_almere_buiten.webp',
    alt: 'Opel Astra reservesleutel bijmaken op locatie Almere Buiten'
  },
  {
    id: 16,
    src: '/images/gallery/autosleutel_opel_corsa_sleutel_bijmaken_almere_haven.webp',
    alt: 'Opel Corsa klapsleutel bijmaken en transponder inleren Almere Haven'
  },
  {
    id: 17,
    src: '/images/gallery/autosleutel_porsche_cayenne_sleutel_bijmaken_amersfoort_centrum.webp',
    alt: 'Porsche Cayenne smart key keyless entry autosleutel programmeren Amersfoort Centrum'
  },
  {
    id: 18,
    src: '/images/gallery/autosleutel_porsche_911_macan_sleutel_amersfoort_vathorst.webp',
    alt: 'Porsche 911 en Porsche Macan autosleutel bijmaken Amersfoort Vathorst'
  },
  {
    id: 19,
    src: '/images/gallery/autosleutel_porsche_panamera_reservesleutel_amersfoort_noord.webp',
    alt: 'Porsche Panamera autosleutel bijmaken op locatie Amersfoort Noord'
  },
  {
    id: 20,
    src: '/images/gallery/autosleutel_porsche_reservesleutel_amersfoort_zuid.webp',
    alt: 'Porsche sportmodel autosleutel inleren en programmeren Amersfoort Zuid'
  },
  {
    id: 21,
    src: '/images/gallery/autosleutel_porsche_smartkey_bijmaken_amersfoort_west.webp',
    alt: 'Porsche smartkey en reservesleutel bijmaken Amersfoort West'
  },
  {
    id: 22,
    src: '/images/gallery/autosleutel_skoda_octavia_reservesleutel_hilversum.webp',
    alt: 'Skoda Octavia autosleutel bijmaken en programmeren op locatie Hilversum'
  },
  {
    id: 23,
    src: '/images/gallery/autosleutel_toyota_corolla_reservesleutel_zeist.webp',
    alt: 'Toyota Corolla smart key keyless go autosleutel bijmaken Zeist'
  },
  {
    id: 24,
    src: '/images/gallery/autosleutel_volvo_xc60_v40_sleutel_bijmaken_nieuwegein.webp',
    alt: 'Volvo XC60 V40 autosleutel bijmaken en smart key inleren Nieuwegein'
  },
  {
    id: 25,
    src: '/images/gallery/autosleutel_volkswagen_golf_reservesleutel_maarssen.webp',
    alt: 'Volkswagen Golf reservesleutel bijmaken en programmeren Maarssen'
  },
  {
    id: 26,
    src: '/images/gallery/autosleutel_volkswagen_polo_sleutel_programmeren_houten.webp',
    alt: 'Volkswagen Polo reservesleutel bijmaken en afstandsbediening inleren Houten'
  }
];

export default function RealGalleryShowcase() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const itemsPerPage = 4;
  const totalPages = Math.ceil(REAL_GALLERY_PROJECTS.length / itemsPerPage);

  // Chunk projects into pages of 4 so all pages stay mounted in DOM (ZERO black flash)
  const slides: GalleryProject[][] = [];
  for (let i = 0; i < REAL_GALLERY_PROJECTS.length; i += itemsPerPage) {
    slides.push(REAL_GALLERY_PROJECTS.slice(i, i + itemsPerPage));
  }

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentPage((prevPage) => (prevPage + 1) % totalPages);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, totalPages]);

  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  return (
    <div
      className={styles.showcaseWrapper}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.sliderViewport}>
        <div
          className={styles.sliderTrack}
          style={{ transform: `translate3d(-${currentPage * 100}%, 0, 0)` }}
        >
          {slides.map((slideProjects, slideIdx) => (
            <div key={slideIdx} className={styles.slidePage}>
              <div className={styles.grid}>
                {slideProjects.map((project, idx) => (
                  <div key={project.id} className={styles.card}>
                    <div className={styles.imageContainer}>
                      <Image
                        src={project.src}
                        alt={project.alt}
                        fill
                        sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 340px"
                        loading={slideIdx < 3 ? "eager" : "lazy"}
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SLIDER NAVIGATION ARROWS & DOTS */}
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
    </div>
  );
}
