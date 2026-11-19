import { NextResponse } from 'next/server';
import { SITE_CONFIG } from '@/config/site.config';
import { amsterdamDate, checkOps, logOps } from '@/lib/opsAuth';
import { readDraft } from '@/lib/opsInvoiceDraft';
import { summarizeInvoices } from '@/lib/opsInvoices';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const LIMIT = 1000;
const DRAFTS_PER_DAY = 20;

/**
 * Sales invoices for the office assistant: counts, open amounts and the latest
 * ones. Read only, and without e-mail or address fields, which it has no use for.
 */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('sales_invoices')
    .select('invoice_number, issue_date, client_name, total, status')
    .order('issue_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(LIMIT);

  if (error) {
    console.error('ops invoices read failed:', error.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  const rows = data ?? [];
  await logOps(supabase, 'invoices.read', { count: rows.length });
  return NextResponse.json({
    ...summarizeInvoices(rows, amsterdamDate()),
    /* Older invoices are left out past this point, so the totals would be too low. */
    incomplete: rows.length === LIMIT,
  });
}

/**
 * A new draft. Always status concept: nothing here can send, finish or change an
 * invoice. Each draft uses a number from the invoice series, so a looping
 * assistant is stopped at DRAFTS_PER_DAY.
 */
export async function POST(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const result = readDraft(body);
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
  const { draft } = result;

  const supabase = createSupabaseAdminClient();

  const { count, error: countError } = await supabase
    .from('ops_audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'invoice.draft')
    .gte('created_at', new Date(Date.now() - 86_400_000).toISOString());

  if (countError) {
    console.error('ops draft count failed:', countError.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }
  if ((count ?? 0) >= DRAFTS_PER_DAY) {
    return NextResponse.json({ error: 'Daglimiet voor concepten bereikt' }, { status: 429 });
  }

  const { data: invoice, error } = await supabase
    .from('sales_invoices')
    .insert({
      status: 'concept',
      biller_name: SITE_CONFIG.fullName,
      biller_email: SITE_CONFIG.email,
      biller_phone: SITE_CONFIG.phone,
      biller_kvk: SITE_CONFIG.kvk,
      biller_btw: SITE_CONFIG.btw || null,
      /* The placeholder in the config must never land on a stored invoice. */
      biller_iban: SITE_CONFIG.iban.startsWith('NL00BANK') ? null : SITE_CONFIG.iban,
      client_name: draft.client.name,
      client_street: draft.client.street,
      client_postcode: draft.client.postcode,
      client_city: draft.client.city,
      client_email: draft.client.email,
      client_phone: draft.client.phone,
      client_btw: draft.client.btw,
      notes: draft.notes,
      subtotal: draft.subtotal,
      vat_total: draft.vatTotal,
      total: draft.total,
    })
    .select('id, invoice_number')
    .single();

  if (error || !invoice) {
    console.error('ops draft insert failed:', error?.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  await logOps(supabase, 'invoice.draft', { number: invoice.invoice_number });

  const { error: lineError } = await supabase.from('sales_invoice_lines').insert(
    draft.lines.map((line, index) => ({
      invoice_id: invoice.id,
      line_no: index,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      discount: 0,
      vat_rate: line.vatRate,
    }))
  );

  if (lineError) {
    console.error('ops draft lines failed:', lineError.message);
    return NextResponse.json(
      { error: `Concept ${invoice.invoice_number} aangemaakt, maar regels opslaan mislukte` },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      number: invoice.invoice_number,
      client: draft.client.name,
      subtotal: draft.subtotal,
      vatTotal: draft.vatTotal,
      total: draft.total,
    },
    { status: 201 }
  );
}
