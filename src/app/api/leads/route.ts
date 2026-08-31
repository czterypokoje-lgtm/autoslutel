import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit';

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

/**
 * Normalise a Dutch phone number to E.164 (+31…) so duplicates collapse
 * regardless of how the customer typed it. Returns null if it cannot be parsed.
 */
function toE164NL(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+31')) return `+31${digits.slice(3).replace(/^0/, '')}`;
  if (digits.startsWith('0031')) return `+31${digits.slice(4).replace(/^0/, '')}`;
  if (digits.startsWith('06') || digits.startsWith('0')) return `+31${digits.slice(1)}`;
  if (digits.startsWith('31')) return `+31${digits.slice(2)}`;
  return null;
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
    };

    let { data, error } = await supabase.from('leads').insert([enrichedRow]);

    // PGRST204 / 42703 = column not found. The migration has not been run yet;
    // fall back to the shape the current table does have.
    if (error && (error.code === 'PGRST204' || error.code === '42703')) {
      console.warn(
        'leads table is missing the new columns — falling back to legacy insert. ' +
          'Run supabase/migrations/0001_leads_sellable.sql to enable phone/consent capture.'
      );
      ({ data, error } = await supabase.from('leads').insert([legacyRow]));
    }

    if (error) {
      console.error('Error inserting lead into Supabase:', error);
      return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/leads route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
