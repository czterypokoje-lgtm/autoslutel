'use client';

import { useEffect } from 'react';
import { AD_CLICK_PARAMS } from '@/lib/adClickId';

/**
 * Tells /api/ad-visit that a real browser rendered this paid landing.
 *
 * proxy.ts has already written the row and set the httpOnly cookie that
 * identifies it; this component carries no id and could not forge one if it
 * wanted to. All it proves is that JavaScript ran — which is precisely the
 * signal that separates a customer from something that fetched the HTML and
 * left (see src/lib/clickFraud.ts).
 *
 * WHEN IT FIRES. Once, on the first of: an interaction, two and a half
 * seconds, or the page being hidden. The timer exists so a visitor who reads
 * and leaves without touching anything still counts as human; the pagehide
 * path exists so a visitor who leaves inside those 2.5 seconds does too.
 *
 * The cost of that compromise, stated plainly: `interacted` is only true when
 * the interaction happened before the beacon went out, so it undercounts.
 * That is why clickFraud.ts gives a dead `interacted` a single point and only
 * across five or more visits — it is a hint, never a verdict.
 *
 * Fires only on landings carrying a click id, so an organic visitor's browser
 * makes no extra request at all.
 */

const PROBE_DELAY_MS = 2500;

function hasPaidClickId(): boolean {
  const params = new URLSearchParams(window.location.search);
  return AD_CLICK_PARAMS.some((p) => !!params.get(p));
}

export default function AdVisitBeacon() {
  useEffect(() => {
    if (!hasPaidClickId()) return;

    let sent = false;
    let interacted = false;

    /* Started first so it can be a const that `cleanup` closes over; `send`
       exists by the time it fires. */
    const timer = window.setTimeout(() => send(), PROBE_DELAY_MS);

    const cleanup = () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', onInteract);
      document.removeEventListener('keydown', onInteract);
      document.removeEventListener('scroll', onInteract);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', send);
    };

    const send = () => {
      if (sent) return;
      sent = true;
      cleanup();

      /*
       * Everything below is what the browser says about itself, so all of it
       * is forgeable — it is only ever read as grounds for suspicion, never
       * as proof of innocence. A headless default (one core, 800x600, UTC,
       * no languages) is what it is looking for.
       */
      const payload = {
        interacted,
        webdriver: navigator.webdriver === true,
        cores:
          typeof navigator.hardwareConcurrency === 'number'
            ? navigator.hardwareConcurrency
            : null,
        width: window.screen?.width ?? null,
        height: window.screen?.height ?? null,
        timezone: (() => {
          try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
          } catch {
            return null;
          }
        })(),
        languages: Array.isArray(navigator.languages) ? navigator.languages.join(',') : '',
      };

      try {
        void fetch('/api/ad-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          // Survives the page being torn down, which is the whole point of
          // the pagehide path.
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Nothing to recover: the row simply stays js_ran = false, and one
        // silent landing convicts nobody.
      }
    };

    const onInteract = () => {
      interacted = true;
      send();
    };

    const onHide = () => {
      if (document.visibilityState === 'hidden') send();
    };

    document.addEventListener('pointerdown', onInteract, { once: true, passive: true });
    document.addEventListener('keydown', onInteract, { once: true });
    document.addEventListener('scroll', onInteract, { once: true, passive: true });
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', send);

    return cleanup;
  }, []);

  return null;
}
