import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../jobs/jobs.module.css';
import MonteursPanel, { type Technician } from './MonteursPanel';

export const dynamic = 'force-dynamic';

export default async function MonteursPage() {
  await requireOfficeUser('/admin/monteurs');

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('technicians')
    .select('id, name, phone, active, werkgebied, color, user_id')
    .order('name');

  if (error) {
    const missing = /permission denied|does not exist|relation/i.test(error.message);
    return (
      <div className={styles.warning}>
        Monteurs konden niet worden geladen: {error.message}
        {missing && (
          <>
            <br />
            Voer <code>supabase/migrations/0004_jobs_agenda.sql</code> uit in de
            Supabase SQL editor.
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Monteurs</h1>
        <span className={styles.count}>
          {(data ?? []).length} {(data ?? []).length === 1 ? 'monteur' : 'monteurs'}
        </span>
      </div>
      <MonteursPanel technicians={(data ?? []) as unknown as Technician[]} />
    </>
  );
}
