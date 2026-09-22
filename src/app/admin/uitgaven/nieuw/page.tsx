import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead } from '../../_ui';
import ExpenseForm from './ExpenseForm';

export const dynamic = 'force-dynamic';

export default async function NieuweUitgavePage() {
  const user = await requireCrmUser('/admin/uitgaven/nieuw');
  const supabase = await createSupabaseServerClient();
  const isOffice = user.role !== 'monteur';

  let myTechId = null;
  if (!isOffice) {
    const me = await supabase.from('technicians').select('id').eq('email', user.email).single();
    if (me.data) myTechId = me.data.id;
  }

  const { data: technicians } = await supabase.from('technicians').select('id, name').eq('active', true);

  return (
    <>
      <PageHead
        title="Nieuwe Uitgave"
        sub="Registreer een bedrijfskost of dien een bonnetje in voor declaratie."
      />
      <ExpenseForm 
        technicians={technicians || []} 
        isOffice={isOffice} 
        myTechId={myTechId} 
      />
    </>
  );
}