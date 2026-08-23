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
          <span className={styles.score}>4.9/5</span>
          <span className={styles.star}>⭐</span>
        </div>
        <span className={styles.label}>Klantenbeoordeling</span>
      </div>
    </div>
  );
}
