/*
 * Europe/Amsterdam wall-clock helpers, safe on the server and in the browser.
 * Calendar days travel as 'YYYY-MM-DD' strings; instants as ISO timestamps.
 * Day arithmetic happens at 12:00 UTC so DST never shifts a date.
 */

export const AMSTERDAM = 'Europe/Amsterdam';

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: AMSTERDAM, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

function zoneParts(ms: number) {
  const p = Object.fromEntries(partsFormatter.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, min: +p.minute, s: +p.second };
}

function offsetAt(ms: number): number {
  const p = zoneParts(ms);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(ms / 1000) * 1000;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' + 'HH:MM' in Amsterdam → UTC Date. */
export function amsterdamToUtc(day: string, time: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  let ms = guess - offsetAt(guess);
  ms = guess - offsetAt(ms);
  return new Date(ms);
}

/** UTC instant → { day: 'YYYY-MM-DD', time: 'HH:MM', minutes } in Amsterdam. */
export function amsterdamParts(value: string | Date | number): { day: string; time: string; minutes: number } {
  const p = zoneParts(new Date(value).getTime());
  return { day: `${p.y}-${pad(p.m)}-${pad(p.d)}`, time: `${pad(p.h)}:${pad(p.min)}`, minutes: p.h * 60 + p.min };
}

export const amsterdamToday = () => amsterdamParts(Date.now()).day;

const noon = (day: string) => new Date(`${day}T12:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(day: string, n: number): string {
  const d = noon(day);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}

/** Same day-of-month n months later, clamped to the month's last day. */
export function addMonths(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return iso(target);
}

/** ISO weekday, 1 = Monday … 7 = Sunday. */
export const isoWeekday = (day: string) => ((noon(day).getUTCDay() + 6) % 7) + 1;
export const startOfWeek = (day: string) => addDays(day, 1 - isoWeekday(day));
export const startOfMonth = (day: string) => `${day.slice(0, 7)}-01`;
export const endOfMonth = (day: string) => addDays(addMonths(startOfMonth(day), 1), -1);
export const daysBetween = (from: string, to: string) => Math.round((noon(to).getTime() - noon(from).getTime()) / 86_400_000);

export function minutesToTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};
