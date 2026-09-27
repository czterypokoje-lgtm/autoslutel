import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getDriveTimes, resolvePostcode } from '@/lib/googleMaps';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_EUR_PER_KM = 0.23;

/** How many jobs one press will work through, so a click cannot run away. */
const BATCH = 100;

interface Job {
  id: string;
  lat: number | string | null;
  lng: number | string | null;
  postcode: string | null;
  city: string | null;
  technician_id: string | null;
}

const coord = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * Measures fuel for finished jobs that never got it.
 *
 * Two jobs at once: everything completed before this feature existed has no
 * travel cost at all, and anything finished while Google was unreachable was
 * deliberately left blank rather than written as zero. Both are fixed by the
 * same pass, which is why this is a button rather than a one-off script — it
 * is the repair tool as much as the migration.
 *
 * Idempotent: crm_set_job_travel only writes rows where travel_km is still
 * null and no cost was typed by hand, so pressing it twice changes nothing
 * and pressing it after an outage finishes the job.
 *
 * The matrix is inverted on purpose. The technician's base is the fixed point
 * and the jobs are the many, so asking "how far is each job from this base"
 * uses getDriveTimes' 25-origins-per-request chunking: three HTTP calls for
 * 63 jobs instead of 63. Distance is symmetric enough for a fuel estimate.
 */
export async function POST() {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const rate = Number(process.env.FUEL_EUR_PER_KM) > 0
    ? Number(process.env.FUEL_EUR_PER_KM)
    : DEFAULT_EUR_PER_KM;

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, lat, lng, postcode, city, technician_id')
    .eq('status', 'afgerond')
    .is('travel_km', null)
    .limit(BATCH);

  if (error) {
    return NextResponse.json(
      {
        error: /travel_km/.test(error.message)
          ? 'Voer supabase/migrations/0057_job_travel_and_margin.sql uit.'
          : error.message,
      },
      { status: 500 }
    );
  }

  const { data: technicians } = await supabase
    .from('technicians')
    .select('id, base_lat, base_lng');
  const bases = new Map(
    (technicians ?? []).map((t) => [t.id, { lat: coord(t.base_lat), lng: coord(t.base_lng) }])
  );

  let filled = 0;
  let skipped = 0;
  let located = 0;

  /*
   * Grouped by technician, because that is what makes the matrix call cheap:
   * one destination, many origins, 25 per request.
   */
  const byTechnician = new Map<string, Job[]>();
  for (const job of (jobs ?? []) as Job[]) {
    if (!job.technician_id || !bases.get(job.technician_id)?.lat) {
      skipped += 1;
      continue;
    }
    byTechnician.set(job.technician_id, [...(byTechnician.get(job.technician_id) ?? []), job]);
  }

  for (const [technicianId, rows] of byTechnician) {
    const base = bases.get(technicianId)!;

    /*
     * Fill in coordinates while we are here. 16% of jobs have no city, which
     * puts them in the "onbekend" bucket on every city report — and the
     * postcode we already hold is enough to fix both that and the missing
     * lat/lng this route needs anyway.
     */
    const origins: { lat: number; lng: number }[] = [];
    const usable: Job[] = [];
    for (const job of rows) {
      let lat = coord(job.lat);
      let lng = coord(job.lng);

      if ((lat === null || lng === null) && job.postcode) {
        const resolved = await resolvePostcode(job.postcode).catch(() => null);
        if (resolved?.coords) {
          lat = resolved.coords.lat;
          lng = resolved.coords.lng;
          await supabase
            .from('jobs')
            .update({ lat, lng, ...(job.city ? {} : { city: resolved.city ?? null }) })
            .eq('id', job.id);
          located += 1;
        }
      }

      if (lat === null || lng === null) {
        skipped += 1;
        continue;
      }
      origins.push({ lat, lng });
      usable.push(job);
    }

    if (!origins.length) continue;

    const drives = await getDriveTimes(origins, { lat: base.lat!, lng: base.lng! });

    for (const [index, job] of usable.entries()) {
      const drive = drives[index];
      if (!drive) {
        skipped += 1;
        continue;
      }
      const km = Math.round((2 * drive.distanceMeters) / 10) / 100;
      if (km <= 0) {
        skipped += 1;
        continue;
      }
      const { data: outcome } = await supabase.rpc('crm_set_job_travel', {
        p_job: job.id,
        p_km: km,
        p_eur: Math.round(km * rate * 100) / 100,
      });
      if (outcome === 'ok') filled += 1;
      else skipped += 1;
    }
  }

  return NextResponse.json({ filled, skipped, located, considered: jobs?.length ?? 0 });
}
