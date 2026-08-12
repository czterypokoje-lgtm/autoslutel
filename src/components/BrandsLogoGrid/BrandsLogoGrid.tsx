import React from 'react';
import Link from 'next/link';
import styles from './BrandsLogoGrid.module.css';

interface BrandsLogoGridProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  hideSeoHeader?: boolean;
}

export const BRANDS_WITH_LOGOS = [
  { name: 'Volkswagen', slug: 'volkswagen-autosleutel-bijmaken', models: 'Golf, Polo, Tiguan, Passat', svg: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg' },
  { name: 'BMW', slug: 'bmw-autosleutel-bijmaken', models: '1-, 3-, 5-Serie, X1, X3, X5', svg: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg' },
  { name: 'Mercedes-Benz', slug: 'mercedes-autosleutel-bijmaken', models: 'A/C/E-Klasse, Sprinter, Vito', svg: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg' },
  { name: 'Audi', slug: 'audi-autosleutel-bijmaken', models: 'A1, A3, A4, A6, Q3, Q5, Q7', svg: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg' },
  { name: 'Opel', slug: 'opel-autosleutel-bijmaken', models: 'Corsa, Astra, Mokka, Vivaro', svg: '/brands/opel-autosleutel-bijmaken.webp' },
  { name: 'Ford', slug: 'ford-autosleutel-bijmaken', models: 'Focus, Fiesta, Transit, Kuga', svg: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg' },
  { name: 'Renault', slug: 'renault-autosleutel-bijmaken', models: 'Clio, Captur, Megane, Trafic', svg: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_Text.svg' },
  { name: 'Peugeot', slug: 'peugeot-autosleutel-bijmaken', models: '208, 308, 2008, 3008, Partner', svg: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg' },
  { name: 'Toyota', slug: 'toyota-autosleutel-bijmaken', models: 'Aygo, Yaris, Corolla, RAV4', svg: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Toyota_logo_%28Red%29.svg' },
  { name: 'Seat', slug: 'seat-autosleutel-bijmaken', models: 'Ibiza, Leon, Arona, Ateca', svg: '/brands/seat-autosleutel-bijmaken.png' },
  { name: 'Skoda', slug: 'skoda-autosleutel-bijmaken', models: 'Fabia, Octavia, Superb, Kodiaq', svg: '/brands/skoda-autosleutel-bijmaken.png' },
  { name: 'Volvo', slug: 'volvo-autosleutel-bijmaken', models: 'V40, V60, XC40, XC60, XC90', svg: '/brands/volvo-autosleutel-bijmaken.png' },
  { name: 'Nissan', slug: 'nissan-autosleutel-bijmaken', models: 'Micra, Qashqai, Juke, Leaf', svg: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Nissan_2020_logo.svg' },
  { name: 'Hyundai', slug: 'hyundai-autosleutel-bijmaken', models: 'i10, i20, i30, Tucson, Kona', svg: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg' },
  { name: 'Kia', slug: 'kia-autosleutel-bijmaken', models: 'Picanto, Rio, Ceed, Sportage', svg: '/brands/kia-autosleutel-bijmaken.svg' },
  { name: 'Citroën', slug: 'citroen-autosleutel-bijmaken', models: 'C1, C3, C4, Berlingo, Jumper', svg: '/brands/citroen-autosleutel-bijmaken.png' },
  { name: 'Fiat', slug: 'fiat-autosleutel-bijmaken', models: '500, Panda, Ducato, Tipo', svg: '/brands/fiat-autosleutel-bijmaken.webp' },
  { name: 'Honda', slug: 'honda-autosleutel-bijmaken', models: 'Civic, Jazz, CR-V, HR-V', svg: '/brands/honda-autosleutel-bijmaken.webp' },
  { name: 'Mazda', slug: 'mazda-autosleutel-bijmaken', models: 'Mazda2, Mazda3, CX-5, MX-5', svg: '/brands/mazda-autosleutel-bijmaken.svg' },
  { name: 'Land Rover', slug: 'land-rover-autosleutel-bijmaken', models: 'Range Rover, Discovery, Evoque', svg: '/brands/land-rover-autosleutel-bijmaken.png' },
  { name: 'Porsche', slug: 'porsche-autosleutel-bijmaken', models: 'Cayenne, Macan, 911, Panamera', svg: '/brands/porsche-autosleutel-bijmaken.png' },
  { name: 'Mini', slug: 'mini-autosleutel-bijmaken', models: 'Cooper, One, Countryman', svg: '/brands/mini-autosleutel-bijmaken.png' },
,
  { name: 'Alfa Romeo', slug: 'alfa-romeo-autosleutel-bijmaken', models: 'Giulia, Stelvio, Giulietta, MiTo', svg: 'https://logo.clearbit.com/alfaromeo.com' },
  { name: 'Buick', slug: 'buick-autosleutel-bijmaken', models: 'Encore, Envision, Regal', svg: 'https://logo.clearbit.com/buick.com' },
  { name: 'Cadillac', slug: 'cadillac-autosleutel-bijmaken', models: 'Escalade, CTS, XT5, ATS', svg: 'https://logo.clearbit.com/cadillac.com' },
  { name: 'Chery', slug: 'chery-autosleutel-bijmaken', models: 'Tiggo, QQ, Arrizo', svg: 'https://logo.clearbit.com/cheryinternational.com' },
  { name: 'Chevrolet', slug: 'chevrolet-autosleutel-bijmaken', models: 'Spark, Matiz, Captiva, Cruze, Corvette', svg: 'https://logo.clearbit.com/chevrolet.com' },
  { name: 'Chrysler', slug: 'chrysler-autosleutel-bijmaken', models: '300C, Voyager, PT Cruiser', svg: 'https://logo.clearbit.com/chrysler.com' },
  { name: 'Cobra', slug: 'cobra-autosleutel-bijmaken', models: 'AC Cobra', svg: 'https://logo.clearbit.com/cobracar.com' },
  { name: 'Dacia', slug: 'dacia-autosleutel-bijmaken', models: 'Duster, Sandero, Logan, Spring', svg: 'https://logo.clearbit.com/dacia.com' },
  { name: 'Daewoo', slug: 'daewoo-autosleutel-bijmaken', models: 'Matiz, Kalos, Lanos', svg: 'https://logo.clearbit.com/daewoomotor.com' },
  { name: 'DAF', slug: 'daf-autosleutel-bijmaken', models: 'XF, CF, LF', svg: 'https://logo.clearbit.com/daf.com' },
  { name: 'Daihatsu', slug: 'daihatsu-autosleutel-bijmaken', models: 'Cuore, Sirion, Terios', svg: 'https://logo.clearbit.com/daihatsu.com' },
  { name: 'Dodge', slug: 'dodge-autosleutel-bijmaken', models: 'RAM, Challenger, Charger, Caliber', svg: 'https://logo.clearbit.com/dodge.com' },
  { name: 'Ferrari', slug: 'ferrari-autosleutel-bijmaken', models: '458, 488, California, F430', svg: 'https://logo.clearbit.com/ferrari.com' },
  { name: 'Holden', slug: 'holden-autosleutel-bijmaken', models: 'Commodore, Colorado', svg: 'https://logo.clearbit.com/holden.com.au' },
  { name: 'Infiniti', slug: 'infiniti-autosleutel-bijmaken', models: 'Q50, Q30, FX35', svg: 'https://logo.clearbit.com/infiniti.com' },
  { name: 'Isuzu', slug: 'isuzu-autosleutel-bijmaken', models: 'D-Max, N-Series', svg: 'https://logo.clearbit.com/isuzu.com' },
  { name: 'Iveco', slug: 'iveco-autosleutel-bijmaken', models: 'Daily, Eurocargo', svg: 'https://logo.clearbit.com/iveco.com' },
  { name: 'Jaguar', slug: 'jaguar-autosleutel-bijmaken', models: 'F-Type, XF, XE, F-Pace', svg: 'https://logo.clearbit.com/jaguar.com' },
  { name: 'Lada', slug: 'lada-autosleutel-bijmaken', models: 'Niva, Vesta', svg: 'https://logo.clearbit.com/lada.ru' },
  { name: 'Lancia', slug: 'lancia-autosleutel-bijmaken', models: 'Ypsilon, Delta', svg: 'https://logo.clearbit.com/lancia.com' },
  { name: 'Lexus', slug: 'lexus-autosleutel-bijmaken', models: 'CT200h, RX, IS, NX', svg: 'https://logo.clearbit.com/lexus.com' },
  { name: 'Lincoln', slug: 'lincoln-autosleutel-bijmaken', models: 'Navigator, Aviator, MKX', svg: 'https://logo.clearbit.com/lincoln.com' },
  { name: 'Maserati', slug: 'maserati-autosleutel-bijmaken', models: 'Ghibli, Levante, Quattroporte', svg: 'https://logo.clearbit.com/maserati.com' },
  { name: 'McLaren', slug: 'mclaren-autosleutel-bijmaken', models: '570S, 720S, MP4-12C', svg: 'https://logo.clearbit.com/mclaren.com' },
  { name: 'Mitsubishi', slug: 'mitsubishi-autosleutel-bijmaken', models: 'Outlander, Space Star, Colt, ASX', svg: 'https://logo.clearbit.com/mitsubishi-motors.com' },
  { name: 'Oldsmobile', slug: 'oldsmobile-autosleutel-bijmaken', models: 'Aurora, Alero', svg: 'https://logo.clearbit.com/oldsmobile.com' },
  { name: 'Proton', slug: 'proton-autosleutel-bijmaken', models: 'Wira, Gen-2', svg: 'https://logo.clearbit.com/proton.com' },
  { name: 'Rolls Royce', slug: 'rolls-royce-autosleutel-bijmaken', models: 'Phantom, Ghost, Cullinan', svg: 'https://logo.clearbit.com/rolls-roycemotorcars.com' },
  { name: 'Rover', slug: 'rover-autosleutel-bijmaken', models: '75, 45, 25', svg: 'https://logo.clearbit.com/rover.com' },
  { name: 'Saab', slug: 'saab-autosleutel-bijmaken', models: '9-3, 9-5', svg: 'https://logo.clearbit.com/saab.com' },
  { name: 'Smart', slug: 'smart-autosleutel-bijmaken', models: 'Fortwo, Forfour', svg: 'https://logo.clearbit.com/smart.com' },
  { name: 'SsangYong', slug: 'ssangyong-autosleutel-bijmaken', models: 'Rexton, Korando, Tivoli', svg: 'https://logo.clearbit.com/smotor.com' },
  { name: 'Subaru', slug: 'subaru-autosleutel-bijmaken', models: 'Impreza, Forester, Outback', svg: 'https://logo.clearbit.com/subaru.com' },
  { name: 'Suzuki', slug: 'suzuki-autosleutel-bijmaken', models: 'Swift, Alto, Vitara, Ignis', svg: 'https://logo.clearbit.com/suzuki.com' },
  { name: 'Tesla', slug: 'tesla-autosleutel-bijmaken', models: 'Model S, Model 3, Model X, Model Y', svg: 'https://logo.clearbit.com/tesla.com' },
  { name: 'GMC', slug: 'gmc-autosleutel-bijmaken', models: 'Sierra, Yukon, Acadia', svg: 'https://logo.clearbit.com/gmc.com' }
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.svg}
                alt={`${brand.name} sleutel bijmaken logo`}
                className={styles.brandLogoImg}
                loading="lazy"
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
            Bekijk alle {BRANDS_WITH_LOGOS.length} merken die wij bedienen &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
