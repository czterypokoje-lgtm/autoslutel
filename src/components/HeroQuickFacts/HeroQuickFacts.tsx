import { ARRIVAL } from '@/config/arrival';
import styles from './HeroQuickFacts.module.css';

/*
 * What a person standing next to a locked car, or without a key, needs to see
 * before they scroll: how fast and how much, in one small line under the lead. The
 * Bel direct / WhatsApp buttons are not repeated here: they are the top row of the
 * wizard and the form below it (with their tracking ids), and the fixed bar on phones.
 *
 * The price is passed in (each service has its own, from SITE_CONFIG.prices) and
 * the arrival time comes from src/config/arrival.ts, so neither is typed here.
 */
export default function HeroQuickFacts({ price, tone = 'light' }: { price?: string; tone?: 'light' | 'dark' }) {
  return (
    <div className={`${styles.facts} ${tone === 'dark' ? styles.dark : ''}`}>
      <ul className={styles.list}>
        <li>
          <strong>Binnen {ARRIVAL}</strong> ter plaatse
        </li>
        {price ? (
          <li>
            <strong>{price}</strong>, vaste prijs vooraf
          </li>
        ) : null}
        <li>24/7 bereikbaar</li>
      </ul>
    </div>
  );
}
