import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../jobs/jobs.module.css';
import MonteursPanel, { type Technician } from './MonteursPanel';
import { PageHead } from '../_ui';

export const dynamic = 'force-dynamic';

export default async function MonteursPage() {
  await requireOfficeUser('/admin/monteurs');

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('technicians')
    .select('id, name, phone, active, werkgebied, color, user_id, photo_url, online, employment_type')
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

  const list = (data ?? []) as unknown as Technician[];
  const active = list.filter((t) => t.active).length;
  const onDuty = list.filter((t) => t.active && t.online).length;
  const noLogin = list.filter((t) => t.active && !t.user_id).length;

  return (
    <>
      <PageHead
        title="Monteurs"
        sub={`${active} actief · ${onDuty} nu op dienst${noLogin ? ` · ${noLogin} zonder login` : ''}. Klik Open voor dekking, prijzen en logboek.`}
      />
      <MonteursPanel technicians={list} />
    </>
  );
}
