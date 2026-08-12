import React from 'react';
import styles from './BrandsMarquee.module.css';
import Image from 'next/image';

const marqueeBrands = [
  { name: 'Ford', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg' },
  { name: 'Renault', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_Text.svg' },
  { name: 'Opel', logo: '/brands/opel_sleutel_bijmaken.webp' },
  { name: 'Hyundai', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg' },
  { name: 'Citroën', logo: '/brands/citroen_sleutel_bijmaken.webp' },
  { name: 'Kia', logo: '/brands/kia_sleutel_bijmaken.svg' },
  { name: 'Volkswagen', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg' },
  { name: 'BMW', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg' },
  { name: 'Audi', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg' },
  { name: 'Mercedes-Benz', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg' },
  { name: 'Toyota', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Toyota_logo_%28Red%29.svg' },
  { name: 'Peugeot', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg' }
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
            />
          </div>
        ))}
      </div>
    </div>
  );
}
