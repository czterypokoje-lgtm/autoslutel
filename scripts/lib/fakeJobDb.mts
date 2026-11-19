/**
 * An in-memory stand-in for the Supabase client, for the job room checks.
 *
 * It models what the checks rely on: unique keys (a duplicate insert answers
 * 23505), defaults, the shadow rule on job_outbox, the two SQL functions the
 * code calls. Every statement is atomic, like a single SQL statement; with
 * `jitter` it also yields to other tasks between statements, so parallel
 * callers really interleave and check-then-act races show up.
 *
 * What it cannot model (triggers, row locks, RLS, real transactions) is
 * checked against a real Postgres in check-jobroom-sql.mts.
 */
import { randomUUID } from 'node:crypto';

export type Row = Record<string, any>;

const UNIQUE: Record<string, string[][]> = {
  contacts: [['phone_e164']],
  job_rooms: [['lead_id'], ['job_id']],
  job_events: [['channel', 'provider_message_id'], ['event_key']],
  job_outbox: [['dedupe_key']],
  job_approvals: [['outbox_id']],
  contact_aliases: [['contact_id', 'alias_folded']],
  job_parties: [['job_room_id', 'contact_id', 'role']],
};
const SEQ: Record<string, string> = { job_rooms: 'code', job_approvals: 'code' };

export function fakeDb(opts: { jitter?: boolean } = {}) {
  const tables: Record<string, Row[]> = {};
  const counters: Record<string, number> = {};
  const rows = (t: string) => (tables[t] ??= []);
  const yieldNow = () => (opts.jitter ? new Promise<void>((r) => setImmediate(r)) : Promise.resolve());

  const from = (table: string) => {
    let op: 'select' | 'insert' | 'update' | 'upsert' = 'select';
    let conflict = '';
    let payload: Row = {};
    const filters: ((r: Row) => boolean)[] = [];
    let mode: 'many' | 'single' | 'maybe' = 'many';
    let max = Infinity;

    const run = () => {
      if (op === 'upsert') {
        const existing = rows(table).find((r) => r[conflict] === payload[conflict]);
        if (existing) { Object.assign(existing, payload); return { data: [existing], error: null }; }
        op = 'insert';
      }
      if (op === 'insert') {
        const defaults: Row = table === 'contacts' ? { active: true } : {};
        const row: Row = { id: randomUUID(), created_at: new Date().toISOString(), ...defaults, ...payload };
        const seq = SEQ[table];
        if (seq) row[seq] = counters[table] = (counters[table] ?? 0) + 1;
        for (const cols of UNIQUE[table] ?? []) {
          if (cols.some((c) => row[c] == null)) continue;
          if (rows(table).some((r) => cols.every((c) => r[c] === row[c]))) {
            return { data: null, error: { code: '23505', message: 'duplicate' } };
          }
        }
        if (table === 'job_outbox' && row.shadow && ['claimed', 'sent', 'unknown'].includes(row.state)) {
          return { data: null, error: { code: '23514', message: 'shadow never sends' } };
        }
        rows(table).push(row);
        return { data: [row], error: null };
      }
      const hit = rows(table).filter((r) => filters.every((f) => f(r)));
      if (op === 'update') {
        hit.forEach((r) => Object.assign(r, payload));
        return { data: hit, error: null };
      }
      return { data: hit.slice(0, max), error: null };
    };

    const b: any = {
      select: () => b,
      insert: (p: Row) => ((op = 'insert'), (payload = p), b),
      update: (p: Row) => ((op = 'update'), (payload = p), b),
      upsert: (p: Row, o: { onConflict: string }) => ((op = 'upsert'), (payload = p), (conflict = o.onConflict), b),
      eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), b),
      in: (c: string, v: unknown[]) => (filters.push((r) => v.includes(r[c])), b),
      is: (c: string, v: unknown) => (filters.push((r) => (r[c] ?? null) === v), b),
      order: () => b,
      limit: (n: number) => ((max = n), b),
      single: () => ((mode = 'single'), b),
      maybeSingle: () => ((mode = 'maybe'), b),
      then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
        yieldNow().then(() => {
          try {
            const res = run();
            if (res.error) return resolve(res);
            if (mode === 'many') return resolve(res);
            const first = res.data?.[0] ?? null;
            if (mode === 'single' && !first) return resolve({ data: null, error: { code: 'PGRST116', message: 'none' } });
            return resolve({ data: first, error: null });
          } catch (e) {
            reject(e);
          }
        });
      },
    };
    return b;
  };

  const flags = { failNextRpc: false };
  const clock = { now: () => new Date() };

  // The SQL functions, as the database runs them: each call is one atomic step.
  const rpc = async (name: string, args: Row) => {
    await yieldNow();
    if (name === 'job_decide_approval') {
      if (flags.failNextRpc) { flags.failNextRpc = false; return { data: null, error: { message: 'boom' } }; }
      const o = rows('job_outbox').find((r) => r.id === args.p_outbox_id);
      if (!o) return { data: null, error: { message: 'not_found' } };
      if (o.state !== 'proposed') return { data: null, error: { message: 'already_decided' } };
      if (o.text_hash !== args.p_text_hash) return { data: null, error: { message: 'hash_changed' } };
      const code = (counters.job_approvals = (counters.job_approvals ?? 0) + 1);
      rows('job_approvals').push({ id: randomUUID(), code, outbox_id: o.id, decision: args.p_decision, decided_by: args.p_decided_by, decided_via: args.p_decided_via });
      o.state = args.p_decision === 'approved' ? 'approved' : 'cancelled';
      return { data: [{ code, new_state: o.state }], error: null };
    }
    if (name === 'job_heartbeat_claim_alert') {
      let row = rows('job_heartbeats').find((r) => r.service === args.p_service);
      if (!row) rows('job_heartbeats').push((row = { service: args.p_service, beat_at: '1970-01-01T00:00:00Z', alerted_at: null }));
      const now = clock.now();
      if (row.alerted_at && Date.parse(row.alerted_at) > now.getTime() - args.p_minutes * 60_000) return { data: false, error: null };
      row.alerted_at = now.toISOString();
      return { data: true, error: null };
    }
    return { data: null, error: { message: 'unknown rpc' } };
  };

  return { db: { from, rpc } as any, tables, rows, flags, clock };
}
