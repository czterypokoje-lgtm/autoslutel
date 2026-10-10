import React from 'react';
import styles from './VerifiedReviewBanner.module.css';
import { REVIEWS } from '../GoogleReviewsCta/GoogleReviewsCta';
import { SITE_CONFIG } from '@/config/site.config';

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
 * Taken from REVIEWS — the same array transcribed from the Google Business
 * Profile that /bewertungen renders — and not written here. The default
 * used to be a "Sanne V., Local Guide • 12 reviews" who appears nowhere on
 * that profile: placeholder copy that arrived with a contact-page redesign
 * (d6d3c4a) and survived the fabricated-review cleanup in 5c54b6e, because
 * that cleanup went through GoogleReviewsCta and this is a different
 * component. No caller passes a review, so she was on the home page, /kontakt,
 * /leistungen and all nineteen service pages.
 *
 * NOTE FOR WHOEVER ADDS THE NEXT ONE: these must be real reviews, quoted from
 * the profile. A service page showing an invented testimonial is a misleading
 * commercial practice under BW 6:193c, and it is the kind of thing that costs
 * a Google Business Profile its reviews outright. If there is no real review
 * about a given service yet, leave the page on this default rather than
 * writing one that fits.
 *
 * Reviews Google itself truncates with "…" are quoted only up to their last
 * complete sentence (see completeSentences): a quote that stops mid-sentence
 * misrepresents what the person wrote.
 *
 * Hier standen zwei fest eingetragene niederländische Adressen: das
 * Google-Profil des niederländischen Betriebs (share.google/…) und
 * facebook.com/autosleutel24. Beide zeigen jetzt auf SITE_CONFIG.social —
 * dieselbe Falle wie die Place-ID auf /ueber-uns, und sie fällt nicht auf,
 * weil ein Link auf ein echtes Profil funktioniert, nur eben auf das falsche.
 */
/*
 * Google cuts long reviews with "…". Quote only the complete sentences before the
 * cut: a quote that stops mid-sentence misrepresents what the person wrote, but the
 * first sentence or two of a review, quoted whole, is an honest excerpt.
 */
function completeSentences(text: string): string | null {
  if (!text.includes('…')) return text;
  const head = text.split('…')[0].trim();
  const m = head.match(/^([\s\S]*[.!?])(?:\s|$)/);
  return m ? m[1].trim() : null;
}

/** A real review from REVIEWS, by the reviewer's name, in the shape the banner takes. */
export function bannerReviewFor(name: string): BannerReview | undefined {
  const r = REVIEWS.find((review) => review.name === name);
  const text = r ? completeSentences(r.text) : null;
  return r && text ? { name: r.name, meta: `Google · ${r.when}`, text } : undefined;
}

/*
 * Hier gibt es keinen Standard, weil es keine echte Bewertung gibt.
 *
 * Die niederländische Fassung setzt die erste echte Bewertung aus dem
 * Google-Profil als Standard. REVIEWS ist hier leer (§ 5 UWG, siehe die
 * Begründung in GoogleReviewsCta), also ist der Standard null und das Bauteil
 * rendert nichts — statt wie früher einen erfundenen Namen auf jeder Seite.
 */
const DEFAULT_REVIEW: BannerReview | null =
  bannerReviewFor(REVIEWS[0]?.name ?? '') ??
  (REVIEWS[0]
    ? {
        name: REVIEWS[0].name,
        meta: `Google · ${REVIEWS[0].when ?? ''}`,
        text: REVIEWS[0].text,
      }
    : null);

/**
 * @param review A review relevant to this particular page. A contactslot page
 *   showing a review about lost keys is a weaker proof than one about a
 *   contactslot — but only if the contactslot review actually exists.
 */
export default function VerifiedReviewBanner({ review }: { review?: BannerReview } = {}) {
  /*
   * Ohne echte Bewertung kein Banner — weder die übergebene noch der
   * Standard. Die niederländische Fassung hatte einmal eine erfundene
   * Bewertung als Standardwert, die dadurch auf der Startseite, /kontakt und
   * neunzehn Dienstseiten stand.
   */

  const chosen = review ?? DEFAULT_REVIEW;
  if (!chosen) return null;
  const { name, meta, text } = chosen;

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.inner}>
        
        {/* Left Section */}
        <div className={styles.leftSection}>
          <div className={styles.supertitle}>GEPRÜFTE KUNDENBEWERTUNG</div>
          <h2 className={styles.title}>
            Was geprüfte Kunden{' '}<br/>über unseren Service sagen
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
          
          <div className={styles.stars} aria-label="5 von 5 Sternen">
            ★★★★★
          </div>

          <p className={styles.reviewText}>{text}</p>
        </div>

        {/* Right Section (Logos) */}
        <div className={styles.logosSection}>
          {/* The rating and the way out to the profile, so the one quote above
              is never the whole claim. Both read from SITE_CONFIG, which is
              the single place the real figures live. */}
          <a
            href={SITE_CONFIG.social.google}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.8rem', fontWeight: 600, color: 'inherit', textDecoration: 'none', textAlign: 'center', lineHeight: 1.35 }}
          >
            <span style={{ display: 'block', fontSize: '1.1rem' }}>{SITE_CONFIG.rating} ★</span>
            Alle {SITE_CONFIG.reviewCount} Bewertungen auf Google ansehen
          </a>
          {/* Google Logo Circle */}
          <a href={SITE_CONFIG.social.google} target="_blank" rel="noopener noreferrer" className={styles.logoCircle} aria-label="Unsere Google-Bewertungen ansehen">
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </a>
          {/* Facebook Logo Circle */}
          <a href={SITE_CONFIG.social.facebook} target="_blank" rel="noopener noreferrer" className={styles.logoCircle} aria-label="Unsere Facebook-Seite ansehen">
            <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
        </div>
        
      </div>
    </div>
  );
}
