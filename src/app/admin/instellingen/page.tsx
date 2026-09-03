import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import styles from '../klanten/klanten.module.css';
import SettingsPanels, { type Template, type StockItem, type Tech } from './SettingsPanels';

export const dynamic = 'force-dynamic';

export default async function InstellingenPage() {
  await requireOfficeUser('/admin/instellingen');

  const supabase = await createSupabaseServerClient();
  const [{ data: templates, error: tErr }, { data: stock }, { data: techs }] =
    await Promise.all([
      supabase
        .from('service_templates')
        .select('id, name, service_type, price_incl, monteur_fee, duration_slots, active')
        .order('sort_order'),
      supabase
        .from('stock_items')
        .select('id, technician_id, description, quantity, min_quantity')
        .order('description'),
      supabase.from('technicians').select('id, name').eq('active', true).order('name'),
    ]);

  if (tErr) {
    const missing = /does not exist|relation|permission denied/i.test(tErr.message);
    return (
      <div className={styles.warning}>
        Instellingen konden niet worden geladen: {tErr.message}
        {missing && (
          <>
            <br />
            Voer <code>supabase/migrations/0008_calendar_stock_templates.sql</code> uit.
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Instellingen</h1>
        <span className={styles.count}>diensten en voorraad</span>
      </div>
      <SettingsPanels
        templates={(templates ?? []) as unknown as Template[]}
        stock={(stock ?? []) as unknown as StockItem[]}
        technicians={(techs ?? []) as unknown as Tech[]}
      />
    </>
  );
}
