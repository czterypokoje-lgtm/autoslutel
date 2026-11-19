/**
 * Shared job vocabulary: statuses, time windows and postcode routing.
 *
 * Kept out of the components so the agenda, the planner and the API all agree
 * on what a status is called and which window a job sits in — three copies of
 * that list is three chances to drift.
 */

export const JOB_STATUSES = [
  'gepland',
  'onderweg',
  'bezig',
  'afgerond',
  'geannuleerd',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  gepland: 'Gepland',
  onderweg: 'Onderweg',
  bezig: 'Bezig',
  afgerond: 'Afgerond',
  geannuleerd: 'Geannuleerd',
};

export function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === 'string' && (JOB_STATUSES as readonly string[]).includes(value);
}

/**
 * Two-hour windows, because a clock time is a promise this trade cannot keep —
 * the job before it runs over and the customer is left waiting on a number
 * somebody typed optimistically.
 *
 * Round the clock: this is a 24/7 emergency service, and a night call still
 * has to land somewhere in the agenda.
 */
export const TIME_SLOTS = [
  { start: '00:00', end: '02:00' },
  { start: '02:00', end: '04:00' },
  { start: '04:00', end: '06:00' },
  { start: '06:00', end: '08:00' },
  { start: '08:00', end: '10:00' },
  { start: '10:00', end: '12:00' },
  { start: '12:00', end: '14:00' },
  { start: '14:00', end: '16:00' },
  { start: '16:00', end: '18:00' },
  { start: '18:00', end: '20:00' },
  { start: '20:00', end: '22:00' },
  { start: '22:00', end: '24:00' },
] as const;

/** `08:00:00` and `08:00` both become `08:00`. */
export function trimTime(value: string | null | undefined): string {
  return typeof value === 'string' ? value.slice(0, 5) : '';
}

export function slotLabel(start: string | null, end: string | null): string {
  const s = trimTime(start);
  const e = trimTime(end);
  return s && e ? `${s}–${e}` : '—';
}

/**
 * The numeric part of a Dutch postcode. `3512AB`, `3512 ab` and `3512` all
 * give 3512 — the four digits are the region, which is everything routing
 * needs and all the customer reliably types.
 */
export function postcodeDigits(postcode: string | null | undefined): number | null {
  if (!postcode) return null;
  const match = /(\d{4})/.exec(postcode);
  return match ? Number(match[1]) : null;
}

/** Does `3500-3599` cover this postcode? Single values like `3512` also work. */
export function coversPostcode(range: string, postcode: string | null): boolean {
  const digits = postcodeDigits(postcode);
  if (digits === null) return false;

  const parts = range.split('-').map((p) => Number(p.trim()));
  if (parts.length === 1) return Number.isFinite(parts[0]) && parts[0] === digits;
  if (parts.length !== 2 || !parts.every(Number.isFinite)) return false;

  const [low, high] = parts[0] <= parts[1] ? parts : [parts[1], parts[0]];
  return digits >= low && digits <= high;
}

/**
 * `3500-3599, 1000-1099` from the form becomes {'3500-3599','1000-1099'}.
 * Anything that is not a four-digit range is dropped rather than stored as
 * noise the router would silently never match.
 */
export function parseWerkgebied(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter((part) => /^\d{4}(-\d{4})?$/.test(part))
    .slice(0, 40);
}

export interface TechnicianLike {
  id: string;
  name: string;
  active: boolean;
  werkgebied: string[] | null;
}

export interface SuggestionInput {
  technicians: TechnicianLike[];
  postcode: string | null;
  /** How many jobs each technician already has on the day being planned. */
  loadByTechnician: Record<string, number>;
  /** Technician ids marked unavailable for that date. */
  unavailable?: Set<string>;
}

export interface Suggestion {
  technician: TechnicianLike;
  inRegion: boolean;
  load: number;
  reason: string;
}

/**
 * Ranks technicians for a job. It suggests; it never assigns.
 *
 * The planner keeps the last word on purpose — traffic, which blanks and chips
 * are in which van, and a customer who asked for the person who came last time
 * are all things this function cannot know.
 */
export function suggestTechnicians({
  technicians,
  postcode,
  loadByTechnician,
  unavailable,
}: SuggestionInput): Suggestion[] {
  return technicians
    .filter((t) => t.active && !unavailable?.has(t.id))
    .map((t) => {
      const inRegion = (t.werkgebied ?? []).some((range) =>
        coversPostcode(range, postcode)
      );
      const load = loadByTechnician[t.id] ?? 0;
      return {
        technician: t,
        inRegion,
        load,
        reason: inRegion
          ? `werkgebied · ${load} ${load === 1 ? 'klus' : 'klussen'} die dag`
          : `buiten werkgebied · ${load} ${load === 1 ? 'klus' : 'klussen'} die dag`,
      };
    })
    .sort((a, b) => {
      // Region first, then whoever has the lightest day.
      if (a.inRegion !== b.inRegion) return a.inRegion ? -1 : 1;
      if (a.load !== b.load) return a.load - b.load;
      return a.technician.name.localeCompare(b.technician.name);
    });
}

/** `2026-09-02` for a Date, in Amsterdam terms rather than UTC. */
export function isoDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Monday of the week containing `iso`, as an ISO date string. */
export function weekStart(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  const day = (date.getUTCDay() + 6) % 7; // Monday = 0
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
