import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireSupabaseAuthConfig } from './env';

/**
 * Supabase client bound to the caller's session cookies.
 *
 * Every CRM read and write goes through this client, never the service-role
 * key — that is what makes the RLS policies in 0003_crm_roles.sql the real
 * guard. A bug in a page cannot leak rows the policy would refuse.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = requireSupabaseAuthConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components may not set cookies. Harmless: proxy.ts refreshes
          // the session on the next request, which is where writes belong.
        }
      },
    },
  });
}
