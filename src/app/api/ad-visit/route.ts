import { NextResponse } from 'next/server';
import { getClientIp, rateLimit } from '@/lib/rateLimit';
import {
  AD_VISIT_COOKIE,
  type ClientSignals,
  clickFraudConfigured,
  markAdVisitHuman,
} from '@/lib/clickFraud';

/**
 * "A real browser was here."
 *
 * proxy.ts records every paid landing, but it cannot tell the difference
 * between a customer and something that fetched the HTML and left — at that
 * point in the request there is nothing to tell it with. This route is the
 * other half: it only ever gets called because JavaScript ran, which is the
 * single most load-bearing signal in src/lib/clickFraud.ts.
 *
 * THE ROW ID COMES FROM THE COOKIE, NEVER FROM THE BODY. If the id were a
 * parameter, anyone could POST someone else's visit id and mark a bot's
 * landing as human — or, worse, work out which ids exist. The cookie is
 * httpOnly, set by proxy.ts on the landing itself, and cleared here once
 * used, so it is good for exactly one report.
 *
 * Everything in the body is client-supplied and therefore suspect. It is only
 * ever used to ADD suspicion (see signalPoints) — nothing a browser says
 * here can clear an address.
 */

export const dynamic = 'force-dynamic';

/** Generous: one landing fires one beacon, and a reload is a new landing. */
const RATE_LIMIT = 30;
const RATE_WINDOW = 600;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A number only if it is one, finite, and inside a sane range. */
function num(value: unknown, max: number): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max
    ? Math.round(value)
    : null;
}

function text(value: unknown, max: number): string | null {
  return typeof value === 'string' ? value.slice(0, max) : null;
}

export async function POST(request: Request) {
  // Answer 204 to everything. This endpoint tells a caller nothing about
  // whether their report landed, which id exists, or whether the table is
  // even configured — there is nothing here worth probing.
  const done = () => new NextResponse(null, { status: 204 });

  if (!clickFraudConfigured) return done();

  /*
   * Same-origin only. The worst a forged cross-site POST could do is mark the
   * victim's own landing as human, which is hardly an attack — but this is
   * one header, and it keeps a third-party page from quietly driving our
   * evidence table at all.
   */
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return done();

  const cookie = request.headers
    .get('cookie')
    ?.split('; ')
    .find((c) => c.startsWith(`${AD_VISIT_COOKIE}=`))
    ?.slice(AD_VISIT_COOKIE.length + 1);

  // No cookie means this was not a paid landing, or the beacon is late. Either
  // way there is no row to attach the report to.
  if (!cookie || !UUID.test(cookie)) return done();

  const ip = getClientIp(request);
  const limit = await rateLimit(`advisit:${ip}`, RATE_LIMIT, RATE_WINDOW);
  if (!limit.ok) return done();

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    // A beacon with no readable body still proves JavaScript ran, which is
    // the part that matters. Carry on with no signals.
  }

  const signals: ClientSignals = {
    cores: num(body.cores, 512),
    width: num(body.width, 32_768),
    height: num(body.height, 32_768),
    timezone: text(body.timezone, 64),
    languages: text(body.languages, 120),
  };

  await markAdVisitHuman(cookie, {
    /* Only ever true: a missing or false value leaves the column alone rather
       than claiming the visitor sat still. */
    interacted: body.interacted === true ? true : undefined,
    /* navigator.webdriver. Recorded as given — false is meaningful here too,
       because it distinguishes "said no" from "never reported". */
    webdriver: typeof body.webdriver === 'boolean' ? body.webdriver : null,
    client_signals: signals,
  });

  /* One report per landing. Clearing the cookie makes a replayed beacon a
     no-op even before the js_ran=false filter in markAdVisitHuman does. */
  const response = done();
  response.cookies.set(AD_VISIT_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
