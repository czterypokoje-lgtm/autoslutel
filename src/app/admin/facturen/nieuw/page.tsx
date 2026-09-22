import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SITE_CONFIG } from '@/config/site.config';
import { PageHead } from '../../_ui';
import InvoiceForm from '../InvoiceForm';

export const dynamic = 'force-dynamic';

export default async function NieuweFactuurPage() {
  const user = await requireCrmUser('/admin/facturen/nieuw');
  const supabase = await createSupabaseServerClient();

  /* The office may bill on any technician's behalf; a monteur only ever
     files their own — same split the invoice-upload route already uses. */
  
  const { data: clients } = await supabase
    .from('sales_invoices')
    .select('client_name, client_street, client_postcode, client_city, client_email, client_phone, client_btw')
    .not('client_name', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200);

  const uniqueClients = Array.from(new Map(
    (clients || []).map(c => [c.client_name, c])
  ).values());


  const technicians =
    user.role === 'monteur'
      ? []
      : ((await supabase.from('technicians').select('id, name').eq('active', true).order('name'))
          .data ?? []);

  return (
    <>
      <PageHead
        title="Nieuwe factuur"
        sub="Vul de klant en de regels in — het nummer, de btw en het totaal worden voor u berekend."
      />
      <InvoiceForm
        technicians={technicians as { id: string; name: string }[]}
        showTechnicianPicker={user.role !== 'monteur'}
        biller={{
          name: SITE_CONFIG.fullName,
          email: SITE_CONFIG.email,
          phone: SITE_CONFIG.phone,
          kvk: SITE_CONFIG.kvk,
          btw: SITE_CONFIG.btw,
          iban: SITE_CONFIG.iban,
        }}
        previousClients={uniqueClients}
      />
    </>
  );
}
