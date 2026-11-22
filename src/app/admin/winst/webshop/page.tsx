import { notFound } from 'next/navigation';
import { requireOfficeUser } from '@/lib/crmSession';
import { BRAND, WAREHOUSE } from '@/config/install';
import KfcReports from '../KfcReports';

export const dynamic = 'force-dynamic';

export const metadata = { title: `Webshopmarge | ${BRAND.name}` };

/** Margin, stock value and receivables from the warehouse ledger; Autosleutel24 keeps its klus-based Winst & verbruik at /admin/winst. */
export default async function Page() {
  if (!WAREHOUSE) notFound();
  await requireOfficeUser('/admin/winst/webshop');
  return <KfcReports />;
}
