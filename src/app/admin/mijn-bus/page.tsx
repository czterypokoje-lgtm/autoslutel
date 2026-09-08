import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import BusDashboard from './BusDashboard';

export const dynamic = 'force-dynamic';

export default async function MijnBusPage() {
  const user = await requireCrmUser();
  const supabase = await createSupabaseServerClient();

  if (user.role !== 'monteur') {
    return <div>Alleen monteurs hebben een bus. (Gebruik de kantoor-schermen om centrale voorraad te zien.)</div>;
  }

  // Get the technician ID
  const { data: tech } = await supabase
    .from('technicians')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!tech) return <div>Technician profiel ontbreekt.</div>;

  // Fetch the stock currently in this van
  const { data: myStock } = await supabase
    .from('stock_items')
    .select('*')
    .eq('technician_id', tech.id)
    .order('description', { ascending: true });

  // Fetch central stock (technician_id IS NULL)
  const { data: centralStock } = await supabase
    .from('stock_items')
    .select('*')
    .is('technician_id', null)
    .order('description', { ascending: true });

  // Fetch other technicians for transfers
  const { data: otherTechs } = await supabase
    .from('technicians')
    .select('id, name')
    .neq('id', tech.id)
    .order('name', { ascending: true });

  return (
    <div style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--gray-900)' }}>Mijn bus</h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Jouw huidige werkvoorraad. Pak spullen uit het magazijn of draag over aan collega's.
        </p>
      </header>
      
      <BusDashboard 
        myStock={myStock || []} 
        centralStock={centralStock || []} 
        otherTechs={otherTechs || []}
        technicianId={tech.id}
      />
    </div>
  );
}
