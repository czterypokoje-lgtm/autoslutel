/**
 * First-party capture of the ad click id (gclid/wbraid/gbraid/msclkid) that
 * brought a visitor here, so a phone call from them — which never touches
 * /api/leads — can still be attributed later. See supabase/migrations/
 * 0053_call_click_attribution.sql for why this needs a table at all.
 *
 * Stored the moment it appears in the URL, before any consent choice: this
 * is a click id, not tracking of behaviour — nothing leaves the browser
 * until a real, completed job later claims it, and exporting that job to
 * Google Ads already goes through its own consent-gated pipeline (see
 * src/app/api/track-call-conversion and .../export-conversions).
 */

export const AD_CLICK_PARAMS = ['gclid', 'wbraid', 'gbraid', 'msclkid'] as const;
export type AdClickIds = Partial<Record<(typeof AD_CLICK_PARAMS)[number], string>>;

const COOKIE_NAME = 'as24_clickid';
/** Matches Google's own offline-conversion click window (see export-conversions/route.ts). */
const COOKIE_MAX_AGE_DAYS = 90;

/**
 * How long after a tel:/WhatsApp click a hand-created job may still claim it.
 *
 * This business runs one phone line, so "the most recent unclaimed click" is
 * almost always the right one — but it's a guess, not a certainty. A short
 * window trades a few missed matches (customer thinks it over for an hour
 * before calling) for far fewer wrong ones (a second, unrelated visitor's
 * click stealing the attribution). Widen it if the office reports jobs are
 * going unmatched; narrow it if a match looks wrong.
 */
export const CALL_CLICK_WINDOW_MINUTES = 45;

function fromSearch(search: string): AdClickIds | null {
  const params = new URLSearchParams(search);
  const found: AdClickIds = {};
  for (const key of AD_CLICK_PARAMS) {
    const value = params.get(key);
    if (value) found[key] = value.slice(0, 200);
  }
  return Object.keys(found).length ? found : null;
}

/** Call once on mount, on every page: if this landing has a click id, remember it. */
export function captureAdClickIdFromUrl(): void {
  if (typeof window === 'undefined') return;
  const found = fromSearch(window.location.search);
  if (!found) return;
  try {
    const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(found))};path=/;max-age=${maxAge};SameSite=Lax`;
  } catch {
    // Cookies blocked — this visitor's phone call simply won't be attributable later.
  }
}

/** Reads the click id captured earlier this session (or on this exact page load). */
export function readAdClickId(): AdClickIds | null {
  if (typeof document === 'undefined') return null;
  const fromUrl = fromSearch(window.location.search);
  if (fromUrl) return fromUrl;

  const raw = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return parsed && typeof parsed === 'object' ? (parsed as AdClickIds) : null;
  } catch {
    return null;
  }
}
