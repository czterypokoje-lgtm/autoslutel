import React from 'react';
import styles from './GoogleReviewCard.module.css';

export interface GoogleReview {
  name: string;
  avatarUrl?: string; // If undefined, we use initials
  avatarLetter?: string;
  avatarColor?: string;
  date: string;
  rating: number;
  text: string;
  snippet?: string; // For "lees verder" truncation
}

export const SHARED_GOOGLE_REVIEWS: GoogleReview[] = [
  {
    name: 'Yuri Sharapa',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YuriSharapa',
    date: '2 jaar geleden',
    rating: 5,
    text: 'Hi!\n\nYesterday I slammed the door in the evening and left the key inside. I called Autosleutel24 and within 30 minutes someone was there. Very professional!'
  },
  {
    name: 'Aicha Kone',
    avatarLetter: 'A',
    avatarColor: '#e81c62',
    date: '2 jaar geleden',
    rating: 5,
    text: 'Thank you for your good service. I call their for my car lock. their service is soo fast, I am really impressed.'
  },
  {
    name: 'Lisa van den Bor',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LisaBor',
    date: '2 jaar geleden',
    rating: 5,
    text: 'Sleutel aan de binnenkant van de deur laten zitten, stom! Ze stonden gelukkig zelfs op zondag binnen 20 minuten voor de deur en Jeffrey maakte onze deur 100% schadevrij open.'
  }
];

export default function GoogleReviewCard({ review }: { review: GoogleReview }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          {review.avatarUrl ? (
            <img src={review.avatarUrl} alt={review.name} className={styles.avatarImage} loading="lazy" />
          ) : (
            <div className={styles.avatarLetter} style={{ backgroundColor: review.avatarColor || '#e81c62' }}>
              {review.avatarLetter || review.name.charAt(0)}
            </div>
          )}
        </div>
        <div className={styles.meta}>
          <div className={styles.name}>{review.name}</div>
          <div className={styles.date}>{review.date}</div>
        </div>
        <div className={styles.googleIconWrap}>
          <div className={styles.googleTooltip}>Geplaatst op Google</div>
          <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>
      </div>

      <div className={styles.ratingRow}>
        <div className={styles.stars}>
          {[...Array(5)].map((_, i) => (
            <svg key={i} viewBox="0 0 24 24" width="18" height="18" fill={i < review.rating ? "#fbbc04" : "#e0e0e0"}>
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          ))}
        </div>
        <svg className={styles.verifiedIcon} viewBox="0 0 24 24" width="18" height="18" fill="#1877F2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </div>

      <div className={styles.reviewText}>
        {review.text}
      </div>

      <div className={styles.readMore}>
        Lees verder
      </div>
    </div>
  );
}
