/**
 * What a technician pays us, and what they get for it.
 *
 * The pitch is not "pay us instead of nothing" — every independent auto
 * locksmith in the country is already buying leads, they just buy them from
 * Google, per click, for a stranger who may be driving a car nobody can do.
 * This is the same money for a booked job at an agreed price.
 *
 * The middle tier is priced at €399 rather than €599 on purpose. At €599 it was
 * never the cheapest option at any revenue: Premium overtook Starter at €7,059
 * a month while Pro did not until €8,557, so by the time Pro made sense Premium
 * already made more sense, and a technician who did the arithmetic would either
 * stay free or jump straight to €1,200. See breakEven() below — the test file
 * asserts that each tier is genuinely the cheapest somewhere.
 *
 * These are the defaults for a *new* agreement. What an existing technician
 * actually pays lives on their own row in technician_subscription, because a
 * subscription is a contract with a person and editing a constant here must
 * never retroactively change what somebody already owes.
 */

export const TIERS = ['starter', 'pro', 'premium'] as const;
export type Tier = (typeof TIERS)[number];

export interface TierTerms {
  label: string;
  /** Per month, excluding VAT. */
  monthlyFee: number;
  /** Taken from the job total. */
  commissionPct: number;
  /**
   * How long this tier sees a matching job before it widens to the next one.
   * Not an exclusive: when the window closes the offer opens up rather than
   * dying, so a premium technician who is driving does not block the job.
   */
  prioritySeconds: number;
  pitch: string;
}

export const TIER_TERMS: Record<Tier, TierTerms> = {
  starter: {
    label: 'Starter',
    monthlyFee: 0,
    commissionPct: 25,
    prioritySeconds: 0,
    pitch: 'Niets vooraf. U betaalt alleen als u werk aanneemt.',
  },
  pro: {
    label: 'Pro',
    monthlyFee: 399,
    commissionPct: 18,
    prioritySeconds: 45,
    pitch: 'Voor wie er een paar klussen per week uit haalt.',
  },
  premium: {
    label: 'Premium',
    monthlyFee: 1200,
    commissionPct: 8,
    prioritySeconds: 90,
    pitch: 'U ziet elke klus in uw gebied als eerste, en betaalt de laagste commissie.',
  },
};

/** What this tier costs at a given monthly revenue through the platform. */
export function monthlyCost(tier: Tier, revenue: number): number {
  const terms = TIER_TERMS[tier];
  return terms.monthlyFee + (terms.commissionPct / 100) * revenue;
}

/** The cheapest tier at a given monthly revenue. */
export function bestTier(revenue: number): Tier {
  return [...TIERS].sort((a, b) => monthlyCost(a, revenue) - monthlyCost(b, revenue))[0];
}

/**
 * The revenue at which `tier` becomes cheaper than `other`, or null when it
 * never does. This is the number a technician actually wants on the page:
 * "Pro is voordeliger vanaf € 5.700 omzet per maand."
 */
export function breakEven(tier: Tier, other: Tier): number | null {
  const a = TIER_TERMS[tier];
  const b = TIER_TERMS[other];
  const feeGap = a.monthlyFee - b.monthlyFee;
  const pctGap = (b.commissionPct - a.commissionPct) / 100;
  if (pctGap <= 0) return null; // never catches up
  const revenue = feeGap / pctGap;
  return revenue > 0 ? Math.round(revenue) : 0;
}

/**
 * What we take from one job, given the terms on the technician's own row.
 *
 * Always computed from the stored percentage rather than the tier, so a job
 * done last month settles at last month's deal.
 */
export function commissionOn(total: number, commissionPct: number): number {
  return Math.round(total * (commissionPct / 100) * 100) / 100;
}

/**
 * What this technician would have paid Google for the same work.
 *
 * A deliberately conservative stand-in until real figures exist: Dutch
 * auto-locksmith search terms run to a few euro a click and only a fraction of
 * clicks become a booking. It is shown as an estimate, labelled as one, and it
 * is the whole renewal conversation — a technician who cannot see what the
 * subscription bought them will not renew it.
 */
export const ADS_COST_PER_JOB = 85;

export function adsComparison(jobs: number, paid: number) {
  const ads = jobs * ADS_COST_PER_JOB;
  return { ads, paid, saved: Math.round((ads - paid) * 100) / 100 };
}
