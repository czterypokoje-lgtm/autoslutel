'use client';

import React, { useRef } from 'react';
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
  }
];

export default function RealGalleryShowcase() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth < 640 ? 300 : 800;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={styles.showcaseWrapper}>
      <div className={styles.sliderViewport} ref={scrollRef}>
        <div className={styles.sliderTrack}>
          {REAL_GALLERY_PROJECTS.map((project, idx) => (
            <div key={project.id} className={styles.card}>
              <div className={styles.imageContainer}>
                <Image
                  src={project.src}
                  alt={project.alt}
                  fill
                  unoptimized={true}
                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 340px"
                  loading={idx < 4 ? "eager" : "lazy"}
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.sliderNav}>
        <button onClick={() => scroll('left')} className={styles.arrowBtn} aria-label="Vorige foto's">
          &#8592;
        </button>
        <button onClick={() => scroll('right')} className={styles.arrowBtn} aria-label="Volgende foto's">
          &#8594;
        </button>
      </div>
    </div>
  );
}
