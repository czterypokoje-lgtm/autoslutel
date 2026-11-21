import { PreviewText } from '@/app/admin/PreviewLanguage';
import { notFound, redirect } from 'next/navigation';
import { BRAND, WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireCrmUser } from '@/lib/crmSession';
import { canUsePos, openSession, sessionSummary, type PosSummary } from '@/lib/kfcPos';
import Kassa from './Kassa';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Kassa | ${BRAND.name}` };

/**
 * The shop counter: scan, take payment, print the receipt, close the day.
 *
 * A sale is one database transaction (kfc_pos_sale, migration 0129): paid
 * invoice, stock out of the fullest bin, payments on the till session.
 */
export default async function KassaPage() {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  const user = await requireCrmUser('/admin/kassa');
  if (!canUsePos(user)) redirect('/admin/geen-toegang');
  let summary: PosSummary | null = null;
  let error = '';
  try {
    const session = await openSession();
    summary = session ? await sessionSummary(session) : null;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'De kassa kon niet geladen worden.';
  }
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>{"Kassa"}</PreviewText></h1>
        <p className="text-muted-foreground text-sm"><PreviewText>{"Scan, reken af en print de bon. Elke verkoop boekt de factuur, de voorraad en de betaling in één keer."}</PreviewText></p>
      </div>
      {error
        ? <p className="text-destructive text-sm">{error}</p>
        : <Kassa initial={summary} cashier={user.email ?? ''} />}
    </>
  );
}
