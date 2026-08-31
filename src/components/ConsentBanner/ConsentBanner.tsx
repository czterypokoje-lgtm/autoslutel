'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import styles from './ConsentBanner.module.css';
import {
  readConsent,
  writeConsent,
  applyConsent,
  OPEN_PREFERENCES_EVENT,
} from '@/lib/consent';

/**
 * First-party cookie banner, replacing the iubenda Cookie Solution.
 *
 * Two deliberate differences from the widget it replaces:
 *  - it is a bottom strip, not a full-screen overlay, so the phone and
 *    WhatsApp CTAs stay visible and tappable while the visitor decides;
 *  - "Weigeren" and "Accepteren" are the same size and weight, which the AVG
 *    requires — refusing must be as easy as accepting.
 *
 * Nothing that stores personal data runs before a choice is made: Google tags
 * start with Consent Mode defaults of "denied" (set in layout.tsx) and Clarity
 * is not loaded at all until statistics are accepted.
 */
export default function ConsentBanner() {
  const [open, setOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [statistics, setStatistics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (existing) {
      // Re-assert the stored choice on every page load; Consent Mode defaults
      // to denied on each fresh document.
      applyConsent(existing);
      setStatistics(existing.statistics);
      setMarketing(existing.marketing);
    } else {
      setOpen(true);
    }

    const reopen = () => {
      const current = readConsent();
      setStatistics(current?.statistics ?? false);
      setMarketing(current?.marketing ?? false);
      setShowOptions(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_PREFERENCES_EVENT, reopen);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, reopen);
  }, []);

  const save = useCallback((choice: { statistics: boolean; marketing: boolean }) => {
    writeConsent(choice);
    setOpen(false);
    setShowOptions(false);
  }, []);

  if (!open) return null;

  return (
    <div
      className={styles.wrap}
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
    >
      <div className={styles.panel}>
        <p className={styles.title} id="consent-title">
          Cookies op autosleutel24.nl
        </p>
        <p className={styles.text}>
          Wij gebruiken noodzakelijke cookies om de site te laten werken. Met uw
          toestemming gebruiken wij ook cookies voor statistieken en marketing.
          U kunt uw keuze altijd wijzigen. Lees meer in ons{' '}
          <Link href="/cookiebeleid">cookiebeleid</Link> en{' '}
          <Link href="/privacybeleid">privacybeleid</Link>.
        </p>

        {showOptions && (
          <div className={styles.options}>
            <label className={styles.option}>
              <input type="checkbox" checked disabled readOnly />
              <span className={styles.optionBody}>
                <span className={styles.optionName}>
                  Noodzakelijk
                  <span className={styles.always}>altijd aan</span>
                </span>
                <span className={styles.optionDesc}>
                  Nodig om de website te laten werken. Slaat geen persoonlijke
                  gegevens op voor andere doeleinden.
                </span>
              </span>
            </label>

            <label className={styles.option}>
              <input
                type="checkbox"
                checked={statistics}
                onChange={(e) => setStatistics(e.target.checked)}
              />
              <span className={styles.optionBody}>
                <span className={styles.optionName}>Statistieken</span>
                <span className={styles.optionDesc}>
                  Google Analytics en Microsoft Clarity. Helpt ons te zien welke
                  pagina&apos;s werken. Clarity maakt opnames van websessies.
                </span>
              </span>
            </label>

            <label className={styles.option}>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
              <span className={styles.optionBody}>
                <span className={styles.optionName}>Marketing</span>
                <span className={styles.optionDesc}>
                  Google Ads. Meet welke advertenties tot een aanvraag leiden en
                  maakt relevantere advertenties mogelijk.
                </span>
              </span>
            </label>
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.reject}`}
            onClick={() => save({ statistics: false, marketing: false })}
          >
            Weigeren
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.accept}`}
            onClick={() =>
              save(
                showOptions
                  ? { statistics, marketing }
                  : { statistics: true, marketing: true }
              )
            }
          >
            {showOptions ? 'Keuze opslaan' : 'Accepteren'}
          </button>
          {!showOptions && (
            <button
              type="button"
              className={styles.link}
              onClick={() => setShowOptions(true)}
            >
              Instellingen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
