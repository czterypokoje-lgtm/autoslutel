import { notFound } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { invoiceDueDate } from '@/lib/invoiceDue';
import BankPreview from '../BankPreview';
import { IS_KEYFORCARS } from '@/config/install';
import { listLines, suggest } from '@/lib/kfcBank';
import { customerOptions } from '@/lib/kfcReceivables';
import KfcBank from '../KfcBank';

export default async function BankPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  if (view !== 'rekeningen' && view !== 'transacties' && view !== 'betalingen' && view !== 'verwacht') notFound();
  await requireOfficeUser(`/admin/bank/${view}`);
  if (IS_KEYFORCARS && !CRM_PREVIEW && view !== 'verwacht') {
    const status = view === 'betalingen' ? 'matched' : view === 'rekeningen' ? 'ignored' : 'open';
    const lines = await listLines(status);
    const [suggestions, customers] = await Promise.all([status === 'open' ? suggest(lines) : Promise.resolve({}), customerOptions()]);
    return <KfcBank view={status} lines={lines} suggestions={suggestions} customers={customers.map((c) => ({ id: c.id, company: c.company }))} />;
  }
  if (view === 'verwacht' && !CRM_PREVIEW) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from('sales_invoices')
      .select('id, invoice_number, client_name, issue_date, total')
      .eq('status', 'verzonden')
      .order('issue_date');
    if (error) return <BankPreview view={view} expected={null} />;
    return <BankPreview view={view} expected={(data ?? []).map(inv => ({
      id: inv.id,
      ref: inv.invoice_number,
      customer: inv.client_name,
      dueDate: invoiceDueDate(inv.issue_date).toISOString().slice(0, 10),
      cents: Math.round(Number(inv.total) * 100),
    }))} />;
  }
  return <BankPreview view={view} />;
}
