import styles from './UrgencyBanner.module.css';
import { SITE_CONFIG } from '@/config/site.config';

export default function UrgencyBanner() {
  return (
    <div className={styles.banner} role="alert">
      <div className={styles.inner}>
        <div className={styles.dot} aria-hidden="true" />
        <span className={styles.text}>
          <strong>24/7 Spoed Service</strong> — Gemiddelde reactietijd {SITE_CONFIG.responseTime} — Mobiel door heel Nederland &amp; België
        </span>
        <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.cta} id="banner-phone-cta">
          Bel Direct: {SITE_CONFIG.phone}
        </a>
      </div>
    </div>
  );
}
