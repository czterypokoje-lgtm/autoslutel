import { redirect } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  buildOffice,
  heartbeatStatus,
  type EventRow,
  type HeartbeatRow,
  type OutboxRow,
} from '@/lib/jobRoomLive';

/**
 * Everything the live view and the office view read, in one place.
 *
 * Read-only, through the signed-in person's own session: row level security
 * lets only the owner read these tables, so a non-owner is sent away rather
 * than shown an empty screen that looks like "nothing is happening".
 * The clock is read here, once per request, not in a component body.
 */
export async function loadLive(returnTo: string) {
  const user = await requireOfficeUser(returnTo);
  if (user.role !== 'owner') redirect('/admin/geen-toegang');

  const supabase = await createSupabaseServerClient();
  const now = new Date();

  const [events, outbox, beats] = await Promise.all([
    supabase
      .from('job_events')
      .select('id, created_at, job_room_id, direction, channel, actor, kind, body, status')
      .order('created_at', { ascending: false })
      .limit(150),
    supabase
      .from('job_outbox')
      .select('id, job_room_id, audience, kind, tier, state, created_at')
      .order('created_at', { ascending: false })
      .limit(150),
    supabase.from('job_heartbeats').select('service, beat_at, alerted_at'),
  ]);

  const eventRows = (events.data ?? []) as EventRow[];
  const outboxRows = (outbox.data ?? []) as OutboxRow[];

  const roomIds = [
    ...new Set([...eventRows.map((e) => e.job_room_id), ...outboxRows.map((o) => o.job_room_id)].filter(Boolean)),
  ] as string[];
  const rooms = roomIds.length
    ? await supabase.from('job_rooms').select('id, code').in('id', roomIds)
    : { data: [] as { id: string; code: number }[] };
  const codeOf = new Map((rooms.data ?? []).map((r) => [r.id, `J-${r.code}`]));

  const expected = (process.env.JOBROOM_HEARTBEAT_SERVICES ?? 'transport')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const heartbeats = heartbeatStatus((beats.data ?? []) as HeartbeatRow[], expected, now);
  const desks = buildOffice(eventRows, outboxRows, heartbeats, now);

  const waiting = outboxRows.filter((o) => o.state === 'proposed');
  const waitingOver15 = waiting.filter((o) => now.getTime() - Date.parse(o.created_at) > 15 * 60_000);

  return {
    nowMs: now.getTime(),
    events: eventRows,
    outbox: outboxRows,
    heartbeats,
    desks,
    codeOf: (id: string | null) => (id ? (codeOf.get(id) ?? '—') : '—'),
    waiting: waiting.length,
    waitingOver15: waitingOver15.length,
    blockedToday: eventRows.filter((e) => e.status === 'blocked' && now.getTime() - Date.parse(e.created_at) < 86_400_000).length,
    readFailed: Boolean(events.error || outbox.error),
  };
}

const TIME = new Intl.DateTimeFormat('nl-NL', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'Europe/Amsterdam',
});
export const fmtTime = (iso: string) => TIME.format(new Date(iso));
