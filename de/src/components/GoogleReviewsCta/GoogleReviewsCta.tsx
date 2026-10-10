import React from 'react';
import { SITE_CONFIG } from '@/config/site.config';
import styles from './GoogleReviewsCta.module.css';

interface GoogleReviewsCtaProps {
  /** Optional heading override, e.g. "Beoordelingen uit Utrecht". */
  title?: string;
  /** Optional intro line shown under the heading. */
  intro?: string;
  /** Show only the first N reviews; the link below goes to all of them on Google. */
  limit?: number;
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
/*
 * Exported so /bewertungen can build Review markup from the same array the
 * cards render. It must be marked up THERE and nowhere else: this component
 * is on all 62 city pages, and emitting the same review nodes 62 times is the
 * per-page duplication utils/schema.ts already warns about.
 */
/*
 * Display order is ours; the reviews themselves are quoted as Google shows them.
 * Dutch reviews lead because the customer reading this is usually Dutch and in a hurry,
 * and the one that opens with a remark about the owner speaking only English goes last.
 */
/**
 * Echte Bewertungen dieser Seite — derzeit keine.
 *
 * Leer, und das ist eine Entscheidung. Die niederländische Fassung enthält
 * hier fünf aus dem Google-Unternehmensprofil abgetippte Bewertungen mit
 * Namen; das sind niederländische Kunden. Sie auf einer deutschen Domain zu
 * zeigen, als wären sie deutsche Bewertungen, oder sie zu übersetzen, wäre
 * eine irreführende geschäftliche Handlung nach § 5 UWG — und seit 2022
 * verlangt § 5b Abs. 3 UWG ausdrücklich, offenzulegen, ob und wie Bewertungen
 * auf Echtheit geprüft wurden.
 *
 * Die niederländische Datei warnt an dieser Stelle selbst davor, hier
 * Erfundenes einzutragen. Das gilt hier genauso: wer eine Bewertung
 * hinzufügt, trägt eine echte ein, wörtlich aus dem deutschen
 * Unternehmensprofil. Solange es keine gibt, zeigt die Seite keine.
 */
export type Review = {
  /** Wie der Bewertende bei Google signiert. */
  name: string;
  /** Die Zeile unter dem Namen, z. B. "Local Guide • 12 Bewertungen". */
  meta: string;
  /** Die Bewertung, wörtlich zitiert. */
  text: string;
  /** Wann sie abgegeben wurde, wie Google es anzeigt. */
  when?: string;
};

export const REVIEWS: Review[] = [];

export default function GoogleReviewsCta({ title, intro, limit }: GoogleReviewsCtaProps) {
  const profileUrl = SITE_CONFIG.social.google;

  /*
   * Ohne echte Bewertungen rendert dieser Block nichts.
   *
   * Sonst stünde dort eine Bewertung von 0 mit fünf Sternen daneben — also
   * eine Behauptung ohne Grundlage, auf der Startseite. Sobald die erste
   * echte Bewertung in REVIEWS steht, erscheint der Block von selbst.
   */
  if (REVIEWS.length === 0) return null;

  return (
    <div>
      {title && <h2>{title}</h2>}
      {intro && <p>{intro}</p>}

      <div className={styles.ratingBig}>
        <span className={styles.ratingNum}>{SITE_CONFIG.rating}</span>
        <div>
          <div className="stars">★★★★★</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Google-Bewertungen</span>
        </div>
      </div>
      <div className={styles.reviewGrid}>
        {REVIEWS.slice(0, limit ?? REVIEWS.length).map((r) => (
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
          Bekijk alle reviews op Google →
        </a>
      </div>
    </div>
  );
}
