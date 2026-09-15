import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * Server-side OpenAI Ads conversion for phone calls.
 *
 * The browser pixel (src/lib/consent.ts loadOpenAIPixel + PhoneConversionTracker)
 * already sends this same event client-side. This route exists because a
 * phone click has no other server round-trip at all — nothing here can double
 * with the web-form leads, which get their own client-side `oaiq('track', ...)`
 * call and are not sent through this route. A tracking-protection browser or
 * an ad blocker can silently drop the client beacon; this survives that,
 * the same reasoning as Google Ads' "Enhanced conversions for leads".
 *
 * Consent is read from the same first-party cookie the ConsentBanner already
 * writes (src/lib/consent.ts), not from anything the client claims in the
 * request body — sending lead data to an ad platform without marketing
 * consent is the same AVG violation whether it happens in the browser or on
 * the server.
 *
 * Silently a no-op (200, does nothing) until OPENAI_ADS_API_KEY is set, so
 * this is safe to deploy before that key exists.
 */

export const dynamic = 'force-dynamic';

const EVENTS_ENDPOINT = 'https://bzr.openai.com/v1/events';
const PIXEL_ID = 'NgrU53SbdM3WdR4Kjvyp6Z';

function hasMarketingConsent(request: Request): boolean {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)as24_consent=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : '';
  // Format is "SM" — statistics digit, marketing digit. See src/lib/consent.ts.
  return /^[01]{2}$/.test(value) && value[1] === '1';
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_ADS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ skipped: true, reason: 'not_configured' });
  }

  if (!hasMarketingConsent(request)) {
    return NextResponse.json({ skipped: true, reason: 'no_consent' });
  }

  let sourceUrl = '';
  try {
    const body = await request.json();
    sourceUrl = typeof body?.sourceUrl === 'string' ? body.sourceUrl.slice(0, 500) : '';
  } catch {
    // No body is fine — sourceUrl is optional context, not required.
  }

  try {
    const response = await fetch(`${EVENTS_ENDPOINT}?pid=${PIXEL_ID}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        validate_only: false,
        events: [
          {
            id: randomUUID(),
            type: 'lead_created',
            timestamp_ms: Date.now(),
            source_url: sourceUrl || undefined,
            action_source: 'web',
            data: { type: 'customer_action' },
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('OpenAI Ads event send failed', response.status, text);
      return NextResponse.json({ success: false }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('OpenAI Ads event send error', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
