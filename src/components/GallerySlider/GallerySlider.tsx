'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import styles from './GallerySlider.module.css';

export interface GalleryImage {
  src: string;
  caption: string;
}

interface GallerySliderProps {
  images: GalleryImage[];
  title?: string;
}

export default function GallerySlider({ images, title = "Onze service in de hele regio — Galerij" }: GallerySliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth;
      sliderRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!images || images.length === 0) return null;

  const isFewImages = images.length <= 4;

  return (
    <div className={styles.container}>
      {title && <h2 className={styles.title}>{title}</h2>}
      
      <div className={styles.sliderWrapper}>
        {!isFewImages && (
          <button onClick={scrollLeft} className={`${styles.arrowButton} ${styles.prevButton}`} aria-label="Vorige foto">
            &#8592;
          </button>
        )}

        <div className={`${styles.slider} ${isFewImages ? styles.centeredSlider : ''}`} ref={sliderRef}>
          {images.map((img, index) => (
            <div key={index} className={styles.slide}>
              <Image 
                src={img.src} 
                alt={img.caption} 
                fill
                className={styles.image}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className={styles.overlay}>
                <h3 className={styles.caption}>{img.caption}</h3>
              </div>
            </div>
          ))}
        </div>

        {!isFewImages && (
          <button onClick={scrollRight} className={`${styles.arrowButton} ${styles.nextButton}`} aria-label="Volgende foto">
            &#8594;
          </button>
        )}
      </div>
    </div>
  );
}
