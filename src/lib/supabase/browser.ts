'use client';

import { createBrowserClient } from '@supabase/ssr';
import { requireSupabaseAuthConfig } from './env';

/**
 * Supabase client for the browser. Used only to start a magic-link sign-in and
 * to sign out; all CRM data is read on the server.
 */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = requireSupabaseAuthConfig();
  return createBrowserClient(url, anonKey);
}
