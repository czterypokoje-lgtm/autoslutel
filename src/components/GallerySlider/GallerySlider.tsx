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

  // Caption under the photo, not on top of it: an overlay darkened every
  // photo, and inside the service pages' content column the page's own
  // paragraph styles turned the white caption grey and unreadable.
  const renderImageCard = (img: GalleryImage, index: number) => (
    <figure key={index} className={`${styles.card} ${isFewImages ? '' : styles.slide}`}>
      <div className={styles.imageCard}>
        <Image
          src={img.src}
          alt={img.caption}
          fill
          className={styles.image}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <figcaption className={styles.caption}>{img.caption}</figcaption>
    </figure>
  );

  return (
    <div className={styles.container}>
      {title && <h2 className={styles.title}>{title}</h2>}
      
      {isFewImages ? (
        <div className={styles.grid}>
          {images.map((img, index) => renderImageCard(img, index))}
        </div>
      ) : (
        <div className={styles.sliderWrapper}>
          <button onClick={scrollLeft} className={`${styles.arrowButton} ${styles.prevButton}`} aria-label="Vorige foto">
            &#8592;
          </button>

          <div className={styles.slider} ref={sliderRef}>
            {images.map((img, index) => renderImageCard(img, index))}
          </div>

          <button onClick={scrollRight} className={`${styles.arrowButton} ${styles.nextButton}`} aria-label="Volgende foto">
            &#8594;
          </button>
        </div>
      )}
    </div>
  );
}
