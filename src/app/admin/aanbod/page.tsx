import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../admin.module.css';
import { SCENARIO_INFO, isScenario } from '@/lib/scenarios';
import { slotLabel } from '@/lib/crmJobs';
import OfferList, { type OfferRow } from './OfferList';

export const dynamic = 'force-dynamic';

/**
 * Work being offered to this technician right now.
 *
 * Offered, never assigned. Declining costs nothing and is recorded without
 * comment — that is a legal position as much as a courtesy: we set the price,
 * take the payment and route the work, and a contractor who cannot say no to
 * any of it starts to look like an employee to the Belastingdienst.
 *
 * The address is deliberately incomplete until the job is accepted. The
 * postcode and the town are enough to judge the drive; the door number is the
 * customer's, and it is not handed to five people so one of them can take it.
 */
export default async function AanbodPage() {
  const user = await requireCrmUser('/admin/aanbod');
  const supabase = await createSupabaseServerClient();

  const { data: me } = await supabase
    .from('technicians')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!me) {
    return (
      <>
        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>Aanbod</h1>
          </div>
        </div>
        <p className={`${styles.note} ${styles.noteBad}`}>
          Uw login is nog niet aan een monteur gekoppeld.
        </p>
      </>
    );
  }

  const { data, error } = await supabase
    .from('job_offers')
    .select(
      'id, rank, score, reason, offered_at, expires_at, jobs (id, scheduled_date, slot_start, slot_end, postcode, city, car_make, car_model, car_year, scenario, quoted_price, keyless, technician_id)'
    )
    .eq('technician_id', me.id)
    .is('response', null)
    .order('expires_at');

  if (error) {
    return (
      <>
        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>Aanbod</h1>
          </div>
        </div>
        <p className={`${styles.note} ${styles.noteBad}`}>
          {/does not exist|relation/i.test(error.message)
            ? 'Voer supabase/migrations/0013_technician_platform.sql uit.'
            : error.message}
        </p>
      </>
    );
  }

  const now = Date.now();

  const offers: OfferRow[] = (data ?? [])
    .flatMap((row) => {
      const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
      if (!job) return [];
      // Already taken by someone faster, or the window has not opened yet.
      if (job.technician_id) return [];
      if (new Date(row.offered_at).getTime() > now) return [];
      if (new Date(row.expires_at).getTime() < now) return [];

      const scenario = isScenario(job.scenario) ? job.scenario : null;

      return [
        {
          id: row.id,
          reason: row.reason ?? '',
          expiresAt: row.expires_at,
          car: [job.car_make, job.car_model, job.car_year].filter(Boolean).join(' ') || 'Onbekende auto',
          work: scenario ? SCENARIO_INFO[scenario].label : 'Werk aan de sleutel',
          minutes: scenario ? SCENARIO_INFO[scenario].minutes : null,
          keyless: job.keyless,
          when: `${job.scheduled_date} · ${slotLabel(job.slot_start, job.slot_end)}`,
          where: [job.postcode, job.city].filter(Boolean).join(' ') || 'Onbekend',
          price: job.quoted_price == null ? null : Number(job.quoted_price),
        },
      ];
    });

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Aanbod</h1>
          <p className={styles.pageSub}>
            Klussen die bij uw vak en uw gebied passen. Afwijzen kost u niets en telt niet mee —
            wie het eerst accepteert, krijgt de klus.
          </p>
        </div>
      </div>

      <OfferList offers={offers} />
    </>
  );
}
