/**
 * One codebase, one database — enforced, not assumed.
 *
 * This CRM runs on Autosleutel24's Supabase project only. KeyForCars used to
 * run the same code against its own project and has since moved to its own
 * repository, but its database still exists next to ours: on 21 Nov 2026 a
 * local Autosleutel24 setup was pointed at the KeyForCars database by mistake,
 * every screen worked, and any save would have written Autosleutel24 data into
 * KeyForCars's books. This module makes such a configuration refuse to run.
 *
 * Two checks:
 *  1. The project ref in the Supabase URL must be Autosleutel24's live project,
 *     or one listed in CRM_SUPABASE_TEST_PROJECTS (test/staging projects, or a
 *     host such as 127.0.0.1 for a local Supabase). KeyForCars's live project is
 *     refused even when listed there, so the allow-list cannot be used to reach
 *     the other company's data.
 *  2. Optional, DB side: migration 0133 adds a one-row crm_install table. When
 *     a row is present it must say 'autosleutel24'; CRM_REQUIRE_INSTALL_MARKER=1
 *     makes a missing row an error too.
 *
 * Pure: no imports with side effects, nothing read from process.env here, so
 * node --test can exercise it without a database (tests/unit).
 */

/** The value the crm_install marker row (migration 0133) has in our database. */
export const INSTALL_MARKER = 'autosleutel24';

/** Autosleutel24's live Supabase project. */
export const LIVE_PROJECT = 'utctfircycpjmpjqmtmm';

/** Other companies' live projects: never ours, not even through the test allow-list. */
export const FOREIGN_PROJECTS: Record<string, string> = {
  lzdwxkhlscsitstxdgar: 'KeyForCars',
};

/** "<ref>.supabase.co" → ref; any other host (local, custom domain) → null. */
export function supabaseProjectRef(url: string): string | null {
  try {
    const match = /^([a-z0-9]{20})\.supabase\.(?:co|in)$/.exec(new URL(url).hostname.toLowerCase());
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/** Comma- or space-separated refs or hostnames. */
export function parseAllowList(raw: string | undefined | null): string[] {
  return (raw ?? '')
    .split(/[\s,]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export type GuardInput = {
  /** Every Supabase URL this deployment has; empty ones are ignored. */
  urls: (string | undefined | null)[];
  /** CRM_SUPABASE_TEST_PROJECTS, already parsed. */
  allowed: string[];
};

/** A sentence saying why this deployment must not run, or null when it may. */
export function supabaseProjectProblem({ urls, allowed }: GuardInput): string | null {
  for (const url of urls) {
    if (!url) continue;
    let host: string;
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      return `Supabase-URL "${url}" is ongeldig.`;
    }
    const ref = supabaseProjectRef(url);
    if (ref === LIVE_PROJECT) continue;
    const owner = ref ? FOREIGN_PROJECTS[ref] : undefined;
    if (owner) {
      return (
        `Supabase-project ${ref} is de live database van ${owner}, ` +
        `niet van Autosleutel24. Verwacht: ${LIVE_PROJECT}. ` +
        'Gestopt zodat data van de twee bedrijven nooit mengt.'
      );
    }
    if ((ref && allowed.includes(ref)) || allowed.includes(host)) continue;
    return (
      `Supabase-project ${ref ?? host} is niet de database van Autosleutel24 ` +
      `(verwacht ${LIVE_PROJECT}). Is het een testproject, zet het dan in CRM_SUPABASE_TEST_PROJECTS.`
    );
  }
  return null;
}

export type MarkerInput = {
  url: string;
  anonKey: string;
  /** CRM_REQUIRE_INSTALL_MARKER=1: no marker row is an error too. */
  required: boolean;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

/**
 * Reads crm_install_profile() (migration 0133) with the anon key. A database
 * without the function or without a row passes unless `required`; a database
 * that cannot be reached passes too — the project-ref check above is the main
 * guard, and an unreachable database stops the CRM by itself.
 */
export async function installMarkerProblem({
  url,
  anonKey,
  required,
  fetchImpl = fetch,
  timeoutMs = 2000,
}: MarkerInput): Promise<string | null> {
  if (!url || !anonKey) return null;
  let profile: unknown = null;
  try {
    const response = await fetchImpl(`${url.replace(/\/+$/, '')}/rest/v1/rpc/crm_install_profile`, {
      method: 'GET',
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.ok) profile = await response.json();
    else if (response.status !== 404) return null; // auth or server trouble: cannot tell, do not block
  } catch {
    return null;
  }
  if (typeof profile === 'string' && profile) {
    return profile === INSTALL_MARKER
      ? null
      : `Deze database is gemarkeerd als "${profile}" (tabel crm_install), maar dit is de CRM van Autosleutel24. Gestopt.`;
  }
  return required
    ? `De database heeft geen installatiemarkering (crm_install), en CRM_REQUIRE_INSTALL_MARKER=1 vraagt er een ('${INSTALL_MARKER}', migratie 0133).`
    : null;
}
