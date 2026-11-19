import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IS_KEYFORCARS } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireWarehouseUser } from '@/lib/crmSession';
import { pickList } from '@/lib/kfcOrders';
import { OrderLines } from '../OrderParts';

// Formatters live here, not in the client module: a server component cannot call a client export.
const WHEN = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Picklijst | KeyForCars' };

/** Paid orders waiting in the warehouse, oldest first. Tick lines as picked, ship when complete. */
export default async function PickPage() {
  if (!IS_KEYFORCARS || CRM_PREVIEW) notFound();
  await requireWarehouseUser('/admin/bestellingen/picken');
  const orders = await pickList();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Picklijst</h1>
        <p className="text-muted-foreground text-sm">{orders.length} betaalde {orders.length === 1 ? 'bestelling wacht' : 'bestellingen wachten'} op verzending. Oudste eerst.</p>
      </div>
      {orders.length === 0 && <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-10 text-center text-sm">Niets te picken.</p>}
      {orders.map((order) => (
        <section key={order.id} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-3">
            <Link href={`/admin/bestellingen/${order.id}`} className="text-lg font-semibold underline-offset-4 hover:underline">#{order.number}</Link>
            <span className="text-muted-foreground text-sm">{order.shop} · {WHEN.format(new Date(order.created_at))} · {order.country}</span>
          </div>
          <OrderLines order={order} canAct />
        </section>
      ))}
    </div>
  );
}
