import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AD_CLICK_PARAMS, WHATSAPP_REF_PATTERN } from '@/lib/adClickId';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { sendOpenAiEvent } from '@/lib/openaiAds';

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
    const row = {
      gclid: clean(body.gclid),
      wbraid: clean(body.wbraid),
      gbraid: clean(body.gbraid),
      msclkid: clean(body.msclkid),
      source_url: clean(body.sourceUrl, 500),
    };
    /* The code the visitor's WhatsApp message now starts with — see 0063_call_click_whatsapp_ref.sql. */
    const ref = typeof body.ref === 'string' && WHATSAPP_REF_PATTERN.test(body.ref) ? body.ref : null;
    const { error } = await supabase.from('call_clicks').insert({ ...row, ref });
    /* Without the code rather than not at all: a code collision, or this
       deploy running before migration 0062, must not cost the click itself. */
    if (error && ref) await supabase.from('call_clicks').insert(row);
  } catch (err) {
    console.error('[call-click] failed to record click', err);
  }
}

const RATE_LIMIT = 30;
const RATE_WINDOW = 60;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await rateLimit(`callconv:${ip}`, RATE_LIMIT, RATE_WINDOW);
  /* 204, not 429: this is a fire-and-forget beacon behind a tel: link and the
     visitor is already dialling. Dropping the write is the whole response. */
  if (!limit.ok) return new NextResponse(null, { status: 204 });

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

  const success = await sendOpenAiEvent({
    eventName: 'lead_created',
    sourceUrl: sourceUrl || undefined,
    ip: ip,
    userAgent: request.headers.get('user-agent') || undefined,
  });

  if (!success) {
    return NextResponse.json({ success: false }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
