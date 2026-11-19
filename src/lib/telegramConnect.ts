import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * A one-time code for connecting a Telegram chat to a person.
 *
 * What this replaces: the connect link used to carry the technician's or the
 * office user's own uuid, and the bot linked whatever chat sent it. A uuid is
 * an identifier, not a secret — technician ids sit in CRM URLs and in receipt
 * storage paths (facturen/<technician_id>/…) — so anyone who saw one could
 * connect their own Telegram as that person and read their jobs, balance,
 * van, invoices and expenses, or bid on their offers. With an office user's
 * id it was worse: awarding jobs, creating jobs, approving expenses.
 *
 * The code says nothing about who you are. It is looked up, spent, and gone.
 */

/** Long enough not to guess, short enough for Telegram's 64-char payload. */
const TOKEN_BYTES = 16;

/** Long enough to walk to your phone, short enough that a leaked link rots. */
const TTL_MINUTES = 30;

export type ConnectKind = 'technician' | 'admin';

function newToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

/**
 * The code to put in the connect link, reusing an unexpired one rather than
 * writing a row per page view.
 *
 * Returns null when the table is not there yet, so the profile page degrades
 * to "not available on this environment" instead of failing.
 */
export async function connectToken(
  supabase: SupabaseClient,
  kind: ConnectKind,
  subjectId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('telegram_connect_tokens')
    .select('token')
    .eq('kind', kind)
    .eq('subject_id', subjectId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.token) return existing.token as string;

  const token = newToken();
  const { error } = await supabase.from('telegram_connect_tokens').insert({
    token,
    kind,
    subject_id: subjectId,
    expires_at: new Date(Date.now() + TTL_MINUTES * 60_000).toISOString(),
  });

  if (error) {
    console.error('Connect token insert failed:', error.message);
    return null;
  }
  return token;
}
