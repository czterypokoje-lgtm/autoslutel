import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { ARRIVAL } from '@/config/arrival';
import styles from './HeroQuickFacts.module.css';

/*
 * What a person standing next to a locked car, or without a key, needs to see
 * before they scroll: how fast, how much, and a button that calls. It sits in
 * the hero directly under the lead so it is inside the first screen on a phone,
 * above the photo and the form, and does not depend on the sticky bar.
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
      <div className={styles.buttons}>
        <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.call}>
          Bel {SITE_CONFIG.phone}
        </a>
        <a href={WHATSAPP_URL} className={styles.wa} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
      </div>
    </div>
  );
}
