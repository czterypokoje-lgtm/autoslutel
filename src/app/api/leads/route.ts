import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit';
import { isScenario } from '@/lib/scenarios';
import { notifyNewLead } from '@/lib/leadNotify';
import { toE164NL } from '@/lib/phone';

/**
 * Lead capture.
 *
 * Public by necessity, so it is protected by a honeypot field, a per-IP rate
 * limit, and length caps on every string before anything reaches the database.
 *
 * Phone number: historically the phone was concatenated into `location`, which
 * made deduplication and routing impossible. This route now writes a dedicated
 * `phone` / `phone_e164` column when the database has them, and falls back to
 * the legacy shape when it does not — so it is safe to deploy before running
 * supabase/migrations/0001_leads_sellable.sql, and upgrades itself afterwards.
 */

export const dynamic = 'force-dynamic';

const RATE_LIMIT = 8; // submissions
const RATE_WINDOW = 3600; // per hour, per IP

const MAX = {
  brand: 60,
  model: 80,
  year: 10,
  service: 120,
  location: 200,
  postcode: 12,
  phone: 40,
  name: 120,
  email: 160,
  photoUrl: 500,
  clickId: 200,
} as const;

/** Trim, cap, and drop anything that is not a usable string. */
function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}


export async function POST(request: Request) {
  try {
    // Order matters: reject bots and malformed input before touching any
    // infrastructure, so a spam flood never reaches the database or the
    // rate limiter's backing store.
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
    }

    // Honeypot: a real person never fills a hidden field. Answer 200 so a bot
    // cannot tell it was rejected, but store nothing.
    if (typeof body.company === 'string' && body.company.trim() !== '') {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const ip = getClientIp(request);
    const limit = await rateLimit(`leads:${ip}`, RATE_LIMIT, RATE_WINDOW);
    if (!limit.ok) return tooManyRequests(RATE_WINDOW);

    const brand = clean(body.brand, MAX.brand);
    const model = clean(body.model, MAX.model);
    const year = clean(body.year, MAX.year);
    const service = clean(body.service, MAX.service);
    const location = clean(body.location, MAX.location);
    const phone = clean(body.phone, MAX.phone);
    const postcode = clean(body.postcode, MAX.postcode);
    const name = clean(body.name, MAX.name);
    const email = clean(body.email, MAX.email);
    const photoUrl = clean(body.photoUrl, MAX.photoUrl);
    const source = clean(body.source, 40) ?? 'unknown';
    const gclid = clean(body.gclid, MAX.clickId);
    const wbraid = clean(body.wbraid, MAX.clickId);
    const gbraid = clean(body.gbraid, MAX.clickId);
    /*
     * Microsoft Advertising's click id. The column has existed since 0045 and
     * the forms now send it, but this route never read it — so it arrived in
     * the request body and was dropped, and every Bing click stayed
     * unattributable exactly the way Google's did before gclid was stored.
     */
    const msclkid = clean(body.msclkid, MAX.clickId);

    // What the visitor chose (working key vs. all lost) and the indicative
    // price shown for it, from forms that ask (see publicQuote.ts). Never
    // trusted beyond a plausible range — this is a quote, not an invoice.
    const scenario = isScenario(body.scenario) ? body.scenario : null;
    const quotedPriceNum = Number(body.quotedPrice);
    const quotedPrice =
      Number.isFinite(quotedPriceNum) && quotedPriceNum > 0 && quotedPriceNum < 10000 ? quotedPriceNum : null;

    // Reject an entirely empty submission rather than storing a blank row.
    if (!brand && !model && !service && !location && !phone) {
      return NextResponse.json({ error: 'Onvoldoende gegevens' }, { status: 400 });
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.storage_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.storage_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    /*
     * Auto-flagged, not auto-dropped. The same phone number submitting again
     * within 72 hours is almost always the same person retrying a form or
     * clicking a second ad, not a second independent lead — but the row is
     * still kept (never silently discarded) so the office can see it and the
     * offline-conversions export can exclude it from what gets reported to
     * Google Ads as a real conversion.
     */
    const phoneE164ForDupeCheck = toE164NL(phone);
    let initialStatus: string | undefined;
    if (phoneE164ForDupeCheck) {
      const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from('leads')
        .select('id')
        .eq('phone_e164', phoneE164ForDupeCheck)
        .gte('created_at', since)
        .limit(1);
      if (recent && recent.length > 0) initialStatus = 'duplicate';
    }

    const legacyRow = {
      brand,
      model,
      year,
      service,
      // Keep the legacy combined value so existing exports and views keep working.
      location: phone ? `${location ?? ''} (Tel: ${phone})`.trim() : location,
      photo_url: photoUrl,
      gclid,
      wbraid,
      gbraid,
    };

    const enrichedRow = {
      ...legacyRow,
      location, // clean location once the dedicated phone column exists
      phone,
      phone_e164: toE164NL(phone),
      postcode: postcode ? postcode.toUpperCase().replace(/\s+/g, '') : null,
      name,
      email,
      source,
      consent_marketing: body.consentMarketing === true,
      consent_at: body.consentMarketing === true ? new Date().toISOString() : null,
      scenario,
      quoted_price: quotedPrice,
      /* Enriched row only — the legacy fallback shape predates this column,
         and adding it there would break the very fallback it exists for. */
      msclkid,
      ...(initialStatus ? { status: initialStatus } : {}),
    };

    /*
     * .select('id') so the response can hand the id back to the browser —
     * without it Supabase returns no row at all on insert, and the client
     * has no way to tag this exact lead in anything (Clarity's custom tags,
     * a "thanks, we'll call you" reference number, etc).
     */
    let { data, error } = await supabase.from('leads').insert([enrichedRow]).select('id').single();

    // PGRST204 / 42703 = column not found. The migration has not been run yet;
    // fall back to the shape the current table does have.
    if (error && (error.code === 'PGRST204' || error.code === '42703')) {
      console.warn(
        'leads table is missing the new columns — falling back to legacy insert. ' +
          'Run supabase/migrations/0001_leads_sellable.sql to enable phone/consent capture.'
      );
      ({ data, error } = await supabase.from('leads').insert([legacyRow]).select('id').single());
    }

    if (error) {
      console.error('Error inserting lead into Supabase:', error);
      return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
    }

    /*
     * Tell somebody. Until this line existed the route ended at the insert:
     * the lead was stored correctly and then sat there, because nothing on
     * any phone or in any inbox said it had arrived.
     *
     * Awaited, not fired and forgotten. On a serverless runtime the function
     * can be frozen the moment the response is returned, so a floating
     * promise here is an alert that sometimes sends — which is worse than one
     * that never does, because nobody goes looking for the missing half.
     *
     * Wrapped anyway: the lead is already committed at this point, and a mail
     * provider having a bad minute must not turn that into an error page for
     * a customer who is standing next to a locked car.
     */
    try {
      await notifyNewLead({
        ...enrichedRow,
        location,
        status: initialStatus ?? 'new',
      });
    } catch (notifyError) {
      console.error('[leads] lead saved but the alert failed', notifyError);
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/leads route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
