import { NextResponse } from 'next/server';
import { rateLimit, getClientIp, tooManyRequests } from '@/lib/rateLimit';

/**
 * RDW licence-plate lookup proxy.
 *
 * Rate limited so the endpoint cannot be used to enumerate the RDW register
 * through our IP, and cached hard: vehicle registration data for a given plate
 * effectively never changes, so repeat lookups should never reach RDW.
 */

export const dynamic = 'force-dynamic';

const RATE_LIMIT = 30; // lookups
const RATE_WINDOW = 3600; // per hour, per IP
const RDW_TIMEOUT_MS = 5000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { success: false, error: 'Kenteken is verplicht' },
      { status: 400 }
    );
  }

  // Clean kenteken: remove dashes, spaces, make uppercase
  const kenteken = query.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  if (kenteken.length < 4 || kenteken.length > 8) {
    return NextResponse.json(
      { success: false, error: 'Ongeldig kenteken' },
      { status: 400 }
    );
  }

  const ip = getClientIp(request);
  const limit = await rateLimit(`kenteken:${ip}`, RATE_LIMIT, RATE_WINDOW);
  if (!limit.ok) return tooManyRequests(RATE_WINDOW) as NextResponse;

  try {
    const rdwUrl = `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${encodeURIComponent(kenteken)}`;
    const response = await fetch(rdwUrl, {
      signal: AbortSignal.timeout(RDW_TIMEOUT_MS),
      // RDW data is static per plate; let the CDN answer repeat lookups.
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error(`RDW API error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Geen voertuig gevonden voor dit kenteken' },
        { status: 404 }
      );
    }

    const vehicle = data[0];

    // Extract Year from YYYYMMDD string
    let bouwjaar = '';
    const datumToelating =
      vehicle.datum_eerste_toelating || vehicle.datum_eerste_afgifte_nederland;
    if (datumToelating && String(datumToelating).length >= 4) {
      bouwjaar = String(datumToelating).substring(0, 4);
    }

    // Clean up make/model strings (RDW often has extra spaces or weird capitalization)
    const merk = vehicle.merk ? String(vehicle.merk).trim() : '';
    const handelsbenaming = vehicle.handelsbenaming
      ? String(vehicle.handelsbenaming).trim()
      : '';

    return NextResponse.json(
      {
        success: true,
        data: {
          kenteken,
          merk,
          model: handelsbenaming,
          bouwjaar,
          voertuigsoort: vehicle.voertuigsoort || '',
          inrichting: vehicle.inrichting || '',
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (error: unknown) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    console.error('Error in /api/kenteken:', error);

    // Never block the lead on a slow RDW — tell the user they can type it in.
    return NextResponse.json(
      {
        success: false,
        error: timedOut
          ? 'Kentekencheck duurde te lang. Vul uw gegevens handmatig in.'
          : 'Kentekencheck is tijdelijk niet beschikbaar. Vul uw gegevens handmatig in.',
      },
      { status: timedOut ? 504 : 502 }
    );
  }
}
