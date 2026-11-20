import type { Conversation } from '../ConversationConsole';

/* Presentation helpers for the Studio Chat port; `now` comes from the server so server and client agree. */
export type Group = 'Vandaag' | 'Gisteren' | 'Eerder';

export const OUTCOME_LABEL: Record<string, string> = { success: 'Gelukt', failure: 'Mislukt', unknown: 'Onbekend' };
export const CHANNEL_LABEL: Record<string, string> = { phone: 'Telefoon', whatsapp: 'WhatsApp', sms: 'SMS', email: 'E-mail', form: 'Websiteformulier', unknown: 'Onbekend' };

export const displayName = (c: Conversation) => c.lead?.name || c.thread?.name || c.phone || c.thread?.email || 'Onbekend nummer';

export function groupOf(createdAt: string, now: number): Group {
  // Compare calendar dates in Europe/Amsterdam, not process-local time — the server runs UTC, the browser Amsterdam.
  const key = new Date(createdAt).toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam' });
  if (key === new Date(now).toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam' })) return 'Vandaag';
  if (key === new Date(now - 86_400_000).toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam' })) return 'Gisteren';
  return 'Eerder';
}

export function shortTime(iso: string, now: number) {
  const d = new Date(iso);
  const min = Math.max(0, Math.round((now - d.getTime()) / 60_000));
  if (min < 1) return 'Zojuist';
  if (min < 60) return `${min}m`;
  if (min < 24 * 60) return `${Math.round(min / 60)}u`;
  if (min < 7 * 24 * 60) return `${Math.round(min / (24 * 60))}d`;
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

export const longDate = (iso: string) => new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
export const clock = (iso: string) => new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

export function duration(secs: number | null) {
  if (!secs) return null;
  const m = Math.floor(secs / 60), s = secs % 60;
  return m ? `${m} min ${s ? `${s} s` : ''}`.trim() : `${s} s`;
}

/** First sentence of the summary, or the outcome: what the list shows as the "subject". */
export function subjectOf(c: Conversation) {
  if (c.thread?.subject) return c.thread.subject;
  const first = c.summary?.split(/(?<=[.!?])\s/)[0]?.trim();
  return first || (c.outcome ? OUTCOME_LABEL[c.outcome] ?? c.outcome : 'Gesprek');
}

export function previewOf(c: Conversation) {
  const lastUser = [...c.turns].reverse().find((t) => t.role === 'user');
  return lastUser?.message ?? c.summary ?? '';
}
