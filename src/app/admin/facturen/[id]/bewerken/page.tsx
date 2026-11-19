import { notFound } from 'next/navigation';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Notice } from '../../../_ui';
import InvoiceForm, { type InvoiceFormValues } from '../../InvoiceForm';

export const dynamic = 'force-dynamic';

export default async function FactuurBewerkenPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireCrmUser('/admin/facturen');
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const [{ data: invoice, error }, { data: lines }, techniciansResult] = await Promise.all([
    supabase.from('sales_invoices').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('sales_invoice_lines')
      .select('description, quantity, unit_price, discount, vat_rate')
      .eq('invoice_id', id)
      .order('line_no'),
    user.role === 'monteur'
      ? Promise.resolve({ data: [] })
      : supabase.from('technicians').select('id, name').eq('active', true).order('name'),
  ]);

  if (error || !invoice) notFound();

  const initial: InvoiceFormValues = {
    billerName: invoice.biller_name ?? '',
    billerStreet: invoice.biller_street ?? '',
    billerPostcode: invoice.biller_postcode ?? '',
    billerCity: invoice.biller_city ?? '',
    billerEmail: invoice.biller_email ?? '',
    billerPhone: invoice.biller_phone ?? '',
    billerKvk: invoice.biller_kvk ?? '',
    billerBtw: invoice.biller_btw ?? '',
    billerIban: invoice.biller_iban ?? '',
    clientName: invoice.client_name ?? '',
    clientStreet: invoice.client_street ?? '',
    clientPostcode: invoice.client_postcode ?? '',
    clientCity: invoice.client_city ?? '',
    clientEmail: invoice.client_email ?? '',
    clientPhone: invoice.client_phone ?? '',
    clientBtw: invoice.client_btw ?? '',
    technicianId: invoice.technician_id ?? '',
    creditApplied: String(invoice.credit_applied ?? 0),
    notes: invoice.notes ?? '',
    lines: (lines ?? []).map((l) => ({
      description: l.description,
      quantity: String(l.quantity),
      unitPrice: String(l.unit_price),
      discount: String(l.discount),
      vatRate: String(l.vat_rate),
    })),
  };

  return (
    <>
      <PageHead
        title={`Factuur ${invoice.invoice_number} bewerken`}
        sub="Wijzigingen slaan direct op — het nummer en de status blijven hetzelfde."
      />
      {invoice.status !== 'concept' && (
        <Notice tone="info">
          Deze factuur staat op &ldquo;{invoice.status === 'betaald' ? 'Betaald' : 'Verzonden'}&rdquo;. Een
          bewerking hier verandert alleen de inhoud, niet die status — pas een al verstuurde factuur alleen aan
          als de klant nog geen kopie heeft.
        </Notice>
      )}
      <InvoiceForm
        invoiceId={invoice.id}
        initial={initial}
        technicians={(techniciansResult.data ?? []) as { id: string; name: string }[]}
        showTechnicianPicker={user.role !== 'monteur'}
        biller={{
          name: invoice.biller_name ?? '',
          email: invoice.biller_email ?? '',
          phone: invoice.biller_phone ?? '',
          kvk: invoice.biller_kvk ?? '',
          btw: invoice.biller_btw ?? '',
          iban: invoice.biller_iban ?? '',
        }}
      />
    </>
  );
}
