import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getCrmUser, OFFICE_ROLES } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildInvoicePdf, type PdfInvoice, type PdfLine } from '@/lib/opsInvoicePdf';
import { sendMail } from '@/lib/email';
import { IS_KEYFORCARS } from '@/config/install';
import { SITE_CONFIG } from '@/config/site.config';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const DATE = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long', timeZone: 'UTC' });

/**
 * E-mail the invoice to the customer: the final PDF (no CONCEPT stamp, logo,
 * due date, payment line) attached to a short Dutch mail from the office's
 * address, reply-to the biller. A concept becomes "verzonden" on success.
 * Office roles, or the monteur the invoice is on, may send.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCrmUser();
  if (!user || !user.role) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Ongeldig factuur-id' }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const [{ data: invoice, error }, { data: lines }] = await Promise.all([
    supabase.from('sales_invoices').select('*').eq('id', id).maybeSingle(),
    supabase.from('sales_invoice_lines').select('description, quantity, unit_price, vat_rate').eq('invoice_id', id).order('line_no'),
  ]);
  if (error || !invoice) return NextResponse.json({ error: 'Factuur niet gevonden' }, { status: 404 });
  const office = OFFICE_ROLES.includes(user.role);
  if (!office && invoice.created_by !== user.id) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  const to = typeof invoice.client_email === 'string' ? invoice.client_email.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) return NextResponse.json({ error: 'De klant heeft geen geldig e-mailadres op de factuur.' }, { status: 400 });

  const logoPng = IS_KEYFORCARS ? null : await readFile(path.join(process.cwd(), 'public', 'logo.png')).catch(() => null);
  const pdf = await buildInvoicePdf(invoice as unknown as PdfInvoice, (lines ?? []) as unknown as PdfLine[], { draft: false, logoPng });
  const due = invoice.due_date ? new Date(`${invoice.due_date}T00:00:00Z`) : new Date(Date.parse(invoice.issue_date) + 14 * 86_400_000);
  const firstName = String(invoice.client_name ?? '').trim();

  const text = `Beste ${firstName || 'klant'},

Hierbij ontvangt u factuur ${invoice.invoice_number} van ${invoice.biller_name}, als pdf in de bijlage.

Factuurdatum: ${DATE.format(new Date(invoice.issue_date))}
Vervaldatum: ${DATE.format(due)}
Totaal: ${MONEY.format(Number(invoice.total))}

Gelieve het bedrag voor ${DATE.format(due)} over te maken${invoice.biller_iban ? ` op IBAN ${invoice.biller_iban}` : ''} t.n.v. ${invoice.biller_name}, onder vermelding van ${invoice.invoice_number}.

Vragen over deze factuur? Antwoord op deze e-mail${invoice.biller_phone ? ` of bel ${invoice.biller_phone}` : ''}.

Met vriendelijke groet,
${invoice.biller_name}`;

  const sent = await sendMail({
    to,
    subject: `Factuur ${invoice.invoice_number} van ${invoice.biller_name}`,
    text,
    replyTo: invoice.biller_email || SITE_CONFIG.email,
    attachments: [{ filename: `Factuur-${invoice.invoice_number}.pdf`, content: Buffer.from(pdf).toString('base64') }],
  });
  if (!sent) return NextResponse.json({ error: 'De mail kon niet worden verstuurd. Controleer RESEND_API_KEY en het afzenderadres.' }, { status: 502 });

  if (invoice.status === 'concept') {
    const { error: statusError } = await supabase.from('sales_invoices').update({ status: 'verzonden' }).eq('id', id);
    if (statusError) console.error('Invoice mailed but status not updated', id, statusError.message);
  }
  return NextResponse.json({ sent: true, to });
}
