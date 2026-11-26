import { NextResponse } from 'next/server';
import { getCrmUser, CRM_ROLES } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { jobInvoiceSourcesValid, readJobInvoiceLineSource, type JobInvoiceLineSource } from '@/lib/jobInvoiceSources';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SITE_CONFIG } from '@/config/site.config';
import { BRAND, IS_KEYFORCARS } from '@/config/install';

/* Blank biller fields fall back to the company's own details — never to the other install's. */
const BILLER_DEFAULTS = IS_KEYFORCARS
  ? { fullName: BRAND.name, email: null, phone: null, kvk: null, btw: null, iban: null }
  : SITE_CONFIG;

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

interface LineInput extends JobInvoiceLineSource {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  vatRate: number;
}

/*
 * sales_invoices.issue_date is what the ledger dates the receivable on and
 * counts the due date from (trigger kfc_post_invoice). A typo there is a
 * receivable that was never due or has been overdue for a year, so the window
 * is narrow: at most a day ahead (a client clock may run early, and Amsterdam
 * can already be a day past UTC), at most two years back. Absent = the column
 * default, today in Amsterdam.
 */
function issueDate(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  const days = (date.getTime() - Date.now()) / 86_400_000;
  return days > 1.5 || days < -730 ? null : value;
}

/** The due date the office chose: a calendar date, not before the issue date and at most a year after it. */
function dueDate(value: unknown, issue: string | undefined): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const from = issue ?? new Date().toISOString().slice(0, 10);
  const days = (Date.parse(`${value}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000;
  return Number.isFinite(days) && days >= 0 && days <= 366 ? value : undefined;
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

  const source = readJobInvoiceLineSource(r);
  return source && { description, quantity, unitPrice, discount, vatRate, ...source };
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

  const issue = issueDate(body.issue_date);
  if (issue === null) {
    return NextResponse.json({ error: 'Ongeldige factuurdatum' }, { status: 400 });
  }

  /* Totals, computed once here — never taken from the client as a number. */
  let subtotal = 0;
  let vatTotal = 0;
  for (const l of goodLines) {
    const base = l.quantity * l.unitPrice - l.discount;
    /* A discount larger than the line it sits on would credit money through a
       field meant to reduce one. No such invoice exists; reject it. */
    if (base < 0) {
      return NextResponse.json({ error: 'Een korting is hoger dan de regel zelf' }, { status: 400 });
    }
    subtotal += base;
    vatTotal += base * (l.vatRate / 100);
  }
  subtotal = Math.round(subtotal * 100) / 100;
  vatTotal = Math.round(vatTotal * 100) / 100;
  if (subtotal < 0 || vatTotal < 0) {
    return NextResponse.json({ error: 'De regels leveren een negatief factuurtotaal op' }, { status: 400 });
  }
  /* Credit can only settle what is owed — never turn the invoice into a payout. */
  const creditApplied = Math.min(money(body.credit_applied) ?? 0, Math.round((subtotal + vatTotal) * 100) / 100);
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

  const jobId = body.job_id;
  let agreedTotal: number | null = null;
  if (jobId != null) {
    if (typeof jobId !== 'string' || !UUID.test(jobId)) {
      return NextResponse.json({ error: 'Ongeldig job-id' }, { status: 400 });
    }
    const { data: job, error: jobError } = await supabase.from('jobs').select('id, final_price, quoted_price').eq('id', jobId).maybeSingle();
    if (jobError) return NextResponse.json({ error: 'Klus ophalen mislukt' }, { status: 500 });
    if (!job) return NextResponse.json({ error: 'Klus niet gevonden' }, { status: 404 });
    agreedTotal = job.final_price ?? job.quoted_price;
  }

  if (goodLines.some((line) => line.job_line_kind) &&
      !await jobInvoiceSourcesValid(createSupabaseAdminClient(), typeof jobId === 'string' ? jobId : null, goodLines)) {
    return NextResponse.json({ error: 'Ongeldige koppeling met gebruikte voorraad.' }, { status: 400 });
  }

  if (agreedTotal !== null && goodLines.some((line) => line.job_line_kind) &&
      Math.round((subtotal + vatTotal) * 100) !== Math.round(agreedTotal * 100)) {
    return NextResponse.json({ error: 'Het factuurtotaal moet overeenkomen met het afgesproken totaal.' }, { status: 409 });
  }

  const due = dueDate(body.due_date, issue ?? undefined);
  const header = {
      ...(issue ? { issue_date: issue } : {}),
      ...(due ? { due_date: due } : {}),
      biller_name: text(body.biller_name, 200) ?? BILLER_DEFAULTS.fullName,
      biller_street: text(body.biller_street, 200),
      biller_postcode: text(body.biller_postcode, 20),
      biller_city: text(body.biller_city, 100),
      biller_email: text(body.biller_email, 200) ?? BILLER_DEFAULTS.email,
      biller_phone: text(body.biller_phone, 40) ?? BILLER_DEFAULTS.phone,
      biller_kvk: text(body.biller_kvk, 40) ?? BILLER_DEFAULTS.kvk,
      biller_btw: text(body.biller_btw, 40) ?? BILLER_DEFAULTS.btw,
      biller_iban: text(body.biller_iban, 40) ?? BILLER_DEFAULTS.iban,
      client_name: clientName,
      // sales_invoices.customer_id exists only on KeyForCars (migration 0093); Autosleutel24's table has no such column.
      ...(IS_KEYFORCARS ? { customer_id: typeof body.customer_id === 'string' && /^[a-f0-9-]{36}$/i.test(body.customer_id) ? body.customer_id : null } : {}),
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
      job_id: jobId ?? null,
  };
  let { data: invoice, error } = await supabase.from('sales_invoices').insert(header).select('id, invoice_number').single();
  // Before migration 0144 the column is not there: save without it rather than refuse the invoice.
  if (error && /due_date/.test(error.message)) {
    const { due_date: _skip, ...withoutDue } = header as typeof header & { due_date?: string };
    void _skip;
    ({ data: invoice, error } = await supabase.from('sales_invoices').insert(withoutDue).select('id, invoice_number').single());
  }

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

  /*
   * Remember what this user typed, so the next invoice starts from it: the
   * Van block and the payment term. Best effort — a missing table (0144 not
   * run yet) must never fail a saved invoice.
   */
  const termsDays = Number.isInteger(body.terms_days) && (body.terms_days as number) >= 0 && (body.terms_days as number) <= 180 ? (body.terms_days as number) : null;
  await supabase.from('crm_user_prefs').upsert({
    user_id: user.id,
    invoice_from: {
      name: text(body.biller_name, 200), street: text(body.biller_street, 200), postcode: text(body.biller_postcode, 20), city: text(body.biller_city, 100),
      email: text(body.biller_email, 200), phone: text(body.biller_phone, 40), kvk: text(body.biller_kvk, 40), btw: text(body.biller_btw, 40), iban: text(body.biller_iban, 40),
      website: text(body.biller_website, 200), accountName: text(body.biller_account_name, 200),
    },
    ...(termsDays !== null ? { invoice_terms_days: termsDays } : {}),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' }).then(({ error: prefError }) => { if (prefError && !/does not exist|relation|schema cache/i.test(prefError.message)) console.error('Invoice prefs not stored', prefError.message); });

  const { error: lineError } = await supabase.from('sales_invoice_lines').insert(
    goodLines.map((l, index) => ({
      invoice_id: invoice.id,
      line_no: index,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      discount: l.discount,
      vat_rate: l.vatRate,
      job_line_kind: l.job_line_kind,
      job_stock_id: l.job_stock_id,
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
