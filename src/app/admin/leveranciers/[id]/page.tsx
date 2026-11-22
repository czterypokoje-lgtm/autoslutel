import { notFound } from 'next/navigation';
import { BRAND, WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireOfficeUser } from '@/lib/crmSession';
import { getSupplier } from '@/lib/kfcSuppliers';
import SupplierCard, { TABS, type Tab } from './SupplierCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Leverancier | ${BRAND.name}` };

const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

/** The supplier card: details, articles and prices, orders, invoices, payments, statement, balance. */
export default async function SupplierPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; po?: string }> }) {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  const { id } = await params;
  await requireOfficeUser('/admin/leveranciers');
  if (!uuid.test(id)) notFound();
  const data = await getSupplier(id);
  if (!data) notFound();
  const query = await searchParams;
  const tab = (TABS as readonly string[]).includes(query.tab ?? '') ? (query.tab as Tab) : 'gegevens';
  const po = query.po && uuid.test(query.po) && data.orders.some((order) => order.id === query.po) ? query.po : null;
  return <SupplierCard {...data} initialTab={po ? 'facturen' : tab} invoiceForOrder={po} />;
}
