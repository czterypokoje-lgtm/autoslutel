import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BRAND, WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireCrmUser } from '@/lib/crmSession';
import { StockError } from '@/lib/kfcInventory';
import { canUsePos, storedZReport, type ZReport } from '@/lib/kfcPos';
import { PrintButton, PrintStyles, ZReportView } from '../../ZReportView';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Z-rapport | ${BRAND.name}` };

/** One stored Z-report, exactly as frozen at closing, ready to reprint. */
export default async function KassaSessiePage({ params }: { params: Promise<{ id: string }> }) {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  const { id } = await params;
  const user = await requireCrmUser(`/admin/kassa/sessies/${encodeURIComponent(id)}`);
  if (!canUsePos(user)) redirect('/admin/geen-toegang');

  let report: ZReport | null = null;
  let error = '';
  try {
    report = await storedZReport(id);
  } catch (cause) {
    if (cause instanceof StockError && cause.status === 404) notFound();
    error = cause instanceof Error ? cause.message : 'Het Z-rapport kon niet geladen worden.';
  }

  return (
    <>
      <PrintStyles />
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Z-rapport {report?.zNumber ? `nr. ${report.zNumber}` : ''}</h1>
        <Link href="/admin/kassa/sessies" className="text-sm underline underline-offset-4">Alle Z-rapporten</Link>
      </div>
      {error && <p className="text-destructive text-sm" role="alert">{error}</p>}
      {report && (
        <div className="grid max-w-md gap-3">
          <ZReportView report={report} />
          <PrintButton label="Z-rapport printen" />
        </div>
      )}
    </>
  );
}
