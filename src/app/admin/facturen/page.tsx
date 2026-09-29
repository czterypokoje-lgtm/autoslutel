import Link from 'next/link';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Notice, ui } from '../_ui';
import FacturenTable from './FacturenTable';

export const dynamic = 'force-dynamic';

export default async function FacturenPage() {
  const user = await requireCrmUser('/admin/facturen');
  const supabase = await createSupabaseServerClient();

  // Fetch invoices with job vehicle data
  const query = supabase
    .from('sales_invoices')
    .select(`
      id, 
      invoice_number, 
      issue_date, 
      client_name, 
      client_city,
      client_email,
      client_phone,
      total, 
      status,
      job:job_id (
        id,
        car_make,
        car_model,
        kenteken,
        service_type
      )
    `)
    .order('created_at', { ascending: false })
    .limit(300);

  /*
   * No extra filter for a monteur. This used to add
   * `.eq('created_by', user.id)`, which is NARROWER than the table's own RLS
   * policy (0032):
   *
   *   crm_role() in ('owner','kantoor')
   *   or technician_id = my_technician_id()
   *   or created_by = auth.uid()
   *
   * The policy already lets a monteur see an invoice addressed to them —
   * `technician_id` — and the app filter threw that half away. So an invoice
   * the office raised FOR Garage NRD was invisible to Garage NRD, and the
   * screen told them it was only ever going to show their own. Duplicating an
   * access rule in the query is how the two drift; the policy is the guard,
   * and it is the only one.
   */

  const { data, error } = await query;

  return (
    <>
      <PageHead
        title="Facturen"
        sub="Maak, verzend en beheer facturen voor uw klanten."
        actions={
          <Link href="/admin/facturen/nieuw" className={`${ui.btn} ${ui.btnPrimary}`}>
            + Nieuwe factuur
          </Link>
        }
      />

      {error ? (
        <Notice tone="bad">
          Facturen konden niet worden geladen: {error.message}
        </Notice>
      ) : (
        <FacturenTable rows={(data as any) || []} />
      )}
      
      {user.role === 'monteur' && (
        <div style={{marginTop: "24px"}}><Notice tone="info">U ziet de facturen die u zelf heeft opgesteld en de facturen die het kantoor aan u heeft gericht.</Notice></div>
      )}
    </>
  );
}
