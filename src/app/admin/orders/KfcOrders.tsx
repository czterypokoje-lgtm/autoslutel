import Link from 'next/link';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PreviewText } from '../PreviewLanguage';
import { SHOPS, sampleOrders, type OrderStatus, type SampleOrder } from '@/lib/kfcSampleOrders';
import { listShopOrders, shopOrdersExist } from '@/lib/kfcOrders';
import { WOO_SHOPS, wooConfigured, type WooShop } from '@/lib/kfcWoo';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { FulfilmentBadge, ImportPanel } from '../bestellingen/OrderParts';
import type { Fulfilment } from '@/lib/kfcOrders';

/**
 * Orders from the three web shops, newest first. Read-only: an order is
 * handled in WooCommerce; this screen is for finding one and seeing what was
 * in it. Preview: sample orders. Phase 2 swaps the source for shop_orders and
 * adds the per-line fulfilment states.
 */

const STATUS: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  processing: { label: 'In behandeling', variant: 'default' },
  completed: { label: 'Afgerond', variant: 'secondary' },
  'on-hold': { label: 'Wacht op betaling', variant: 'outline' },
  cancelled: { label: 'Geannuleerd', variant: 'outline' },
  refunded: { label: 'Terugbetaald', variant: 'destructive' },
};

const LIMIT = 30;
const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const WHEN = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });

function Filter({ on, href, children }: { on: boolean; href: string; children: React.ReactNode }) {
  return <Button asChild size="sm" variant={on ? 'default' : 'ghost'}><Link href={href}>{children}</Link></Button>;
}

type Row = SampleOrder & { id?: string; fulfilment?: Fulfilment };

export default async function KfcOrders({ shop, status, q, requestedPage, canImport = false }: { shop?: string; status?: string; q?: string; requestedPage?: string; canImport?: boolean }) {
  const query = (q ?? '').trim().toUpperCase();
  const requested = Number(requestedPage);
  const live = await shopOrdersExist().catch(() => false);
  let shown: Row[]; let total: number; let page: number;
  if (live) {
    page = Number.isInteger(requested) && requested > 0 ? requested : 1;
    const result = await listShopOrders({ shop, status, q: query, page, limit: LIMIT });
    total = result.total;
    shown = result.orders.map((o) => ({
      id: o.id, fulfilment: o.fulfilment, number: o.number, shop: o.shop as SampleOrder['shop'], created: o.created_at,
      status: (o.status in STATUS ? o.status : 'cancelled') as OrderStatus, country: o.country ?? '',
      shippingIncl: o.shipping_incl_cents, totalIncl: o.total_incl_cents, totalExcl: o.total_excl_cents,
      lines: o.lines.map((l) => ({ sku: l.sku, name: l.name, image: '', quantity: l.quantity, unitIncl: l.unit_incl_cents ?? 0 })),
    }));
  } else {
    const all = sampleOrders().filter((order) =>
      (!shop || order.shop === shop) &&
      (!status || order.status === status) &&
      (!query || order.number.includes(query) || order.lines.some((line) => line.sku.toUpperCase().includes(query))));
    total = all.length;
    page = Number.isInteger(requested) ? Math.min(Math.max(1, Math.ceil(total / LIMIT)), Math.max(1, requested)) : 1;
    shown = all.slice((page - 1) * LIMIT, page * LIMIT);
  }
  const pageCount = Math.max(1, Math.ceil(total / LIMIT));
  const orders = { length: total };
  const importShops = canImport ? await Promise.all((Object.keys(WOO_SHOPS) as WooShop[]).map(async (s) => ({
    shop: s, configured: wooConfigured(s),
    orders: (await createSupabaseAdminClient().from('kfc_shop_orders').select('id', { count: 'exact', head: true }).eq('shop', s)).count ?? 0,
  }))) : [];

  const link = (change: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const next = { shop, status, q, ...change };
    for (const [key, value] of Object.entries(next)) if (value) params.set(key, value);
    const text = params.toString();
    return text ? `/admin/orders?${text}` : '/admin/orders';
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>Bestellingen</PreviewText></h1>
          <p className="text-muted-foreground text-sm"><PreviewText>Alle drie de webshops</PreviewText> · {orders.length}</p>
        </div>
        <form method="get" action="/admin/orders" className="relative w-full max-w-xs">
          {shop && <input type="hidden" name="shop" value={shop} />}
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input type="search" name="q" defaultValue={q} placeholder="Zoek op ordernummer of SKU" aria-label="Zoek bestelling" className="pl-8" />
        </form>
      </div>

      {canImport && <ImportPanel shops={importShops} />}
      {!live && <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs"><PreviewText>Voorbeeldbestellingen. Echte producten en prijzen, verzonnen klanten en aantallen.</PreviewText></p>}

      <div className="flex flex-wrap gap-2">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border p-1">
          <Filter on={!shop} href={link({ shop: undefined })}><PreviewText>Alle</PreviewText></Filter>
          {SHOPS.map((s) => <Filter key={s} on={shop === s} href={link({ shop: s })}>{s}</Filter>)}
        </div>
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border p-1">
          <Filter on={!status} href={link({ status: undefined })}><PreviewText>Elke status</PreviewText></Filter>
          {(Object.keys(STATUS) as OrderStatus[]).map((s) => <Filter key={s} on={status === s} href={link({ status: s })}><PreviewText>{STATUS[s].label}</PreviewText></Filter>)}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><PreviewText>Datum</PreviewText></TableHead>
                <TableHead><PreviewText>Webshop</PreviewText></TableHead>
                <TableHead><PreviewText>Bestelling</PreviewText></TableHead>
                <TableHead><PreviewText>Producten</PreviewText></TableHead>
                <TableHead><PreviewText>Land</PreviewText></TableHead>
                <TableHead className="text-right"><PreviewText>Excl. btw</PreviewText></TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((order) => (
                <TableRow key={`${order.shop}-${order.number}`}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{WHEN.format(new Date(order.created))}</TableCell>
                  <TableCell>{order.shop}</TableCell>
                  <TableCell className="font-medium"><Link className="underline-offset-4 hover:underline" href={`/admin/bestellingen/${order.id ?? `${order.shop}--${order.number}`}`}>#{order.number}</Link></TableCell>
                  <TableCell>
                    {order.lines.map((line) => (
                      <div key={line.sku} className="text-sm">
                        {line.quantity} × <Link prefetch={false} className="font-medium underline-offset-4 hover:underline" href={`/admin/voorraad/p/${encodeURIComponent(line.sku)}`}>{line.sku}</Link>{' '}
                        <span className="text-muted-foreground">{line.name.slice(0, 48)}</span>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>{order.country}</TableCell>
                  <TableCell className="text-right tabular-nums">{MONEY.format(order.totalExcl / 100)}</TableCell>
                  <TableCell className="space-x-1 whitespace-nowrap"><Badge variant={STATUS[order.status].variant}><PreviewText>{STATUS[order.status].label}</PreviewText></Badge>{order.fulfilment && order.fulfilment !== 'external' && <FulfilmentBadge value={order.fulfilment} />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm">
          {page > 1 && <Button asChild variant="outline" size="sm"><Link href={link({ page: String(page - 1) })}><PreviewText>Vorige pagina</PreviewText></Link></Button>}
          <span className="text-muted-foreground">{page} / {pageCount}</span>
          {page < pageCount && <Button asChild variant="outline" size="sm"><Link href={link({ page: String(page + 1) })}><PreviewText>Volgende pagina</PreviewText></Link></Button>}
        </div>
      )}
    </div>
  );
}
