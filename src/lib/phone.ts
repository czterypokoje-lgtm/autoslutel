/**
 * One phone normaliser, so two parts of the CRM cannot disagree about whether
 * "06 11 75 12 31" and "+31611751231" are the same person.
 *
 * Lifted out of api/leads/route.ts, which had the only copy. The conversations
 * console needs the identical rule to match a call against the lead it came
 * from — a second, slightly different implementation is how a customer ends up
 * with two records that never join.
 */
export function toE164NL(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+31')) return `+31${digits.slice(3).replace(/^0/, '')}`;
  if (digits.startsWith('0031')) return `+31${digits.slice(4).replace(/^0/, '')}`;
  if (digits.startsWith('06') || digits.startsWith('0')) return `+31${digits.slice(1)}`;
  if (digits.startsWith('31')) return `+31${digits.slice(2)}`;
  /* Already international and not Dutch — keep it rather than forcing +31
     onto a German number, which is exactly the caller this agent gets. */
  if (digits.startsWith('+')) return digits;
  return null;
}
