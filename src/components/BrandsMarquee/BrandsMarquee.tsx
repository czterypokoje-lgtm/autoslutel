import React from 'react';
import styles from './BrandsMarquee.module.css';
import Image from 'next/image';

const marqueeBrands = [
  { name: 'Ford', logo: 'https://cdn.simpleicons.org/ford/001E50' },
  { name: 'Renault', logo: 'https://cdn.simpleicons.org/renault/001E50' },
  { name: 'Opel', logo: '/brands/opel_sleutel_bijmaken.webp' },
  { name: 'Hyundai', logo: 'https://cdn.simpleicons.org/hyundai/001E50' },
  { name: 'Citroën', logo: '/brands/citroen_sleutel_bijmaken.webp' },
  { name: 'Kia', logo: '/brands/kia_sleutel_bijmaken.svg' },
  { name: 'Volkswagen', logo: 'https://cdn.simpleicons.org/volkswagen/001E50' },
  { name: 'BMW', logo: 'https://cdn.simpleicons.org/bmw/001E50' },
  { name: 'Audi', logo: 'https://cdn.simpleicons.org/audi/001E50' },
  { name: 'Mercedes-Benz', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg' },
  { name: 'Toyota', logo: 'https://cdn.simpleicons.org/toyota/001E50' },
  { name: 'Peugeot', logo: 'https://cdn.simpleicons.org/peugeot/001E50' }
];

export default function BrandsMarquee() {
  return (
    <div className={styles.marqueeContainer}>
      <div className={styles.marqueeTrack}>
        {marqueeBrands.map((brand, i) => (
          <div key={`${brand.name}-${i}`} className={styles.marqueeItem}>
            <Image 
              src={brand.logo} 
              alt={`${brand.name} autosleutel bijmaken`} 
              width={70} 
              height={40} 
              style={{ objectFit: 'contain' }}
              loading="lazy"
              unoptimized={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
