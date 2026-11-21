import { notFound } from 'next/navigation';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { BRAND, WAREHOUSE } from '@/config/install';
import { requireOfficeUser } from '@/lib/crmSession';
import { ownerDashboard } from '@/lib/kfcOwnerDashboard';
import OwnerDashboardView from './OwnerDashboardView';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Eigenaarsoverzicht | ${BRAND.name}` };

/** /admin/rapporten/eigenaar — the shop owner's dashboard (office roles; warehouse installs). */
export default async function OwnerPage() {
  if (!WAREHOUSE) notFound();
  await requireOfficeUser('/admin/rapporten/eigenaar');
  const { data, failure } = await ownerDashboard().then(
    (loaded) => ({ data: loaded, failure: '' }),
    (error: unknown) => ({ data: null, failure: error instanceof Error ? error.message : String(error) }),
  );
  if (data) return <OwnerDashboardView data={data} />;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-100">
      <p className="font-medium"><PreviewText>Het eigenaarsoverzicht kon niet worden geladen.</PreviewText></p>
      <p className="mt-1 text-xs opacity-80">{failure}</p>
      <p className="mt-1 text-xs opacity-80"><PreviewText>Staat migratie 0131_kfc_inventory_reports.sql op deze database?</PreviewText></p>
    </div>
  );
}
