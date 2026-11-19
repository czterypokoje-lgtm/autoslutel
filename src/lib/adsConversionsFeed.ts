import { createHash, timingSafeEqual } from 'node:crypto';
import type { JobClick } from './adAttribution.ts';

/**
 * The daily Google Ads offline-conversion file, built from finished jobs.
 *
 * Pure on purpose: rows in, text out, `now` passed in. Google Ads fetches the
 * file by itself every day (Goals > Conversions > Uploads > Schedules, source
 * HTTPS), so the same job must always give the same row. A repeated fetch is
 * then harmless: Google ignores a conversion it already holds for the same
 * click, name and time.
 *
 * The file carries NO personal data: only a click id, the conversion name,
 * the time, the value and the currency. Rows that arrive with names, phones,
 * emails, addresses or plates are read for the click id and nothing else.
 */

export const FEED_USERNAME = 'google-ads';
export const FEED_MIN_PASSWORD_LENGTH = 24;
export const CONVERSION_NAME = 'Job Completed';
export const CONVERSION_CURRENCY = 'EUR';
export const CLICK_WINDOW_DAYS = 90;

/*
 * Header: all three click id columns, in Google's own order and spelling.
 * Google's template takes "Google Click ID", "GBRAID" and "WBRAID" as three
 * separate columns and wants exactly one of them filled per row. A gbraid or
 * wbraid dropped into the "Google Click ID" column is rejected as an unknown
 * click, so rows that only have one of those use their own column.
 */
export const FEED_HEADER =
  'Google Click ID,GBRAID,WBRAID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency';
export const FEED_FIRST_LINE = 'Parameters:TimeZone=Europe/Amsterdam';

type Id = string | null | undefined;
type Num = number | string | null | undefined;

export interface FeedLead {
  gclid?: Id;
  wbraid?: Id;
  gbraid?: Id;
  created_at?: Id;
  /* Anything else a row carries (name, phone, email...) is never read. */
  [extra: string]: unknown;
}

export interface FeedJobRow {
  id: string;
  status?: Id;
  gross_margin?: Num;
  final_price?: Num;
  completed_at?: Id;
  gclid?: Id;
  wbraid?: Id;
  gbraid?: Id;
  click_captured_at?: Id;
  leads?: FeedLead | null;
  [extra: string]: unknown;
}

export interface FeedCounts {
  rows: number;
  skipped_no_click_id: number;
  skipped_too_old: number;
  skipped_bad_time: number;
  skipped_no_value: number;
  /* A recovered click id that another row of this file already carries, or that two recovered rows share. */
  skipped_duplicate_click: number;
  /* Rows whose click id was recovered by src/lib/adAttribution.ts (a subset of `rows`). */
  recovered_certain: number;
  recovered_likely: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/* Click ids are base64url-ish. Anything else is not a click id. */
const CLICK_ID = /^[A-Za-z0-9_-]{8,200}$/;

const clean = (v: Id): string | null => {
  const t = typeof v === 'string' ? v.trim() : '';
  return CLICK_ID.test(t) ? t : null;
};

const toMs = (v: Id): number | null => {
  if (!v) return null;
  const ms = new Date(v).getTime();
  return Number.isNaN(ms) ? null : ms;
};

/**
 * `YYYY-MM-DD HH:mm:ss` in Europe/Amsterdam, matching the file's own
 * TimeZone line. Never an ISO "T", never an offset, null for a missing or
 * unparseable time (a null becoming new Date(0) is how rows once went out
 * stamped 1970).
 */
export function formatAmsterdam(iso: Id): string | null {
  const ms = toMs(iso);
  if (ms === null || ms <= 0) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(ms));
  const p = (t: string) => parts.find((x) => x.type === t)?.value ?? '';
  return `${p('year')}-${p('month')}-${p('day')} ${p('hour')}:${p('minute')}:${p('second')}`;
}

/** 149.5 -> "149.50", dot decimal. Null when there is no positive amount. */
export function formatValue(v: Num): string | null {
  const n = typeof v === 'string' ? Number(v.trim().replace(',', '.')) : Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  const cents = Math.round(n * 100);
  return cents > 0 ? (cents / 100).toFixed(2) : null;
}

export function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function pickClick(job: FeedJobRow): { kind: 'gclid' | 'gbraid' | 'wbraid'; id: string } | null {
  const lead = job.leads ?? null;
  /* Lead's id first (the original form path), then the job's own, claimed
     from a call click. Within that: gclid beats gbraid beats wbraid. */
  for (const kind of ['gclid', 'gbraid', 'wbraid'] as const) {
    const id = clean(lead?.[kind] as Id) ?? clean(job[kind]);
    if (id) return { kind, id };
  }
  return null;
}

/**
 * `recovered` holds clicks found for jobs that carry none themselves (see
 * adAttribution.ts), keyed by job id. It is only consulted when the job has no
 * click id of its own or on its lead, so rows that already work never change.
 * A recovery carries a click id, a rule and a time, nothing personal.
 */
export function buildAdsFeed(
  jobs: readonly FeedJobRow[],
  now: Date = new Date(),
  recovered: ReadonlyMap<string, JobClick> = new Map()
): { csv: string; counts: FeedCounts } {
  const counts: FeedCounts = {
    rows: 0,
    skipped_no_click_id: 0,
    skipped_too_old: 0,
    skipped_bad_time: 0,
    skipped_no_value: 0,
    skipped_duplicate_click: 0,
    recovered_certain: 0,
    recovered_likely: 0,
  };
  const cutoff = now.getTime() - CLICK_WINDOW_DAYS * DAY_MS;
  const seen = new Set<string>();
  const out: { ms: number; id: string; line: string }[] = [];

  /*
   * One click, one job. The matcher already withdraws a click that two jobs
   * fit; this is the last gate before Google, so it is checked again on the
   * rows actually in this file: a recovered click id is never added when a
   * row already carries it, nor when two recovered rows would share it.
   */
  const ownIds = new Set<string>();
  const recoveredUses = new Map<string, number>();
  for (const job of jobs) {
    if (job.status !== 'afgerond') continue;
    const own = pickClick(job);
    if (own) ownIds.add(own.id);
    else if (recovered.has(job.id)) {
      const id = recovered.get(job.id)!.id;
      recoveredUses.set(id, (recoveredUses.get(id) ?? 0) + 1);
    }
  }

  for (const job of jobs) {
    if (job.status !== 'afgerond') continue;
    if (seen.has(job.id)) continue;
    seen.add(job.id);

    const own = pickClick(job);
    const rec = own ? undefined : recovered.get(job.id);
    const click = own ?? (rec ? { kind: rec.kind, id: rec.id } : null);
    if (!click) {
      counts.skipped_no_click_id++;
      continue;
    }
    if (rec && (ownIds.has(rec.id) || (recoveredUses.get(rec.id) ?? 0) > 1)) {
      counts.skipped_duplicate_click++;
      continue;
    }

    const doneMs = toMs(job.completed_at);
    const done = formatAmsterdam(job.completed_at);
    if (doneMs === null || !done || doneMs > now.getTime()) {
      counts.skipped_bad_time++;
      continue;
    }
    /* Never before the lead existed; for a phone job, never before the click. */
    const clickedMs = rec
      ? toMs(rec.clickedAt)
      : (toMs(job.leads?.created_at) ?? toMs(job.click_captured_at));
    if (clickedMs !== null && doneMs < clickedMs) {
      counts.skipped_bad_time++;
      continue;
    }
    if (doneMs < cutoff || (clickedMs !== null && clickedMs < cutoff)) {
      counts.skipped_too_old++;
      continue;
    }

    const value = formatValue(job.gross_margin);
    if (!value) {
      counts.skipped_no_value++;
      continue;
    }

    const ids = { gclid: '', gbraid: '', wbraid: '' };
    ids[click.kind] = click.id;
    if (rec) counts[rec.confidence === 'certain' ? 'recovered_certain' : 'recovered_likely']++;
    const line = [ids.gclid, ids.gbraid, ids.wbraid, CONVERSION_NAME, done, value, CONVERSION_CURRENCY]
      .map(csvField)
      .join(',');
    out.push({ ms: doneMs, id: job.id, line });
  }

  out.sort((a, b) => a.ms - b.ms || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  counts.rows = out.length;
  const csv = [FEED_FIRST_LINE, FEED_HEADER, ...out.map((r) => r.line)].join('\n') + '\n';
  return { csv, counts };
}

const digest = (s: string) => createHash('sha256').update(s).digest();

/**
 * HTTP Basic, the one scheme Google's schedule supports. Both halves are
 * always compared, in constant time, so neither the username nor the length
 * of the password leaks. A password env under 24 characters switches the
 * feed off entirely.
 */
export function checkAdsFeedAuth(authorization: string | null, envPassword: string | undefined): boolean {
  if (!envPassword || envPassword.length < FEED_MIN_PASSWORD_LENGTH) return false;
  if (!authorization || !/^Basic /i.test(authorization)) return false;
  let decoded = '';
  try {
    decoded = Buffer.from(authorization.slice(6).trim(), 'base64').toString('utf8');
  } catch {
    return false;
  }
  const at = decoded.indexOf(':');
  if (at < 0) return false;
  const userOk = timingSafeEqual(digest(decoded.slice(0, at)), digest(FEED_USERNAME));
  const passOk = timingSafeEqual(digest(decoded.slice(at + 1)), digest(envPassword));
  return userOk && passOk;
}
