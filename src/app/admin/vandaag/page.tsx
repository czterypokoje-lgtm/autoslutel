import { redirect } from 'next/navigation';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isoDate } from '@/lib/crmJobs';
import { STUDIO_UI, WAREHOUSE } from '@/config/install';
import styles from './vandaag.module.css';
import VanScreen, { type VanJob } from './VanScreen';
import StudioVanScreen from './StudioVanScreen';
import { VanMaterialQueue } from './VanMaterialUse';
import { technicianVanStock } from '@/lib/vanStock';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { getBrandLogo } from '@/lib/brandLogos';

export const dynamic = 'force-dynamic';

/**
 * "Mijn klussen vandaag" — the monteur's whole application.
 *
 * One page, no menu, no filters. The office panel is a different job done at a
 * desk; this is used standing next to a car with one hand free.
 *
 * The office can open it too, which is how a planner checks what a monteur is
 * actually looking at.
 */
export default async function VandaagPage({
  searchParams,
}: {
  searchParams: Promise<{ monteur?: string }>;
}) {
  const user = await requireCrmUser('/admin/vandaag');
  const { monteur } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const today = isoDate(new Date());

  // Who am I on the road? For the office, optionally someone else.
  const { data: me } = await supabase
    .from('technicians')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  const technicianId =
    user.role === 'monteur' ? me?.id ?? null : monteur ?? me?.id ?? null;

  if (user.role === 'monteur' && !technicianId) {
    return (
      <div className={styles.wrap}>
        <p className={styles.warning}>
          Je account is nog niet aan een monteur gekoppeld. Vraag kantoor om je
          bij <strong>Monteurs</strong> aan je naam te koppelen — zonder die
          koppeling weet het systeem niet welke klussen van jou zijn.
        </p>
      </div>
    );
  }

  // Force first-run wizard if this is a monteur and they have no coverage declared
  if (user.role === 'monteur' && technicianId) {
    const { data: coverage } = await supabase
      .from('technician_coverage')
      .select('id')
      .eq('technician_id', technicianId)
      .limit(1);

    if (!coverage || coverage.length === 0) {
      redirect('/admin/start');
    }
  }

  let query = supabase
    .from('jobs')
    .select(
      'id, status, scheduled_date, slot_start, slot_end, street, postcode, city, kenteken, service_type, quoted_price, final_price, notes, customer_name, customer_phone, signature_url, car_make, car_model, car_year, keyless'
    )
    .eq('scheduled_date', today)
    .order('slot_start');

  if (technicianId) query = query.eq('technician_id', technicianId);

  const { data, error } = await query;

  if (error) {
    const missing = /permission denied|does not exist|relation|column/i.test(
      error.message
    );
    return (
      <div className={styles.wrap}>
        <p className={styles.warning}>
          De klussen konden niet worden geladen: {error.message}
          {missing && (
            <>
              <br />
              Voer <code>supabase/migrations/0005_job_records.sql</code> uit.
            </>
          )}
        </p>
      </div>
    );
  }

  /*
   * What is actually in this van, for the materials picker.
   *
   * `quantity > 0` on purpose: a picker that offers a part the van does not
   * hold is how a job gets charged for something that was never fitted, and
   * how the count goes wrong without anyone noticing until a stocktake.
   */
  const ledger = WAREHOUSE && !CRM_PREVIEW && user.role === 'monteur' && technicianId
    ? await technicianVanStock(technicianId) : null;
  const { data: vanStock } = ledger ? { data: [] } : await supabase
    .from('stock_items')
    .select('id, description, quantity, unit_cost')
    .eq('technician_id', technicianId || '00000000-0000-0000-0000-000000000000')
    .gt('quantity', 0)
    .order('description');

  const vanJobs = ((data ?? []) as unknown as VanJob[]).map((j) => ({ ...j, warehouseEnabled: WAREHOUSE, logo: getBrandLogo(j.car_make) }));

  const Screen = STUDIO_UI ? StudioVanScreen : VanScreen;
  const screen = <Screen jobs={vanJobs} technicianName={me?.name ?? null} today={today} vanStock={vanStock || []} />;
  return ledger ? <VanMaterialQueue owner={user.id} stock={ledger}>{screen}</VanMaterialQueue> : screen;
}
