import styles from './UrgencyBanner.module.css';
import { SITE_CONFIG } from '@/config/site.config';

/*
 * Der Streifen über jeder Seite — und deshalb die teuerste Stelle für einen
 * falschen Satz. Hier stand bis zuletzt der niederländische Text: "Gemiddelde
 * reactietijd … Mobiel door heel Nederland", auf 48 von 51 Seiten, über der
 * deutschen Überschrift.
 *
 * Die durchschnittliche Reaktionszeit ist mit heraus: sie war eine gemessene
 * Zahl aus dem niederländischen Betrieb, und in Deutschland gibt es noch
 * nichts zu messen. Was bleibt, ist nachprüfbar — 24/7 und die vier Städte,
 * in denen wirklich ein Partner sitzt, aus der Konfiguration statt "door heel
 * Nederland".
 */
export default function UrgencyBanner() {
  return (
    <div className={styles.banner} role="alert">
      <div className={styles.inner}>
        <div className={styles.dot} aria-hidden="true" />
        <span className={styles.text}>
          <strong>24/7 Soforthilfe</strong> — mobil in {SITE_CONFIG.serviceAreaString}
        </span>
        <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.cta} id="banner-phone-cta">
          Direkt anrufen: {SITE_CONFIG.phone}
        </a>
      </div>
    </div>
  );
}
