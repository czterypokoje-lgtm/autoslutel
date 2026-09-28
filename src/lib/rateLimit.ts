/**
 * Dependency-free sliding-window rate limiter backed by Upstash Redis REST.
 *
 * Works on Vercel serverless/edge without a client library. If the Upstash
 * environment variables are absent it fails OPEN (allows the request) so that
 * a missing config never takes the site down — check `configured` if you need
 * to know whether limiting is actually active.
 *
 * Env vars (Vercel → Storage → Upstash Redis wires these up automatically):
 *   KV_REST_API_URL / UPSTASH_REDIS_REST_URL
 *   KV_REST_API_TOKEN / UPSTASH_REDIS_REST_TOKEN
 */

const REST_URL =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REST_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

export const rateLimitConfigured = Boolean(REST_URL && REST_TOKEN);

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  limit: number;
  /** True when limiting could not run (no config / upstream error) and we allowed through. */
  degraded: boolean;
}

/**
 * The caller's IP, from a header the caller cannot choose.
 *
 * `x-forwarded-for` is a list, and a proxy APPENDS to it — so anything the
 * client sent arrives first. Reading `[0]` meant reading attacker-supplied
 * data: `X-Forwarded-For: 1.2.3.<random>` on every request produced a fresh
 * bucket each time and defeated the limiter completely, on lead submission,
 * blob uploads and RDW lookups alike.
 *
 * `x-vercel-forwarded-for` is set by the platform and cannot be spoofed from
 * outside, so it is preferred. Falling back to XFF we take the LAST entry,
 * which is the address our own proxy observed, rather than the first.
 */
export function getClientIp(request: Request): string {
  const trusted = request.headers.get('x-vercel-forwarded-for');
  if (trusted) return trusted.split(',').pop()!.trim();

  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    const hops = fwd.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length) return hops[hops.length - 1]!;
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

async function redis(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(REST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
    signal: AbortSignal.timeout(2000),
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const json = (await res.json()) as { result?: unknown };
  return json.result;
}

/**
 * Fixed-window counter. `key` should identify both the route and the caller,
 * e.g. `leads:1.2.3.4`. Window is in seconds.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (!rateLimitConfigured) {
    return { ok: true, remaining: limit, limit, degraded: true };
  }

  try {
    const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
    const redisKey = `rl:${key}:${bucket}`;

    const count = Number(await redis(['INCR', redisKey]));
    if (count === 1) {
      // First hit in this window — set the TTL so the key cleans itself up.
      await redis(['EXPIRE', redisKey, windowSeconds]);
    }

    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      limit,
      degraded: false,
    };
  } catch {
    // Upstream problem — allow the request rather than blocking real customers.
    return { ok: true, remaining: limit, limit, degraded: true };
  }
}

/** Standard 429 response with a Retry-After hint. */
export function tooManyRequests(windowSeconds: number): Response {
  return new Response(
    JSON.stringify({ error: 'Te veel verzoeken. Probeer het later opnieuw.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(windowSeconds),
      },
    }
  );
}
