import type { SupabaseClient } from '@supabase/supabase-js';
import { toE164NL } from './phone.ts';
import { isScenario, type Scenario } from './scenarios.ts';
import { redactExample } from './agentKnowledge.ts';

/**
 * docs/lead-quotes.md — a quote as a row, not a number on `leads.quoted_price`.
 *
 * Pure validation here, no database import for the parsing half: the ops
 * route and scripts/check-lead-quotes.mts both need the exact same rule for
 * "is this a quote we may store", and a second, slightly different copy is
 * how a bad row sneaks past one path and not the other (same lesson as
 * src/lib/phone.ts).
 *
 * The db-facing half (`linkByPhone`, `insertProposed`, `recordAgentQuote`)
 * takes its SupabaseClient as an argument rather than importing one, same as
 * src/lib/tasks.ts — the route decides which client (service-role or
 * cookie-bound) gets used, this file never chooses privilege.
 */

export const CHANNELS = ['whatsapp', 'phone', 'form', 'agent', 'crm'] as const;
export type Channel = (typeof CHANNELS)[number];

export const LOST_REASONS = ['te_duur', 'concurrent', 'geen_reactie', 'zelf_opgelost', 'niet_mogelijk', 'anders'] as const;
export type LostReason = (typeof LOST_REASONS)[number];

export type Outcome = 'open' | 'won' | 'lost' | 'no_reply';
export type LinkState = 'linked' | 'unlinked' | 'ambiguous';

const isChannel = (value: unknown): value is Channel => typeof value === 'string' && (CHANNELS as readonly string[]).includes(value);
const isLostReason = (value: unknown): value is LostReason => typeof value === 'string' && (LOST_REASONS as readonly string[]).includes(value);

const clip = (value: unknown, max: number): string | null =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;

/* ── price bands, §3.3: "boven welk bedrag verliezen we" ─────────────── */

export type PriceBand = '0-150' | '150-250' | '250-400' | '400+';

export function priceBand(price: number): PriceBand {
  if (price < 150) return '0-150';
  if (price < 250) return '150-250';
  if (price < 400) return '250-400';
  return '400+';
}

/**
 * Accepts a number or a Dutch-decimal string ("95,00"); rejects anything
 * negative, zero, non-numeric, or carrying more than two decimals.
 */
function parsePrice(raw: unknown): number | null {
  let text: string;
  if (typeof raw === 'number') text = String(raw);
  else if (typeof raw === 'string') text = raw.trim();
  else return null;
  if (!text) return null;
  text = text.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

/** "€95" matches price 95; "95" surrounded by other digits ("1950") does not. */
function amountInText(price: number, text: string): boolean {
  const whole = String(Math.trunc(price));
  return new RegExp(`(?<!\\d)${whole}(?!\\d)`).test(text);
}

/**
 * The sentence the server hands over, clipped to 160 chars and redacted
 * before it ever reaches a row. The amount must survive both steps — if
 * clipping or redaction eats the digits, the quote has no evidence left and
 * is rejected rather than stored as an unverifiable number.
 */
function prepareEvidence(raw: unknown, price: number): { ok: true; text: string } | { ok: false } {
  const clipped = clip(raw, 160);
  if (!clipped) return { ok: false };
  const redacted = redactExample(clipped).slice(0, 160);
  if (!redacted || !amountInText(price, redacted)) return { ok: false };
  return { ok: true, text: redacted };
}

export interface NormalizedQuote {
  phone: string;
  channel: Channel;
  make: string | null;
  model: string | null;
  year: number | null;
  scenario: Scenario | null;
  price: number;
  quotedAt: string; // ISO
  outcome: Outcome;
  lostReason: LostReason | null;
  evidenceRef: string | null;
  evidenceQuote: string;
  confidence: number | null;
}

export type NormalizeResult = { ok: true; row: NormalizedQuote } | { ok: false; reason: string };

/**
 * One row from `POST /api/ops/quotes`: `{phone, at, channel, make, model,
 * year, scenario, price, quote, ref, confidence, outcome?, lost_reason?}`.
 * Never throws — every bad field comes back as a named reason so the caller
 * can report `rejected:<reason>` per row instead of failing the whole batch.
 */
export function normalizeQuoteInput(raw: unknown): NormalizeResult {
  const r = (raw ?? {}) as Record<string, unknown>;

  const phone = toE164NL(typeof r.phone === 'string' ? r.phone : null);
  if (!phone) return { ok: false, reason: 'invalid_phone' };

  if (!isChannel(r.channel)) return { ok: false, reason: 'invalid_channel' };

  const at = typeof r.at === 'string' || typeof r.at === 'number' ? new Date(r.at) : null;
  if (!at || Number.isNaN(at.getTime())) return { ok: false, reason: 'invalid_at' };

  let scenario: Scenario | null = null;
  if (r.scenario !== undefined && r.scenario !== null) {
    if (!isScenario(r.scenario)) return { ok: false, reason: 'invalid_scenario' };
    scenario = r.scenario;
  }

  const price = parsePrice(r.price);
  if (price === null) return { ok: false, reason: 'invalid_price' };

  const evidence = prepareEvidence(r.quote, price);
  if (!evidence.ok) return { ok: false, reason: 'no_evidence' };

  let outcome: Outcome = 'open';
  if (r.outcome !== undefined && r.outcome !== null) {
    if (r.outcome !== 'open' && r.outcome !== 'won' && r.outcome !== 'lost' && r.outcome !== 'no_reply') {
      return { ok: false, reason: 'invalid_outcome' };
    }
    outcome = r.outcome;
  }

  let lostReason: LostReason | null = null;
  if (r.lost_reason !== undefined && r.lost_reason !== null) {
    if (!isLostReason(r.lost_reason)) return { ok: false, reason: 'invalid_lost_reason' };
    lostReason = r.lost_reason;
  }

  const yearNum = typeof r.year === 'number' ? r.year : typeof r.year === 'string' ? Number(r.year) : NaN;

  return {
    ok: true,
    row: {
      phone,
      channel: r.channel,
      make: clip(r.make, 60),
      model: clip(r.model, 60),
      year: Number.isInteger(yearNum) && yearNum > 1900 && yearNum < 2100 ? yearNum : null,
      scenario,
      price,
      quotedAt: at.toISOString(),
      outcome,
      lostReason,
      evidenceRef: clip(r.ref, 80),
      evidenceQuote: evidence.text,
      confidence: typeof r.confidence === 'number' && r.confidence >= 0 && r.confidence <= 1 ? r.confidence : null,
    },
  };
}

/* ── linking, §3.1: exact E.164 or nothing, ever ──────────────────────── */

export type LinkResult = { state: 'linked'; lead_id: string } | { state: 'unlinked' } | { state: 'ambiguous' };

/**
 * Zero matches on `leads.phone_e164` -> unlinked. Exactly one -> linked. Two
 * or more (duplicate lead rows on the same number) -> ambiguous, a person
 * decides in /admin/offertes. Never on name, last digits, or similarity.
 */
export async function linkByPhone(db: SupabaseClient, phone: string | null): Promise<LinkResult> {
  if (!phone) return { state: 'unlinked' };
  const { data, error } = await db.from('leads').select('id').eq('phone_e164', phone).limit(2);
  if (error) {
    console.error('leadQuotes linkByPhone failed:', error.message);
    return { state: 'unlinked' };
  }
  const rows = data ?? [];
  if (rows.length === 0) return { state: 'unlinked' };
  if (rows.length >= 2) return { state: 'ambiguous' };
  return { state: 'linked', lead_id: String((rows[0] as { id: string }).id) };
}

interface InsertRow {
  phone_e: string | null;
  lead_id: string | null;
  link_state: LinkState;
  channel: Channel;
  make: string | null;
  model: string | null;
  year: number | null;
  scenario: Scenario | null;
  quoted_price: number;
  quoted_at: string;
  outcome: Outcome;
  lost_reason: LostReason | null;
  status: 'proposed' | 'confirmed';
  source: 'server' | 'agent' | 'crm';
  evidence_ref: string | null;
  evidence_quote: string;
  confidence: number | null;
}

/**
 * Proposals from the server, one per `POST /api/ops/quotes` row. Upserted on
 * the table's own unique key (source, evidence_ref, quoted_price) so sending
 * the same chat twice is a no-op, not a second row. `ignoreDuplicates` means
 * a conflicting row is silently skipped rather than overwritten — a person's
 * review of an earlier proposal must never be clobbered by a re-run.
 *
 * Returns which (source, evidence_ref, quoted_price) keys actually landed, so
 * the caller can tell a fresh insert from a duplicate per row.
 */
export async function insertProposed(
  db: SupabaseClient,
  rows: InsertRow[]
): Promise<{ inserted: Set<string>; error?: string }> {
  if (!rows.length) return { inserted: new Set() };
  const { data, error } = await db
    .from('lead_quotes')
    .upsert(rows, { onConflict: 'source,evidence_ref,quoted_price', ignoreDuplicates: true })
    .select('source, evidence_ref, quoted_price');
  if (error) return { inserted: new Set(), error: error.message };
  const key = (row: { source: string; evidence_ref: string | null; quoted_price: number }) =>
    `${row.source}|${row.evidence_ref ?? ''}|${row.quoted_price}`;
  return { inserted: new Set((data ?? []).map(key)) };
}

export const insertKey = (source: string, evidenceRef: string | null, price: number): string =>
  `${source}|${evidenceRef ?? ''}|${price}`;

/**
 * The telephonist's own quote, written the moment it is said out loud —
 * `source='agent'`, `status='confirmed'` from the start, because the price it
 * states is already office-approved (it comes straight from dispatch_pricing,
 * see /api/agent/quote). No `proposed` step for this source.
 */
export async function recordAgentQuote(
  db: SupabaseClient,
  input: {
    phone?: string | null;
    make: string;
    model?: string | null;
    year?: number | null;
    scenario: Scenario;
    price: number;
    evidenceRef?: string | null;
    evidenceQuote: string;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const evidence = prepareEvidence(input.evidenceQuote, input.price);
  if (!evidence.ok) return { ok: false, error: 'no_evidence' };

  const phone = toE164NL(input.phone ?? null);
  const link = await linkByPhone(db, phone);

  const row: InsertRow = {
    phone_e: phone,
    lead_id: link.state === 'linked' ? link.lead_id : null,
    link_state: link.state,
    channel: 'agent',
    make: clip(input.make, 60),
    model: clip(input.model, 60),
    year: typeof input.year === 'number' && Number.isInteger(input.year) ? input.year : null,
    scenario: input.scenario,
    quoted_price: input.price,
    quoted_at: new Date().toISOString(),
    outcome: 'open',
    lost_reason: null,
    status: 'confirmed',
    source: 'agent',
    evidence_ref: clip(input.evidenceRef, 80),
    evidence_quote: evidence.text,
    confidence: null,
  };

  const { error } = await db.from('lead_quotes').insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type { InsertRow as LeadQuoteInsertRow };
