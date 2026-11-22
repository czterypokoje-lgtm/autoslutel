import { PreviewText } from '@/app/admin/PreviewLanguage';
import { notFound } from 'next/navigation';
import { BRAND, WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireWarehouseUser, seesPrices } from '@/lib/crmSession';
import { listPurchaseOrders, type PurchaseOrder } from '@/lib/kfcInventory';
import Inkoop from './Inkoop';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Inkoop | ${BRAND.name}` };

/**
 * Purchase orders: what is on order at the supplier, and goods received.
 *
 * Office drafts and orders; the warehouse receives by shelf and box. A
 * received line is the only thing that books a 'received' stock move, so
 * Incoming on the stock screen is exactly the open quantity here.
 */
export default async function InkoopPage({ searchParams }: { searchParams: Promise<{ leverancier?: string }> }) {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  // ?leverancier=<id> (from the supplier card) preselects the supplier on a new order.
  const { leverancier } = await searchParams;
  const initialSupplier = leverancier && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(leverancier) ? leverancier : '';
  const user = await requireWarehouseUser('/admin/inkoop');
  let orders: PurchaseOrder[] = [];
  let error = '';
  try {
    orders = await listPurchaseOrders(user);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Inkooporders konden niet geladen worden.';
  }
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>{"Inkoop"}</PreviewText></h1>
        <p className="text-muted-foreground text-sm"><PreviewText>{"Wat bij de leverancier besteld staat en wat is ontvangen. Ontvangst boekt de voorraad; de inkoopfactuur zet alleen de prijs."}</PreviewText></p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : <Inkoop orders={orders} canEdit={seesPrices(user)} initialSupplier={initialSupplier} />}
    </>
  );
}
