import React from 'react';
import { SITE_CONFIG } from '@/config/site.config';
import styles from './GoogleReviewsCta.module.css';

interface GoogleReviewsCtaProps {
  /** Optional heading override, e.g. "Beoordelingen uit Utrecht". */
  title?: string;
  /** Optional intro line shown under the heading. */
  intro?: string;
}

/**
 * Real reviews, copied from the Google Business Profile linked below —
 * name, star rating and text exactly as Google shows them, including the
 * "… More" Google itself truncates a long review with. Two 5-star reviews
 * on the profile (ALPER T. ALP, Arda Açarol) carry no written text, so
 * they are not listed here; a card with an invented quote under a real
 * name is exactly the kind of thing this replaced.
 *
 * This file previously showed three entirely made-up reviews (fake names,
 * fake cities, fake cars, a fake "4.9 · 247 reviews") on every page that
 * imports it — the same misleading-commercial-practice problem already
 * fixed elsewhere on this site (BW 6:193c). The rating and count now come
 * from SITE_CONFIG, the one place they're meant to be kept true, instead
 * of a second, different, invented number living only in this file.
 */
const REVIEWS = [
  {
    name: 'Roy',
    when: 'een week geleden',
    text: 'Exceptional service and a great company. Was a little bit starteld at first by talking to a only English speaking owner, but they came as promised very late at night and helped us make our car save again. Were fast and nice too. Great service.',
  },
  {
    name: 'Stijn Van Arkel',
    when: '2 weken geleden',
    text: 'De monteur kwam netjes bij mij op locatie en heeft binnen één uur twee nieuwe autosleutels ingeleerd op de auto. Alles werkte direct en de service was snel en …',
  },
  {
    name: 'Cahit Keskin',
    when: 'een maand geleden',
    text: 'Their workmanship was excellent and fast; I was very pleased',
  },
  {
    name: 'Lal',
    when: 'een maand geleden',
    text: 'Premium service they are very gentle and professional',
  },
  {
    name: 'Baran Kaya',
    when: 'een maand geleden',
    text: 'Good service, They make key for my bmw m5 in 30 minute, Very friendly and professional service. i recommend',
  },
  {
    name: 'ışıl güvercin',
    when: 'een maand geleden',
    text: 'Fast and trustful service. The young technician took care of everything; he opened my Golf door in approximately 1 minute. Very professional and clean work. I highly recommend him',
  },
  {
    name: 'xXx XxX',
    when: '2 maanden geleden',
    text: 'Very friendly and competent service. They were able to make two complete replacement keys for a 2011 Mercedes Vito W639 at a fair and transparent price. I recommend.',
  },
  {
    name: 'Julia Van Doorn',
    when: '2 maanden geleden',
    text: 'Uitstekende service! Autosleutel voor Mercedes, twee uur later klaar. …',
  },
] as const;

export default function GoogleReviewsCta({ title, intro }: GoogleReviewsCtaProps) {
  const profileUrl = SITE_CONFIG.social.google;

  return (
    <div>
      {title && <h2>{title}</h2>}
      {intro && <p>{intro}</p>}

      <div className={styles.ratingBig}>
        <span className={styles.ratingNum}>{SITE_CONFIG.rating}</span>
        <div>
          <div className="stars">★★★★★</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
            {SITE_CONFIG.reviewCount} Google beoordelingen
          </span>
        </div>
      </div>
      <div className={styles.reviewGrid}>
        {REVIEWS.map((r) => (
          <div key={r.name} className={styles.reviewCard}>
            <div className="stars">★★★★★</div>
            <p className={styles.reviewText}>&ldquo;{r.text}&rdquo;</p>
            <div className={styles.reviewMeta}>
              <div className={styles.reviewAvatar}>{r.name[0]}</div>
              <div>
                <strong>{r.name}</strong>
                <span>{r.when}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.9rem', color: '#b93c20', fontWeight: 600, textDecoration: 'none' }}
        >
          Bekijk alle {SITE_CONFIG.reviewCount} reviews op Google →
        </a>
      </div>
    </div>
  );
}
