import { redirect } from 'next/navigation';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../jobs/jobs.module.css';
import Wizard from './Wizard';

export const dynamic = 'force-dynamic';

export default async function StartPage() {
  const user = await requireCrmUser('/admin/start');

  if (user.role !== 'monteur') {
    redirect('/admin');
  }

  const supabase = await createSupabaseServerClient();

  const { data: me } = await supabase
    .from('technicians')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!me) {
    return (
      <div className={styles.warning}>
        Je account is nog niet aan een monteur gekoppeld. Vraag kantoor om dit te doen.
      </div>
    );
  }

  // If they somehow land here but already have coverage, redirect to vandaag
  const { data: coverage } = await supabase
    .from('technician_coverage')
    .select('id')
    .eq('technician_id', me.id)
    .limit(1);

  if (coverage && coverage.length > 0) {
    redirect('/admin/vandaag');
  }

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Welkom, {me.name}</h1>
      </div>
      <p className={styles.note} style={{ marginBottom: 20 }}>
        Voordat je klussen kunt ontvangen, moeten we weten waar je werkt en wat je kunt.
      </p>
      <Wizard technicianId={me.id} />
    </>
  );
}
