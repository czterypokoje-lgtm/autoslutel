/**
 * Read-only switch for the local redesign copy.
 *
 * With NEXT_PUBLIC_CRM_READONLY=1 the CRM reads the real Supabase data but
 * cannot change it: proxy.ts refuses every non-GET request to /admin and
 * /api/admin, and every Supabase client gets a fetch that refuses writes to
 * the database and storage. Sign-in still works (it goes to /auth/v1).
 *
 * Never set this in production.
 */
export const CRM_READONLY = process.env.NEXT_PUBLIC_CRM_READONLY === '1';

export const READONLY_MESSAGE = 'Alleen-lezen testkopie: opslaan staat uit';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isSafeMethod(method: string | undefined): boolean {
  return SAFE_METHODS.has((method ?? 'GET').toUpperCase());
}

/** A fetch for Supabase clients that lets reads and auth through, nothing else. */
export const readonlyFetch: typeof fetch = async (input, init) => {
  const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (!isSafeMethod(method) && !url.includes('/auth/v1/')) {
    return new Response(JSON.stringify({ message: READONLY_MESSAGE, code: 'READONLY' }), {
      status: 423,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return fetch(input, init);
};

/** Spread into a Supabase client's options. Empty when the switch is off. */
export const readonlyClientOptions = CRM_READONLY ? { global: { fetch: readonlyFetch } } : {};
