import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isoDate } from '@/lib/crmJobs';
import styles from './vandaag.module.css';
import VanScreen, { type VanJob } from './VanScreen';

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

  let query = supabase
    .from('jobs')
    .select(
      'id, status, scheduled_date, slot_start, slot_end, street, postcode, city, kenteken, service_type, quoted_price, final_price, notes, customer_name, customer_phone, signature_url'
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

  return (
    <VanScreen
      jobs={(data ?? []) as unknown as VanJob[]}
      technicianName={me?.name ?? null}
      today={today}
    />
  );
}
