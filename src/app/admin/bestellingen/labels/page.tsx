import { notFound } from 'next/navigation';
import { IS_KEYFORCARS } from '@/config/install';
import { requireWarehouseUser } from '@/lib/crmSession';
import { getShopOrdersByIds } from '@/lib/kfcOrders';
import { LABEL_PRINT_CSS, LabelSheet } from '../LabelSheet';
import { PrintNow } from './PrintNow';

export const dynamic = 'force-dynamic';

/**
 * Every own label (+ pakbon) for a batch of orders on one print job:
 * /admin/bestellingen/labels?ids=a,b,c — what "print all labels" opens.
 * Orders whose label lives at Sendcloud are listed with their PDF instead.
 */
export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ ids?: string; print?: string }> }) {
  if (!IS_KEYFORCARS) notFound();
  await requireWarehouseUser('/admin/bestellingen/picken');
  // &print=0 shows the sheet without opening the print dialog (checking a batch before the run).
  const { ids, print } = await searchParams;
  const list = (ids ?? '').split(',').filter((id) => /^[a-f0-9-]{36}$/i.test(id));
  const orders = await getShopOrdersByIds(list);
  const own = orders.filter((o) => !o.carrier || o.carrier === 'eigen');
  const external = orders.filter((o) => o.carrier && o.carrier !== 'eigen');
  return (
    <div className="mx-auto max-w-md bg-white p-6 text-black print:max-w-none print:p-0">
      <style>{LABEL_PRINT_CSS}</style>
      <div className="no-print mb-4 flex flex-col gap-2 text-sm">
        <p className="font-medium">{own.length} {own.length === 1 ? 'label' : 'labels'} + pakbonnen in één afdruk.</p>
        {external.length > 0 && (
          <p className="text-gray-600">
            {external.length} {external.length === 1 ? 'bestelling heeft' : 'bestellingen hebben'} een Sendcloud-label:{' '}
            <a className="underline" href={`/api/admin/kfc-orders/labels?ids=${external.map((o) => o.id).join(',')}`} target="_blank" rel="noopener noreferrer">download die als één PDF</a>.
          </p>
        )}
        <PrintNow auto={own.length > 0 && print !== '0'} />
      </div>
      {own.map((order) => <LabelSheet key={order.id} order={order} />)}
      {own.length === 0 && <p className="no-print text-sm text-gray-500">Geen eigen labels in deze selectie.</p>}
    </div>
  );
}
