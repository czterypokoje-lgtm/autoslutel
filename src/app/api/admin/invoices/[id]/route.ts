import { NextResponse } from 'next/server';
import { getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Change an invoice — either just its status, or the whole thing.
 *
 * Anyone who can see the invoice at all (RLS on sales_invoices, same policy
 * for read and write) may PATCH it: a monteur paid on the spot needs to mark
 * betaald from the van, and a typo in a client's postcode should not need a
 * trip back to the office to fix.
 *
 * A status-only body (`{ status }` alone) takes the cheap path. Anything with
 * `lines` is a full edit: the header is updated and every line is replaced —
 * there is no per-line diff, because the form never submits one line at a
 * time, only the whole invoice as it stands on screen.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = new Set(['concept', 'verzonden', 'betaald']);

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function money(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) && n >= 0 && n < 100_000_000 ? Math.round(n * 100) / 100 : null;
}

interface LineInput {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: number;
}

function readLine(raw: unknown): LineInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const description = text(r.description, 300);
  if (!description) return null;

  const quantity = money(r.quantity) ?? 0;
  const unitPrice = money(r.unitPrice);
  const discount = money(r.discount) ?? 0;
  const vatRate = money(r.vatRate);
  if (quantity <= 0 || unitPrice === null || vatRate === null) return null;

  return { description, quantity, unitPrice, discount, vatRate };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  if (!user.role) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Ongeldig factuur-id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  /* ── status only ── */
  if (!Array.isArray(body.lines)) {
    if (typeof body.status !== 'string' || !STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'Onbekende status' }, { status: 400 });
    }

    /*
     * paid_at is set the moment betaald is first chosen, and cleared if the
     * status is ever moved back off it — a plain line of text on the sheet
     * ("Betaald op ...") needs a real date behind it, not just a boolean.
     */
    const { error } = await supabase
      .from('sales_invoices')
      .update({
        status: body.status,
        paid_at: body.status === 'betaald' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: `Opslaan mislukt: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  /* ── full edit ── */
  const clientName = text(body.client_name, 200);
  if (!clientName) {
    return NextResponse.json({ error: 'Naam van de klant is verplicht' }, { status: 400 });
  }

  const lines = body.lines.map(readLine);
  if (!lines.length || lines.some((l) => l === null)) {
    return NextResponse.json(
      { error: 'Elke regel heeft een omschrijving, aantal, prijs en btw nodig' },
      { status: 400 }
    );
  }
  const goodLines = lines as LineInput[];

  const creditApplied = money(body.credit_applied) ?? 0;

  let subtotal = 0;
  let vatTotal = 0;
  for (const l of goodLines) {
    const base = l.quantity * l.unitPrice - l.discount;
    subtotal += base;
    vatTotal += base * (l.vatRate / 100);
  }
  subtotal = Math.round(subtotal * 100) / 100;
  vatTotal = Math.round(vatTotal * 100) / 100;
  const total = Math.round((subtotal + vatTotal - creditApplied) * 100) / 100;

  const asked = text(body.technician_id, 40);
  const technicianId = user.role === 'monteur' ? undefined : asked && UUID.test(asked) ? asked : null;

  const { error: headerError } = await supabase
    .from('sales_invoices')
    .update({
      biller_name: text(body.biller_name, 200) ?? undefined,
      biller_street: text(body.biller_street, 200),
      biller_postcode: text(body.biller_postcode, 20),
      biller_city: text(body.biller_city, 100),
      biller_email: text(body.biller_email, 200),
      biller_phone: text(body.biller_phone, 40),
      biller_kvk: text(body.biller_kvk, 40),
      biller_btw: text(body.biller_btw, 40),
      biller_iban: text(body.biller_iban, 40),
      client_name: clientName,
      client_street: text(body.client_street, 200),
      client_postcode: text(body.client_postcode, 20),
      client_city: text(body.client_city, 100),
      client_email: text(body.client_email, 200),
      client_phone: text(body.client_phone, 40),
      client_btw: text(body.client_btw, 40),
      notes: text(body.notes, 2000),
      credit_applied: creditApplied,
      subtotal,
      vat_total: vatTotal,
      total,
      ...(technicianId !== undefined ? { technician_id: technicianId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (headerError) {
    return NextResponse.json({ error: `Opslaan mislukt: ${headerError.message}` }, { status: 500 });
  }

  /* Every line is replaced — the form has no notion of "this one line
     changed", only "this is the invoice as it now stands". */
  const { error: deleteError } = await supabase.from('sales_invoice_lines').delete().eq('invoice_id', id);
  if (deleteError) {
    return NextResponse.json({ error: `Regels bijwerken mislukt: ${deleteError.message}` }, { status: 500 });
  }

  const { error: insertError } = await supabase.from('sales_invoice_lines').insert(
    goodLines.map((l, index) => ({
      invoice_id: id,
      line_no: index,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      discount: l.discount,
      vat_rate: l.vatRate,
    }))
  );

  if (insertError) {
    return NextResponse.json(
      { error: `Factuur bijgewerkt, maar regels opslaan mislukte: ${insertError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

/**
 * Delete an invoice.
 *
 * Only a concept. A factuur that has been sent or paid carries an invoice
 * number from a gap-free sequence, and a missing number in that sequence is
 * the first thing an accountant asks about — the Belastingdienst expects an
 * issued invoice to be kept for seven years (AWR art. 52), not removed. The
 * way to undo one of those is a creditfactuur, which leaves both documents
 * in the books and explains itself.
 *
 * A concept was never issued, so there is nothing to keep. RLS does the
 * ownership check: a monteur reaches only their own rows, the office reaches
 * all of them, and the same rule already governs reading and editing.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  if (!user.role) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Ongeldig factuur-id' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: invoice, error: readError } = await supabase
    .from('sales_invoices')
    .select('id, status, invoice_number')
    .eq('id', id)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }
  if (!invoice) {
    // Either gone already, or RLS says it is not theirs. Same answer either way.
    return NextResponse.json({ error: 'Factuur niet gevonden' }, { status: 404 });
  }

  if (invoice.status !== 'concept') {
    return NextResponse.json(
      {
        error:
          `Factuur ${invoice.invoice_number} is al ${invoice.status} en mag niet worden verwijderd. ` +
          'Maak een creditfactuur om hem terug te draaien.',
      },
      { status: 409 }
    );
  }

  const { error: deleteError } = await supabase.from('sales_invoices').delete().eq('id', id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // sales_invoice_lines cascade from the FK in 0032.
  return NextResponse.json({ ok: true });
}
