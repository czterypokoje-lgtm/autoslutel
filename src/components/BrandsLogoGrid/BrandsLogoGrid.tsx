import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './BrandsLogoGrid.module.css';

interface BrandsLogoGridProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  hideSeoHeader?: boolean;
}

export const BRANDS_WITH_LOGOS = [
  { name: 'Volkswagen', slug: 'volkswagen-autosleutel-bijmaken', models: 'Golf, Polo, Tiguan, Passat', svg: 'https://cdn.simpleicons.org/volkswagen/001E50' },
  { name: 'BMW', slug: 'bmw-autosleutel-bijmaken', models: '1-, 3-, 5-Serie, X1, X3, X5', svg: 'https://cdn.simpleicons.org/bmw/001E50' },
  { name: 'Mercedes-Benz', slug: 'mercedes-autosleutel-bijmaken', models: 'A-Klasse, C-Klasse, E-Klasse, Sprinter', svg: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg' },
  { name: 'Audi', slug: 'audi-autosleutel-bijmaken', models: 'A1, A3, A4, A6, Q3, Q5, Q7', svg: 'https://cdn.simpleicons.org/audi/001E50' },
  { name: 'Opel', slug: 'opel-autosleutel-bijmaken', models: 'Corsa, Astra, Mokka, Vivaro', svg: '/brands/opel_sleutel_bijmaken.webp' },
  { name: 'Ford', slug: 'ford-autosleutel-bijmaken', models: 'Focus, Fiesta, Transit, Kuga', svg: 'https://cdn.simpleicons.org/ford/001E50' },
  { name: 'Renault', slug: 'renault-autosleutel-bijmaken', models: 'Clio, Captur, Megane, Trafic', svg: 'https://cdn.simpleicons.org/renault/001E50' },
  { name: 'Peugeot', slug: 'peugeot-autosleutel-bijmaken', models: '208, 308, 2008, 3008, Partner', svg: 'https://cdn.simpleicons.org/peugeot/001E50' },
  { name: 'Toyota', slug: 'toyota-autosleutel-bijmaken', models: 'Aygo, Yaris, Corolla, RAV4', svg: 'https://cdn.simpleicons.org/toyota/001E50' },
  { name: 'Seat', slug: 'seat-autosleutel-bijmaken', models: 'Ibiza, Leon, Arona, Ateca', svg: '/brands/seat_sleutel_bijmaken.webp' },
  { name: 'Skoda', slug: 'skoda-autosleutel-bijmaken', models: 'Fabia, Octavia, Superb, Kodiaq', svg: '/brands/skoda_sleutel_bijmaken.webp' },
  { name: 'Volvo', slug: 'volvo-autosleutel-bijmaken', models: 'V40, V60, XC40, XC60, XC90', svg: '/brands/volvo_sleutel_bijmaken.webp' },
  { name: 'Nissan', slug: 'nissan-autosleutel-bijmaken', models: 'Micra, Qashqai, Juke, Leaf', svg: 'https://cdn.simpleicons.org/nissan/001E50' },
  { name: 'Hyundai', slug: 'hyundai-autosleutel-bijmaken', models: 'i10, i20, i30, Tucson, Kona', svg: 'https://cdn.simpleicons.org/hyundai/001E50' },
  { name: 'Kia', slug: 'kia-autosleutel-bijmaken', models: 'Picanto, Rio, Ceed, Sportage', svg: '/brands/kia_sleutel_bijmaken.svg' },
  { name: 'Citroën', slug: 'citroen-autosleutel-bijmaken', models: 'C1, C3, C4, Berlingo, Jumper', svg: '/brands/citroen_sleutel_bijmaken.webp' },
  { name: 'Fiat', slug: 'fiat-autosleutel-bijmaken', models: '500, Panda, Ducato, Tipo', svg: '/brands/fiat_sleutel_bijmaken.webp' },
  { name: 'Honda', slug: 'honda-autosleutel-bijmaken', models: 'Civic, Jazz, CR-V, HR-V', svg: '/brands/honda_sleutel_bijmaken.webp' },
  { name: 'Mazda', slug: 'mazda-autosleutel-bijmaken', models: 'Mazda2, Mazda3, CX-5, MX-5', svg: '/brands/mazda_sleutel_bijmaken.svg' },
  { name: 'Land Rover', slug: 'land-rover-autosleutel-bijmaken', models: 'Range Rover, Discovery, Evoque', svg: '/brands/land_rover_sleutel_bijmaken.webp' },
  { name: 'Porsche', slug: 'porsche-autosleutel-bijmaken', models: 'Cayenne, Macan, 911, Panamera', svg: '/brands/porsche_sleutel_bijmaken.webp' },
  { name: 'Mini', slug: 'mini-autosleutel-bijmaken', models: 'Cooper, One, Countryman', svg: '/brands/mini_sleutel_bijmaken.webp' },
  { name: 'Alfa Romeo', slug: 'alfa-romeo-autosleutel-bijmaken', models: 'Giulia, Stelvio, Giulietta, MiTo', svg: '/brands/alfa_romeo_sleutel_bijmaken.webp' },
  { name: 'Lexus', slug: 'lexus-autosleutel-bijmaken', models: 'CT200h, RX, IS, NX', svg: '/brands/lexus_sleutel_bijmaken.webp' },
  { name: 'Mitsubishi', slug: 'mitsubishi-autosleutel-bijmaken', models: 'Outlander, Space Star, Colt, ASX', svg: '/brands/mitsubishi_sleutel_bijmaken.webp' },
  { name: 'Smart', slug: 'smart-autosleutel-bijmaken', models: 'Fortwo, Forfour', svg: '/brands/smart_sleutel_bijmaken.webp' },
  { name: 'Maserati', slug: 'maserati-autosleutel-bijmaken', models: 'Ghibli, Levante, Quattroporte', svg: '/brands/maserati_sleutel_bijmaken.webp' },
  { name: 'Subaru', slug: 'subaru-autosleutel-bijmaken', models: 'Impreza, Forester, Outback', svg: '/brands/subaru_sleutel_bijmaken.svg' },
  { name: 'Dacia', slug: 'dacia-autosleutel-bijmaken', models: 'Duster, Sandero, Logan, Spring', svg: '/brands/dacia_sleutel_bijmaken.svg' },
  { name: 'Dodge', slug: 'dodge-autosleutel-bijmaken', models: 'RAM, Challenger, Charger, Caliber', svg: '/brands/dodge_sleutel_bijmaken.webp' },
  { name: 'Ferrari', slug: 'ferrari-autosleutel-bijmaken', models: '458, 488, California, F430', svg: '/brands/ferrari_sleutel_bijmaken.webp' },
  { name: 'Jaguar', slug: 'jaguar-autosleutel-bijmaken', models: 'F-Type, XF, XE, F-Pace', svg: '/brands/jaguar_sleutel_bijmaken.webp' },
  { name: 'Saab', slug: 'saab-autosleutel-bijmaken', models: '9-3, 9-5', svg: '/brands/saab_sleutel_bijmaken.webp' },
  { name: 'GMC', slug: 'gmc-autosleutel-bijmaken', models: 'Sierra, Yukon, Acadia', svg: '/brands/gmc_sleutel_bijmaken.webp' },
  { name: 'Bentley', slug: 'bentley-autosleutel-bijmaken', models: 'Continental GT, Bentayga, Flying Spur', svg: '/brands/bentley_sleutel_bijmaken.webp' }
];

export default function BrandsLogoGrid({ title, subtitle, hideSeoHeader = false }: BrandsLogoGridProps) {
  return (
    <section className={styles.brandsSection}>
      <div className="container">
        {!hideSeoHeader && (
          <div className={styles.brandsSeoHeader}>
            <h2 className={styles.brandsHeading}>{title || 'Autosleutel Bijmaken — Alle Merken'}</h2>
            <p className={styles.brandsLead}>
              {subtitle || 'Wij maken en programmeren autosleutels voor alle gangbare merken direct ter plaatse. Selecteer uw merk:'}
            </p>
          </div>
        )}

        <div className={styles.brandsLogoGrid}>
          {BRANDS_WITH_LOGOS.map((brand) => (
            <Link
              key={brand.slug}
              href={`/merken/${brand.slug}`}
              className={styles.brandLogoCard}
              title={`${brand.name} autosleutel bijmaken — ${brand.models}`}
            >
              <Image
                src={brand.svg}
                alt={`${brand.name} logo`}
                className={styles.brandLogoImg}
                width={80}
                height={48}
              />
              <span className={styles.brandLogoName}>{brand.name} sleutel bijmaken</span>
              {/* Hidden SEO text for crawlers */}
              <span className={styles.brandSeoHidden}>{brand.models}</span>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link href="/merken" className={styles.brandsAllLink}>
            Bekijk alle 59 merken die wij bedienen &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
