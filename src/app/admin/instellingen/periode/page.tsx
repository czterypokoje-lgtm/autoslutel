import { notFound } from 'next/navigation';
import { BRAND, WAREHOUSE } from '@/config/install';
import { requireOfficeUser } from '@/lib/crmSession';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { amsterdamToday, endOfPreviousMonth, getPeriodLock, type PeriodLockState } from '@/lib/kfcPeriodLock';
import PeriodLockManager from './PeriodLockManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Afgesloten periode | ${BRAND.name}` };

/** The books-closed date. Office reads it; only the owner closes or reopens. */
export default async function PeriodePage() {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  const user = await requireOfficeUser('/admin/instellingen/periode');
  const yesterday = new Date(Date.parse(`${amsterdamToday()}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  let state: PeriodLockState = { lock: null, log: [] };
  let error = '';
  try {
    state = await getPeriodLock();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'De afgesloten periode kon niet geladen worden.';
  }
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Afgesloten periode</h1>
        <p className="text-muted-foreground max-w-prose text-sm">
          Na afsluiten kan niemand meer iets boeken, wijzigen of verwijderen met een datum tot en met die dag: facturen, betalingen,
          creditnota&apos;s, leveranciersboekingen en voorraadmutaties. Wat al geboekt is blijft gewoon zichtbaar, en een correctie
          doe je met een boeking van vandaag (bijvoorbeeld een tegenboeking).
        </p>
      </div>
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      <PeriodLockManager initial={state} canManage={user.role === 'owner'} defaultUntil={endOfPreviousMonth()} latest={yesterday} />
    </>
  );
}
