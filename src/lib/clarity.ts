/**
 * Tags the visitor's current Microsoft Clarity session with this lead's id,
 * so the office can find the actual recording of what someone did right
 * before they became a lead — Clarity → Filters → Custom tags → lead_id.
 *
 * Uses the documented custom-tags API (window.clarity("set", key, value));
 * there is no direct "link straight to this session" API in Clarity's
 * client SDK, only this kind of after-the-fact filter.
 * https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api
 *
 * A no-op whenever Clarity itself isn't running — this business's
 * ConsentBanner only loads Clarity after "Statistieken" is accepted, so most
 * sessions will never have it, and that's fine: nothing here is required for
 * a lead to be saved or alerted.
 */
export function tagLeadClaritySession(leadId: string | null | undefined): void {
  if (!leadId || typeof window === 'undefined') return;
  window.clarity?.('set', 'lead_id', leadId);
}
