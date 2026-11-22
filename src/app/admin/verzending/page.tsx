import { requireOfficeUser, requireWarehouseUser } from '@/lib/crmSession';
import { pickList } from '@/lib/kfcOrders';
import { listTestParcels, shippingTestEnabled } from '@/lib/kfcShippingTest';
import { redirect } from 'next/navigation';
import { ShippingTestQueue } from './ShippingTestQueue';

export const dynamic = 'force-dynamic';

export default async function ShippingPage({ searchParams }: {
  searchParams: Promise<{ order?: string; parcel?: string; print?: string; error?: string; view?: string; q?: string; status?: string }>;
}) {
  if (!shippingTestEnabled) {
    await requireOfficeUser('/admin/verzending');
    redirect('/admin/verzending/nieuw');
  }
  const user = await requireWarehouseUser('/admin/verzending');
  const params = await searchParams;
  if (params.view === 'sent') {
    const office = user.role === 'owner' || user.role === 'kantoor';
    redirect(office ? '/admin/orders?' + new URLSearchParams({ status: params.status === 'external' ? 'completed' : 'dispatched', ...(params.q ? { q: params.q } : {}) }) : '/admin/verzending');
  }
  const data = await pickList(true);
  const orders = data.map(({ id, shop, number, fulfilment, ship_street, ship_postcode, ship_city, country, carrier, lines }) => ({
    id, shop, number, fulfilment, ship_street, ship_postcode, ship_city, country, carrier,
    lines: lines.map(({ id, name, sku, quantity }) => ({ id, name, sku, quantity })),
  }));
  const parcels = await listTestParcels(orders.map((order) => order.id));
  return <ShippingTestQueue orders={orders} parcels={parcels} selected={params.order} requestedParcel={params.parcel}
    error={params.error === 'parcel'} showPrint={params.print === '1' || params.view === 'labels'} />;
}
