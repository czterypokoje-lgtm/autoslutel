import React from 'react';
import { SITE_CONFIG } from '@/config/site.config';
import styles from './GoogleReviewsCta.module.css';

interface GoogleReviewsCtaProps {
  /** Optional heading override, e.g. "Beoordelingen uit Utrecht". */
  title?: string;
  /** Optional intro line shown under the heading. */
  intro?: string;
}

export default function GoogleReviewsCta({ title, intro }: GoogleReviewsCtaProps) {
  const profileUrl = SITE_CONFIG.social.google;
  
  const reviews = [
    { text: 'Alle BMW sleutels kwijt. Dealer: 2 weken en €1.400. Autosleutel Expert: zelfde dag, €580. Aanrader.', name: 'Mark V.', city: 'Eindhoven', car: 'BMW X5' },
    { text: 'Golf 8 SFD probleem. Geen enkele andere specialist kon het oplossen. Binnen 3 uur gereed.', name: 'Peter D.', city: 'Tilburg', car: 'VW Golf 8' },
    { text: 'Mercedes Sprinter vloot — vaste prijsafspraken, prioriteit service. Perfecte B2B partner.', name: 'R. Jacobs', city: 'Breda', car: 'Mercedes Sprinter' },
  ];

  return (
    <div>
      <div className={styles.ratingBig}>
        <span className={styles.ratingNum}>4.9</span>
        <div>
          <div className="stars">★★★★★</div>
          <span style={{fontSize: '0.8rem', color: 'var(--gray-500)'}}>
            247 Google beoordelingen
          </span>
        </div>
      </div>
      <div className={styles.reviewGrid}>
        {reviews.map((r, i) => (
          <div key={i} className={styles.reviewCard}>
            <div className="stars">★★★★★</div>
            <p className={styles.reviewText}>"{r.text}"</p>
            <div className={styles.reviewMeta}>
              <div className={styles.reviewAvatar}>{r.name[0]}</div>
              <div>
                <strong>{r.name}</strong>
                <span>{r.city} — {r.car}</span>
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
          Bekijk alle 247 reviews op Google →
        </a>
      </div>
    </div>
  );
}
