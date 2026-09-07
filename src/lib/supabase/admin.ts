import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * A client that answers to nobody's session.
 *
 * Every CRM read and write goes through the cookie-bound client in server.ts,
 * because that is what makes the RLS policies the real guard. This one bypasses
 * them, so it exists for exactly one case: a caller who is not a person.
 *
 * Today that is the voice agent. It has no login, no role, and no business
 * reaching anything an employee can reach — so the routes that use this client
 * decide for themselves, per route, what they will read and write. The key is
 * the loaded gun; the routes are the trigger discipline.
 *
 * Three environment names are accepted because that is what the deployment
 * already has: two of them predate this file and are used by the Mollie webhook
 * and the conversion export.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.storage_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Service-role Supabase credentials are not configured.');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
