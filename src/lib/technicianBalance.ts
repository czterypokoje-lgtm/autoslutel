/**
 * The technician earnings rule, shared between `mijn-saldo` (their full
 * history) and the `overzicht` dashboard (today's slice of the same number).
 * One formula, so a future change to how commission is applied can't drift
 * between the two screens that both promise the technician the same figure.
 */

export interface BalanceJob {
  final_price: number | string | null;
  quoted_price: number | string | null;
  commission_pct: number | string | null;
}

export interface BalancePayout {
  amount: number | string;
  status: string;
}

/** What was charged, not what was quoted; the agreed commission even at 0%. */
export function priceOf(job: BalanceJob): number {
  return Number(job.final_price ?? job.quoted_price) || 0;
}

export function earnedOn(job: BalanceJob): number {
  return priceOf(job) * ((100 - Number(job.commission_pct ?? 25)) / 100);
}

/** Earned minus whatever has already been paid out or is waiting to be. */
export function computeAvailable(jobs: BalanceJob[], payouts: BalancePayout[]): number {
  const earned = jobs.reduce((total, job) => total + earnedOn(job), 0);
  const paidOut = payouts
    .filter((p) => p.status === 'paid')
    .reduce((total, p) => total + Number(p.amount), 0);
  const pendingOut = payouts
    .filter((p) => p.status === 'pending')
    .reduce((total, p) => total + Number(p.amount), 0);
  return Math.max(0, earned - paidOut - pendingOut);
}
