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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
  ],
};
