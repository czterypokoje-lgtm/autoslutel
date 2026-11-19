/**
 * Checks for the live view and the stop alarm (S8): `node scripts/check-joblive.mts`.
 * Synthetic rows and a stand-in database; the Telegram send is a recording stub.
 */
import assert from 'node:assert/strict';
import {
  buildOffice, deskOf, feedText, heartbeatStatus, isDaytime, maskPhones, outboxDeskOf,
  type EventRow, type OutboxRow,
} from '../src/lib/jobRoomLive.ts';
import { checkHeartbeats, recordHeartbeat } from '../src/lib/opsJobRoom.ts';

type Row = Record<string, any>;

// --- Numbers never show in full ---
assert.equal(maskPhones('Bel +31 6 1234 5678 nu'), 'Bel ••••5678 nu');
assert.equal(maskPhones('06-12345678'), '••••5678');
assert.equal(maskPhones('+4915100000001'), '••••0001');
assert.equal(maskPhones('Totaal € 149,50 op 2026-11-08'), 'Totaal € 149,50 op 2026-11-08', 'prices and dates stay');
assert.equal(feedText({ body: 'Mijn nummer is 0612345678, graag bellen' }).includes('0612345678'), false);
assert.equal(feedText({ body: 'x'.repeat(500) }).length, 301);

// --- Desks ---
const ev = (over: Partial<EventRow> & { created_at: string }): EventRow => ({
  id: String(Math.random()), job_room_id: 'room-1', direction: 'in', channel: 'whatsapp', actor: 'transport',
  kind: 'message', body: null, status: 'recorded', ...over,
});
assert.equal(deskOf({ kind: 'message', actor: 'transport', direction: 'in' }), 'intake');
assert.equal(deskOf({ kind: 'send.result', actor: 'transport', direction: 'out' }), 'transport');
assert.equal(deskOf({ kind: 'invoice.proposed', actor: 'x', direction: 'internal' }), 'invoice');
assert.equal(deskOf({ kind: 'translate.draft', actor: 'x', direction: 'internal' }), 'translator');
assert.equal(deskOf({ kind: 'quote.in', actor: 'x', direction: 'in' }), 'quote');
assert.equal(deskOf({ kind: 'offer.sent', actor: 'x', direction: 'out' }), 'dispatch');
assert.equal(deskOf({ kind: 'weird', actor: 'x', direction: 'internal' }), null);
assert.equal(outboxDeskOf({ kind: 'invoice:I-00001:abc', audience: 'self_started' }), 'invoice');
assert.equal(outboxDeskOf({ kind: 'offer', audience: 'technician' }), 'dispatch');

// --- Clock: the alarm is for the working day, Amsterdam time ---
assert.equal(isDaytime(new Date('2026-11-08T10:00:00Z')), true); // 11:00
assert.equal(isDaytime(new Date('2026-11-08T23:30:00Z')), false); // 00:30
assert.equal(isDaytime(new Date('2026-11-08T05:59:00Z')), false); // 06:59
assert.equal(isDaytime(new Date('2026-11-08T06:00:00Z')), true); // 07:00

const noon = new Date('2026-11-08T11:00:00Z');
const minsAgo = (m: number, from = noon) => new Date(from.getTime() - m * 60_000).toISOString();
let beats = heartbeatStatus([{ service: 'transport', beat_at: minsAgo(5) }], ['transport'], noon);
assert.equal(beats[0].stale, false);
beats = heartbeatStatus([{ service: 'transport', beat_at: minsAgo(45) }], ['transport'], noon);
assert.equal(beats[0].stale, true);
assert.equal(beats[0].ageMinutes, 45);
beats = heartbeatStatus([], ['transport'], noon);
assert.equal(beats[0].stale, true, 'an expected service that never beat is stale');
assert.equal(heartbeatStatus([], ['transport'], new Date('2026-11-08T23:30:00Z'))[0].stale, false, 'quiet at night is normal');
assert.equal(heartbeatStatus([{ service: 'extra', beat_at: minsAgo(300) }], ['transport'], noon).find((b) => b.service === 'extra')!.stale, false);

// --- Office: the worst thing is the one you see ---
const fresh = heartbeatStatus([{ service: 'transport', beat_at: minsAgo(1) }], ['transport'], noon);
const events = [
  ev({ created_at: minsAgo(0.5), kind: 'message' }),
  ev({ created_at: minsAgo(30), kind: 'translate.draft', actor: 'x', direction: 'internal', status: 'error' }),
  ev({ created_at: minsAgo(200), kind: 'report.day', actor: 'x', direction: 'internal' }),
];
const outbox: OutboxRow[] = [
  { id: 'o1', job_room_id: 'room-1', audience: 'self_started', kind: 'invoice:I-00001:abc', tier: 2, state: 'proposed', created_at: minsAgo(20) },
];
let desks = buildOffice(events, outbox, fresh, noon);
const desk = (k: string) => desks.find((d) => d.key === k)!;
assert.equal(desk('intake').state, 'working');
assert.equal(desk('translator').state, 'error', 'a failed action in the last hour');
assert.equal(desk('invoice').state, 'waiting');
assert.equal(desk('invoice').waiting, 1);
assert.equal(desk('reports').state, 'idle');
assert.equal(desk('doctor').lastAction, null);
assert.equal(desk('intake').lastAction, '← message');
assert.equal(desks.length, 8);
desks = buildOffice(events, outbox, heartbeatStatus([{ service: 'transport', beat_at: minsAgo(50) }], ['transport'], noon), noon);
assert.equal(desk('transport').state, 'error', 'a late heartbeat turns its desk red');

// --- Heartbeat routes' logic, with an alert that only records ---
const clock = { now: new Date() };
function stubDb() {
  const t: Row[] = [];
  const from = () => {
    let op = 'select'; let payload: Row = {}; const f: ((r: Row) => boolean)[] = []; let one = false;
    const b: any = {
      select: () => b,
      insert: (p: Row) => ((op = 'insert'), (payload = p), b),
      update: (p: Row) => ((op = 'update'), (payload = p), b),
      upsert: (p: Row) => ((op = 'upsert'), (payload = p), b),
      eq: (c: string, v: unknown) => (f.push((r) => r[c] === v), b),
      maybeSingle: () => ((one = true), b),
      then: (res: (v: unknown) => void) => {
        if (op === 'upsert') {
          const ex = t.find((r) => r.service === payload.service);
          if (ex) Object.assign(ex, payload); else t.push({ ...payload });
          return res({ data: null, error: null });
        }
        if (op === 'insert') { t.push({ ...payload }); return res({ data: null, error: null }); }
        const hit = t.filter((r) => f.every((x) => x(r)));
        if (op === 'update') { hit.forEach((r) => Object.assign(r, payload)); return res({ data: null, error: null }); }
        return res({ data: one ? (hit[0] ?? null) : hit, error: null });
      },
    };
    return b;
  };
  // job_heartbeat_claim_alert as the database runs it: one statement, so only one caller wins.
  const rpc = async (name: string, args: Row) => {
    if (name !== 'job_heartbeat_claim_alert') return { data: null, error: { message: 'unknown rpc' } };
    let row = t.find((r) => r.service === args.p_service);
    if (!row) t.push((row = { service: args.p_service, beat_at: '1970-01-01T00:00:00Z', alerted_at: null }));
    const now = clock.now;
    if (row.alerted_at && Date.parse(row.alerted_at) > now.getTime() - args.p_minutes * 60_000) return { data: false, error: null };
    row.alerted_at = now.toISOString();
    return { data: true, error: null };
  };
  return { db: { from, rpc } as any, t };
}
const { db, t } = stubDb();
const sent: string[] = [];
const notify = async (text: string) => void sent.push(text);
const opts = (over: Row = {}) => {
  const o = { expected: ['transport'], alert: true, alertsOn: true, notify, now: noon, ...over };
  clock.now = o.now as Date;
  return o;
};

assert.equal((await recordHeartbeat(db, { service: 'Bad Name' })).status, 400);
assert.equal((await recordHeartbeat(db, { service: 'transport', note: 'ok' })).status, 200);
assert.equal(t.length, 1);
let r = await checkHeartbeats(db, opts({ now: new Date(Date.now()) }));
assert.deepEqual(r.body.stale, [], 'just beat: not stale (daytime or not)');
assert.equal(sent.length, 0);

t[0].beat_at = minsAgo(45);
r = await checkHeartbeats(db, opts({ alertsOn: false }));
assert.deepEqual(r.body.stale, ['transport']);
assert.equal(sent.length, 0, 'alerts switched off: shadow, nothing sent');
r = await checkHeartbeats(db, opts({ alert: false }));
assert.equal(sent.length, 0, 'a plain check never alerts');
r = await checkHeartbeats(db, opts());
assert.equal(sent.length, 1);
assert.match(sent[0], /transport.*45 minuten/);
assert.equal(/\d{7,}/.test(sent[0]), false, 'no numbers in the alarm');
r = await checkHeartbeats(db, opts({ now: new Date(noon.getTime() + 20 * 60_000) }));
assert.equal(sent.length, 1, 'one alert per hour, not one per minute');
r = await checkHeartbeats(db, opts({ now: new Date(noon.getTime() + 70 * 60_000) }));
assert.equal(sent.length, 2, 'still silent an hour later: alert again');
await recordHeartbeat(db, { service: 'transport' });
assert.equal(t[0].alerted_at, null, 'a beat clears the alert');

const empty = stubDb();
r = await checkHeartbeats(empty.db, opts());
assert.equal(sent.length, 3, 'never beaten counts as silent');
assert.match(sent[2], /nog nooit/);
assert.equal(empty.t.length, 1, 'a placeholder row keeps it from repeating');
r = await checkHeartbeats(empty.db, opts());
assert.equal(sent.length, 3);

// Two checks at the same moment: one alert, not two
{
  const racing = stubDb();
  const before = sent.length;
  await Promise.all([checkHeartbeats(racing.db, opts()), checkHeartbeats(racing.db, opts())]);
  assert.equal(sent.length - before, 1, 'overlapping checks cannot double-alert');
  // A failing Telegram send is reported, not thrown, and not retried within the hour
  const failing = stubDb();
  const res = await checkHeartbeats(failing.db, opts({ notify: async () => { throw new Error('telegram down'); } }));
  assert.deepEqual(res.body.failed, ['transport']);
}

console.log('check-joblive: all passed');
