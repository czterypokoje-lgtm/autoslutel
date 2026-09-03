import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { safeNext } from '../safeNext';

export const dynamic = 'force-dynamic';

/**
 * Where the magic link lands. Exchanges the one-time code for a session and
 * writes the cookies — a Route Handler can set cookies, a Server Component
 * cannot, which is why this step is a route and not a page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  const fail = (reason: string) => {
    const url = new URL('/admin/login', origin);
    url.searchParams.set('error', reason);
    return NextResponse.redirect(url);
  };

  // Supabase reports a rejected or expired link here rather than sending a code.
  if (searchParams.get('error')) {
    return fail('De inloglink is verlopen of al gebruikt. Vraag een nieuwe aan.');
  }
  if (!code) {
    return fail('Ongeldige inloglink.');
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return fail('De inloglink is verlopen of al gebruikt. Vraag een nieuwe aan.');
    }
  } catch {
    return fail('Inloggen is op deze omgeving niet geconfigureerd.');
  }

  return NextResponse.redirect(new URL(next, origin));
}
