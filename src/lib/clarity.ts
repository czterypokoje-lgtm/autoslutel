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

/**
 * Tags the visitor's Clarity session with the ad click id that brought them,
 * so a flagged address on /admin/klikfraude leads to watchable footage:
 * Clarity → Filters → Custom tags → ad_click.
 *
 * WHY THIS IS WORTH THE FIFTEEN LINES. The click-fraud verdict in
 * src/lib/clickFraud.ts is nine numbers in a table, and acting on it means
 * putting an address into a live campaign. Excluding a real customer is the
 * expensive, invisible mistake — so being able to watch thirty seconds of
 * what actually happened, before excluding anyone, is what turns the verdict
 * from something trusted into something checked.
 *
 * WHY THE CLICK ID AND NOT THE VISIT ID. The ad_visits row id lives in an
 * httpOnly cookie that this code deliberately cannot read (see
 * src/app/api/ad-visit/route.ts: if a page could learn its own row id, the
 * body could carry one). The click id is already in the URL, already in the
 * row, and already in the evidence export the office pastes into a ticket —
 * so it joins the two systems without disclosing anything new.
 *
 * NEVER TAG THE IP ADDRESS. Clarity anonymises IPs before storing them, on
 * purpose. Pushing ours back in as a custom tag would undo exactly that, and
 * turn a privacy-by-design analytics tool into a second copy of the evidence
 * table. The join happens in the CRM, where the IP already lives under RLS.
 *
 * A no-op when Clarity is not running — the ConsentBanner only loads it after
 * "Statistieken" is accepted, so most sessions never have it. Nothing about
 * recording or judging a visit depends on this.
 */
export function tagAdClickClaritySession(clickId: string | null | undefined): void {
  if (!clickId || typeof window === 'undefined') return;
  window.clarity?.('set', 'ad_click', clickId);
}
