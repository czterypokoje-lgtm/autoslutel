import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAuthorized, adminAuthConfigured } from '@/lib/adminAuth';

/**
 * Google Ads offline-conversion export.
 *
 * This route reads personal data (leads) with the Supabase service-role key,
 * which bypasses Row Level Security. It MUST never be publicly reachable.
 * Access requires the EXPORT_SECRET bearer token; without a correct token the
 * route answers 404 so its existence is not advertised.
 *
 * Set EXPORT_SECRET in the Vercel project environment before deploying.
 *
 * Split into two lists, not one, because a lead with a gclid is not
 * automatically a conversion worth bidding on:
 *   - `positive`: qualified or sold — a real conversion, reported once.
 *   - `negative`: spam or duplicate — the click itself was never a real
 *     conversion, reported as a Google Ads "conversion adjustment"
 *     (RETRACTION) so Smart Bidding stops treating that click as a signal
 *     to find more like it. Without this half, every spam form-fill trains
 *     the algorithm to spend more money finding more spam.
 * A lead sitting at `new`, `contacted` or a non-spam `rejected` is reported
 * as neither — the office hasn't decided yet, and guessing is worse than
 * waiting.
 */

export const dynamic = 'force-dynamic';

const EXPORT_COLUMNS = 'id, created_at, service, status, gclid, wbraid, gbraid';

function unauthorized() {
  // 404 rather than 401: do not confirm that this endpoint exists.
  return new NextResponse(null, { status: 404 });
}

function supabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.storage_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.storage_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: Request) {
  // Defence in depth: middleware already gates this path, but a route that
  // reads personal data with the service-role key must check for itself too.
  if (!adminAuthConfigured()) {
    console.error('Admin credentials are not configured — refusing to export leads');
    return unauthorized();
  }
  if (!isAuthorized(request)) {
    return unauthorized();
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .select(EXPORT_COLUMNS)
      .or('gclid.not.is.null,wbraid.not.is.null,gbraid.not.is.null')
      .is('exported_at', null)
      .in('status', ['qualified', 'sold', 'spam', 'duplicate'])
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const positive = (data ?? []).filter((l) => l.status === 'qualified' || l.status === 'sold');
    const negative = (data ?? []).filter((l) => l.status === 'spam' || l.status === 'duplicate');

    return NextResponse.json(
      { success: true, positive, negative },
      {
        status: 200,
        headers: {
          // Never let a CDN or browser cache personal data.
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Marks leads as exported once their CSV has actually been downloaded, so
 * the next export run never reports the same click to Google Ads twice.
 */
export async function PATCH(request: Request) {
  if (!adminAuthConfigured()) return unauthorized();
  if (!isAuthorized(request)) return unauthorized();

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string') : [];
  if (!ids.length) {
    return NextResponse.json({ error: 'Geen ids opgegeven' }, { status: 400 });
  }

  const supabase = supabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const { error } = await supabase
    .from('leads')
    .update({ exported_at: new Date().toISOString() })
    .in('id', ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, count: ids.length });
}
