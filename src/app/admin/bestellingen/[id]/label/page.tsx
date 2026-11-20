import { notFound } from 'next/navigation';
import { WAREHOUSE } from '@/config/install';
import { requireWarehouseUser } from '@/lib/crmSession';
import { getShopOrder } from '@/lib/kfcOrders';
import { LABEL_PRINT_CSS, LabelSheet } from '../../LabelSheet';

export const dynamic = 'force-dynamic';

/** The CRM's own shipping label (100 × 150 mm) plus a packing slip, printed from the browser. */
export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  if (!WAREHOUSE) notFound();
  await requireWarehouseUser('/admin/bestellingen');
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const order = await getShopOrder(id);
  if (!order) notFound();
  return (
    <div className="mx-auto max-w-md bg-white p-6 text-black print:max-w-none print:p-0">
      <style>{LABEL_PRINT_CSS}</style>
      <LabelSheet order={order} />
      <p className="no-print mt-4 text-xs text-gray-500">Afdrukken: Ctrl+P of ⌘P. Labelprinter 100 × 150 mm, of A4 met de pakbon op pagina 2.</p>
    </div>
  );
}
