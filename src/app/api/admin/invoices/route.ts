import { NextResponse } from 'next/server';
import { getCrmUser, CRM_ROLES } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SITE_CONFIG } from '@/config/site.config';

export const dynamic = 'force-dynamic';

/**
 * Create a sales invoice — the one a monteur or the office sends to a klant,
 * not the purchase invoices in /api/admin/invoice (singular).
 *
 * Any signed-in CRM role may post one; RLS on sales_invoices is what actually
 * decides whose invoice this becomes visible to afterwards. The totals are
 * computed here, once, from the lines in the request — never trusted from a
 * client-supplied total — and stored on the row so the PDF never drifts from
 * what was actually charged.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export async function POST(request: Request) {
  const user = await getCrmUser();
  if (!user || !user.role || !CRM_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const clientName = text(body.client_name, 200);
  if (!clientName) {
    return NextResponse.json({ error: 'Naam van de klant is verplicht' }, { status: 400 });
  }

  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  const lines = rawLines.map(readLine);
  if (!lines.length || lines.some((l) => l === null)) {
    return NextResponse.json(
      { error: 'Elke regel heeft een omschrijving, aantal, prijs en btw nodig' },
      { status: 400 }
    );
  }
  const goodLines = lines as LineInput[];

  const creditApplied = money(body.credit_applied) ?? 0;

  /* Totals, computed once here — never taken from the client as a number. */
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

  const supabase = await createSupabaseServerClient();

  let technicianId: string | null = null;
  if (user.role === 'monteur') {
    const { data } = await supabase
      .from('technicians')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    technicianId = data?.id ?? null;
  } else {
    const asked = text(body.technician_id, 40);
    technicianId = asked && UUID.test(asked) ? asked : null;
  }

  const jobId = text(body.job_id, 40);

  const { data: invoice, error } = await supabase
    .from('sales_invoices')
    .insert({
      biller_name: text(body.biller_name, 200) ?? SITE_CONFIG.fullName,
      biller_street: text(body.biller_street, 200),
      biller_postcode: text(body.biller_postcode, 20),
      biller_city: text(body.biller_city, 100),
      biller_email: text(body.biller_email, 200) ?? SITE_CONFIG.email,
      biller_phone: text(body.biller_phone, 40) ?? SITE_CONFIG.phone,
      biller_kvk: text(body.biller_kvk, 40) ?? SITE_CONFIG.kvk,
      biller_btw: text(body.biller_btw, 40) ?? SITE_CONFIG.btw,
      biller_iban: text(body.biller_iban, 40) ?? SITE_CONFIG.iban,
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
      created_by: user.id,
      technician_id: technicianId,
      job_id: jobId && UUID.test(jobId) ? jobId : null,
    })
    .select('id, invoice_number')
    .single();

  if (error || !invoice) {
    return NextResponse.json(
      {
        error: /does not exist|relation/i.test(error?.message ?? '')
          ? 'Voer supabase/migrations/0032_sales_invoices.sql uit.'
          : `Opslaan mislukt: ${error?.message ?? 'onbekend'}`,
      },
      { status: 500 }
    );
  }

  const { error: lineError } = await supabase.from('sales_invoice_lines').insert(
    goodLines.map((l, index) => ({
      invoice_id: invoice.id,
      line_no: index,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      discount: l.discount,
      vat_rate: l.vatRate,
    }))
  );

  if (lineError) {
    // The invoice header exists but is empty — better to say so than to leave
    // the technician staring at a spinner with no idea why the total is 0.
    return NextResponse.json(
      { error: `Factuur aangemaakt, maar regels opslaan mislukte: ${lineError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: invoice.id, invoiceNumber: invoice.invoice_number }, { status: 201 });
}
