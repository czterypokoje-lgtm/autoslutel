import styles from './HeroTrustBadge.module.css';

export default function HeroTrustBadge() {
  return (
    <div className={styles.badgeContainer}>
      <div className={styles.avatarPile}>
        <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Klant 1" className={styles.avatar} />
        <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Klant 2" className={styles.avatar} />
        <img src="https://randomuser.me/api/portraits/men/46.jpg" alt="Klant 3" className={styles.avatar} />
        <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Klant 4" className={styles.avatar} />
      </div>
      <div className={styles.ratingInfo}>
        <div className={styles.scoreRow}>
          <span className={styles.score}>5/5</span>
          <div className={styles.stars}>
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#facc15">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            ))}
          </div>
        </div>
        <span className={styles.label}>Gebaseerd op Google reviews</span>
      </div>
    </div>
  );
}
