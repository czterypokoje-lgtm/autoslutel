/**
 * Click fraud on Google Ads: evidence, not a blockade.
 *
 * THE UNCOMFORTABLE PART FIRST. A click on one of our ads is charged inside
 * Google's auction, on Google's servers, before our DNS is even resolved.
 * Nothing deployed on autosleutel24.nl can prevent that charge. Anyone
 * selling a "click-bot blocker" that runs on your own site is selling
 * theatre: by the time the request arrives, the money is gone.
 *
 * Two things actually touch the money, and both are lists of IP addresses
 * with dates attached:
 *
 *   1. IP exclusions in Google Ads     -> stops the NEXT click being charged.
 *   2. An invalid-click credit claim   -> refunds the ones already charged.
 *
 * So this module builds those two lists. It records what really happened on
 * each paid landing (see supabase/migrations/0073_ad_visits_click_fraud.sql)
 * and judges it afterwards, at read time.
 *
 * WHY THE SCORE IS NOT STORED: a verdict written into the row is a verdict
 * from the day the row was written. The first time a threshold here moves,
 * the history becomes incomparable with today. Judging on read means a better
 * threshold also re-judges the past — which is the whole point, because the
 * thresholds below are going to move.
 *
 * WHY IT JUDGES AN ADDRESS AND NOT A VISIT: one silent landing is a customer
 * whose train went into a tunnel. Nine silent landings from one address is a
 * script. Every signal here is weak on its own and only means something in
 * volume, so the unit of judgement is the IP, never the single visit.
 *
 * THE EXPENSIVE MISTAKE is not a bot that scores clean — that costs one
 * click. It is a real customer whose address ends up in the exclusion list,
 * because that address is then unreachable for as long as the list stands,
 * and nobody will ever notice. Every threshold below is deliberately set so
 * that a single weak signal, however suspicious it feels, cannot convict.
 */

/**
 * The recorded landing's row id, handed to the browser so /api/ad-visit can
 * say "the visit you are reporting on is this one".
 *
 * httpOnly on purpose. The beacon never reads it — the browser attaches it to
 * a same-origin fetch by itself — and keeping it out of document.cookie means
 * a script on the page cannot discover or forge another visit's id.
 *
 * Short-lived: it exists only for the seconds between the landing and the
 * beacon, so it is not a tracking cookie and does not need consent.
 */
export const AD_VISIT_COOKIE = 'as24_adv';
export const AD_VISIT_COOKIE_MAX_AGE = 1800; // half an hour

/**
 * Rows one address may write per hour. A cost guard, never a refusal.
 *
 * Nothing is ever turned away over this — see handlePaidLanding in
 * src/proxy.ts for why refusing a paid landing can only lose a customer. All
 * this does is stop a script that found our landing page from writing rows
 * until someone notices the database bill.
 *
 * Sixty is deliberately far above anything a shared office or carrier NAT
 * produces, because the penalty for being wrong here is lost evidence.
 */
export const PAID_RECORD_CAP = 60;
export const PAID_RECORD_WINDOW = 3600;

/** Click id parameters that mark a landing as paid-for. */
export const PAID_CLICK_PARAMS = ['gclid', 'wbraid', 'gbraid', 'msclkid'] as const;

/**
 * What the browser told us about itself, via /api/ad-visit.
 *
 * All of it is client-supplied and therefore all of it is forgeable. It is
 * used only to ADD suspicion, never to clear it: a visit with perfect
 * signals and no JavaScript still counts as silent.
 */
export interface ClientSignals {
  /** navigator.hardwareConcurrency — 0 or 1 is unusual on a real phone. */
  cores?: number | null;
  /** Viewport, as reported by the browser. */
  width?: number | null;
  height?: number | null;
  /** IANA zone from Intl. A Dutch ad clicked from zone UTC is odd. */
  timezone?: string | null;
  /** navigator.languages, joined. An empty list is a headless default. */
  languages?: string | null;
}

/** One row of public.ad_visits, as the CRM reads it back. */
export interface AdVisit {
  id: string;
  created_at: string;
  ip: string | null;
  country: string | null;
  user_agent: string | null;
  path: string | null;
  gclid: string | null;
  wbraid: string | null;
  gbraid: string | null;
  msclkid: string | null;
  campaign_id: string | null;
  keyword: string | null;
  js_ran: boolean;
  interacted: boolean;
  webdriver: boolean | null;
  client_signals: ClientSignals | null;
}

/**
 * `fraude` is the only tier that may enter the exclusion list.
 *
 * `verdacht` exists precisely so that there is somewhere to put an address
 * that looks wrong but has not earned an exclusion — without that middle
 * tier, every judgement call gets rounded up to a block.
 */
export type FraudTier = 'ok' | 'verdacht' | 'fraude';

export interface Judgement {
  ip: string;
  tier: FraudTier;
  points: number;
  /** Dutch, because these are read by the office and pasted into a ticket. */
  reasons: string[];
  visits: number;
  /** Landings where no JavaScript ever ran. The load-bearing signal. */
  silent: number;
  country: string | null;
  firstSeen: string;
  lastSeen: string;
  /** Click ids for the credit claim — Google support asks for these by name. */
  clickIds: string[];
  campaigns: string[];
}

/** At or above this, an address is `fraude` and may be excluded. */
export const FRAUD_POINTS = 6;
/** At or above this, an address is `verdacht` and gets looked at by a person. */
export const SUSPECT_POINTS = 3;

/**
 * Countries this business actually serves. A paid click from outside them is
 * worth ONE point and can never convict on its own: Dutch people travel, use
 * VPNs, and read their email from a hotel in Spain.
 */
const SERVED_COUNTRIES = new Set(['NL', 'BE', 'DE', '']);

/** Silent landings, scored in bands rather than per-click. */
function silentPoints(silent: number): number {
  if (silent >= 9) return 6; // Convicts on its own. Nine is not a tunnel.
  if (silent >= 6) return 4;
  if (silent >= 3) return 3; // Worth a look, nowhere near an exclusion.
  return 0; // One or two silent landings is ordinary web traffic.
}

/**
 * navigator.webdriver, which is the browser admitting it is being driven.
 *
 * Trivially disabled, so its absence proves nothing — but its presence on a
 * landing we PAID for is about as close to a confession as this data gets.
 * Still volume-tiered: one such landing could be our own developer testing a
 * tracking template with Playwright, and excluding the office's own address
 * would be the expensive mistake.
 */
function webdriverPoints(count: number): number {
  if (count >= 2) return 6;
  if (count === 1) return 4;
  return 0;
}

const median = (numbers: number[]): number => {
  if (!numbers.length) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/**
 * Machine cadence: four or more landings whose gaps are both short and
 * suspiciously even. Worth two points, which is below `verdacht` on purpose —
 * a person comparing three of our city pages in one go looks exactly like
 * this, and so does a customer refreshing a slow page.
 */
function cadencePoints(times: number[]): { points: number; reason?: string } {
  if (times.length < 4) return { points: 0 };
  const sorted = [...times].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) gaps.push((sorted[i]! - sorted[i - 1]!) / 1000);

  const mid = median(gaps);
  if (mid > 120) return { points: 0 };

  // Spread around the median. A human's gaps vary wildly; a loop's barely do.
  const spread = median(gaps.map((g) => Math.abs(g - mid)));
  if (spread > Math.max(3, mid * 0.25)) return { points: 0 };

  return {
    points: 2,
    reason: `${times.length} klikken met een gelijkmatig ritme van ~${Math.round(mid)}s`,
  };
}

/** Headless-browser tells. Capped at two points: all of them are forgeable. */
function signalPoints(visits: AdVisit[]): { points: number; reasons: string[] } {
  const reasons: string[] = [];
  let points = 0;

  const signals = visits.map((v) => v.client_signals).filter((s): s is ClientSignals => !!s);
  if (!signals.length) return { points: 0, reasons };

  if (signals.some((s) => typeof s.cores === 'number' && s.cores > 0 && s.cores <= 1)) {
    points += 1;
    reasons.push('browser meldt één processorkern');
  }
  if (
    signals.some(
      (s) =>
        typeof s.width === 'number' &&
        typeof s.height === 'number' &&
        s.width > 0 &&
        s.width <= 800 &&
        s.height <= 600
    )
  ) {
    points += 1;
    reasons.push('venster van 800x600 of kleiner (standaardmaat van een headless browser)');
  }
  if (signals.some((s) => s.timezone === 'UTC')) {
    points += 1;
    reasons.push('tijdzone UTC, niet Europe/Amsterdam');
  }
  if (signals.some((s) => s.languages === '')) {
    points += 1;
    reasons.push('browser meldt geen enkele taalvoorkeur');
  }

  return { points: Math.min(2, points), reasons: reasons.slice(0, 2) };
}

const unique = (values: (string | null)[]): string[] =>
  [...new Set(values.filter((v): v is string => !!v))];

/**
 * Judge one address from every paid landing it produced.
 *
 * `visits` must all share an IP and should cover one window (the CRM passes
 * the last 30 days). Returns null for an empty list rather than inventing a
 * clean verdict for an address nobody has seen.
 */
export function judgeIp(visits: AdVisit[]): Judgement | null {
  if (!visits.length) return null;

  const ip = visits[0]!.ip ?? 'onbekend';
  const times = visits.map((v) => new Date(v.created_at).getTime()).filter(Number.isFinite);
  const sortedTimes = [...times].sort((a, b) => a - b);

  const silent = visits.filter((v) => !v.js_ran).length;
  const webdrivers = visits.filter((v) => v.webdriver === true).length;
  const interacted = visits.filter((v) => v.interacted).length;
  const country = visits.find((v) => v.country)?.country ?? null;

  const reasons: string[] = [];
  let points = 0;

  const silentScore = silentPoints(silent);
  if (silentScore) {
    points += silentScore;
    reasons.push(
      `${silent} van ${visits.length} betaalde landingen zonder dat er JavaScript liep`
    );
  }

  const driverScore = webdriverPoints(webdrivers);
  if (driverScore) {
    points += driverScore;
    reasons.push(
      webdrivers === 1
        ? 'browser meldde zelf dat hij door automatisering werd bestuurd'
        : `${webdrivers} landingen waarbij de browser zelf meldde dat hij bestuurd werd`
    );
  }

  /* Sheer volume. One address producing twenty paid clicks in a month is not
     a household, whatever the other signals say. */
  if (visits.length >= 20) {
    points += 3;
    reasons.push(`${visits.length} betaalde klikken van één adres`);
  } else if (visits.length >= 10) {
    points += 2;
    reasons.push(`${visits.length} betaalde klikken van één adres`);
  }

  const cadence = cadencePoints(times);
  if (cadence.points) {
    points += cadence.points;
    if (cadence.reason) reasons.push(cadence.reason);
  }

  if (country && !SERVED_COUNTRIES.has(country)) {
    points += 1;
    reasons.push(`klikken uit ${country}, buiten het werkgebied`);
  }

  /* Nobody out of five or more ever touched anything. One point: a price page
     answers the question without a click. */
  if (visits.length >= 5 && interacted === 0) {
    points += 1;
    reasons.push('geen enkele klik of toetsaanslag op de pagina, bij alle bezoeken');
  }

  const signals = signalPoints(visits);
  points += signals.points;
  reasons.push(...signals.reasons);

  const tier: FraudTier =
    points >= FRAUD_POINTS ? 'fraude' : points >= SUSPECT_POINTS ? 'verdacht' : 'ok';

  return {
    ip,
    tier,
    points,
    reasons,
    visits: visits.length,
    silent,
    country,
    firstSeen: new Date(sortedTimes[0] ?? Date.now()).toISOString(),
    lastSeen: new Date(sortedTimes[sortedTimes.length - 1] ?? Date.now()).toISOString(),
    clickIds: unique(visits.map((v) => v.gclid ?? v.wbraid ?? v.gbraid ?? v.msclkid)),
    campaigns: unique(visits.map((v) => v.campaign_id)),
  };
}

/**
 * Which addresses a nightly alert should name.
 *
 * Only `fraude`, and only once ever. Both halves matter, in opposite
 * directions:
 *
 *   Only `fraude`  — alerting on `verdacht` would push the office toward
 *                    excluding addresses that have not earned it, which is
 *                    the one mistake this whole module is built to avoid. The
 *                    middle tier exists so suspicion has somewhere to live
 *                    that is not a phone buzzing.
 *   Only once      — a nightly repeat of the same addresses trains people to
 *                    stop reading the message, which also hides the night
 *                    something new happens. `alreadyAlerted` is that memory
 *                    (public.ad_fraud_alerts).
 */
export function needsAlert(
  judgements: Judgement[],
  alreadyAlerted: Iterable<string>
): Judgement[] {
  const seen = new Set(alreadyAlerted);
  return judgements.filter((j) => j.tier === 'fraude' && !seen.has(j.ip));
}

/** Group a window of visits by address and judge each one, worst first. */
export function judgeAll(visits: AdVisit[]): Judgement[] {
  const byIp = new Map<string, AdVisit[]>();
  for (const visit of visits) {
    if (!visit.ip) continue;
    const list = byIp.get(visit.ip);
    if (list) list.push(visit);
    else byIp.set(visit.ip, [visit]);
  }

  return [...byIp.values()]
    .map(judgeIp)
    .filter((j): j is Judgement => !!j)
    .sort((a, b) => b.points - a.points || b.visits - a.visits);
}

/*
 * ---------------------------------------------------------------------------
 * Writing. Called from proxy.ts, which runs on every paid landing, so this
 * uses plain fetch against Supabase's REST endpoint rather than the
 * supabase-js client — the same reasoning as rateLimit.ts: no client library
 * in the request path, a hard timeout, and failure that never reaches the
 * visitor.
 * ---------------------------------------------------------------------------
 */

const SUPABASE_REST = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  return url ? `${url.replace(/\/$/, '')}/rest/v1` : '';
})();

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.storage_SUPABASE_SERVICE_ROLE_KEY || '';

/** True when a visit can actually be recorded. */
export const clickFraudConfigured = Boolean(SUPABASE_REST && SERVICE_KEY);

/**
 * Fire-and-forget insert. Returns false instead of throwing: a landing page
 * must never fail, or go slow, because the evidence table was unreachable.
 */
export async function recordAdVisit(row: Record<string, unknown>): Promise<boolean> {
  if (!clickFraudConfigured) return false;
  try {
    const res = await fetch(`${SUPABASE_REST}/ad_visits`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Mark a recorded landing as having run JavaScript.
 *
 * `id` comes from the httpOnly cookie proxy.ts set, never from the request
 * body — see src/app/api/ad-visit/route.ts. The filter pins the update to
 * `js_ran=false` as well, so a replayed beacon cannot keep rewriting a row,
 * and nothing here can ever set a field back to false.
 */
export async function markAdVisitHuman(
  id: string,
  patch: { interacted?: boolean; webdriver?: boolean | null; client_signals?: ClientSignals }
): Promise<boolean> {
  if (!clickFraudConfigured) return false;
  try {
    const params = new URLSearchParams({ id: `eq.${id}`, js_ran: 'is.false' });
    const res = await fetch(`${SUPABASE_REST}/ad_visits?${params}`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ js_ran: true, ...patch }),
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
