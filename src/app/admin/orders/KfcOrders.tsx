import Link from 'next/link';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PreviewProductName, PreviewText, PreviewStyledInput } from '../PreviewLanguage';
import { SHOPS, sampleOrders, type OrderStatus, type SampleOrder } from '@/lib/kfcSampleOrders';
import { listShopOrders, sampleShopOrdersExist, shopOrdersExist } from '@/lib/kfcOrders';
import { WOO_SHOPS, wooConfigured, type WooShop } from '@/lib/kfcWoo';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { IS_KEYFORCARS } from '@/config/install';
import { OWN_SHOP, syncOwnOrdersOnView } from '@/lib/kfcOwnShop';
import { FulfilmentBadge, ImportPanel, OwnImportPanel } from '../bestellingen/OrderParts';
import type { Fulfilment } from '@/lib/kfcOrders';

/**
 * Orders from the three web shops, newest first. Read-only: an order is
 * handled in WooCommerce; this screen is for finding one and seeing what was
 * in it. Preview: sample orders. Phase 2 swaps the source for shop_orders and
 * adds the per-line fulfilment states.
 */

/* One colour per state, the same palette and dark-mode handling the invoice badges use. */
const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  processing: { label: 'In behandeling', className: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  completed: { label: 'Afgerond', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  'on-hold': { label: 'Wacht op betaling', className: 'border-border bg-muted/40 text-muted-foreground' },
  cancelled: { label: 'Geannuleerd', className: 'border-destructive/20 bg-destructive/10 text-destructive' },
  refunded: { label: 'Terugbetaald', className: 'border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400' },
};

/** The office's note, short enough for a table cell; the full text is the cell's tooltip. */
const snippet = (note: string | null | undefined) => {
  const text = (note ?? '').trim().replace(/\s+/g, ' ');
  return text.length > 70 ? `${text.slice(0, 70)}…` : text;
};

const LIMIT = 30;
const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const WHEN = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });

function Filter({ on, href, children }: { on: boolean; href: string; children: React.ReactNode }) {
  return <Button asChild size="sm" variant={on ? 'default' : 'ghost'}><Link href={href}>{children}</Link></Button>;
}

type Row = SampleOrder & { id?: string; fulfilment?: Fulfilment; note?: string | null };

export default async function KfcOrders({ shop, status, q, requestedPage, canImport = false, canImportOwn = false }: { shop?: string; status?: string; q?: string; requestedPage?: string; canImport?: boolean; canImportOwn?: boolean }) {
  const dispatched = status === 'dispatched';
  const query = (q ?? '').trim().toUpperCase();
  const requested = Number(requestedPage);
  // Autosleutel24: the webshop writes public.orders; bring new paid orders into the ledger before listing it.
  if (canImportOwn) await syncOwnOrdersOnView();
  const [live, hasSamples] = await Promise.all([shopOrdersExist().catch(() => false), sampleShopOrdersExist().catch(() => false)]);
  // The sample orders are KeyForCars's shops; Autosleutel24 shows its own empty ledger instead.
  const showSampleNotice = IS_KEYFORCARS && (!live || hasSamples);
  let shown: Row[]; let total: number; let page: number;
  if (live || !IS_KEYFORCARS) {
    page = Number.isInteger(requested) && requested > 0 ? requested : 1;
    const result = await listShopOrders({ shop, status: dispatched ? undefined : status, fulfilment: dispatched ? 'shipped' : undefined, q: query, page, limit: LIMIT });
    total = result.total;
    shown = result.orders.map((o) => ({
      id: o.id, fulfilment: o.fulfilment, number: o.number, shop: o.shop as SampleOrder['shop'], created: o.created_at,
      status: (o.status in STATUS ? o.status : 'cancelled') as OrderStatus, country: o.country ?? '', note: o.note ?? null,
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
  // Autosleutel24: one own webshop, so one panel with its order count and when it last ran.
  const ownImport = canImportOwn ? await (async () => {
    const db = createSupabaseAdminClient();
    const [count, run] = await Promise.all([
      db.from('kfc_shop_orders').select('id', { count: 'exact', head: true }).eq('shop', OWN_SHOP),
      db.from('kfc_import_runs').select('finished_at').eq('shop', OWN_SHOP).not('finished_at', 'is', null).order('finished_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    return { orders: count.count ?? 0, last: (run.data?.finished_at as string | null) ?? null };
  })() : null;

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
          <p className="text-muted-foreground text-sm">{SHOPS.length > 1 ? <PreviewText>Alle webshops</PreviewText> : SHOPS[0]} · {orders.length}</p>
        </div>
        <form method="get" action="/admin/orders" className="relative w-full max-w-xs">
          {shop && <input type="hidden" name="shop" value={shop} />}
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <PreviewStyledInput type="search" name="q" defaultValue={q} placeholder="Zoek op ordernummer of SKU" aria-label="Zoek bestelling" className="pl-8" />
        </form>
      </div>

      {canImport && <div className="max-md:order-last"><ImportPanel shops={importShops} /></div>}
      {ownImport && <div className="max-md:order-last"><OwnImportPanel orders={ownImport.orders} last={ownImport.last} /></div>}
      {showSampleNotice && <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs"><PreviewText>Voorbeeldbestellingen. Echte producten en prijzen, verzonnen klanten en aantallen.</PreviewText></p>}

      <div className="flex flex-wrap gap-2">
        {SHOPS.length > 1 && (
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border p-1">
            <Filter on={!shop} href={link({ shop: undefined })}><PreviewText>Alle</PreviewText></Filter>
            {SHOPS.map((s) => <Filter key={s} on={shop === s} href={link({ shop: s })}>{s}</Filter>)}
          </div>
        )}
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border p-1">
          <Filter on={!status} href={link({ status: undefined })}><PreviewText>Elke status</PreviewText></Filter>
          <Filter on={dispatched} href={link({ status: 'dispatched' })}><PreviewText>Verzonden in CRM</PreviewText></Filter>
          {(Object.keys(STATUS) as OrderStatus[]).map((s) => <Filter key={s} on={status === s} href={link({ status: s })}><PreviewText>{STATUS[s].label}</PreviewText></Filter>)}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y md:hidden">
            {shown.map((order) => (
              <li key={`m-${order.shop}-${order.number}`} className="flex flex-col gap-1.5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Link className="font-semibold" href={`/admin/bestellingen/${order.id ?? `${order.shop}--${order.number}`}`}>#{order.number}</Link>
                  <span className="font-medium tabular-nums">{MONEY.format(order.totalExcl / 100)}</span>
                </div>
                <div className="text-muted-foreground text-xs">{order.shop} · {WHEN.format(new Date(order.created))} · {order.country}</div>
                <div className="text-xs">
                  {order.lines.map((line) => <div key={line.sku} className="truncate">{line.quantity} × <span className="font-medium">{line.sku}</span> <span className="text-muted-foreground"><PreviewProductName sku={line.sku} limit={40}>{line.name}</PreviewProductName></span></div>)}
                </div>
                <div className="flex flex-wrap gap-1 pt-0.5"><Badge variant="outline" className={STATUS[order.status].className}><PreviewText>{STATUS[order.status].label}</PreviewText></Badge>{order.fulfilment && order.fulfilment !== 'external' && <FulfilmentBadge value={order.fulfilment} />}</div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><PreviewText>Datum</PreviewText></TableHead>
                <TableHead><PreviewText>Webshop</PreviewText></TableHead>
                <TableHead><PreviewText>Bestelling</PreviewText></TableHead>
                <TableHead><PreviewText>Producten</PreviewText></TableHead>
                <TableHead><PreviewText>Land</PreviewText></TableHead>
                <TableHead><PreviewText>Notitie</PreviewText></TableHead>
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
                        <span className="text-muted-foreground"><PreviewProductName sku={line.sku} limit={48}>{line.name}</PreviewProductName></span>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>{order.country}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[18rem] truncate" title={order.note ?? ''}>{snippet(order.note) || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{MONEY.format(order.totalExcl / 100)}</TableCell>
                  <TableCell className="space-x-1 whitespace-nowrap"><Badge variant="outline" className={STATUS[order.status].className}><PreviewText>{STATUS[order.status].label}</PreviewText></Badge>{order.fulfilment && order.fulfilment !== 'external' && <FulfilmentBadge value={order.fulfilment} />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
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
