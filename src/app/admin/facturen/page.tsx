import Link from 'next/link';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { STUDIO_UI } from '@/config/install';
import { PageHead, Notice, ui } from '../_ui';
import FacturenTable from './FacturenTable';
import type { InvoiceRow } from './_components/data';
import { Invoices } from './_components/invoices';
import { getBrandLogo } from '@/lib/brandLogos';

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
      due_date,
      client_name, 
      client_city,
      client_email,
      client_phone,
      total, 
      status,
      technician:technician_id ( name ),
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

  let { data, error }: { data: unknown; error: { message: string } | null } = await query;
  // Before migration 0144 there is no due_date column: read the list without it instead of showing an error.
  if (error && /due_date/.test(error.message)) {
    ({ data, error } = await supabase.from('sales_invoices').select(`id, invoice_number, issue_date, client_name, client_city, client_email, client_phone, total, status, technician:technician_id ( name ), job:job_id ( id, car_make, car_model, kenteken, service_type )`).order('created_at', { ascending: false }).limit(300));
  }

  /* Same query, same role split — only the markup differs. */
  const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => {
    const job = (Array.isArray(r.job) ? r.job[0] : r.job) as { car_make?: string | null } | null;
    const tech = (Array.isArray(r.technician) ? r.technician[0] : r.technician) as { name?: string } | null;
    return {
      ...(r as object),
      job,
      technician_name: tech?.name ?? null,
      logo: getBrandLogo(job?.car_make ?? null),
    } as never;
  });

  if (STUDIO_UI) {
    if (error) {
      return (
        <>
          <PageHead title="Facturen" />
          <Notice tone="bad">Facturen konden niet worden geladen: {error.message}</Notice>
        </>
      );
    }
    return (
      <Invoices
        rows={rows as unknown as InvoiceRow[]}
        showTechnician={user.role !== 'monteur'}
        isMonteur={user.role === 'monteur'}
      />
    );
  }

  return (
    <>
      <PageHead
        title="Facturen"
        sub="Facturen aan klanten: concept, verzonden, betaald. Klik een factuur voor details, verzenden of de PDF."
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
        <FacturenTable showTechnician={user.role !== 'monteur'} rows={rows} />
      )}
      
      {user.role === 'monteur' && (
        <div style={{marginTop: "24px"}}><Notice tone="info">U ziet de facturen die u zelf heeft opgesteld en de facturen die het kantoor aan u heeft gericht.</Notice></div>
      )}
    </>
  );
}
