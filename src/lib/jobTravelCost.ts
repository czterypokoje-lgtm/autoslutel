import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getDriveTime } from './googleMaps';

/**
 * What a job cost in fuel.
 *
 * The owner's rule: a per-kilometre rate times the distance driven, rather
 * than asking a monteur to tag every receipt to a job. Nobody types anything;
 * the number appears when the job is marked afgerond.
 *
 * Deliberately not derived from the `expenses` fuel receipts that arrive over
 * Telegram. Those are real money and belong in the monthly books, but a tank
 * filled on Tuesday cannot be attributed to Tuesday's third job without
 * someone deciding how — which is the manual tagging this replaces. The two
 * live side by side on purpose: expenses answer "what did we spend", this
 * answers "what did this job cost us".
 */

/** €0.23/km is the Dutch untaxed norm; it moves about twice a year. */
const DEFAULT_EUR_PER_KM = 0.23;

function ratePerKm(): number {
  const raw = Number(process.env.FUEL_EUR_PER_KM);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_EUR_PER_KM;
}

interface JobRow {
  lat: number | string | null;
  lng: number | string | null;
  technician_id: string | null;
  travel_km: number | null;
  cost_travel: number | null;
}

const coord = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * Measures the round trip for one job and books it, once.
 *
 * Best-effort by design: it runs inside `after()`, long past the response the
 * monteur is waiting on, and a job that finished is not less finished because
 * Google was unreachable. Every failure path leaves both columns null rather
 * than writing a zero — a 0 reads as "we drove nowhere" and quietly flatters
 * every margin it touches.
 */
export async function fillTravelCost(supabase: SupabaseClient, jobId: string): Promise<void> {
  try {
    const { data: job } = await supabase
      .from('jobs')
      .select('lat, lng, technician_id, travel_km, cost_travel')
      .eq('id', jobId)
      .maybeSingle<JobRow>();

    // Already measured, or already typed by hand. The RPC would refuse anyway;
    // this saves the Distance Matrix call.
    if (!job || job.travel_km !== null || Number(job.cost_travel ?? 0) !== 0) return;

    const jobLat = coord(job.lat);
    const jobLng = coord(job.lng);
    if (jobLat === null || jobLng === null || !job.technician_id) return;

    const { data: technician } = await supabase
      .from('technicians')
      .select('base_lat, base_lng')
      .eq('id', job.technician_id)
      .maybeSingle<{ base_lat: number | string | null; base_lng: number | string | null }>();

    const baseLat = coord(technician?.base_lat);
    const baseLng = coord(technician?.base_lng);
    if (baseLat === null || baseLng === null) return;

    const drive = await getDriveTime({ lat: baseLat, lng: baseLng }, { lat: jobLat, lng: jobLng });
    if (!drive) return;

    /*
     * Round trip: the van has to come back.
     *
     * ponytail: a straight there-and-back, per job. Three jobs on one loop are
     * each charged the full return leg, so a busy day is overstated. Per-day
     * route stitching is the upgrade, when someone actually asks for it — it
     * needs the day's jobs in visit order, which nothing records yet.
     */
    const km = Math.round((2 * drive.distanceMeters) / 10) / 100;
    if (km <= 0) return;

    const euro = Math.round(km * ratePerKm() * 100) / 100;

    const { data: outcome, error } = await supabase.rpc('crm_set_job_travel', {
      p_job: jobId,
      p_km: km,
      p_eur: euro,
    });

    if (error) {
      console.error('Travel cost write failed:', error.message);
    } else if (outcome !== 'ok') {
      // 'al_bekend' — someone typed a figure, or a concurrent call won. Fine.
      console.info(`Travel cost for job ${jobId} not written: ${outcome}`);
    }
  } catch (err) {
    console.error('Travel cost failed:', err instanceof Error ? err.message : err);
  }
}
