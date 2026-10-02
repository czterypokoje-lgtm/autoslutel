import { redirect } from 'next/navigation';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Notice } from '../_ui';
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
      <Notice tone="bad">Je account is nog niet aan een monteur gekoppeld. Vraag kantoor om dit te doen.</Notice>
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
      <PageHead
        title={`Welkom, ${me.name.split(' ')[0]}`}
        sub="Vier korte stappen. Daarna weten we waar je werkt en wat je kunt, en krijg je klussen aangeboden."
      />
      <Wizard technicianId={me.id} />
    </>
  );
}
