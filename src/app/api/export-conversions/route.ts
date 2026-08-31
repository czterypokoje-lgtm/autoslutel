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
 */

export const dynamic = 'force-dynamic';

// Only the columns Google Ads actually needs for offline conversion import.
// Deliberately excludes free-text fields that may contain customer contact data.
const EXPORT_COLUMNS = 'id, created_at, service, gclid, wbraid, gbraid';

function unauthorized() {
  // 404 rather than 401: do not confirm that this endpoint exists.
  return new NextResponse(null, { status: 404 });
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

  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.storage_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.storage_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('leads')
      .select(EXPORT_COLUMNS)
      .or('gclid.not.is.null,wbraid.not.is.null,gbraid.not.is.null')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, data },
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
