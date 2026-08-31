import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthorized, adminAuthConfigured } from '@/lib/adminAuth';

/**
 * Next 16 renamed the `middleware` file convention to `proxy`.
 *
 * Gates internal surfaces that were previously reachable — and indexable — by
 * anyone, and stamps them noindex so they can never enter the search index.
 *
 * These pages are client components, so they cannot export `metadata`;
 * the X-Robots-Tag header is how they get their noindex.
 */
const PROTECTED = [
  '/offline-conversions',
  '/account',
  '/demo-form',
  '/demo-kenteken',
  '/api/export-conversions',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
    '/offline-conversions/:path*',
    '/account/:path*',
    '/demo-form/:path*',
    '/demo-kenteken/:path*',
    '/api/export-conversions/:path*',
  ],
};
