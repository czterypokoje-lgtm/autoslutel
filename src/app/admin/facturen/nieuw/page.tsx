import type { JobBillingRecipient } from '@/lib/jobAccounts';
import { notFound } from 'next/navigation';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { priceFor, type PriceRow } from '@/lib/dispatchPricing';
import { isScenario, scenarioFromLabel } from '@/lib/scenarios';
import { prepareJobInvoice, type JobInvoiceDraft } from '@/lib/jobInvoiceDraft';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SITE_CONFIG } from '@/config/site.config';
import { BRAND, IS_KEYFORCARS, STUDIO_UI, WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { PageHead, Notice } from '../../_ui';
import { PreviewText } from '../../PreviewLanguage';
import InvoiceForm from '../InvoiceForm';
import { customerOptions } from '@/lib/kfcReceivables';
import { Invoice as KfcInvoice } from './_components/invoice';

export const dynamic = 'force-dynamic';

export default async function NieuweFactuurPage({ searchParams }: { searchParams: Promise<{ klant?: string; klus?: string }> }) {
  const { klant, klus } = await searchParams;
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
  let jobDraft: JobInvoiceDraft | undefined;
  let billing: JobBillingRecipient | null = null;
  if (klus) {
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(klus)) notFound();
    const { data: job, error } = await supabase.from('jobs').select('id, billing_account_id, customer_name, technician_id, service_type, car_make, car_model, car_year, scenario, keyless, final_price, quoted_price, revenue_materials, revenue_labor, revenue_callout, revenue_discount').eq('id', klus).maybeSingle();
    if (error) throw new Error('Klus ophalen mislukt');
    if (!job) notFound();
    if (job.billing_account_id) {
      const { data, error: billingError } = await createSupabaseAdminClient().from('kfc_customers')
        .select('id, company, phone, email, street, postcode, city, vat_number')
        .eq('id', job.billing_account_id).is('anonymised_at', null).maybeSingle();
      if (billingError) throw new Error('Klantaccount ophalen mislukt.');
      billing = data;
    }
    if (WAREHOUSE) {
      const { data: rows, error: stockError } = await createSupabaseAdminClient().from('kfc_job_stock')
        .select('id, quantity, article_code, kfc_articles (name)').eq('job_id', klus).eq('state', 'used').order('created_at');
      if (stockError) throw new Error('Gebruikte voorraad ophalen mislukt');
      const used = (rows ?? []).map((row) => ({
        ...row, name: (row.kfc_articles as unknown as { name: string } | null)?.name,
      }));
      if (used.length) {
        const scenario = isScenario(job.scenario) ? job.scenario : scenarioFromLabel(job.service_type);
        let serviceTariff: number | undefined;
        if (job.car_make && scenario && user.role !== 'monteur') {
          const { data: rates, error: rateError } = await supabase.from('dispatch_pricing')
            .select('make, model, scenario, from_year, to_year, keyless, price, service_price').eq('scenario', scenario);
          if (rateError) throw new Error('Tarieven ophalen mislukt');
          serviceTariff = priceFor((rates ?? []) as PriceRow[], {
            make: job.car_make, model: job.car_model, year: job.car_year,
          }, scenario, job.keyless)?.servicePrice;
        }
        jobDraft = prepareJobInvoice(job, used, serviceTariff);
      }
    }
  }

  // KeyForCars: the Studio Admin invoice screen (form + live A4 preview), billing ledger customers.
  if (IS_KEYFORCARS) {
    return (
      <KfcInvoice
        jobDraft={jobDraft}
        jobId={klus}
        customers={await customerOptions()}
        initialCustomerId={billing?.id ?? klant ?? null}
        from={{ name: BRAND.name, email: '', phone: '', website: '', street: '', postcode: '', city: '', kvk: '', btw: '', iban: '', accountName: BRAND.name }}
      />
    );
  }

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

  /* Autosleutel24's Studio look: the same Studio screen, with a free-text
     client, the price list and (for the office) the monteur picker. */
  if (STUDIO_UI) {
    return (
      <KfcInvoice
        jobDraft={jobDraft}
        jobId={klus}
        customers={[]}
        initialCustomerId={null}
        billing={billing ?? undefined}
        freeTextClient
        previousClients={uniqueClients}
        technicians={user.role === 'monteur' ? undefined : (technicians as { id: string; name: string }[])}
        from={{
          name: SITE_CONFIG.fullName,
          email: SITE_CONFIG.email,
          phone: SITE_CONFIG.phone,
          website: SITE_CONFIG.domain,
          street: '',
          postcode: '',
          city: '',
          kvk: SITE_CONFIG.kvk,
          btw: SITE_CONFIG.btw,
          iban: SITE_CONFIG.iban,
          accountName: SITE_CONFIG.fullName,
        }}
      />
    );
  }

  return (
    <>
      <PageHead
        title={<PreviewText>Nieuwe factuur</PreviewText>}
        sub="Vul de klant en de regels in — het nummer, de btw en het totaal worden voor u berekend."
      />
      <InvoiceForm
        billing={billing ?? undefined}
        jobDraft={jobDraft}
        jobId={klus}
        technicians={technicians as { id: string; name: string }[]}
        showTechnicianPicker={!IS_KEYFORCARS && user.role !== 'monteur'}
        customers={IS_KEYFORCARS ? await customerOptions() : undefined}
        initialCustomerId={klant ?? null}
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
