/**
 * Who gets offered the job, and in what order.
 *
 * Offered, not assigned. We set the price, take the payment and route the work,
 * and in the Netherlands that combination is exactly what gets examined for
 * schijnzelfstandigheid. A technician who can decline without penalty, sets
 * their own availability and keeps their own customers in the same calendar is
 * a contractor; one who is told where to be is not. The offer-and-accept flow
 * here is a legal position as much as a UX one.
 *
 * Four hard gates and then a score. The gates are facts — can they do this car,
 * do they drive there, are they free — and a failure on any of them removes the
 * technician entirely. The score only orders the ones who are left.
 */

import { coversCar, type Car, type CoverageRow } from './capability';
import { coversPostcode, postcodeDigits } from './crmJobs';
import { TIER_TERMS, type Tier } from './subscription';
import type { Scenario } from './scenarios';

export interface Candidate {
  id: string;
  name: string;
  werkgebied: string[];
  base_lat: number | null;
  base_lng: number | null;
  online: boolean;
  tier: Tier;
  /** Their declared coverage rows. */
  coverage: CoverageRow[];
  /** Article codes currently in their van, from stock_items. */
  vanStock: string[];
  /** Jobs they already hold in this slot. */
  busyInSlot: number;
  /** Accepted ÷ offered over the last 30 days, or null when new. */
  acceptRate: number | null;
}

export interface DispatchRequest {
  car: Car;
  scenario: Scenario;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  /** The article the quote picked, when it picked one. */
  articleCode?: string | null;
}

export interface Rejection {
  id: string;
  name: string;
  /** Which gate they failed. Kept so "why didn't I get that job" is answerable. */
  gate: 'kan_auto_niet' | 'buiten_gebied' | 'bezet';
}

export interface Offer {
  technicianId: string;
  name: string;
  tier: Tier;
  rank: number;
  score: number;
  reason: string;
  /** Seconds after dispatch that this offer opens and closes. */
  opensAfter: number;
  expiresAfter: number;
}

export interface DispatchPlan {
  offers: Offer[];
  rejected: Rejection[];
  /** True when nobody passed the gates — the caller must be told no. */
  empty: boolean;
}

/** How long any one technician gets to answer once their window opens. */
const ANSWER_WINDOW = 120;

/**
 * Postcode nearness, as a stand-in for distance until routing is wired up.
 *
 * The first two digits of a Dutch postcode are a region and the next two a
 * town, so |3512 − 3584| is a usable proxy for "roughly how far". It is not a
 * drive time and is never shown as one; it only breaks ties inside a tier.
 */
function nearness(werkgebied: string[], postcode: string | null): number {
  const target = postcodeDigits(postcode);
  if (target == null || !werkgebied.length) return 0;

  let best = Infinity;
  for (const range of werkgebied) {
    const bounds = range.split('-').map((n) => Number(n.trim()));
    const from = bounds[0];
    const to = bounds[1] ?? bounds[0];
    if (!Number.isFinite(from)) continue;
    const distance = target < from ? from - target : target > to ? target - to : 0;
    best = Math.min(best, distance);
  }
  return best === Infinity ? 0 : Math.max(0, 1 - best / 500);
}

/**
 * Score the technicians who passed the gates.
 *
 * Van stock is weighted hardest on purpose. The most expensive failure in this
 * trade is arriving without the right blank: the slot is gone, the fuel is
 * gone, and someone has to go back. Everything else on this list is a
 * preference; that one is money.
 */
function scoreOf(
  candidate: Candidate,
  request: DispatchRequest,
  driveTimeSeconds: number | null
): { score: number; reason: string } {
  const reasons: string[] = [];
  let score = 0;

  if (request.articleCode && candidate.vanStock.includes(request.articleCode)) {
    score += 50;
    reasons.push('heeft het onderdeel in de bus');
  }

  if (driveTimeSeconds !== null) {
    // 30 mins (1800s) = perfect 25 points. 
    // Closer than 30 mins doesn't add points. Longer than 30 mins drops points linearly.
    // 2 hours (7200s) away = 0 points.
    const penalty = Math.max(0, (driveTimeSeconds - 1800) / 5400); // 5400s = 90 mins spread
    const points = Math.max(0, 25 * (1 - penalty));
    score += points;
    
    if (driveTimeSeconds < 1800) reasons.push('binnen half uur rijden');
    else if (driveTimeSeconds < 3600) reasons.push('binnen 1 uur rijden');
  } else {
    // Fallback if geocoding/routing failed
    const near = nearness(candidate.werkgebied, request.postcode);
    score += near * 25;
    if (near > 0.9) reasons.push('rijdt hier');
  }

  if (candidate.online) {
    score += 15;
    reasons.push('nu aan het werk');
  }

  if (candidate.acceptRate != null) {
    score += candidate.acceptRate * 10;
    if (candidate.acceptRate > 0.8) reasons.push('neemt bijna alles aan');
  } else {
    // A new technician is neither punished nor favoured; they sit mid-table
    // until they have a record, otherwise nobody new ever gets a first job.
    score += 5;
  }

  // A technician already holding work in this window can still take it, but is
  // the last choice within their tier.
  score -= candidate.busyInSlot * 12;
  if (candidate.busyInSlot) reasons.push(`heeft al ${candidate.busyInSlot} klus(sen) in dit blok`);

  return { score: Math.round(score * 100) / 100, reason: reasons.join(' · ') || 'voldoet' };
}

/**
 * The offer plan for one job.
 *
 * Premium sees it first, then Pro, then Starter — but a tier's head start is a
 * head start, not an exclusive: when the window closes the job widens rather
 * than dying, so a premium technician who is under a dashboard does not block
 * everyone else.
 */
export async function planDispatch(candidates: Candidate[], request: DispatchRequest): Promise<DispatchPlan> {
  const rejected: Rejection[] = [];
  const passed: Candidate[] = [];

  for (const candidate of candidates) {
    if (!coversCar(candidate.coverage, request.car, request.scenario)) {
      rejected.push({ id: candidate.id, name: candidate.name, gate: 'kan_auto_niet' });
      continue;
    }
    if (request.postcode && candidate.werkgebied.length) {
      const covers = candidate.werkgebied.some((range) => coversPostcode(range, request.postcode));
      if (!covers) {
        rejected.push({ id: candidate.id, name: candidate.name, gate: 'buiten_gebied' });
        continue;
      }
    }
    passed.push(candidate);
  }

  if (!passed.length) return { offers: [], rejected, empty: true };

  // Resolve drive times for those who passed
  let driveTimes: (number | null)[] = passed.map(() => null);
  if (request.lat && request.lng) {
    const { getDriveTimes } = await import('@/lib/googleMaps');
    const origins = passed.map(c => ({
      lat: c.base_lat ?? request.lat!, 
      lng: c.base_lng ?? request.lng!
    }));
    
    // Batch fetch from Maps API
    const results = await getDriveTimes(origins, { lat: request.lat, lng: request.lng });
    driveTimes = results.map(r => r ? r.durationSeconds : null);
  }

  const scored = passed
    .map((candidate, idx) => ({ candidate, ...scoreOf(candidate, request, driveTimes[idx]) }))
    .sort((a, b) => b.score - a.score);

  /* Waves, in tier order. A tier with nobody in it costs no time. */
  const ORDER: Tier[] = ['premium', 'pro', 'starter'];
  const offers: Offer[] = [];
  let opensAfter = 0;
  let rank = 0;

  for (const tier of ORDER) {
    const wave = scored.filter((s) => s.candidate.tier === tier);
    if (!wave.length) continue;

    for (const entry of wave) {
      offers.push({
        technicianId: entry.candidate.id,
        name: entry.candidate.name,
        tier,
        rank: rank++,
        score: entry.score,
        reason: entry.reason,
        opensAfter,
        expiresAfter: opensAfter + ANSWER_WINDOW,
      });
    }

    // The next tier waits out this one's head start, then joins in.
    opensAfter += TIER_TERMS[tier].prioritySeconds;
  }

  return { offers, rejected, empty: false };
}

/** Which offers are open right now, `seconds` after the job was dispatched. */
export function openAt(plan: DispatchPlan, seconds: number): Offer[] {
  return plan.offers.filter((o) => seconds >= o.opensAfter && seconds < o.expiresAfter);
}
