import { csvField, formatAmsterdam, formatValue, CONVERSION_CURRENCY, CONVERSION_NAME, FEED_FIRST_LINE, FEED_HEADER } from './adsConversionsFeed.ts';
import { clickOf, phoneKey, type ClickKind } from './adAttribution.ts';
import { RULE_INFO, RULE_ORDER, VAT_RATE, type MatchRule, type Strength } from './conversionRules.ts';

/**
 * Proposes which ad click led to which sale. Proposes only: a person confirms
 * every match on /admin/conversies before Google sees it (table
 * ad_conversion_matches, migration 0109), and the daily file carries nothing
 * else. Pure: rows in, proposals out, `now` passed in.
 *
 * A sale is a finished job, a WhatsApp chat marked won (whatsapp_quotes) or a
 * WhatsApp ad review marked "gedaan" (whatsapp_ad_reviews). Evidence, strongest
 * first. Phone numbers are compared here and never returned.
 *
 *   own_click     hard    the job row itself carries the click id
 *   lead_form     hard    the job's own web lead carries it
 *   office_claim  hard    the office claimed a call click for this job
 *   review_code   strong  the review's WhatsApp code ([K7F2]) is that click's code
 *   quote_code    strong  the won chat contains that click's code
 *   chat_code     strong  that click's code was sent from the sale's phone number
 *   same_phone    medium  another web lead with the same number carries it
 *   time          weak    an unclaimed tap on the phone button up to 72 hours
 *                         before the job was entered (a guess; jobs only, and
 *                         only offered when nothing stronger exists)
 *
 * A click is offered only when it is not later than the sale and not older than
 * 90 days before it. A click a person already confirmed for another sale is shown
 * as taken and cannot be confirmed twice.
 */

export type SaleSource = 'job' | 'whatsapp_quote' | 'whatsapp_review';
export { RULE_INFO, RULE_ORDER, VAT_RATE, type MatchRule, type Strength };

/** The rules the old automatic file used without anyone looking: the "before" figure. */
export const OLD_FEED_RULES: readonly MatchRule[] = ['own_click', 'lead_form', 'office_claim', 'chat_code'];

export const CLICK_WINDOW_DAYS = 90;
export const TIME_RULE_HOURS = 72;
const TIME_RULE_MAX = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const CODE_IN_TEXT = /\[([A-HJKMNP-Z2-9]{4})\]/g;

type Id = string | null | undefined;

export interface Sale {
  source: SaleSource;
  id: string;
  /** When it was sold: job completed_at, chat quoted_at/asked_at, review work date. The conversion time. */
  at: string;
  /** When the office entered it (jobs only), for the time rule. */
  enteredAt?: Id;
  phone?: Id;
  leadId?: Id;
  /** Click id columns on the job row itself. */
  own?: { gclid?: Id; gbraid?: Id; wbraid?: Id; capturedAt?: Id } | null;
  /** WhatsApp codes tied to this sale (a review's ref, codes found in a chat). */
  codes?: readonly string[];
  /** Amount the customer paid, incl. BTW; null when unknown. */
  valueIncl: number | null;
  /** True when the BTW basis was not stated and incl. was assumed. */
  vatAssumed: boolean;
  /** For the screen: what was sold, no phone number. */
  title: string;
  detail: string;
}

export interface PoolLead {
  id: string;
  created_at?: Id;
  phone?: Id;
  phone_e164?: Id;
  gclid?: Id;
  gbraid?: Id;
  wbraid?: Id;
}

export interface PoolClick {
  id: string;
  created_at?: Id;
  gclid?: Id;
  gbraid?: Id;
  wbraid?: Id;
  ref?: Id;
  claimed_by_job_id?: Id;
  chat_phone_key?: Id;
  chat_phone_conflict?: boolean | null;
  campaignId?: string | null;
  page?: string | null;
}

export interface Decision {
  id: string;
  source: SaleSource;
  source_id: string;
  click_id: string;
  click_kind: ClickKind;
  clicked_at: string;
  conversion_at: string | null;
  rule: string;
  decision: 'bevestigd' | 'afgewezen';
  value_incl_btw: number | string | null;
  value_excl_btw: number | string | null;
  vat_assumed: boolean;
  decided_at: string;
  uploaded_at: string | null;
}

export interface Candidate {
  kind: ClickKind;
  id: string;
  clickedAt: string;
  rules: MatchRule[];
  best: MatchRule;
  strength: Strength;
  campaignId: string | null;
  page: string | null;
  /** Minutes between click and sale (or job entry, for the time rule). */
  minutesBefore: number;
  /** Confirmed for another sale: shown, not confirmable. */
  taken: boolean;
}

export type SaleStatus = 'bevestigd' | 'voorstel' | 'geen' | 'te_oud';

export interface SaleReview {
  sale: Sale;
  status: SaleStatus;
  candidates: Candidate[];
  confirmed: Decision | null;
}

const toMs = (v: Id): number | null => {
  if (!v) return null;
  const ms = new Date(v).getTime();
  return Number.isNaN(ms) || ms <= 0 ? null : ms;
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** 145.20 incl. -> 120.00 excl. at 21% BTW. */
export function exclBtw(incl: number): number {
  return round2(incl / (1 + VAT_RATE));
}

/** An amount with its stated basis, as incl. BTW. Unknown basis counts as incl. (owner's rule) and is flagged. */
export function toIncl(amount: number | null | undefined, basis: Id): { incl: number | null; assumed: boolean } {
  if (amount === null || amount === undefined || !Number.isFinite(amount) || amount <= 0) return { incl: null, assumed: false };
  if (basis === 'excl') return { incl: round2(amount * (1 + VAT_RATE)), assumed: false };
  return { incl: round2(amount), assumed: basis !== 'incl' };
}

/** Every [K7F2]-style code in a piece of text, upper case, no duplicates. */
export function codesIn(text: string): string[] {
  return [...new Set([...text.toUpperCase().matchAll(CODE_IN_TEXT)].map((m) => m[1]))];
}

const strengthRank: Record<Strength, number> = { hard: 0, strong: 1, medium: 2, weak: 3 };

/**
 * Proposals for each sale. Sales older than 90 days are `te_oud`: Google no
 * longer accepts their clicks, so they are counted, not offered.
 */
export function proposeMatches(
  sales: readonly Sale[],
  pool: { leads: readonly PoolLead[]; clicks: readonly PoolClick[] },
  decisions: readonly Decision[],
  now: Date
): SaleReview[] {
  const nowMs = now.getTime();
  const leadById = new Map(pool.leads.map((l) => [l.id, l] as const));
  const confirmedByClick = new Map<string, Decision>();
  const confirmedBySale = new Map<string, Decision>();
  const rejected = new Set<string>();
  for (const d of decisions) {
    const saleKey = `${d.source}:${d.source_id}`;
    if (d.decision === 'bevestigd') {
      confirmedByClick.set(d.click_id, d);
      confirmedBySale.set(saleKey, d);
    } else rejected.add(`${saleKey}:${d.click_id}`);
  }

  return sales.map((sale): SaleReview => {
    const saleKey = `${sale.source}:${sale.id}`;
    const confirmed = confirmedBySale.get(saleKey) ?? null;
    const saleMs = toMs(sale.at);
    if (confirmed) return { sale, status: 'bevestigd', candidates: [], confirmed };
    if (saleMs === null) return { sale, status: 'geen', candidates: [], confirmed: null };
    if (saleMs < nowMs - CLICK_WINDOW_DAYS * DAY_MS) return { sale, status: 'te_oud', candidates: [], confirmed: null };

    const earliest = saleMs - CLICK_WINDOW_DAYS * DAY_MS;
    const found = new Map<string, Candidate>();
    const add = (
      rule: MatchRule,
      row: { gclid?: Id; gbraid?: Id; wbraid?: Id } | null | undefined,
      atRaw: Id,
      origin: { campaignId?: string | null; page?: string | null } = {},
      reference: number = saleMs
    ) => {
      const click = clickOf(row);
      const at = toMs(atRaw);
      if (!click || at === null || at > saleMs || at < earliest) return;
      if (rejected.has(`${saleKey}:${click.id}`)) return;
      const existing = found.get(click.id);
      if (existing) {
        if (!existing.rules.includes(rule)) existing.rules.push(rule);
        return;
      }
      found.set(click.id, {
        kind: click.kind,
        id: click.id,
        clickedAt: new Date(at).toISOString(),
        rules: [rule],
        best: rule,
        strength: RULE_INFO[rule].strength,
        campaignId: origin.campaignId ?? null,
        page: origin.page ?? null,
        minutesBefore: Math.round((reference - at) / 60000),
        taken: confirmedByClick.has(click.id),
      });
    };

    if (sale.source === 'job') {
      add('own_click', sale.own, sale.own?.capturedAt ?? sale.enteredAt ?? sale.at);
      const lead = sale.leadId ? leadById.get(sale.leadId) : undefined;
      if (lead) add('lead_form', lead, lead.created_at);
      for (const c of pool.clicks) if (c.claimed_by_job_id === sale.id) add('office_claim', c, c.created_at, c);
    }

    const codes = new Set((sale.codes ?? []).map((c) => c.trim().toUpperCase()));
    if (codes.size) {
      const rule: MatchRule = sale.source === 'whatsapp_review' ? 'review_code' : 'quote_code';
      for (const c of pool.clicks) {
        const ref = typeof c.ref === 'string' ? c.ref.trim().toUpperCase() : '';
        if (!ref || !codes.has(ref)) continue;
        if (c.claimed_by_job_id && c.claimed_by_job_id !== sale.id) continue;
        add(rule, c, c.created_at, c);
      }
    }

    const key = phoneKey(sale.phone);
    if (key) {
      for (const c of pool.clicks) {
        if (c.chat_phone_key !== key || c.chat_phone_conflict === true) continue;
        if (c.claimed_by_job_id && c.claimed_by_job_id !== sale.id) continue;
        add('chat_code', c, c.created_at, c);
      }
      for (const lead of pool.leads) {
        if (lead.id === sale.leadId) continue;
        if (phoneKey(lead.phone) === key || phoneKey(lead.phone_e164) === key) add('same_phone', lead, lead.created_at);
      }
    }

    /* Time only when nothing better exists: the nearest unclaimed phone taps before the job was entered. */
    const entered = toMs(sale.enteredAt);
    if (sale.source === 'job' && found.size === 0 && entered !== null) {
      const from = entered - TIME_RULE_HOURS * 60 * 60 * 1000;
      const near = pool.clicks
        .filter((c) => !c.claimed_by_job_id && !c.ref)
        .map((c) => ({ c, at: toMs(c.created_at) }))
        .filter((x): x is { c: PoolClick; at: number } => x.at !== null && x.at >= from && x.at <= entered)
        .sort((a, b) => b.at - a.at)
        .slice(0, TIME_RULE_MAX);
      for (const { c } of near) add('time', c, c.created_at, c, entered);
    }

    const candidates = [...found.values()]
      .map((c) => {
        c.rules.sort((a, b) => RULE_ORDER.indexOf(a) - RULE_ORDER.indexOf(b));
        c.best = c.rules[0];
        c.strength = RULE_INFO[c.best].strength;
        return c;
      })
      .sort((a, b) => strengthRank[a.strength] - strengthRank[b.strength] || a.minutesBefore - b.minutesBefore);
    return { sale, status: candidates.length ? 'voorstel' : 'geen', candidates, confirmed: null };
  });
}

export interface MatchStats {
  /** All sales loaded, any age. */
  sales: number;
  /** Sales recent enough for Google (sold within 90 days). */
  inWindow: number;
  byKind: Record<SaleSource, { inWindow: number; old: number }>;
  /** In window: what the old automatic file would have sent (jobs only, no person involved). */
  beforeAuto: number;
  /** In window, with at least one open proposal or a confirmation. */
  withEvidence: number;
  /** Of those, with hard or strong evidence. */
  withStrongEvidence: number;
  confirmed: number;
  confirmedIncl: number;
  confirmedExcl: number;
}

export function matchStats(reviews: readonly SaleReview[]): MatchStats {
  const s: MatchStats = {
    sales: reviews.length,
    inWindow: 0,
    byKind: { job: { inWindow: 0, old: 0 }, whatsapp_quote: { inWindow: 0, old: 0 }, whatsapp_review: { inWindow: 0, old: 0 } },
    beforeAuto: 0,
    withEvidence: 0,
    withStrongEvidence: 0,
    confirmed: 0,
    confirmedIncl: 0,
    confirmedExcl: 0,
  };
  for (const r of reviews) {
    if (r.status === 'te_oud') {
      s.byKind[r.sale.source].old++;
      continue;
    }
    s.inWindow++;
    s.byKind[r.sale.source].inWindow++;
    if (r.status === 'bevestigd' && r.confirmed) {
      s.confirmed++;
      s.withEvidence++;
      s.withStrongEvidence++;
      s.confirmedIncl += Number(r.confirmed.value_incl_btw) || 0;
      s.confirmedExcl += Number(r.confirmed.value_excl_btw) || 0;
      continue;
    }
    const open = r.candidates.filter((c) => !c.taken);
    if (open.length) s.withEvidence++;
    if (open.some((c) => c.strength === 'hard' || c.strength === 'strong')) s.withStrongEvidence++;
    /* The old file sent a job when exactly one click came from its automatic rules. */
    const auto = new Set(open.filter((c) => c.rules.some((rule) => OLD_FEED_RULES.includes(rule))).map((c) => c.id));
    if (r.sale.source === 'job' && auto.size === 1) s.beforeAuto++;
  }
  s.confirmedIncl = round2(s.confirmedIncl);
  s.confirmedExcl = round2(s.confirmedExcl);
  return s;
}

export interface FeedRow {
  id: string;
  click_kind: ClickKind;
  click_id: string;
  clicked_at: string;
  conversion_at: string | null;
  value_excl_btw: number | string | null;
  decision: string;
}

export interface ConfirmedFeedCounts {
  rows: number;
  skipped_too_old: number;
  skipped_bad_row: number;
}

/**
 * The file Google fetches: confirmed rows only, value excl. BTW, the same
 * header and time format as before. Rows whose click is older than 90 days
 * are left out (Google would refuse them). Same rows in, same file out, so a
 * repeated fetch is harmless.
 */
export function buildConfirmedFeed(rows: readonly FeedRow[], now: Date): { csv: string; counts: ConfirmedFeedCounts; ids: string[] } {
  const counts: ConfirmedFeedCounts = { rows: 0, skipped_too_old: 0, skipped_bad_row: 0 };
  const cutoff = now.getTime() - CLICK_WINDOW_DAYS * DAY_MS;
  const out: { ms: number; id: string; line: string }[] = [];
  const seenClick = new Set<string>();
  for (const row of rows) {
    if (row.decision !== 'bevestigd') continue;
    const clicked = toMs(row.clicked_at);
    const done = toMs(row.conversion_at);
    const time = formatAmsterdam(row.conversion_at);
    const value = formatValue(row.value_excl_btw);
    if (clicked === null || done === null || !time || !value || done < clicked || done > now.getTime() || seenClick.has(row.click_id)) {
      counts.skipped_bad_row++;
      continue;
    }
    if (clicked < cutoff) {
      counts.skipped_too_old++;
      continue;
    }
    seenClick.add(row.click_id);
    const ids = { gclid: '', gbraid: '', wbraid: '' };
    ids[row.click_kind] = row.click_id;
    const line = [ids.gclid, ids.gbraid, ids.wbraid, CONVERSION_NAME, time, value, CONVERSION_CURRENCY].map(csvField).join(',');
    out.push({ ms: done, id: row.id, line });
  }
  out.sort((a, b) => a.ms - b.ms || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  counts.rows = out.length;
  return {
    csv: [FEED_FIRST_LINE, FEED_HEADER, ...out.map((r) => r.line)].join('\n') + '\n',
    counts,
    ids: out.map((r) => r.id),
  };
}
