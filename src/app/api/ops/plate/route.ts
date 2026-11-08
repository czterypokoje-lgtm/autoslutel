import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { lookupPlate, plateHash, normalizePlate, PlateError } from '@/lib/rdwPlate';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * RDW facts for one plate: make, model, year, version, fuel, colour, catalogue
 * price, last owner change, APK date, taxi and export flags. Read only; the
 * same JSON as `asl plate`. Nothing is written to a lead or job here.
 *
 * Asked for one plate at a time, only when a customer or approver gave it. The
 * audit log gets a hash of the plate, never the plate.
 */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const raw = new URL(request.url).searchParams.get('plate');
  try {
    const { plate } = normalizePlate(raw);
    const result = await lookupPlate(plate);
    await logOps(createSupabaseAdminClient(), 'plate.read', { plate_hash: plateHash(plate), status: result.status });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PlateError) {
      return NextResponse.json(
        { status: 'error', summary: error.message, next_actions: error.nextActions, retry: error.retry },
        { status: error.httpStatus }
      );
    }
    console.error('ops plate failed:', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }
}
