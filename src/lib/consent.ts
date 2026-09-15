/**
 * Consent state — replaces the iubenda Cookie Solution.
 *
 * Three categories. "necessary" is always on and covers nothing that stores
 * personal data; the other two are opt-in and start denied, which is what the
 * AVG (and the Telecommunicatiewet art. 11.7a) requires for a Dutch audience.
 *
 * The stored record is versioned: bump CONSENT_VERSION whenever the categories
 * or the banner wording change, and every visitor is asked again — you cannot
 * rely on consent given for a different set of purposes.
 */

export const CONSENT_VERSION = 1;
export const CONSENT_KEY = 'as24_consent';
/** Mirrors the choice into a cookie so the server could read it later if needed. */
export const CONSENT_COOKIE = 'as24_consent';
/** How long a choice stands before we ask again. AVG has no fixed term; 6 months is common practice. */
export const CONSENT_MAX_AGE_DAYS = 182;

export interface ConsentState {
  version: number;
  /** ISO timestamp — this is the proof that consent was given, and when. */
  at: string;
  statistics: boolean;
  marketing: boolean;
}

export const DENIED: Omit<ConsentState, 'at' | 'version'> = {
  statistics: false,
  marketing: false,
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: unknown;
  }
}

/**
 * The choice as recorded in the cookie: "10" is statistics yes, marketing no.
 *
 * The fallback for every device where localStorage is not available. It
 * carries no timestamp — the cookie's own max-age is what expires it.
 */
function readConsentCookie(): ConsentState | null {
  if (typeof document === 'undefined') return null;

  const raw = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);

  const value = raw ? decodeURIComponent(raw) : '';
  if (!/^[01]{2}$/.test(value)) return null;

  return {
    version: CONSENT_VERSION,
    at: new Date().toISOString(),
    statistics: value[0] === '1',
    marketing: value[1] === '1',
  };
}

/** Reads the stored choice, or null when the visitor has not decided yet. */
export function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return readConsentCookie();
    const parsed = JSON.parse(raw) as ConsentState;

    // A record from an older wording is not consent for the current one.
    if (parsed.version !== CONSENT_VERSION) return null;

    const ageDays =
      (Date.now() - new Date(parsed.at).getTime()) / (1000 * 60 * 60 * 24);
    if (!Number.isFinite(ageDays) || ageDays > CONSENT_MAX_AGE_DAYS) return null;

    return parsed;
  } catch {
    // Private mode, blocked storage, corrupt JSON — try the cookie instead.
    return readConsentCookie();
  }
}

export function writeConsent(choice: { statistics: boolean; marketing: boolean }): ConsentState {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    at: new Date().toISOString(),
    statistics: choice.statistics,
    marketing: choice.marketing,
  };
  /*
   * The cookie is written first, and separately.
   *
   * These used to share one try block with localStorage first, so on a device
   * where localStorage throws — Safari in private browsing, or storage blocked
   * for an insecure origin — the write failed before the cookie line ran and
   * nothing was recorded at all. The banner then came back on every single
   * page load, with no way for the visitor to ever get rid of it.
   */
  try {
    const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
      `${state.statistics ? 1 : 0}${state.marketing ? 1 : 0}`
    )};path=/;max-age=${maxAge};SameSite=Lax`;
  } catch {
    // Cookies blocked as well; the choice still applies for this page view.
  }

  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable — the cookie above is the record.
  }
  applyConsent(state);
  notifyConsentChanged();
  return state;
}

/**
 * Pushes the choice into Google Consent Mode v2 and starts any script that was
 * held back. Safe to call repeatedly.
 */
export function applyConsent(state: ConsentState | null): void {
  if (typeof window === 'undefined') return;

  const statistics = state?.statistics ?? false;
  const marketing = state?.marketing ?? false;

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args);
  };

  gtag('consent', 'update', {
    analytics_storage: statistics ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied',
  });

  // Let GTM trigger tags that wait for a decision.
  window.dataLayer.push({
    event: 'consent_update',
    consent_statistics: statistics,
    consent_marketing: marketing,
  });

  if (statistics) loadClarity();
}

/**
 * Microsoft Clarity records sessions and is not Consent Mode aware, so unlike
 * the Google tags it must not be loaded at all until the visitor agrees.
 */
const CLARITY_ID = 'y9gjejwp8z';
let clarityRequested = false;

export function loadClarity(): void {
  if (typeof window === 'undefined' || clarityRequested) return;
  if (document.getElementById('ms-clarity')) return;
  clarityRequested = true;

  const s = document.createElement('script');
  s.id = 'ms-clarity';
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
  document.head.appendChild(s);
}

/** Opens the preferences panel from anywhere (footer link, cookie policy page). */
export const OPEN_PREFERENCES_EVENT = 'as24:open-consent';

export function openConsentPreferences(): void {
  window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT));
}

/* ──────────────────────────────────────────────────────────────────────────
   External store
   ──────────────────────────────────────────────────────────────────────────
   The stored choice lives in localStorage, which does not exist during SSR.
   Reading it in an effect and calling setState causes a cascading render
   (react-hooks/set-state-in-effect), so it is exposed as an external store
   for useSyncExternalStore instead.

   getSnapshot must return a stable reference or React re-renders forever,
   hence the cache — it is refreshed only when the choice actually changes.
   ────────────────────────────────────────────────────────────────────────── */

const CONSENT_CHANGED_EVENT = 'as24:consent-changed';

let snapshot: ConsentState | null = null;
let snapshotLoaded = false;

function refreshSnapshot(): void {
  snapshot = readConsent();
  snapshotLoaded = true;
}

export function subscribeConsent(onChange: () => void): () => void {
  const handler = () => {
    refreshSnapshot();
    onChange();
  };
  window.addEventListener(CONSENT_CHANGED_EVENT, handler);
  return () => window.removeEventListener(CONSENT_CHANGED_EVENT, handler);
}

export function getConsentSnapshot(): ConsentState | null {
  if (!snapshotLoaded) refreshSnapshot();
  return snapshot;
}

/** Server render has no stored choice, so the banner is never in the SSR HTML. */
export function getConsentServerSnapshot(): ConsentState | null {
  return null;
}

function notifyConsentChanged(): void {
  refreshSnapshot();
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT));
}
