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
  let query = supabase
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
        service_type,
        problem
      )
    `)
    .order('created_at', { ascending: false })
    .limit(300);

  // Apply RLS-like logic for monteur if needed (monteurs should only see their own)
  if (user.role === 'monteur') {
    query = query.eq('created_by', user.id);
  }

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
        <div style={{marginTop: "24px"}}><Notice tone="info">U ziet hier alleen de facturen die u zelf heeft opgesteld.</Notice></div>
      )}
    </>
  );
}
