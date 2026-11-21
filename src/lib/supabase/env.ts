/**
 * Supabase public credentials, in one place.
 *
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` is new: the site only ever talked to Supabase
 * from the server with the service-role key, so an anon key was never needed.
 * The CRM signs people in, and a browser session needs it.
 *
 * Fail closed: a deployment missing credentials must refuse to sign anyone
 * in, not half-work.
 */

import { INSTALL } from '@/config/install';
import { installMarkerProblem, parseAllowList, supabaseProjectProblem } from './installGuard';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const CRM_PREVIEW = process.env.NODE_ENV === 'development'
  && process.env.CRM_PREVIEW === '1'
  && !SUPABASE_URL && !SUPABASE_ANON_KEY && !process.env.SUPABASE_URL
  && !process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.storage_SUPABASE_SERVICE_ROLE_KEY;

/** True when this deployment can run Supabase Auth at all. */
export function supabaseAuthConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Why this deployment must not talk to its Supabase project, or null.
 *
 * Checks every Supabase URL the server can see against CRM_INSTALL (see
 * installGuard.ts). In the browser only the public URL is inlined and the
 * test allow-list is not, so the browser skips the check: the server already
 * refused to serve the page.
 */
export function supabaseInstallProblem(): string | null {
  if (typeof window !== 'undefined') return null;
  return supabaseProjectProblem({
    install: INSTALL,
    urls: [SUPABASE_URL, process.env.SUPABASE_URL, process.env.storage_SUPABASE_URL],
    allowed: parseAllowList(process.env.CRM_SUPABASE_TEST_PROJECTS),
  });
}

/** Throws when the Supabase project belongs to the other install. */
export function assertSupabaseInstall(): void {
  const problem = supabaseInstallProblem();
  if (problem) throw new Error(`[install-guard] ${problem}`);
}

/** The DB-side marker (migration 0133), checked with the anon key. */
export function supabaseMarkerProblem(): Promise<string | null> {
  return installMarkerProblem({
    install: INSTALL,
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    required: process.env.CRM_REQUIRE_INSTALL_MARKER === '1',
  });
}

/** Throws rather than building a client against empty strings, or against the other install's database. */
export function requireSupabaseAuthConfig(): { url: string; anonKey: string } {
  assertSupabaseInstall();
  if (!supabaseAuthConfigured()) {
    throw new Error(
      'Supabase Auth is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}
