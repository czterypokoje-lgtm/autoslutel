/**
 * Supabase public credentials, in one place.
 *
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` is new: the site only ever talked to Supabase
 * from the server with the service-role key, so an anon key was never needed.
 * The CRM signs people in, and a browser session needs it.
 *
 * Fail closed, like /api/checkout does with the Mollie key: a deployment
 * missing credentials must refuse to sign anyone in, not half-work.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True when this deployment can run Supabase Auth at all. */
export function supabaseAuthConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Throws rather than building a client against empty strings. */
export function requireSupabaseAuthConfig(): { url: string; anonKey: string } {
  if (!supabaseAuthConfigured()) {
    throw new Error(
      'Supabase Auth is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}
