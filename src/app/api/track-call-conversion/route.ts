import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { AD_CLICK_PARAMS } from '@/lib/adClickId';

/**
 * Two unrelated jobs share this route because they share a trigger (a tel:/
 * WhatsApp click) and a reason to exist server-side (an ad blocker or
 * tracking-protection browser can silently drop the client-side beacons in
 * PhoneConversionTracker):
 *
 *  1. Server-side OpenAI Ads conversion for phone calls — consent-gated,
 *     unchanged from before (see the gate below).
 *  2. Anonymous click-id capture into call_clicks, always, regardless of
 *     consent or whether OPENAI_ADS_API_KEY is even set — this is what lets
 *     api/admin/jobs later attribute a phone-only completed job back to an
 *     ad click. Nothing here is sent to Google/OpenAI; it only becomes part
 *     of a real export once a job claims it and that export runs through
 *     its own consent-gated pipeline (api/export-conversions). See
 *     supabase/migrations/0053_call_click_attribution.sql.
 *
 * Consent for (1) is read from the same first-party cookie the ConsentBanner
 * already writes (src/lib/consent.ts), not from anything the client claims
 * in the request body — sending lead data to an ad platform without
 * marketing consent is the same AVG violation whether it happens in the
 * browser or on the server.
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

function clean(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/** Best-effort only: a visitor clicking a phone number must never see this fail. */
async function recordCallClick(body: Record<string, unknown>): Promise<void> {
  const hasAnyClickId = AD_CLICK_PARAMS.some((key) => clean(body[key]));
  if (!hasAnyClickId) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.storage_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.storage_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('call_clicks').insert({
      gclid: clean(body.gclid),
      wbraid: clean(body.wbraid),
      gbraid: clean(body.gbraid),
      msclkid: clean(body.msclkid),
      source_url: clean(body.sourceUrl, 500),
    });
  } catch (err) {
    console.error('[call-click] failed to record click', err);
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine — everything read from it below is optional.
  }
  const sourceUrl = clean(body.sourceUrl, 500) ?? '';

  // Always, regardless of consent or configuration below.
  await recordCallClick(body);

  const apiKey = process.env.OPENAI_ADS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ skipped: true, reason: 'not_configured' });
  }

  if (!hasMarketingConsent(request)) {
    return NextResponse.json({ skipped: true, reason: 'no_consent' });
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
