'use client';

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { SITE_CONFIG } from '@/config/site.config';
import Link from 'next/link';
import styles from './ConsentBanner.module.css';
import {
  writeConsent,
  applyConsent,
  OPEN_PREFERENCES_EVENT,
  subscribeConsent,
  getConsentSnapshot,
  getConsentServerSnapshot,
} from '@/lib/consent';

/**
 * Eigenes Cookie-Banner, an der Stelle der iubenda Cookie Solution.
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
  // localStorage does not exist during SSR, so the stored choice is read
  // through an external store rather than an effect + setState.
  const stored = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot
  );

  // Shown when the visitor has not decided yet, or reopened from the footer.
  const [reopened, setReopened] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [statistics, setStatistics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Re-assert the stored choice on every page load: Consent Mode resets to the
  // denied defaults on each fresh document.
  useEffect(() => {
    if (stored) applyConsent(stored);
  }, [stored]);

  useEffect(() => {
    const reopen = () => {
      setStatistics(stored?.statistics ?? false);
      setMarketing(stored?.marketing ?? false);
      setShowOptions(true);
      setReopened(true);
    };
    window.addEventListener(OPEN_PREFERENCES_EVENT, reopen);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, reopen);
  }, [stored]);

  /*
   * A way to get the banner out of the way while testing on a phone.
   *
   * Set NEXT_PUBLIC_HIDE_CONSENT=1 in .env.local. It is checked together with
   * NODE_ENV, so it cannot silently switch the banner off on the live site —
   * running without a consent banner is not a styling choice, it is a breach
   * of the Telecommunicatiewet art. 11.7a.
   */
  const hiddenForDev =
    process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_HIDE_CONSENT === '1';

  const open = !hiddenForDev && (reopened || stored === null);

  const save = useCallback((choice: { statistics: boolean; marketing: boolean }) => {
    // writeConsent notifies the store, which flips `stored` away from null.
    writeConsent(choice);
    setReopened(false);
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
          Cookies auf {SITE_CONFIG.domain.replace('https://', '')}
        </p>
        <p className={styles.text}>
          <span className={styles.full}>
            Technisch notwendige Cookies brauchen wir, damit die Seite funktioniert. Für
            Statistik und Marketing nur mit Ihrer Einwilligung — und die können Sie jederzeit
            ändern oder widerrufen. Mehr steht in unserer{' '}
            <Link href="/cookie-richtlinie">Cookie-Richtlinie</Link> und der{' '}
            <Link href="/datenschutz">Datenschutzerklärung</Link>.
          </span>
          {/* Auf dem Telefon eine Zeile: wer neben einem verschlossenen Auto
              steht, soll die Seite sehen und keine Textwand. */}
          <span className={styles.brief}>
            Notwendige Cookies für den Betrieb, Statistik und Marketing nur mit Ihrer
            Einwilligung. <Link href="/cookie-richtlinie">Cookie-Richtlinie</Link>.
          </span>
        </p>

        {showOptions && (
          <div className={styles.options}>
            <label className={styles.option}>
              <input type="checkbox" checked disabled readOnly />
              <span className={styles.optionBody}>
                <span className={styles.optionName}>
                  Technisch notwendig
                  <span className={styles.always}>immer aktiv</span>
                </span>
                <span className={styles.optionDesc}>
                  Nötig, damit die Seite funktioniert und Ihre Entscheidung gespeichert bleibt.
                  Braucht nach § 25 Abs. 2 TDDDG keine Einwilligung und wird nicht zum
                  Verfolgen verwendet.
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
                <span className={styles.optionName}>Statistik</span>
                {/*
                  * Hier stand "Google Analytics en Microsoft Clarity … opnames
                  * van websessies". In dieser App ist kein Messwerkzeug
                  * eingerichtet (site.config.ts analytics steht auf null), es
                  * wird also nichts geladen. Eine Verarbeitung zu beschreiben,
                  * die nicht stattfindet, ist derselbe Fehler wie eine zu
                  * verschweigen — siehe app/cookie-richtlinie.
                  */}
                <span className={styles.optionDesc}>
                  Zeigt uns, welche Seiten funktionieren. Derzeit ist kein Statistik-Werkzeug
                  eingerichtet; Ihre Zustimmung wird gespeichert und gilt, sobald eines
                  hinzukommt.
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
                  Misst, welche Anzeige zu einer Anfrage geführt hat. Derzeit ist kein
                  Anzeigenkonto eingerichtet; Ihre Zustimmung wird gespeichert und gilt, sobald
                  eines hinzukommt.
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
            Ablehnen
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
            {showOptions ? 'Auswahl speichern' : 'Alle akzeptieren'}
          </button>
          {!showOptions && (
            <button
              type="button"
              className={styles.link}
              onClick={() => setShowOptions(true)}
            >
              Einstellungen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
