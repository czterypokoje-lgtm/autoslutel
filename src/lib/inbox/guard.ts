/*
 * Deterministic safety net in front of the model's own `needs_human` call.
 * The model is asked never to invent a price or promise a time, but a draft
 * that slips through anyway should not auto-send just because the model
 * said it was fine — so this re-checks the reply text itself, with plain
 * regex, before `handleInbound.ts` lets an 'auto' thread send it. No
 * Supabase, no network: pure text in, a reason (or null) out, so it can be
 * unit-tested on its own.
 */

export type GuardReason = 'price' | 'time';

const strip = (s: string) => s.replace(/\s+/g, '');

/** `€123`, `€ 123,50` or `95,-` / `95 euro` — a price the reply states as fact. */
const MONEY_RE = /€\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*(?:euro\b|,-)/gi;

/** A clock time, a "binnen/over X minuten/uur" promise, or a day-part promise. */
const TIME_RE = /\b\d{1,2}[:.]\d{2}\b|\b(?:binnen|over)\s+\d+\s*(?:minuten|min|uur|kwartier)\b|vandaag nog|morgenochtend|morgenmiddag/i;

/**
 * null = clean. 'price' = the reply names an amount that is not verbatim
 * (modulo whitespace) in the confirmed facts the model was given — the
 * model may have rounded, guessed, or carried over a figure from earlier in
 * the thread. 'time' = the reply promises a clock time or an arrival
 * window, which only a person who actually knows the planning can make true.
 */
export function replyGuard(reply: string, facts: string): GuardReason | null {
  const normalizedFacts = strip(facts);
  const amounts = reply.match(MONEY_RE) ?? [];
  for (const amount of amounts) {
    if (!normalizedFacts.includes(strip(amount))) return 'price';
  }

  if (TIME_RE.test(reply)) return 'time';

  return null;
}
