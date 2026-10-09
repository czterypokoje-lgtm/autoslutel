import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isAuthorized, adminAuthConfigured } from '@/lib/adminAuth';
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseAuthConfigured } from '@/lib/supabase/env';
import { CRM_READONLY, READONLY_MESSAGE, isSafeMethod } from '@/lib/readonly';
import { AD_CLICK_PARAMS, readClickOrigin } from '@/lib/adClickId';
import { getClientIp, rateLimit } from '@/lib/rateLimit';
import {
  AD_VISIT_COOKIE,
  AD_VISIT_COOKIE_MAX_AGE,
  PAID_RECORD_CAP,
  PAID_RECORD_WINDOW,
  clickFraudConfigured,
  recordAdVisit,
} from '@/lib/clickFraud';

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
 * Countries blocked outright, at the office's request, after seeing zero-
 * click Clarity sessions from Poland and India.
 *
 * Never applied to /api/* — a payment or messaging webhook (Mollie,
 * Telegram) can legitimately call in from a server hosted anywhere, and
 * blocking those would break real functionality to stop traffic that costs
 * nothing (a session with 0 clicks isn't spending ad budget or filling a
 * form). Never applied to a known crawler either: Googlebot and friends
 * don't request pages from a Dutch IP, and robots.txt already explicitly
 * invites several of these by name — blocking them here would silently
 * contradict that and could deindex the site.
 */
const BLOCKED_COUNTRIES = new Set(['PL', 'IN']);

const KNOWN_CRAWLER =
  /bot|crawl|spider|slurp|googlebot|bingbot|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|applebot|petalbot|gptbot|chatgpt-user|claudebot|claude-web|google-extended|perplexitybot|youbot|amazonbot|anthropic-ai|bytespider/i;

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

  // Fail closed: an unconfigured deployment refuses rather than exposing an
  // unguarded panel.
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

/**
 * Paid ad landings, recorded as evidence.
 *
 * Google charged for this click inside its own auction before this function
 * ran, so there is nothing here to prevent — see src/lib/clickFraud.ts for
 * why the only useful output is a list of IPs with dates. What this does is
 * write down what really happened, which is the one thing Google support and
 * the IP-exclusion screen both need and nobody else is going to collect.
 *
 * IT NEVER REFUSES A LANDING, and that is a deliberate reversal of the
 * obvious design. Turning away a flood looks like defence but buys nothing:
 * the click is paid for either way, the function already ran, and Dutch
 * mobile carriers put thousands of subscribers behind one CGNAT address — so
 * a threshold low enough to catch a script is also low enough to meet a real
 * customer on a busy campaign, and that customer would get a 429 on the page
 * we just bought for them. The one thing a refusal reliably produces is the
 * expensive mistake this whole module is built to avoid.
 *
 * Returns the normal response carrying the visit cookie, or null when this
 * request is none of its business — which is almost every request: organic
 * pages, APIs, static assets and client-side navigations never get here.
 */
async function handlePaidLanding(
  request: NextRequest,
  event: NextFetchEvent
): Promise<NextResponse | null> {
  if (!clickFraudConfigured) return null;
  /* The read-only local copy writes nothing, and this path reaches Supabase
     over plain REST — it would sail straight past readonlyFetch. */
  if (CRM_READONLY) return null;

  const url = request.nextUrl;
  const clickIds: Record<string, string> = {};
  for (const param of AD_CLICK_PARAMS) {
    const value = url.searchParams.get(param);
    if (value) clickIds[param] = value.slice(0, 200);
  }
  // No click id means nobody paid for this visit. Organic traffic is not
  // this table's business and must not land in it: it would be a log of
  // visitors' IP addresses with no fraud purpose to justify keeping it.
  if (!Object.keys(clickIds).length) return null;

  /*
   * Only the top-level document. Next fetches RSC payloads for the same URL
   * on client navigation and prefetch, which would otherwise record two or
   * three rows for one landing and make a careful reader look like a flood.
   *
   * Missing header counts as a document on purpose: old browsers omit it,
   * and so does most automation — and automation is exactly what this table
   * exists to catch, so an absent header must never be a way out.
   */
  const dest = request.headers.get('sec-fetch-dest');
  if (dest && dest !== 'document') return null;

  const userAgent = request.headers.get('user-agent') ?? '';
  // A declared crawler does not click ads, and charging it with fraud would
  // put Googlebot's own ranges on an exclusion list.
  if (KNOWN_CRAWLER.test(userAgent)) return null;

  const ip = getClientIp(request);
  const origin = readClickOrigin(url.href);

  /*
   * A runaway-cost guard on the INSERT, not on the visitor: past the cap this
   * address's further landings go unrecorded, so a script that found our
   * landing page cannot write rows until the database bill notices.
   *
   * The known cost of that, stated plainly: an address flooding harder than
   * the cap has its later landings uncounted, so `visits` understates it. It
   * does not matter — anything flooding that hard has crossed every threshold
   * in clickFraud.ts long before the cap, and the only thing more evidence
   * would change is the size of the number next to a verdict already made.
   *
   * Fails OPEN when Upstash is not configured (see rateLimit.ts), so a
   * missing env var means everything is recorded rather than nothing.
   */
  const room = await rateLimit(`adrecord:${ip}`, PAID_RECORD_CAP, PAID_RECORD_WINDOW);
  const id = crypto.randomUUID();

  const row = {
    id,
    ip,
    country: request.headers.get('x-vercel-ip-country') || null,
    user_agent: userAgent.slice(0, 500) || null,
    path: url.pathname.slice(0, 300),
    gclid: clickIds.gclid ?? null,
    wbraid: clickIds.wbraid ?? null,
    gbraid: clickIds.gbraid ?? null,
    msclkid: clickIds.msclkid ?? null,
    campaign_id: origin.campaignId,
    keyword: origin.keyword,
  };

  // waitUntil, so the database round trip is never in front of the page. A
  // landing page that got slower in order to catch fraud would cost more than
  // the fraud: this click is paid for either way, and the next real customer
  // is not.
  if (room.ok) event.waitUntil(recordAdVisit(row));

  const response = NextResponse.next();
  response.cookies.set(AD_VISIT_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: AD_VISIT_COOKIE_MAX_AGE,
  });
  return response;
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // Local read-only copy: nothing may write — no CRM save, no server action,
  // no public form posting a real lead. Signing in talks to Supabase directly.
  if (CRM_READONLY && !isSafeMethod(request.method) && !pathname.startsWith('/admin/auth/')) {
    return NextResponse.json(
      { error: READONLY_MESSAGE },
      { status: 423, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!pathname.startsWith('/api/')) {
    const country = request.headers.get('x-vercel-ip-country') ?? '';
    const userAgent = request.headers.get('user-agent') ?? '';
    if (BLOCKED_COUNTRIES.has(country) && !KNOWN_CRAWLER.test(userAgent)) {
      return new NextResponse('Not available in your region.', {
        status: 403,
        headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
      });
    }
  }

  if (pathname === CRM || pathname.startsWith(`${CRM}/`) || pathname.startsWith('/api/admin/')) {
    return handleCrm(request);
  }

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isProtected) {
    // The public site. Nothing is gated here; the only work left is writing
    // down a paid landing if this was one.
    return (await handlePaidLanding(request, event)) ?? NextResponse.next();
  }

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
    // Every page, for the country block above — everything except static
    // assets and Next's own internals, which a geo-check has no reason to
    // run against.
    '/((?!_next/static|_next/image|favicon\\.ico|apple-icon\\.png|icon\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
    '/offline-conversions/:path*',
    '/demo-form/:path*',
    '/demo-kenteken/:path*',
    '/api/export-conversions/:path*',
    '/admin',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
