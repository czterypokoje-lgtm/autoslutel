import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { buildInvoicePdf, type PdfInvoice, type PdfLine } from '@/lib/opsInvoicePdf';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** The PDF of a draft. Sent or paid invoices stay in the CRM. */
export async function GET(request: Request, { params }: { params: Promise<{ number: string }> }) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { number } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: invoice, error } = await supabase
    .from('sales_invoices')
    .select('*')
    .eq('invoice_number', number)
    .eq('status', 'concept')
    .maybeSingle();

  if (error) {
    console.error('ops invoice pdf read failed:', error.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }
  if (!invoice) return NextResponse.json({ error: 'Concept niet gevonden' }, { status: 404 });

  const { data: lines, error: lineError } = await supabase
    .from('sales_invoice_lines')
    .select('description, quantity, unit_price, vat_rate')
    .eq('invoice_id', invoice.id)
    .order('line_no');

  if (lineError) {
    console.error('ops invoice lines read failed:', lineError.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  const pdf = await buildInvoicePdf(invoice as unknown as PdfInvoice, (lines ?? []) as unknown as PdfLine[]);
  await logOps(supabase, 'invoice.pdf', { number });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="concept-${number}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
