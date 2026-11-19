import { maskPhones, maskSensitive } from './jobRoomGuard.ts';

/**
 * Live view and office view over the job room (slice S8).
 *
 * Pure functions: rows in, a picture out. No database, no clock of their own
 * (the caller passes `now`), so every rule here is testable. The picture is
 * never the only proof: each desk links to the exact events behind it.
 */

export type DeskKey =
  | 'intake'
  | 'translator'
  | 'quote'
  | 'dispatch'
  | 'invoice'
  | 'reports'
  | 'doctor'
  | 'transport';

export const DESKS: ReadonlyArray<{ key: DeskKey; label: string }> = [
  { key: 'intake', label: 'Intake' },
  { key: 'translator', label: 'Vertaler' },
  { key: 'quote', label: 'Offerterelais' },
  { key: 'dispatch', label: 'Monteurs uitzetten' },
  { key: 'invoice', label: 'Factuur' },
  { key: 'reports', label: 'Rapporten' },
  { key: 'doctor', label: 'Doctor' },
  { key: 'transport', label: 'WhatsApp-verbinding' },
];

export interface EventRow {
  id: string;
  created_at: string;
  job_room_id: string | null;
  direction: string;
  channel: string;
  actor: string;
  kind: string;
  body: string | null;
  status: string;
}

export interface OutboxRow {
  id: string;
  job_room_id: string;
  audience: string;
  kind: string;
  tier: number;
  state: string;
  created_at: string;
}

export interface HeartbeatRow {
  service: string;
  beat_at: string;
  alerted_at?: string | null;
}

const MINUTE = 60_000;

/** Which desk an event belongs to. Inbound customer messages are the intake's. */
export function deskOf(e: Pick<EventRow, 'kind' | 'actor' | 'direction'>): DeskKey | null {
  const k = e.kind.toLowerCase();
  if (k.startsWith('translat')) return 'translator';
  if (k.startsWith('invoice')) return 'invoice';
  if (k.startsWith('report')) return 'reports';
  if (k.startsWith('doctor')) return 'doctor';
  if (k.startsWith('quote') || k.startsWith('relay')) return 'quote';
  if (k.startsWith('offer') || k.startsWith('tech')) return 'dispatch';
  if (e.direction === 'in' && k === 'message') return 'intake';
  if (e.actor === 'transport' || e.actor === 'wacli') return 'transport';
  return null;
}

/** The desk a waiting outbox row is held at. */
export function outboxDeskOf(o: Pick<OutboxRow, 'kind' | 'audience'>): DeskKey {
  if (o.kind.startsWith('invoice')) return 'invoice';
  if (o.audience === 'technician') return 'dispatch';
  return 'quote';
}

export { maskPhones };

const amsterdamHour = (now: Date) =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hour: '2-digit', hour12: false }).format(now)) % 24;

/** The alarm is for the working day (07:00 to 22:00 Amsterdam); at night a quiet service is normal. */
export const isDaytime = (now: Date) => {
  const h = amsterdamHour(now);
  return h >= 7 && h < 22;
};

export interface ServiceBeat {
  service: string;
  ageMinutes: number | null;
  stale: boolean;
}

/**
 * A service is stale when its newest beat is older than `staleMinutes` during
 * the day. An expected service with no beat at all is stale too: silence is
 * the thing the alarm exists for.
 */
export function heartbeatStatus(
  rows: HeartbeatRow[],
  expected: string[],
  now: Date,
  staleMinutes = 30
): ServiceBeat[] {
  const by = new Map(rows.map((r) => [r.service, r]));
  const services = [...new Set([...expected, ...rows.map((r) => r.service)])];
  const day = isDaytime(now);
  return services.map((service) => {
    const row = by.get(service);
    const age = row ? Math.max(0, Math.round((now.getTime() - Date.parse(row.beat_at)) / MINUTE)) : null;
    const isExpected = expected.includes(service);
    return { service, ageMinutes: age, stale: isExpected && day && (age === null || age > staleMinutes) };
  });
}

export interface DeskView {
  key: DeskKey;
  label: string;
  state: 'working' | 'waiting' | 'idle' | 'error';
  jobRoomId: string | null;
  lastAction: string | null;
  lastAt: string | null;
  waiting: number;
}

/**
 * One desk per worker. error beats waiting beats working beats idle, so the
 * worst thing is always the one you see: a red desk the moment its heartbeat is
 * late or its last action was refused or failed.
 */
export function buildOffice(
  events: EventRow[],
  outbox: OutboxRow[],
  beats: ServiceBeat[],
  now: Date
): DeskView[] {
  const staleDesks = new Set(beats.filter((b) => b.stale).map((b) => b.service));
  return DESKS.map(({ key, label }) => {
    const mine = events.filter((e) => deskOf(e) === key).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const last = mine[0];
    const waiting = outbox.filter((o) => o.state === 'proposed' && outboxDeskOf(o) === key).length;
    const recentBad = mine.some(
      (e) => ['error', 'blocked'].includes(e.status) && now.getTime() - Date.parse(e.created_at) < 60 * MINUTE
    );
    const working = last ? now.getTime() - Date.parse(last.created_at) < 2 * MINUTE : false;
    const state: DeskView['state'] =
      staleDesks.has(key) || recentBad ? 'error' : waiting > 0 ? 'waiting' : working ? 'working' : 'idle';
    return {
      key,
      label,
      state,
      jobRoomId: last?.job_room_id ?? null,
      lastAction: last ? `${last.direction === 'in' ? '←' : last.direction === 'out' ? '→' : '·'} ${last.kind}` : null,
      lastAt: last?.created_at ?? null,
      waiting,
    };
  });
}

/** One feed line: what happened, with any number masked. The exact text stays in the database. */
export function feedText(e: Pick<EventRow, 'body'>, max = 300): string {
  const text = maskSensitive(e.body ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
