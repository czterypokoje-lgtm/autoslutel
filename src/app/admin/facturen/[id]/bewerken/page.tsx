import { PreviewText } from '@/app/admin/PreviewLanguage';
import { notFound } from 'next/navigation';
import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { STUDIO_UI } from '@/config/install';
import { PAYMENT_TERM_DAYS } from '@/lib/invoiceDue';
import { PageHead, Notice } from '../../../_ui';
import InvoiceForm, { type InvoiceFormValues } from '../../InvoiceForm';
import { Invoice as StudioInvoice } from '../../nieuw/_components/invoice';
import {
  dueDateFor, type InvoiceFormValues as StudioInvoiceFormValues, invoiceTaxOptions, WALK_IN_ID,
} from '../../nieuw/_components/data';

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

  /*
   * The Studio form carries ONE btw rate and ONE invoice-wide discount, which
   * it spreads back over the lines on save. That is a faithful round trip only
   * while every line already shares a rate the form actually offers (21/9/0);
   * a legacy invoice with mixed or exotic rates would be silently re-rated, so
   * it keeps the old form, which edits btw per line.
   */
  const lineRates = new Set((lines ?? []).map((l) => Number(l.vat_rate)));
  const uniformRate = lineRates.size === 1 ? [...lineRates][0]! : null;
  const studioSafe = uniformRate !== null && invoiceTaxOptions.some((option) => option.rate === uniformRate);

  if (STUDIO_UI && studioSafe) {
    const issuedDate = String(invoice.issue_date).slice(0, 10);
    const items = (lines ?? []).map((l, index) => ({
      id: `item-${index}`,
      description: l.description ?? '',
      quantity: Number(l.quantity) || 0,
      unitPrice: Number(l.unit_price) || 0,
    }));
    const studioInitial: StudioInvoiceFormValues = {
      referenceNumber: invoice.invoice_number ?? '',
      technicianId: invoice.technician_id ?? '',
      issuedDate,
      paymentDueDate: dueDateFor(issuedDate, PAYMENT_TERM_DAYS),
      from: {
        name: invoice.biller_name ?? '',
        email: invoice.biller_email ?? '',
        phone: invoice.biller_phone ?? '',
        website: '',
        street: invoice.biller_street ?? '',
        postcode: invoice.biller_postcode ?? '',
        city: invoice.biller_city ?? '',
        kvk: invoice.biller_kvk ?? '',
        btw: invoice.biller_btw ?? '',
        iban: invoice.biller_iban ?? '',
        accountName: invoice.biller_name ?? '',
      },
      to: {
        id: WALK_IN_ID,
        name: invoice.client_name ?? '',
        email: invoice.client_email ?? '',
        phone: invoice.client_phone ?? '',
        street: invoice.client_street ?? '',
        postcode: invoice.client_postcode ?? '',
        city: invoice.client_city ?? '',
        btw: invoice.client_btw ?? '',
        termsDays: PAYMENT_TERM_DAYS,
      },
      taxId: String(uniformRate),
      discountType: 'fixed',
      // The stored per-line discounts add back up to one invoice discount; the
      // form re-allocates the same total, so no total moves.
      discountValue: (lines ?? []).reduce((sum, l) => sum + (Number(l.discount) || 0), 0),
      creditApplied: Number(invoice.credit_applied) || 0,
      notes: invoice.notes ?? '',
      items: items.length ? items : [{ id: 'item-1', description: '', quantity: 1, unitPrice: 0 }],
    };

    return (
      <>
        {invoice.status !== 'concept' && (
          <Notice tone="info">
            Deze factuur staat op &ldquo;<PreviewText>{invoice.status === 'betaald' ? 'Betaald' : 'Verzonden'}</PreviewText>&rdquo;. Een
            bewerking hier verandert alleen de inhoud, niet die status — pas een al verstuurde factuur alleen aan
            als de klant nog geen kopie heeft.
          </Notice>
        )}
        <StudioInvoice
          customers={[]}
          initialCustomerId={null}
          freeTextClient
          technicians={user.role === 'monteur' ? undefined : (techniciansResult.data ?? []) as { id: string; name: string }[]}
          invoiceId={invoice.id}
          initial={studioInitial}
          from={studioInitial.from}
        />
      </>
    );
  }

  return (
    <>
      <PageHead
        title={`Factuur ${invoice.invoice_number} bewerken`}
        sub="Wijzigingen slaan direct op — het nummer en de status blijven hetzelfde."
      />
      {invoice.status !== 'concept' && (
        <Notice tone="info">
          Deze factuur staat op &ldquo;<PreviewText>{invoice.status === 'betaald' ? 'Betaald' : 'Verzonden'}</PreviewText>&rdquo;. Een
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
