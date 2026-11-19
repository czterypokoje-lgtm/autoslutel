import { createHash, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * The office assistant's key to /api/ops.
 *
 * Separate from AGENT_API_TOKEN on purpose. That token sits in the ElevenLabs
 * console and is used by a customer-facing agent; this one reads customer lists
 * and must be revocable without touching the phone line.
 *
 * Fails closed: with no token configured the routes answer 503 and serve nobody.
 */

export type OpsAuth = { ok: true } | { ok: false; status: number; error: string };

const digest = (value: string) => createHash('sha256').update(value).digest();

export function checkOps(request: Request): OpsAuth {
  const secret = process.env.OPS_API_TOKEN;
  if (!secret || secret.length < 32) {
    return { ok: false, status: 503, error: 'Niet beschikbaar' };
  }

  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || !timingSafeEqual(digest(token), digest(secret))) {
    return { ok: false, status: 401, error: 'Geen toegang' };
  }

  return { ok: true };
}

/**
 * Who asked for what. Best-effort: a missing audit table must not take the
 * assistant down, but it says so in the log rather than failing silently.
 * Stores the action and its parameters, never the customer data returned.
 */
export async function logOps(
  supabase: SupabaseClient,
  action: string,
  detail: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabase.from('ops_audit_log').insert({ action, detail });
  if (error) console.error('ops_audit_log insert failed:', error.message);
}

/** Today's date as the office means it, not as UTC means it. */
export const amsterdamDate = (at: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(at);
