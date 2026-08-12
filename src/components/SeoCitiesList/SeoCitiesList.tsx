import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CITIES } from '@/config/cities';
import styles from './SeoCitiesList.module.css';

export default function SeoCitiesList() {
  return (
    <section className={styles.seoSection}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.textContent}>
            <p className={styles.eyebrow}>WERKGEBIED</p>
            <h2 className={styles.title}>Wij zijn werkzaam door heel Nederland.</h2>
            
            <div className={styles.citiesList}>
              {CITIES.map((city) => (
                <Link key={city.slug} href={`/steden/${city.slug}`} className={styles.cityItem}>
                  <svg className={styles.pinIcon} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>Autosleutel bijmaken {city.city}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className={styles.imageContent}>
            <div className={styles.imageWrapper}>
              <Image 
                src="/images/autosleutel-bijmaken-utrecht.webp" 
                alt="Autosleutel bijmaken werkgebied Nederland"
                width={500}
                height={600}
                className={styles.seoImage}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
