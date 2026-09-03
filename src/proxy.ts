import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isAuthorized, adminAuthConfigured } from '@/lib/adminAuth';
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseAuthConfigured } from '@/lib/supabase/env';

/**
 * Next 16 renamed the `middleware` file convention to `proxy`.
 *
 * Gates internal surfaces that were previously reachable — and indexable — by
 * anyone, and stamps them noindex so they can never enter the search index.
 *
 * These pages are client components, so they cannot export `metadata`;
 * the X-Robots-Tag header is how they get their noindex.
 */
/**
 * Noindex-only, not auth-gated: these stay publicly reachable but must never
 * enter a search index. The webshop catalogue is built on third-party product
 * data and every page inherits the root canonical, so it is not fit to publish.
 * Belt and braces alongside the layout metadata and the robots.txt disallow —
 * a header cannot be missed by a route that forgets to inherit metadata.
 */
const NOINDEX = ['/webshop'];

const PROTECTED = [
  '/offline-conversions',
  '/demo-form',
  '/demo-kenteken',
  '/api/export-conversions',
];

/**
 * The CRM. Guarded by Supabase Auth, not the shared Basic auth password —
 * three roles work here and "who changed this lead" has to be answerable.
 *
 * Next's guidance is explicit: proxy performs an *optimistic* check only.
 * The real authorisation lives in src/lib/crmSession.ts, next to the data.
 * What this does do is refresh the access token, because a Server Component
 * cannot set cookies and would otherwise watch the session expire under it.
 */
const CRM = '/admin';

/** Reachable without a session, or nobody could ever sign in. */
const CRM_PUBLIC = ['/admin/login', '/admin/auth'];

function crmHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

async function handleCrm(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isPublic = CRM_PUBLIC.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  // Fail closed, the same way /api/checkout does without a Mollie key: an
  // unconfigured deployment refuses rather than exposing an unguarded panel.
  if (!supabaseAuthConfigured()) {
    return crmHeaders(
      new NextResponse('CRM is niet geconfigureerd', { status: 503 })
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refreshes the token as a side effect and writes the rotated cookies onto
  // `response` through setAll above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic) {
    // API routes answer with a status code; only pages get a redirect.
    if (pathname.startsWith('/api/')) {
      return crmHeaders(
        NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
      );
    }
    const login = new URL('/admin/login', request.url);
    login.searchParams.set('next', pathname + request.nextUrl.search);
    return crmHeaders(NextResponse.redirect(login));
  }

  if (user && pathname === '/admin/login') {
    return crmHeaders(NextResponse.redirect(new URL('/admin/leads', request.url)));
  }

  return crmHeaders(response);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === CRM || pathname.startsWith(`${CRM}/`) || pathname.startsWith('/api/admin/')) {
    return handleCrm(request);
  }

  const isNoIndex = NOINDEX.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isNoIndex) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isProtected) return NextResponse.next();

  // Fail closed. A deployment with no credentials configured must not expose
  // the dashboard just because someone forgot an environment variable.
  if (!adminAuthConfigured() || !isAuthorized(request)) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Autosleutel24 admin", charset="UTF-8"',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export const config = {
  matcher: [
    '/webshop/:path*',
    '/webshop',
    '/offline-conversions/:path*',
    '/demo-form/:path*',
    '/demo-kenteken/:path*',
    '/api/export-conversions/:path*',
    '/admin',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
