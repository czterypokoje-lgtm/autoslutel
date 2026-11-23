import { amsterdamParts } from './amsterdamTime.ts';

/*
 * Pure rules for the post-completion review request (cron:
 * src/app/api/cron/review-requests/route.ts). No Supabase import, so
 * scripts/check-review-request.mts can load this file directly with
 * `node --experimental-strip-types`.
 */

export const REVIEW_TEMPLATE_DEFAULT = 'review_verzoek';
export const REVIEW_URL_DEFAULT = 'https://search.google.com/local/writereview?placeid=ChIJdd4hrwug2EcRmSRUsedYDNk';
export const MAX_PER_RUN = 50;
/** Starting daily send cap (see docs/review-requests.md Uitrol): ramp slowly, raise only while WhatsApp quality stays green. */
export const DAILY_MAX_DEFAULT = 10;

const TOO_SOON_MS = 2 * 3_600_000;
const TOO_OLD_MS = 72 * 3_600_000;
const RECENTLY_ASKED_MS = 90 * 86_400_000;

export type NotDueReason = 'not_done' | 'too_soon' | 'too_old' | 'no_phone' | 'already';
export type DueResult = { due: true } | { due: false; reason: NotDueReason };

/** Completed 2–72 h ago, afgerond, with a phone, never asked. */
export function isDue(
  job: { completed_at: string | null; status: string; customer_phone: string | null; review_requested_at: string | null },
  now: Date
): DueResult {
  if (job.status !== 'afgerond' || !job.completed_at) return { due: false, reason: 'not_done' };
  if (job.review_requested_at) return { due: false, reason: 'already' };
  if (!job.customer_phone) return { due: false, reason: 'no_phone' };
  const age = now.getTime() - new Date(job.completed_at).getTime();
  if (age < TOO_SOON_MS) return { due: false, reason: 'too_soon' };
  if (age > TOO_OLD_MS) return { due: false, reason: 'too_old' };
  return { due: true };
}

/** Europe/Amsterdam 09:00–20:00 only — nobody gets a review nudge at 2 a.m. */
export function inSendingHours(now: Date): boolean {
  const minutes = amsterdamParts(now).minutes;
  return minutes >= 9 * 60 && minutes < 20 * 60;
}

/** Same phone asked within the last 90 days — one request per customer in that window. */
export function recentlyAsked(lastRequestedAt: string | null, now: Date): boolean {
  if (!lastRequestedAt) return false;
  return now.getTime() - new Date(lastRequestedAt).getTime() < RECENTLY_ASKED_MS;
}

// Explicit opt-out words only — a message that merely contains "stop" (e.g.
// about stopping by car) must never be read as an opt-out.
const STOP_PHRASES = new Set(['stop', 'stoppen', 'afmelden', 'uitschrijven', 'unsubscribe', 'stop berichten', 'geen berichten meer']);

/** Whole inbound message, case/whitespace/trailing-punctuation-insensitive, is one of the explicit WhatsApp opt-out phrases. */
export function isStopMessage(text: string): boolean {
  const normalised = text
    .trim()
    .toLowerCase()
    .replace(/[.!?,;]+$/, '')
    .trim();
  return STOP_PHRASES.has(normalised);
}
