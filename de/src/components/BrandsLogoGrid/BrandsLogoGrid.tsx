import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './BrandsLogoGrid.module.css';

interface BrandsLogoGridProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  hideSeoHeader?: boolean;
  /**
   * How many logos to show before the "show all" toggle. Eight fills exactly
   * one row on desktop, two on tablet, four on a phone.
   */
  initiallyVisible?: number;
}

export const BRANDS_WITH_LOGOS = [
  { name: 'Volkswagen', slug: 'volkswagen-autosleutel-bijmaken', models: 'Golf, Polo, Tiguan, Passat', svg: '/brands/volkswagen_sleutel_bijmaken.svg' },
  { name: 'BMW', slug: 'bmw-autosleutel-bijmaken', models: '1-, 3-, 5-Serie, X1, X3, X5', svg: '/brands/bmw_sleutel_bijmaken.svg' },
  { name: 'Mercedes-Benz', slug: 'mercedes-autosleutel-bijmaken', models: 'A-Klasse, C-Klasse, E-Klasse, Sprinter', svg: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg' },
  { name: 'Audi', slug: 'audi-autosleutel-bijmaken', models: 'A1, A3, A4, A6, Q3, Q5, Q7', svg: '/brands/audi_sleutel_bijmaken.svg' },
  { name: 'Opel', slug: 'opel-autosleutel-bijmaken', models: 'Corsa, Astra, Mokka, Vivaro', svg: '/brands/opel_sleutel_bijmaken.webp' },
  { name: 'Ford', slug: 'ford-autosleutel-bijmaken', models: 'Focus, Fiesta, Transit, Kuga', svg: '/brands/ford_sleutel_bijmaken.svg' },
  { name: 'Renault', slug: 'renault-autosleutel-bijmaken', models: 'Clio, Captur, Megane, Trafic', svg: '/brands/renault_sleutel_bijmaken.svg' },
  { name: 'Peugeot', slug: 'peugeot-autosleutel-bijmaken', models: '208, 308, 2008, 3008, Partner', svg: '/brands/peugeot_sleutel_bijmaken.svg' },
  { name: 'Toyota', slug: 'toyota-autosleutel-bijmaken', models: 'Aygo, Yaris, Corolla, RAV4', svg: '/brands/toyota_sleutel_bijmaken.svg' },
  { name: 'Seat', slug: 'seat-autosleutel-bijmaken', models: 'Ibiza, Leon, Arona, Ateca', svg: '/brands/seat_sleutel_bijmaken.webp' },
  { name: 'Skoda', slug: 'skoda-autosleutel-bijmaken', models: 'Fabia, Octavia, Superb, Kodiaq', svg: '/brands/skoda_sleutel_bijmaken.webp' },
  { name: 'Volvo', slug: 'volvo-autosleutel-bijmaken', models: 'V40, V60, XC40, XC60, XC90', svg: '/brands/volvo_sleutel_bijmaken.webp' },
  { name: 'Nissan', slug: 'nissan-autosleutel-bijmaken', models: 'Micra, Qashqai, Juke, Leaf', svg: '/brands/nissan_sleutel_bijmaken.svg' },
  { name: 'Hyundai', slug: 'hyundai-autosleutel-bijmaken', models: 'i10, i20, i30, Tucson, Kona', svg: '/brands/hyundai_sleutel_bijmaken.svg' },
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

export default function BrandsLogoGrid({
  title,
  subtitle,
  hideSeoHeader = false,
  initiallyVisible = 8,
}: BrandsLogoGridProps) {
  // Build-time check for localization safety (prevent German/English leaks on Dutch pages)
  if (process.env.NODE_ENV !== 'production') {
    const textToCheck = `${title || ''} ${subtitle || ''}`;
    if (textToCheck && (textToCheck.includes('Welche') || textToCheck.includes('Marken') || textToCheck.includes('What') || textToCheck.includes('brands'))) {
      console.warn('BrandsLogoGrid: Possible language leak detected. Component text appears to be non-Dutch.');
    }
  }

  /*
   * Thirty-five logos at once buried Volkswagen and BMW — the makes people
   * actually arrive looking for — under Bentley, Ferrari and Saab. The common
   * ones lead; the rest are one click away.
   */
  const lead = BRANDS_WITH_LOGOS.slice(0, initiallyVisible);
  const rest = BRANDS_WITH_LOGOS.slice(initiallyVisible);

  return (
    <section className={styles.brandsSection}>
      <div className={`container ${styles.brandsLayout}`}>

        {/* Left Side: Technician Hero */}
        <div className={styles.brandsHero}>
          {/*
           * Hidden below 1024px — see the CSS. This photo exists to sit beside
           * the grid, and on a phone, where it cannot, it becomes a full screen
           * of stock photography between the visitor and the thing they came
           * for. No `priority`: the section sits well below the fold, so
           * preloading it only competed with the real LCP image.
           */}
          <Image
            src="/images/technician_pointing.jpg"
            alt="Autosleutel specialist wijst naar merken"
            width={500}
            height={600}
            className={styles.heroImg}
            loading="lazy"
            sizes="(max-width: 1024px) 0px, 400px"
          />
        </div>

        {/* Right Side: Content and Grid */}
        <div className={styles.brandsContent}>
          {!hideSeoHeader && (
            <div className={styles.brandsSeoHeader}>
              <h2 className={styles.brandsHeading}>{title || 'Autosleutel Bijmaken — Alle Merken'}</h2>
              <p className={styles.brandsLead}>
                {subtitle || 'Wij maken en programmeren autosleutels voor alle gangbare merken direct ter plaatse. Selecteer uw merk:'}
              </p>
            </div>
          )}

          <ul className={styles.brandsLogoGrid}>
            {lead.map((brand) => (
              <BrandCard key={brand.slug} brand={brand} />
            ))}
          </ul>

          {rest.length > 0 && (
            /*
             * <details> rather than a useState toggle: this stays a server
             * component, ships no JavaScript, and works before hydration. The
             * hidden logos are real markup in the page either way, so every
             * /merken link is still there for a crawler to follow.
             */
            <details className={styles.moreBrands}>
              <summary className={styles.moreToggle}>
                {/*
                  * Names the remainder, not a total. "Alle 35 merken tonen"
                  * read as though we serve 35 makes, while the navigation,
                  * footer and /merken all correctly say 59 — 35 is just how
                  * many logos we hold artwork for.
                  */}
                <span className={styles.moreOpen}>
                  Nog {rest.length} merken tonen
                </span>
                <span className={styles.moreClose}>Minder merken tonen</span>
              </summary>

              <ul className={`${styles.brandsLogoGrid} ${styles.restGrid}`}>
                {rest.map((brand) => (
                  <BrandCard key={brand.slug} brand={brand} />
                ))}
              </ul>
            </details>
          )}
        </div>

      </div>
    </section>
  );
}

function BrandCard({ brand }: { brand: (typeof BRANDS_WITH_LOGOS)[number] }) {
  return (
    <li className={styles.brandLogoItem}>
      <Link
        href={`/merken/${brand.slug}`}
        className={styles.brandLogoCard}
        title={`${brand.name} — ${brand.models}`}
      >
        <Image
          src={brand.svg}
          alt={`${brand.name} logo`}
          className={styles.brandLogoImg}
          width={80}
          height={48}
          loading="lazy"
        />
        <span className={styles.brandLogoName}>{brand.name} sleutel bijmaken</span>
      </Link>
    </li>
  );
}
