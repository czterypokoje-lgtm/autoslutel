import React from 'react';
import styles from './VerifiedReviewBanner.module.css';

export interface BannerReview {
  /** As the reviewer signs it on Google. */
  name: string;
  /** The line under the name, e.g. "Local Guide • 12 reviews". */
  meta: string;
  /** The review, quoted as written. */
  text: string;
}

/**
 * The review shown when a page does not name one of its own.
 *
 * NOTE FOR WHOEVER ADDS THE NEXT ONE: these must be real reviews, quoted from
 * the Google profile. A service page showing an invented testimonial is a
 * misleading commercial practice under BW 6:193c, and it is the kind of thing
 * that costs a Google Business Profile its reviews outright. If there is no
 * real review about a given service yet, leave the page on this default rather
 * than writing one that fits.
 */
const DEFAULT_REVIEW: BannerReview = {
  name: 'Sanne V.',
  meta: 'Local Guide • 12 reviews',
  text: 'Snel en vakkundig geholpen! Ik was al mijn sleutels kwijt. Nieuwe sleutel geprogrammeerd in no-time. Na wat rondbellen was Autosleutel24 de enige die binnen 2 uur ter plaatse kon zijn, en met de beste prijs. 👍',
};

/**
 * @param review A review relevant to this particular page. A contactslot page
 *   showing a review about lost keys is a weaker proof than one about a
 *   contactslot — but only if the contactslot review actually exists.
 */
export default function VerifiedReviewBanner({ review }: { review?: BannerReview } = {}) {
  const { name, meta, text } = review ?? DEFAULT_REVIEW;

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.inner}>
        
        {/* Left Section */}
        <div className={styles.leftSection}>
          <div className={styles.supertitle}>NEDERLAND&apos;S TOP AUTOSLOTENMAKER</div>
          <h2 className={styles.title}>
            Wat Geverifieerde Klanten<br/>Zeggen Over Onze Service
          </h2>
        </div>

        {/* Divider for desktop */}
        <div className={styles.divider}></div>

        {/* Middle Section (Review) */}
        <div className={styles.reviewSection}>
          <div className={styles.reviewerHeader}>
            <div className={styles.avatar}>{name.trim().charAt(0).toUpperCase()}</div>
            <div className={styles.reviewerInfo}>
              <div className={styles.reviewerName}>{name}</div>
              <div className={styles.reviewerMeta}>{meta}</div>
            </div>
          </div>
          
          <div className={styles.stars} aria-label="5 sterren">
            ★★★★★
          </div>

          <p className={styles.reviewText}>{text}</p>
        </div>

        {/* Right Section (Logos) */}
        <div className={styles.logosSection}>
          {/* Google Logo Circle */}
          <a href="https://share.google/3qBeXHp6tQ6mdOa4B" target="_blank" rel="noopener noreferrer" className={styles.logoCircle} aria-label="Bekijk onze Google reviews">
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </a>
          {/* Facebook Logo Circle */}
          <a href="https://www.facebook.com/autosleutel24" target="_blank" rel="noopener noreferrer" className={styles.logoCircle} aria-label="Bekijk onze Facebook pagina">
            <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
        </div>
        
      </div>
    </div>
  );
}
