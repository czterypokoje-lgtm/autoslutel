import { STUDIO_UI } from '@/config/install';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../jobs/jobs.module.css';
import MonteursPanel, { type Technician } from './MonteursPanel';
import StudioMonteursPanel from './StudioMonteursPanel';
import { PageHead } from '../_ui';
import { PreviewText } from '../PreviewLanguage';

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
    if (STUDIO_UI) {
      return (
        <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
          <p className="text-destructive text-sm">
            <PreviewText>{`Monteurs konden niet worden geladen: ${error.message}`}</PreviewText>
            {missing && (
              <>
                <br />
                <PreviewText>{'Voer supabase/migrations/0004_jobs_agenda.sql uit in de Supabase SQL editor.'}</PreviewText>
              </>
            )}
          </p>
        </div>
      );
    }
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
  const sub = `${active} actief · ${onDuty} nu op dienst${noLogin ? ` · ${noLogin} zonder login` : ''}. Klik Open voor dekking, prijzen en logboek.`;

  if (STUDIO_UI) {
    return (
      <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight"><PreviewText>Monteurs</PreviewText></h1>
          <p className="text-muted-foreground text-sm"><PreviewText>{sub}</PreviewText></p>
        </div>
        <StudioMonteursPanel technicians={list} />
      </div>
    );
  }

  return (
    <>
      <PageHead title="Monteurs" sub={sub} />
      <MonteursPanel technicians={list} />
    </>
  );
}
