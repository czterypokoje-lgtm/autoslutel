import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Every sales invoice with its lines, for copying the books into Moneybird.
 * Used by a server job the owner starts, not by the assistant: it carries
 * client addresses, which the assistant has no use for.
 */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('sales_invoices')
    .select(
      'id, invoice_number, issue_date, status, paid_at, biller_name, biller_kvk, biller_btw, client_name, client_street, client_postcode, client_city, client_country, client_email, client_btw, credit_applied, subtotal, vat_total, total, notes, sales_invoice_lines (line_no, description, quantity, unit_price, discount, vat_rate)'
    )
    .order('issue_date', { ascending: true })
    .order('invoice_number', { ascending: true })
    .limit(5000);

  if (error) {
    console.error('ops invoice export failed:', error.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  await logOps(supabase, 'invoices.export', { count: data?.length ?? 0 });
  return NextResponse.json({ invoices: data ?? [] });
}
