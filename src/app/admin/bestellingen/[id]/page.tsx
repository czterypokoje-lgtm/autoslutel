import { PreviewProductName, PreviewText } from '@/app/admin/PreviewLanguage';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { canBookReturns, requireWarehouseUser, seesPrices } from '@/lib/crmSession';
import { getShopOrder, shopReturnHistory, type ShopOrder } from '@/lib/kfcOrders';
import { readSendcloudTracking } from '@/lib/sendcloudTracking';
import { sampleOrders } from '@/lib/kfcSampleOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { returnLocations } from '@/lib/kfcInventory';
import { FulfilmentBadge, OrderLines, ReturnLine } from '../OrderParts';

// Formatters live here, not in the client module: a server component cannot call a client export.
const WHEN = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export const dynamic = 'force-dynamic';

/** One shop order: what was ordered, what is reserved, pick and ship. */
export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tracking?: string }> }) {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  const user = await requireWarehouseUser('/admin/bestellingen');
  const { id } = await params;
  // Sample orders (before the first import) link as "<shop>--<number>" and open read-only.
  const sample = !/^[a-f0-9-]{36}$/i.test(id) ? sampleOrder(decodeURIComponent(id)) : null;
  const order = sample ?? (await getShopOrder(id));
  if (!order) notFound();
  const history = await shopReturnHistory(sample ? [] : order.lines);
  const lines = new Map(order.lines.map((line) => [line.id, line]));
  const returnable = canBookReturns(user) ? order.lines.filter((line) => (history.quantities.get(line.id) ?? 0) > 0) : [];
  const locations = returnable.length ? await returnLocations() : [];
  const prices = seesPrices(user);
  const trackingCode = !sample && order.carrier !== 'eigen' ? order.tracking_code : null;
  const tracking = trackingCode && (await searchParams).tracking === '1'
    ? await readSendcloudTracking(trackingCode, process.env.SENDCLOUD_PUBLIC_KEY, process.env.SENDCLOUD_SECRET_KEY) : null;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link href="/admin/orders"><ArrowLeft className="size-4" /> <PreviewText>{"Bestellingen"}</PreviewText></Link></Button>
        <h1 className="text-2xl font-semibold tracking-tight">#{order.number}</h1>
        <span className="text-muted-foreground text-sm">{order.shop} · <PreviewText>Besteld op</PreviewText> <time dateTime={order.created_at}>{WHEN.format(new Date(order.created_at))}</time> · {order.country}</span>
        <FulfilmentBadge value={order.fulfilment} />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-1"><CardTitle className="text-muted-foreground text-xs font-medium uppercase">Verzendadres</CardTitle></CardHeader><CardContent className="text-sm leading-snug">{order.ship_street ? <>{order.ship_company && <div>{order.ship_company}</div>}<div>{order.ship_name}</div><div>{order.ship_street}</div><div>{order.ship_postcode} {order.ship_city}, {order.country}</div>{order.ship_phone && <div className="text-muted-foreground text-xs">{order.ship_phone}</div>}</> : <span className="text-muted-foreground">Niet geïmporteerd</span>}</CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-muted-foreground text-xs font-medium uppercase">Webshopstatus</CardTitle></CardHeader><CardContent className="text-lg font-semibold">{order.status}{order.shop_completed_at && <span className="text-muted-foreground block text-xs font-normal">afgerond teruggeschreven</span>}</CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-muted-foreground text-xs font-medium uppercase"><PreviewText>{"Betaald"}</PreviewText></CardTitle></CardHeader><CardContent className="text-lg font-semibold">{order.paid_at ? WHEN.format(new Date(order.paid_at)) : '—'}</CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-muted-foreground text-xs font-medium uppercase"><PreviewText>{"Totaal"}</PreviewText></CardTitle></CardHeader><CardContent className="text-lg font-semibold">{prices ? <>{MONEY.format(order.total_incl_cents / 100)} <span className="text-muted-foreground text-xs font-normal">incl. btw · {MONEY.format(order.total_excl_cents / 100)} excl.</span></> : '—'}</CardContent></Card>
      </div>
      {sample && <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs">Voorbeeldbestelling. Picken en verzenden werken zodra de echte bestellingen van de webshops zijn geïmporteerd.</p>}
      <OrderLines order={order} canAct={!sample} />
      {returnable.length > 0 && <Card>
        <CardHeader><CardTitle><PreviewText>Fysieke retour</PreviewText></CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          {returnable.map((line) => <ReturnLine key={line.id} line={line} maximum={history.quantities.get(line.id)!} locations={locations} />)}
        </CardContent>
      </Card>}
      {history.returns.length > 0 && <Card>
        <CardHeader><CardTitle><PreviewText>Retourgeschiedenis</PreviewText></CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {history.returns.map((move) => {
              const line = lines.get(move.order_line_id)!;
              return <li key={move.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <span><PreviewProductName sku={line.sku}>{line.name}</PreviewProductName> · {move.delta} ×</span>
                <span><PreviewText>Retour geboekt op</PreviewText> <time dateTime={move.created_at}>{WHEN.format(new Date(move.created_at))}</time></span>
              </li>;
            })}
          </ul>
        </CardContent>
      </Card>}
      {trackingCode && <Card><CardHeader><CardTitle><PreviewText>Vervoerder volgen</PreviewText></CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {tracking?.state === 'available' ? <>
            {tracking.event ? <p>{tracking.event.status.replaceAll('-', ' ')} · {WHEN.format(new Date(tracking.event.timestamp))}</p>
              : <p><PreviewText>Nog geen vervoerdersgebeurtenis</PreviewText></p>}
            <p>{tracking.expectedDate ? <><PreviewText>Geschatte bezorging</PreviewText> · {tracking.expectedDate}</>
              : <PreviewText>Geen bezorgindicatie</PreviewText>}</p>
            {tracking.link && <a className="underline" href={tracking.link} target="_blank" rel="noreferrer"><PreviewText>Volglink openen</PreviewText></a>}
          </> : tracking && <p><PreviewText>{{
            unconfigured: 'Sendcloud-sleutels ontbreken',
            missing: 'Geen Sendcloud-volggegevens',
            unavailable: 'Vervoerder onbereikbaar',
          }[tracking.state]}</PreviewText></p>}
          <Button className="w-fit" size="sm" variant="outline" asChild><Link href="?tracking=1" prefetch={false}><PreviewText>Volgstatus controleren</PreviewText></Link></Button>
        </CardContent>
      </Card>}
    </div>
  );
}

function sampleOrder(key: string): ShopOrder | null {
  const [shop, number] = key.split('--');
  const found = sampleOrders().find((o) => o.shop === shop && o.number === number);
  if (!found) return null;
  return {
    id: key, shop: found.shop, woo_order_id: Number(found.number) || 0, number: found.number, status: found.status,
    fulfilment: found.status === 'completed' ? 'external' : found.status === 'processing' ? 'open' : 'cancelled',
    created_at: found.created, paid_at: found.status === 'processing' || found.status === 'completed' ? found.created : null,
    shipped_at: null, shop_completed_at: null, country: found.country,
    total_incl_cents: found.totalIncl, total_excl_cents: found.totalExcl, shipping_incl_cents: found.shippingIncl,
    lines: found.lines.map((line, index) => ({ id: `${key}-${index}`, sku: line.sku, article_code: null, name: line.name, quantity: line.quantity, reserved: 0, picked: 0, state: 'open', unit_incl_cents: line.unitIncl })),
  };
}
