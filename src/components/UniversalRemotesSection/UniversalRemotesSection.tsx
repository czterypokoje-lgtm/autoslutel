import React from 'react';
import Link from 'next/link';
import styles from './UniversalRemotesSection.module.css';

const brands = [
  {
    name: 'KeyDiy',
    desc: 'Ontdek ons ruime aanbod KeyDiy universele afstandsbedieningen.',
    href: '/webshop/categorie/keydiy',
  },
  {
    name: 'Xhorse',
    desc: 'Hoogwaardige VVDI smart keys en super remotes van Xhorse.',
    href: '/webshop/categorie/xhorse',
  },
  {
    name: 'Autel',
    desc: 'Premium universele IKEY smart keys in diverse stijlen.',
    href: '/webshop/categorie/autel',
  },
  {
    name: 'Lonsdor',
    desc: 'Betrouwbare Lonsdor universele afstandsbedieningen.',
    href: '/webshop/categorie/lonsdor',
  }
];

export default function UniversalRemotesSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Universal Remotes</h2>
        <p className={styles.subtitle}>
          Vind de juiste universele afstandsbediening voor elk voertuig. 
          Kies uit topmerken zoals KeyDiy, Xhorse, Autel en Lonsdor.
        </p>
        
        <div className={styles.grid}>
          {brands.map(brand => (
            <Link key={brand.name} href={brand.href} className={styles.card}>
              <h3 className={styles.brandName}>{brand.name}</h3>
              <p className={styles.cardText}>{brand.desc}</p>
              <span className={styles.actionBtn}>
                Bekijk {brand.name}
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
