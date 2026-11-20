import { createHash } from 'node:crypto';

type Recipient = {
  address: string;
  consent?: { channel: string; scope: string; source: string; at: string; withdrawnAt?: string };
  suppressed?: boolean;
};

export function campaignAudience(recipients: Recipient[], now: Date) {
  const groups = new Map<string, Recipient[]>();
  for (const recipient of recipients) {
    const address = recipient.address.trim().toLowerCase();
    groups.set(address, [...(groups.get(address) ?? []), recipient]);
  }
  return Array.from(groups, ([address, rows]) => {
    const blocked = rows.some((row) => row.suppressed || row.consent?.withdrawnAt);
    const consent = rows.some(({ consent }) => consent?.channel === 'email' && consent.scope === 'marketing' &&
      !!consent.source.trim() && Number.isFinite(Date.parse(consent.at)) && Date.parse(consent.at) <= now.getTime());
    const reason = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? 'invalid_address' :
      blocked ? 'opted_out_or_suppressed' : consent ? null : 'no_documented_consent';
    return { address, reason };
  });
}

export function campaignFingerprint(draft: { id: string; subject: string; body: string; sender: string }, addresses: string[]) {
  return createHash('sha256').update(JSON.stringify([draft.id, draft.subject, draft.body, draft.sender, [...addresses].sort()])).digest('hex');
}

export function simulateCampaign(
  draft: Parameters<typeof campaignFingerprint>[0],
  approval: { fingerprint: string; approvedAudience: string[] },
  currentRecipients: Recipient[],
  previousDeliveries: ReadonlySet<string>,
  now: Date,
) {
  if (campaignFingerprint(draft, approval.approvedAudience) !== approval.fingerprint) return { reason: 'approval_required', outcomes: [] };
  const current = new Map(campaignAudience(currentRecipients, now).map((row) => [row.address, row.reason]));
  const outcomes = [...new Set(approval.approvedAudience)].map((address) => ({
    address,
    status: previousDeliveries.has(address) ? 'already_sent' :
      !current.has(address) ? 'no_documented_consent' : current.get(address) ?? 'simulated',
  }));
  return { reason: null, outcomes };
}
