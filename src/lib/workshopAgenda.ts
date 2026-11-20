import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { amsterdamParts, amsterdamToUtc, amsterdamToday } from '@/lib/amsterdamTime';

/*
 * The KeyForCars workshop calendar: one service for the CRM page and the
 * ElevenLabs Workshop Service agent. Availability and booking rules live in
 * the database (migration 0104: kfc_workshop_free_slots / kfc_workshop_book),
 * so both callers get exactly the same answer and the same conflict guard.
 *
 * Each deployment reads its own Supabase project: the demo its synthetic rows,
 * production its own. Nothing here picks an environment.
 *
 * Callers decide who may call what; these functions use the service-role
 * client because the tables are closed to every other role.
 */

export const WORKSHOP_TZ = 'Europe/Amsterdam';
export const APPOINTMENT_STATUSES = ['gepland', 'bevestigd', 'afgerond', 'geannuleerd', 'no_show'] as const;
export const APPOINTMENT_SOURCES = ['crm', 'telefoon', 'whatsapp'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export type AppointmentSource = (typeof APPOINTMENT_SOURCES)[number];

export interface WorkshopCalendar { id: string; code: string; name: string; capacity: number; color: string; active: boolean; sort: number; technician_id: string | null }
export interface WorkshopService { id: string; code: string; name_nl: string; name_en: string; duration_minutes: number; active: boolean; sort: number }
export interface WorkshopHours { weekday: number; closed: boolean; open_time: string | null; close_time: string | null }
export interface WorkshopClosure { id: string; calendar_id: string | null; starts_at: string; ends_at: string; reason: string | null }
export interface WorkshopAppointment {
  id: string; reference: string; calendar_id: string; service_id: string; starts_at: string; ends_at: string;
  status: AppointmentStatus; source: AppointmentSource; customer_name: string; customer_phone: string | null;
  customer_email: string | null; vehicle_make: string | null; vehicle_model: string | null; vehicle_year: number | null;
  notes: string | null; created_at: string;
}
export interface WorkshopSettings { calendars: WorkshopCalendar[]; services: WorkshopService[]; hours: WorkshopHours[]; closures: WorkshopClosure[] }

export class WorkshopUnavailable extends Error {}

const db = () => createSupabaseAdminClient();

function fail(error: { message: string } | null, what: string): never {
  throw new WorkshopUnavailable(`${what}: ${error?.message ?? 'unknown error'}`);
}

/* ── Amsterdam wall-clock helpers ─────────────────────────────────────── */

export { amsterdamParts, amsterdamToUtc, amsterdamToday };
export const isDay = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`))
  && new Date(`${value}T12:00:00Z`).toISOString().startsWith(value);
export const isTime = (value: unknown): value is string => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export const isUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/* ── Slot IDs for the agent ───────────────────────────────────────────── */
/*
 * "ws-20261124-0930-sleutel-bijmaken": Amsterdam date and time plus the
 * service code. Readable on purpose (the agent may repeat it) and never
 * trusted: booking re-checks everything in the database.
 */
export function makeSlotId(serviceCode: string, start: string | Date): string {
  const { day, time } = amsterdamParts(start);
  return `ws-${day.replaceAll('-', '')}-${time.replace(':', '')}-${serviceCode}`;
}

export function parseSlotId(slotId: unknown): { serviceCode: string; start: Date } | null {
  if (typeof slotId !== 'string') return null;
  const m = /^ws-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})-([a-z0-9-]{2,40})$/.exec(slotId.trim());
  if (!m) return null;
  const day = `${m[1]}-${m[2]}-${m[3]}`;
  const time = `${m[4]}:${m[5]}`;
  if (!isDay(day) || !isTime(time)) return null;
  return { serviceCode: m[6], start: amsterdamToUtc(day, time) };
}

/* ── Input clean-up shared by the CRM form and the agent ──────────────── */

export const cleanText = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};

/** International-friendly: 8–15 digits, keeps a leading +. */
export function cleanPhone(value: unknown): string | null {
  const text = cleanText(value, 40);
  if (!text) return null;
  const plus = text.startsWith('+') || text.startsWith('00');
  const digits = text.replace(/\D/g, '').replace(/^00/, '');
  if (digits.length < 8 || digits.length > 15) return null;
  return plus ? `+${digits}` : digits;
}

export function cleanEmail(value: unknown): string | null {
  const text = cleanText(value, 160)?.toLowerCase() ?? null;
  return text && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : null;
}

export function cleanYear(value: unknown): number | null {
  const n = Number(String(value ?? '').trim());
  return Number.isInteger(n) && n >= 1950 && n <= new Date().getFullYear() + 1 ? n : null;
}

/* ── Reads ────────────────────────────────────────────────────────────── */

export async function getWorkshopSettings(): Promise<WorkshopSettings> {
  const supabase = db();
  const [calendars, services, hours, closures] = await Promise.all([
    supabase.from('kfc_workshop_calendar').select('id, code, name, capacity, color, active, sort, technician_id').order('sort').order('name'),
    supabase.from('kfc_workshop_service').select('id, code, name_nl, name_en, duration_minutes, active, sort').order('sort').order('name_nl'),
    supabase.from('kfc_workshop_hours').select('weekday, closed, open_time, close_time').order('weekday'),
    supabase.from('kfc_workshop_closure').select('id, calendar_id, starts_at, ends_at, reason')
      .gte('ends_at', new Date(Date.now() - 31 * 86_400_000).toISOString()).order('starts_at').limit(200),
  ]);
  if (calendars.error) fail(calendars.error, 'calendars');
  if (services.error) fail(services.error, 'services');
  if (hours.error) fail(hours.error, 'hours');
  if (closures.error) fail(closures.error, 'closures');
  const time = (t: string | null) => (t ? t.slice(0, 5) : null);
  return {
    calendars: calendars.data as WorkshopCalendar[],
    services: services.data as WorkshopService[],
    hours: (hours.data as WorkshopHours[]).map((h) => ({ ...h, open_time: time(h.open_time), close_time: time(h.close_time) })),
    closures: closures.data as WorkshopClosure[],
  };
}

export async function findService(idOrCode: string): Promise<WorkshopService | null> {
  const column = isUuid(idOrCode) ? 'id' : 'code';
  const { data, error } = await db().from('kfc_workshop_service')
    .select('id, code, name_nl, name_en, duration_minutes, active, sort').eq(column, idOrCode).eq('active', true).maybeSingle();
  if (error) fail(error, 'service');
  return (data as WorkshopService | null) ?? null;
}

export async function listAppointments(fromIso: string, toIso: string, calendarId?: string | null): Promise<WorkshopAppointment[]> {
  let query = db().from('kfc_workshop_appointment')
    .select('id, reference, calendar_id, service_id, starts_at, ends_at, status, source, customer_name, customer_phone, customer_email, vehicle_make, vehicle_model, vehicle_year, notes, created_at')
    .lt('starts_at', toIso).gt('ends_at', fromIso).order('starts_at').limit(2000);
  if (calendarId) query = query.eq('calendar_id', calendarId);
  const { data, error } = await query;
  if (error) fail(error, 'appointments');
  return data as WorkshopAppointment[];
}

export type DayStatus = 'open' | 'closed' | 'past' | 'unknown_service';
export interface FreeSlot { calendar_id: string; starts_at: string; ends_at: string }

/** Free start times for one service on one Amsterdam day. */
export async function freeSlots(serviceId: string, day: string, calendarId?: string | null, step = 15): Promise<{ status: DayStatus; slots: FreeSlot[] }> {
  const { data, error } = await db().rpc('kfc_workshop_free_slots', {
    p_service: serviceId, p_day: day, p_calendar: calendarId ?? null, p_step: step,
  });
  if (error) fail(error, 'free slots');
  const rows = (data ?? []) as { day_status: DayStatus; calendar_id: string | null; starts_at: string | null; ends_at: string | null }[];
  const status = rows[0]?.day_status ?? 'closed';
  const slots = rows.filter((r) => r.calendar_id && r.starts_at && r.ends_at)
    .map((r) => ({ calendar_id: r.calendar_id!, starts_at: new Date(r.starts_at!).toISOString(), ends_at: new Date(r.ends_at!).toISOString() }));
  return { status, slots };
}

/** One entry per start time: the agent does not choose a calendar. */
export function distinctStarts(slots: FreeSlot[]): FreeSlot[] {
  const seen = new Map<string, FreeSlot>();
  for (const slot of slots) if (!seen.has(slot.starts_at)) seen.set(slot.starts_at, slot);
  return [...seen.values()].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

/* ── Writes ───────────────────────────────────────────────────────────── */

export type BookResult = 'booked' | 'duplicate' | 'idempotency_mismatch' | 'unknown_service' | 'unknown_calendar'
  | 'past' | 'closed' | 'outside_hours' | 'blocked' | 'full' | 'invalid_time';

export interface BookInput {
  serviceId: string; start: Date; calendarId: string | null; source: AppointmentSource;
  customerName: string; customerPhone: string | null; customerEmail: string | null;
  vehicleMake: string | null; vehicleModel: string | null; vehicleYear: number | null;
  notes: string | null; idempotencyKey: string | null; actor: string | null;
}

export interface BookOutcome {
  result: BookResult; appointment_id: string | null; reference: string | null; starts_at: string | null; ends_at: string | null; calendar_id: string | null;
}

const emptyOutcome = (result: BookResult): BookOutcome => ({ result, appointment_id: null, reference: null, starts_at: null, ends_at: null, calendar_id: null });

export async function bookAppointment(input: BookInput): Promise<BookOutcome> {
  const { data, error } = await db().rpc('kfc_workshop_book', {
    p_service: input.serviceId, p_start: input.start.toISOString(), p_calendar: input.calendarId, p_source: input.source,
    p_customer_name: input.customerName, p_customer_phone: input.customerPhone, p_customer_email: input.customerEmail,
    p_vehicle_make: input.vehicleMake, p_vehicle_model: input.vehicleModel, p_vehicle_year: input.vehicleYear,
    p_notes: input.notes, p_idempotency_key: input.idempotencyKey, p_actor: input.actor,
  });
  if (error) {
    // The exclusion constraint is the last line of defence; report it as a conflict, not an outage.
    if (/kfc_workshop_no_overlap/.test(error.message)) return emptyOutcome('full');
    if (/idempotency_key/.test(error.message)) return emptyOutcome('idempotency_mismatch');
    fail(error, 'book');
  }
  const row = (data as Record<string, string | null>[])[0];
  return {
    result: row.result as BookResult,
    appointment_id: row.appointment_id, reference: row.reference, calendar_id: row.calendar_id,
    starts_at: row.starts_at ? new Date(row.starts_at).toISOString() : null,
    ends_at: row.ends_at ? new Date(row.ends_at).toISOString() : null,
  };
}

export async function moveAppointment(id: string, start: Date, calendarId: string | null, actor: string | null) {
  const { data, error } = await db().rpc('kfc_workshop_move', { p_id: id, p_start: start.toISOString(), p_calendar: calendarId, p_actor: actor });
  if (error) {
    if (/kfc_workshop_no_overlap/.test(error.message)) return { result: 'full', starts_at: null, ends_at: null, calendar_id: null };
    fail(error, 'move');
  }
  return (data as { result: string; starts_at: string | null; ends_at: string | null; calendar_id: string | null }[])[0];
}

export async function cancelAppointment(id: string, actor: string | null): Promise<string> {
  const { data, error } = await db().rpc('kfc_workshop_cancel', { p_id: id, p_actor: actor });
  if (error) fail(error, 'cancel');
  return data as string;
}

export async function setAppointmentStatus(id: string, status: 'gepland' | 'bevestigd' | 'afgerond' | 'no_show', actor: string | null) {
  const { data, error } = await db().from('kfc_workshop_appointment')
    .update({ status, updated_at: new Date().toISOString(), updated_by: actor })
    .eq('id', id).neq('status', 'geannuleerd').select('id');
  if (error) fail(error, 'status');
  return (data ?? []).length ? 'updated' : 'not_found';
}

export async function saveHours(rows: WorkshopHours[]) {
  for (const row of rows) {
    if (!Number.isInteger(row.weekday) || row.weekday < 1 || row.weekday > 7) throw new RangeError('weekday');
    if (!row.closed && (!isTime(row.open_time) || !isTime(row.close_time) || row.close_time! <= row.open_time!)) throw new RangeError('hours');
  }
  const { error } = await db().from('kfc_workshop_hours').upsert(rows.map((row) => ({
    weekday: row.weekday, closed: row.closed, open_time: row.closed ? null : row.open_time, close_time: row.closed ? null : row.close_time,
  })));
  if (error) fail(error, 'hours');
}

export async function saveService(id: string, patch: { duration_minutes?: number; active?: boolean }) {
  const update: Record<string, unknown> = {};
  if (patch.duration_minutes !== undefined) {
    if (!Number.isInteger(patch.duration_minutes) || patch.duration_minutes < 5 || patch.duration_minutes > 600) throw new RangeError('duration');
    update.duration_minutes = patch.duration_minutes;
  }
  if (patch.active !== undefined) update.active = !!patch.active;
  const { error } = await db().from('kfc_workshop_service').update(update).eq('id', id);
  if (error) fail(error, 'service');
}

export async function saveCalendar(id: string, patch: { capacity?: number; active?: boolean }) {
  const update: Record<string, unknown> = {};
  if (patch.capacity !== undefined) {
    if (!Number.isInteger(patch.capacity) || patch.capacity < 1 || patch.capacity > 20) throw new RangeError('capacity');
    update.capacity = patch.capacity;
  }
  if (patch.active !== undefined) update.active = !!patch.active;
  const { error } = await db().from('kfc_workshop_calendar').update(update).eq('id', id);
  if (error) fail(error, 'calendar');
}

export async function addClosure(input: { calendarId: string | null; start: Date; end: Date; reason: string | null; actor: string | null }) {
  if (!(input.end > input.start)) throw new RangeError('closure');
  const { error } = await db().from('kfc_workshop_closure').insert({
    calendar_id: input.calendarId, starts_at: input.start.toISOString(), ends_at: input.end.toISOString(), reason: input.reason, created_by: input.actor,
  });
  if (error) fail(error, 'closure');
}

export async function deleteClosure(id: string) {
  const { error } = await db().from('kfc_workshop_closure').delete().eq('id', id);
  if (error) fail(error, 'closure');
}
