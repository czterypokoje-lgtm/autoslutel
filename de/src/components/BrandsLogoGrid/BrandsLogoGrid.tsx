import React from 'react';
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

/*
 * `slug` is unused for routing today — see BrandCard. It stays because the
 * per-make landing pages (/marken/<slug>) are the next build step and the
 * slugs are already the German keyword form ("bmw-autoschluessel-nachmachen",
 * not the Dutch "...-autosleutel-bijmaken"), so turning the tiles back into
 * links is a one-line change rather than a re-slug.
 */
export const BRANDS_WITH_LOGOS = [
  { name: 'Volkswagen', slug: 'volkswagen-autoschluessel-nachmachen', models: 'Golf, Polo, Tiguan, Passat', svg: '/brands/volkswagen_schluessel_nachmachen.svg' },
  { name: 'BMW', slug: 'bmw-autoschluessel-nachmachen', models: '1er, 3er, 5er, X1, X3, X5', svg: '/brands/bmw_schluessel_nachmachen.svg' },
  { name: 'Mercedes-Benz', slug: 'mercedes-autoschluessel-nachmachen', models: 'A-Klasse, C-Klasse, E-Klasse, Sprinter', svg: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg' },
  { name: 'Audi', slug: 'audi-autoschluessel-nachmachen', models: 'A1, A3, A4, A6, Q3, Q5, Q7', svg: '/brands/audi_schluessel_nachmachen.svg' },
  { name: 'Opel', slug: 'opel-autoschluessel-nachmachen', models: 'Corsa, Astra, Mokka, Vivaro', svg: '/brands/opel_schluessel_nachmachen.webp' },
  { name: 'Ford', slug: 'ford-autoschluessel-nachmachen', models: 'Focus, Fiesta, Transit, Kuga', svg: '/brands/ford_schluessel_nachmachen.svg' },
  { name: 'Renault', slug: 'renault-autoschluessel-nachmachen', models: 'Clio, Captur, Mégane, Trafic', svg: '/brands/renault_schluessel_nachmachen.svg' },
  { name: 'Peugeot', slug: 'peugeot-autoschluessel-nachmachen', models: '208, 308, 2008, 3008, Partner', svg: '/brands/peugeot_schluessel_nachmachen.svg' },
  { name: 'Toyota', slug: 'toyota-autoschluessel-nachmachen', models: 'Aygo, Yaris, Corolla, RAV4', svg: '/brands/toyota_schluessel_nachmachen.svg' },
  { name: 'Seat', slug: 'seat-autoschluessel-nachmachen', models: 'Ibiza, Leon, Arona, Ateca', svg: '/brands/seat_schluessel_nachmachen.webp' },
  { name: 'Škoda', slug: 'skoda-autoschluessel-nachmachen', models: 'Fabia, Octavia, Superb, Kodiaq', svg: '/brands/skoda_schluessel_nachmachen.webp' },
  { name: 'Volvo', slug: 'volvo-autoschluessel-nachmachen', models: 'V40, V60, XC40, XC60, XC90', svg: '/brands/volvo_schluessel_nachmachen.webp' },
  { name: 'Nissan', slug: 'nissan-autoschluessel-nachmachen', models: 'Micra, Qashqai, Juke, Leaf', svg: '/brands/nissan_schluessel_nachmachen.svg' },
  { name: 'Hyundai', slug: 'hyundai-autoschluessel-nachmachen', models: 'i10, i20, i30, Tucson, Kona', svg: '/brands/hyundai_schluessel_nachmachen.svg' },
  { name: 'Kia', slug: 'kia-autoschluessel-nachmachen', models: 'Picanto, Rio, Ceed, Sportage', svg: '/brands/kia_schluessel_nachmachen.svg' },
  { name: 'Citroën', slug: 'citroen-autoschluessel-nachmachen', models: 'C1, C3, C4, Berlingo, Jumper', svg: '/brands/citroen_schluessel_nachmachen.webp' },
  { name: 'Fiat', slug: 'fiat-autoschluessel-nachmachen', models: '500, Panda, Ducato, Tipo', svg: '/brands/fiat_schluessel_nachmachen.webp' },
  { name: 'Honda', slug: 'honda-autoschluessel-nachmachen', models: 'Civic, Jazz, CR-V, HR-V', svg: '/brands/honda_schluessel_nachmachen.webp' },
  { name: 'Mazda', slug: 'mazda-autoschluessel-nachmachen', models: 'Mazda2, Mazda3, CX-5, MX-5', svg: '/brands/mazda_schluessel_nachmachen.svg' },
  { name: 'Land Rover', slug: 'land-rover-autoschluessel-nachmachen', models: 'Range Rover, Discovery, Evoque', svg: '/brands/land_rover_schluessel_nachmachen.webp' },
  { name: 'Porsche', slug: 'porsche-autoschluessel-nachmachen', models: 'Cayenne, Macan, 911, Panamera', svg: '/brands/porsche_schluessel_nachmachen.webp' },
  { name: 'Mini', slug: 'mini-autoschluessel-nachmachen', models: 'Cooper, One, Countryman', svg: '/brands/mini_schluessel_nachmachen.webp' },
  { name: 'Alfa Romeo', slug: 'alfa-romeo-autoschluessel-nachmachen', models: 'Giulia, Stelvio, Giulietta, MiTo', svg: '/brands/alfa_romeo_schluessel_nachmachen.webp' },
  { name: 'Lexus', slug: 'lexus-autoschluessel-nachmachen', models: 'CT200h, RX, IS, NX', svg: '/brands/lexus_schluessel_nachmachen.webp' },
  { name: 'Mitsubishi', slug: 'mitsubishi-autoschluessel-nachmachen', models: 'Outlander, Space Star, Colt, ASX', svg: '/brands/mitsubishi_schluessel_nachmachen.webp' },
  { name: 'Smart', slug: 'smart-autoschluessel-nachmachen', models: 'Fortwo, Forfour', svg: '/brands/smart_schluessel_nachmachen.webp' },
  { name: 'Maserati', slug: 'maserati-autoschluessel-nachmachen', models: 'Ghibli, Levante, Quattroporte', svg: '/brands/maserati_schluessel_nachmachen.webp' },
  { name: 'Subaru', slug: 'subaru-autoschluessel-nachmachen', models: 'Impreza, Forester, Outback', svg: '/brands/subaru_schluessel_nachmachen.svg' },
  { name: 'Dacia', slug: 'dacia-autoschluessel-nachmachen', models: 'Duster, Sandero, Logan, Spring', svg: '/brands/dacia_schluessel_nachmachen.svg' },
  { name: 'Dodge', slug: 'dodge-autoschluessel-nachmachen', models: 'RAM, Challenger, Charger, Caliber', svg: '/brands/dodge_schluessel_nachmachen.webp' },
  { name: 'Ferrari', slug: 'ferrari-autoschluessel-nachmachen', models: '458, 488, California, F430', svg: '/brands/ferrari_schluessel_nachmachen.webp' },
  { name: 'Jaguar', slug: 'jaguar-autoschluessel-nachmachen', models: 'F-Type, XF, XE, F-Pace', svg: '/brands/jaguar_schluessel_nachmachen.webp' },
  { name: 'Saab', slug: 'saab-autoschluessel-nachmachen', models: '9-3, 9-5', svg: '/brands/saab_schluessel_nachmachen.webp' },
  { name: 'GMC', slug: 'gmc-autoschluessel-nachmachen', models: 'Sierra, Yukon, Acadia', svg: '/brands/gmc_schluessel_nachmachen.webp' },
  { name: 'Bentley', slug: 'bentley-autoschluessel-nachmachen', models: 'Continental GT, Bentayga, Flying Spur', svg: '/brands/bentley_schluessel_nachmachen.webp' }
];

export default function BrandsLogoGrid({
  title,
  subtitle,
  hideSeoHeader = false,
  initiallyVisible = 8,
}: BrandsLogoGridProps) {
  // Build-time check for localisation safety (catch Dutch copy left on German pages)
  if (process.env.NODE_ENV !== 'production') {
    const textToCheck = `${title || ''} ${subtitle || ''}`;
    if (textToCheck && /sleutel|bijmaken|merken|diensten/i.test(textToCheck)) {
      console.warn('BrandsLogoGrid: Dutch copy passed to a German page.');
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
            alt="Autoschlüssel-Spezialist zeigt auf die Fahrzeugmarken"
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
              <h2 className={styles.brandsHeading}>{title || 'Autoschlüssel nachmachen — alle Marken'}</h2>
              <p className={styles.brandsLead}>
                {subtitle || 'Wir fertigen und programmieren Autoschlüssel für alle gängigen Marken direkt vor Ort. Wählen Sie Ihre Marke:'}
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
             * component, ships no JavaScript, and works before hydration.
             */
            <details className={styles.moreBrands}>
              <summary className={styles.moreToggle}>
                {/*
                  * Names the remainder, not a total. "Alle 35 Marken anzeigen"
                  * read as though we serve 35 makes — 35 is just how many
                  * logos we hold artwork for.
                  */}
                <span className={styles.moreOpen}>
                  Weitere {rest.length} Marken anzeigen
                </span>
                <span className={styles.moreClose}>Weniger Marken anzeigen</span>
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
  /*
   * Deliberately not a <Link>. On the Dutch site each tile points at
   * /merken/<slug>; the German site has no /marken route yet, so linking
   * would put thirty-five 404s on every page that renders this grid. The tile
   * keeps its markup and styling, so the layout is identical — restore the
   * <Link href={`/marken/${brand.slug}`}> wrapper the day those pages ship.
   */
  return (
    <li className={styles.brandLogoItem}>
      <div className={styles.brandLogoCard} title={`${brand.name} — ${brand.models}`}>
        <Image
          src={brand.svg}
          alt={`${brand.name} Logo`}
          className={styles.brandLogoImg}
          width={80}
          height={48}
          loading="lazy"
        />
        <span className={styles.brandLogoName}>{brand.name} Schlüssel nachmachen</span>
      </div>
    </li>
  );
}
