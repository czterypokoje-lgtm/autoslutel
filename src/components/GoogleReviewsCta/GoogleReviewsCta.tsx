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
 * Links visitors to the real Google Business Profile instead of rendering
 * review text on our own pages.
 *
 * Every rating shown here must be verifiable on the linked profile. Do not
 * add testimonial text, customer names, avatars or counts to this component
 * unless they come from the live profile.
 */
export default function GoogleReviewsCta({ title, intro }: GoogleReviewsCtaProps) {
  const profileUrl = SITE_CONFIG.social.google;

  return (
    <div className={styles.wrap}>
      <div className={styles.badge}>
        <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>

        <div className={styles.scoreBlock}>
          <div className={styles.scoreRow}>
            <span className={styles.score}>{SITE_CONFIG.rating}</span>
            <div className={styles.stars} aria-hidden="true">
              {[...Array(5)].map((_, i) => (
                <svg key={i} viewBox="0 0 24 24" width="18" height="18" fill="#fbbc04">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ))}
            </div>
          </div>
          <span className={styles.countLabel}>Google-reviews</span>
        </div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{title ?? 'Wat klanten over ons zeggen'}</h3>
        <p className={styles.intro}>
          {intro ??
            'Wij plaatsen geen reviews op onze eigen site. Alle beoordelingen leest u ongefilterd op ons Google-bedrijfsprofiel, precies zoals klanten ze hebben achtergelaten.'}
        </p>
        <div className={styles.actions}>
          <a
            className={styles.primary}
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Lees onze Google-reviews
          </a>
          <a
            className={styles.secondary}
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Zelf een review schrijven
          </a>
        </div>
      </div>
    </div>
  );
}
