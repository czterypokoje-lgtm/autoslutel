import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { STUDIO_UI } from '@/config/install';
import { PageHead } from '../../_ui';
import ExpenseForm from './ExpenseForm';
import { StudioExpenseForm } from './_components/expense-form';

export const dynamic = 'force-dynamic';

export default async function NieuweUitgavePage() {
  const user = await requireCrmUser('/admin/uitgaven/nieuw');
  const supabase = await createSupabaseServerClient();
  const isOffice = user.role !== 'monteur';

  let myTechId = null;
  if (!isOffice) {
    const me = await supabase.from('technicians').select('id').eq('user_id', user.id).single();
    if (me.data) myTechId = me.data.id;
  }

  const { data: technicians } = await supabase.from('technicians').select('id, name').eq('active', true);

  if (STUDIO_UI) {
    return (
      <StudioExpenseForm
        technicians={(technicians ?? []) as { id: string; name: string }[]}
        isOffice={isOffice}
        myTechId={myTechId}
      />
    );
  }

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