/**
 * How long the AI agents' conversations are kept (agent_conversations).
 *
 * Pure, no database: tests/unit/privacy-retention.test.mjs runs it under plain
 * Node, and /api/cron/privacy-retention applies it nightly.
 *
 * The periods are the ones the privacy policy states (shop /privacybeleid 4b,
 * docs/webshop-agent-compliance.md): long enough to handle a complaint or a
 * warranty claim about the conversation, no longer.
 *   webchat and unknown   6 months  (the webshop assistant)
 *   phone, WhatsApp, SMS  12 months (service calls: a job, an invoice and a
 *                                    dispute can follow months later)
 *   extern                 0        (other brands' agents in the same
 *                                    ElevenLabs workspace: not our customers,
 *                                    no purpose to keep them)
 * A channel not listed here falls under the shortest real period, so a new
 * channel is never kept forever by omission.
 */

export const RETENTION_DAYS: Record<string, number> = {
  webchat: 183,
  unknown: 183,
  phone: 365,
  whatsapp: 365,
  sms: 365,
  extern: 0,
};
export const DEFAULT_RETENTION_DAYS = 183;

export interface PurgeRule { channels: string[] | null; before: string }

/**
 * One rule per period, oldest-kept first. `channels: null` is "every channel
 * not named in another rule".
 */
export function purgeRules(now: Date): PurgeRule[] {
  const byDays = new Map<number, string[]>();
  for (const [channel, days] of Object.entries(RETENTION_DAYS)) {
    byDays.set(days, [...(byDays.get(days) ?? []), channel]);
  }
  const cutoff = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
  const rules: PurgeRule[] = [...byDays.entries()].map(([days, channels]) => ({ channels, before: cutoff(days) }));
  rules.push({ channels: null, before: cutoff(DEFAULT_RETENTION_DAYS) });
  return rules;
}
