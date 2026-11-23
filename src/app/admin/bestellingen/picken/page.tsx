import { PreviewText } from '@/app/admin/PreviewLanguage';
import { notFound } from 'next/navigation';
import { BRAND, IS_KEYFORCARS, WAREHOUSE } from '@/config/install';
import { syncOwnOrdersOnView } from '@/lib/kfcOwnShop';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireWarehouseUser } from '@/lib/crmSession';
import { pickList } from '@/lib/kfcOrders';
import { PickBoard } from './PickBoard';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Picklijst | ${BRAND.name}` };

/** Request time, named so the clock read is not "during render". */
const requestNow = () => Date.now();

/** Paid orders waiting in the warehouse, per day, oldest first; labels in bulk. */
export default async function PickPage() {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  await requireWarehouseUser('/admin/bestellingen/picken');
  // Autosleutel24: new paid webshop orders into the ledger first, so they can be picked.
  if (!IS_KEYFORCARS) await syncOwnOrdersOnView();
  const orders = await pickList();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>{"Picklijst"}</PreviewText></h1>
        <p className="text-muted-foreground text-sm">{orders.length} <PreviewText>{orders.length === 1 ? "betaalde bestelling wacht op verzending. Per dag, oudste eerst." : "betaalde bestellingen wachten op verzending. Per dag, oudste eerst."}</PreviewText></p>
      </div>
      <PickBoard orders={orders} now={requestNow()} />
    </div>
  );
}
