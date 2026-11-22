import { PreviewText } from '@/app/admin/PreviewLanguage';
import { notFound } from 'next/navigation';
import { BRAND, WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireWarehouseUser, seesPurchasePrices } from '@/lib/crmSession';
import { recentAssemblies, type AssemblyRow } from '@/lib/kfcInventory';
import Montage from './Montage';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Montage | ${BRAND.name}` };

/**
 * Assembly (spec S3, migration 0112): parts off their shelves, one product onto
 * its shelf, in one transaction. Without this, a key built from a housing, a board
 * and a blade left the parts "on the shelf" and the product nowhere in stock.
 */
export default async function MontagePage() {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  const user = await requireWarehouseUser('/admin/voorraad/montage');
  const prices = seesPurchasePrices(user);
  let rows: AssemblyRow[] = [];
  let error = '';
  try {
    rows = await recentAssemblies();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Montages konden niet geladen worden.';
  }
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>{"Montage"}</PreviewText></h1>
        <p className="text-muted-foreground text-sm"><PreviewText>{"Maak één product uit onderdelen. De onderdelen gaan van hun plank af, het product komt op zijn plank, in één keer."}</PreviewText></p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : <Montage initial={prices ? rows : rows.map((r) => ({ ...r, unit_cost_cents: null }))} prices={prices} />}
    </>
  );
}
