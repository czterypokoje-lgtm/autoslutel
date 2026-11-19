import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SITE_CONFIG } from '@/config/site.config';
import { BRAND, IS_KEYFORCARS } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { PageHead, Notice } from '../../_ui';
import { PreviewText } from '../../PreviewLanguage';
import InvoiceForm from '../InvoiceForm';

export const dynamic = 'force-dynamic';

export default async function NieuweFactuurPage() {
  const user = await requireCrmUser('/admin/facturen/nieuw');
  const keyForCarsBiller = { name: BRAND.name, email: '', phone: '', kvk: '', btw: '', iban: '' };
  if (CRM_PREVIEW) {
    return (
      <>
        <PageHead title={<PreviewText>Nieuwe factuur</PreviewText>} />
        <Notice><PreviewText>Factuurvoorbeeld: bedragen worden berekend in het formulier. Opslaan vereist een werkende CRM-verbinding.</PreviewText></Notice>
        <InvoiceForm technicians={[]} showTechnicianPicker={false} biller={keyForCarsBiller} preview />
      </>
    );
  }
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
        title={<PreviewText>Nieuwe factuur</PreviewText>}
        sub="Vul de klant en de regels in — het nummer, de btw en het totaal worden voor u berekend."
      />
      <InvoiceForm
        technicians={technicians as { id: string; name: string }[]}
        showTechnicianPicker={user.role !== 'monteur'}
        biller={IS_KEYFORCARS ? keyForCarsBiller : {
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
