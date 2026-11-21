'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { BookOpen, ClipboardList, PackagePlus, Printer, ScanSearch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart } from '@/app/admin/_ui/charts';
import { ARTICLE_STATUSES, CHANNELS, STOCK_STATES, count, euro, formatCell, labelOf, reasonLabel } from '@/lib/kfcReportColumns';
import type { ArticleDetail } from '@/lib/kfcInventoryReports';
import { usePreviewLanguage } from '../../../PreviewLanguage';

const STATE_TONE: Record<string, string> = {
  negatief: 'border-red-300 bg-red-50 text-red-700', nul: 'border-slate-300 bg-slate-50 text-slate-700',
  laag: 'border-amber-300 bg-amber-50 text-amber-800', op_voorraad: 'border-emerald-300 bg-emerald-50 text-emerald-800',
};
const PO_STATUS: Record<string, [string, string]> = {
  draft: ['Concept', 'Draft'], ordered: ['Besteld', 'Ordered'], received: ['Ontvangen', 'Received'], cancelled: ['Geannuleerd', 'Cancelled'],
};

function Kpi({ label, value, foot, tone }: { label: string; value: ReactNode; foot?: ReactNode; tone?: 'warn' | 'stop' | 'ok' }) {
  const border = tone === 'stop' ? 'border-t-red-500' : tone === 'warn' ? 'border-t-amber-500' : tone === 'ok' ? 'border-t-emerald-500' : 'border-t-slate-300';
  return (
    <Card className={`gap-1 border-t-2 py-3 ${border}`}>
      <CardHeader className="px-4 pb-0"><CardDescription>{label}</CardDescription></CardHeader>
      <CardContent className="px-4">
        <div className="text-xl font-semibold tabular-nums tracking-tight">{value}</div>
        {foot && <div className="text-muted-foreground mt-0.5 text-xs">{foot}</div>}
      </CardContent>
    </Card>
  );
}

/**
 * Article 360°: master data, the five stock numbers per location, open
 * reservations and purchase orders, the movement history with running balance,
 * purchase and sales history with margin, and the label. Money is absent from
 * the data for roles without seesPrices, so it is simply not shown.
 */
export default function ArticleDetailView({ detail, office }: { detail: ArticleDetail; office: boolean }) {
  const { english } = usePreviewLanguage();
  const L = (nl: string, en: string) => (english ? en : nl);
  const a = detail.article;
  const date = (iso: string | null | undefined) => (iso ? formatCell(iso, 'date', english) : '—');
  const stamp = (iso: string | null | undefined) => (iso ? formatCell(iso, 'datetime', english) : '—');
  const saleExcl = a.sale_price_cents === null || a.sale_price_cents === undefined ? null : Math.round(a.sale_price_cents / 1.21);
  const image = a.photo_version ? `/api/admin/voorraad-local?foto=${encodeURIComponent(a.code)}&v=${a.photo_version}` : null;
  const ledgerHref = `/admin/voorraad/analyse?r=ledger&from=2000-01-01&q=${encodeURIComponent(a.code)}`;
  const salesHref = `/admin/voorraad/analyse?r=sales&group=month&q=${encodeURIComponent(a.code)}`;

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 pb-8">
      <header className="flex flex-wrap items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- stock photo from the CRM's own route */}
        {image ? <img src={image} alt="" className="size-24 rounded-xl border object-cover" /> : <div className="bg-muted grid size-24 place-items-center rounded-xl border"><ScanSearch className="text-muted-foreground size-8" aria-hidden="true" /></div>}
        <div className="flex min-w-64 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm">{a.code}</span>
            <Badge variant="outline" className={STATE_TONE[a.stock_state] ?? ''}>{labelOf(STOCK_STATES, a.stock_state, english)}</Badge>
            <Badge variant="secondary">{labelOf(ARTICLE_STATUSES, a.status, english)}</Badge>
            {a.condition !== 'new' && <Badge variant="outline">{a.condition}</Badge>}
            {a.tracking === 'serial' && <Badge variant="outline">{L('Per stuk', 'Serialised')}</Badge>}
          </div>
          <h1 className="text-2xl font-medium tracking-tight">{a.name}</h1>
          <dl className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <div><dt className="inline">SKU </dt><dd className="text-foreground inline font-medium">{a.sku || '—'}</dd></div>
            <div><dt className="inline">EAN </dt><dd className="text-foreground inline">{a.ean?.length ? a.ean.join(', ') : '—'}</dd></div>
            <div><dt className="inline">{L('Categorie', 'Category')} </dt><dd className="text-foreground inline">{a.category || '—'}</dd></div>
            <div><dt className="inline">{L('Leverancier', 'Supplier')} </dt><dd className="text-foreground inline">{a.last_supplier ?? '—'}{a.supplier_ref ? ` · ${a.supplier_ref}` : ''}</dd></div>
            <div><dt className="inline">{L('Locaties', 'Locations')} </dt><dd className="text-foreground inline">{a.locations?.length ? a.locations.join(', ') : '—'}</dd></div>
          </dl>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button asChild variant="outline" size="sm"><a href={`/admin/voorraad/etiketten?codes=${encodeURIComponent(a.code)}`} target="_blank" rel="noreferrer"><Printer aria-hidden="true" />{L('Etiket', 'Label')}</a></Button>
          <Button asChild variant="outline" size="sm"><a href="/admin/voorraad"><ClipboardList aria-hidden="true" />{L('Boeken of tellen', 'Book or count')}</a></Button>
          <Button asChild variant="outline" size="sm"><Link href="/admin/inkoop"><PackagePlus aria-hidden="true" />{L('Inkoop', 'Purchasing')}</Link></Button>
          {a.sku && <Button asChild variant="outline" size="sm"><a href={`/admin/voorraad/p/${encodeURIComponent(a.sku)}`}><BookOpen aria-hidden="true" />{L('Productprofiel', 'Product profile')}</a></Button>}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label={L('Voorraad', 'Stock')}>
        <Kpi label={L('Fysiek', 'Physical')} value={count(a.physical, english)} tone={a.physical < 0 ? 'stop' : undefined} foot={a.unusable ? L(`${a.unusable} onbruikbaar`, `${a.unusable} unusable`) : undefined} />
        <Kpi label={L('Gereserveerd', 'Reserved')} value={count(a.reserved, english)} />
        <Kpi label={L('Beschikbaar', 'Available')} value={count(a.available, english)} tone={a.available <= 0 ? 'warn' : 'ok'} />
        <Kpi label={L('Onderweg', 'Incoming')} value={count(a.incoming, english)} />
        <Kpi label={L('Minimum', 'Minimum')} value={count(a.minimum, english)} foot={`${L('Laatst geteld', 'Last counted')}: ${date(a.last_counted_at)}`} />
        <Kpi label={L('Verkocht 30 / 90 / 365 d', 'Sold 30 / 90 / 365 d')} value={`${a.sold_30d} / ${a.sold_90d} / ${a.sold_365d}`} foot={`${L('Laatst verkocht', 'Last sold')}: ${date(a.last_sold_at)}`} />
      </section>

      {office && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7" aria-label={L('Prijzen en marge', 'Prices and margin')}>
          <Kpi label={L('Laatste inkoopprijs', 'Last purchase price')} value={euro(a.purchase_price_cents, english)} tone={a.purchase_price_cents === null ? 'warn' : undefined}
            foot={a.last_po_cost_cents !== null && a.last_po_cost_cents !== undefined ? `${L('Laatste inkooporder', 'Last PO')}: ${euro(a.last_po_cost_cents, english)}` : undefined} />
          <Kpi label={L('Gem. kostprijs', 'Average cost')} value={euro(a.avg_cost_cents === null || a.avg_cost_cents === undefined ? null : Number(a.avg_cost_cents), english)}
            tone={a.avg_cost_cents === null || a.avg_cost_cents === undefined ? 'warn' : undefined}
            foot={a.avg_cost_cents === null || a.avg_cost_cents === undefined ? L('Onbekend: waarde op inkoopprijs', 'Unknown: valued at purchase price') : L('Waardering voorraad en verkopen', 'Values stock and sales')} />
          <Kpi label={L('Verkoopprijs incl. btw', 'Sale price incl. VAT')} value={euro(a.sale_price_cents, english)} foot={saleExcl !== null ? `${euro(saleExcl, english)} ${L('excl. btw', 'excl. VAT')}` : undefined} />
          <Kpi label={L('Marge op prijslijst', 'List margin')} value={a.margin_pct === null || a.margin_pct === undefined ? '—' : `${a.margin_pct}%`}
            foot={saleExcl !== null && a.purchase_price_cents !== null && a.purchase_price_cents !== undefined ? `${euro(saleExcl - a.purchase_price_cents, english)} ${L('per stuk', 'per unit')}` : undefined} />
          <Kpi label={L('Voorraadwaarde', 'Stock value')} value={euro(a.stock_value_cents, english)} />
          <Kpi label={L('Omzet 12 maanden', 'Revenue 12 months')} value={euro(detail.salesTotals.revenue, english)} foot={L(`${detail.salesTotals.units} stuks`, `${detail.salesTotals.units} units`)} />
          <Kpi label={L('Brutowinst 12 maanden', 'Gross profit 12 months')} value={euro(detail.salesTotals.profit, english)} foot={detail.salesTotals.margin !== null ? `${detail.salesTotals.margin}% ${L('marge', 'margin')}` : undefined} />
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader><CardTitle>{L('Verkocht per maand (stuks)', 'Sold per month (units)')}</CardTitle></CardHeader>
          <CardContent><BarChart reportStyle bars={detail.months.map((m) => ({ label: m.month.slice(2).replace('-', '/'), value: m.units }))} format={(v) => count(Math.round(v), english)} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{L('Per kanaal (12 maanden)', 'By channel (12 months)')}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {detail.channels.length === 0 && <p className="text-muted-foreground">{L('Nog geen verkoop.', 'No sales yet.')}</p>}
            {detail.channels.map((c) => (
              <div key={c.channel} className="flex justify-between gap-2"><span>{english ? CHANNELS.find((x) => x.nl === c.channel)?.en ?? c.channel : c.channel}</span><strong className="tabular-nums">{count(c.units, english)}</strong></div>
            ))}
            <p className="text-muted-foreground mt-2 text-xs">{L('Laatst ontvangen', 'Last received')}: {date(a.last_received_at)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="locaties">
        <TabsList className="flex-wrap">
          <TabsTrigger value="locaties">{L('Per locatie', 'By location')} ({detail.levels.length})</TabsTrigger>
          <TabsTrigger value="bewegingen">{L('Bewegingen', 'Movements')} ({detail.ledger.count})</TabsTrigger>
          <TabsTrigger value="inkoop">{L('Inkoop', 'Purchases')} ({detail.purchases.length})</TabsTrigger>
          <TabsTrigger value="verkoop">{L('Verkoop', 'Sales')} ({detail.salesTotals.lines})</TabsTrigger>
          <TabsTrigger value="reserveringen">{L('Reserveringen', 'Reservations')} ({detail.reservations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="locaties">
          <Card><CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{L('Locatie', 'Location')}</TableHead><TableHead className="text-right">{L('Aantal', 'Qty')}</TableHead>
                <TableHead className="text-right">{L('Minimum', 'Minimum')}</TableHead><TableHead>{L('Laatst geteld', 'Last counted')}</TableHead><TableHead>{L('Gewijzigd', 'Updated')}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {detail.levels.length === 0 && <TableRow><TableCell colSpan={5} className="text-muted-foreground py-6 text-center">{L('Nog niet op een plank geteld.', 'Not counted on a shelf yet.')}</TableCell></TableRow>}
                {detail.levels.map((l) => (
                  <TableRow key={l.location}>
                    <TableCell>{l.location}</TableCell>
                    <TableCell className={`text-right tabular-nums ${l.quantity < 0 ? 'text-red-600' : ''}`}>{count(l.quantity, english)}</TableCell>
                    <TableCell className="text-right tabular-nums">{count(l.minimum, english)}</TableCell>
                    <TableCell>{date(l.last_counted_at)}</TableCell><TableCell>{stamp(l.updated_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="bewegingen">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardDescription>{L(`Laatste ${detail.ledger.rows.length} van ${detail.ledger.count} boekingen; saldo = voorraad over alle locaties na de boeking.`,
                `Latest ${detail.ledger.rows.length} of ${detail.ledger.count} movements; balance = stock over all locations after the movement.`)}</CardDescription>
              <Button asChild variant="outline" size="sm"><Link href={ledgerHref}>{L('Volledig grootboek', 'Full ledger')}</Link></Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader><TableRow>
                  <TableHead>{L('Datum', 'Date')}</TableHead><TableHead>{L('Soort', 'Type')}</TableHead><TableHead>{L('Locatie', 'Location')}</TableHead>
                  <TableHead className="text-right">{L('Mutatie', 'Change')}</TableHead><TableHead className="text-right">{L('Saldo', 'Balance')}</TableHead>
                  {office && <TableHead className="text-right">{L('Waarde', 'Value')}</TableHead>}<TableHead>{L('Bron', 'Source')}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {detail.ledger.rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-6 text-center">{L('Nog geen boekingen.', 'No movements yet.')}</TableCell></TableRow>}
                  {detail.ledger.rows.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{stamp(m.created_at)}</TableCell>
                      <TableCell><Badge variant="outline">{reasonLabel(m.reason, english)}</Badge></TableCell>
                      <TableCell>{m.location}</TableCell>
                      <TableCell className={`text-right font-medium tabular-nums ${m.delta < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{m.delta > 0 ? '+' : ''}{count(m.delta, english)}</TableCell>
                      <TableCell className={`text-right tabular-nums ${m.balance < 0 ? 'text-red-600' : ''}`}>{count(m.balance, english)}</TableCell>
                      {office && <TableCell className="text-right tabular-nums">{euro((m as { value_cents?: number | null }).value_cents ?? null, english)}</TableCell>}
                      <TableCell className="max-w-64 truncate">{m.sales_invoice_id && office ? <Link className="underline" href={`/admin/facturen/${m.sales_invoice_id}`}>{m.source}</Link> : m.source || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inkoop">
          <Card><CardContent className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader><TableRow>
                <TableHead>{L('Datum', 'Date')}</TableHead><TableHead>{L('Leverancier', 'Supplier')}</TableHead><TableHead>{L('Status', 'Status')}</TableHead>
                <TableHead className="text-right">{L('Besteld', 'Ordered')}</TableHead><TableHead className="text-right">{L('Ontvangen', 'Received')}</TableHead>
                {office && <TableHead className="text-right">{L('Inkoopprijs', 'Unit cost')}</TableHead>}<TableHead>{L('Verwacht / ontvangen', 'Expected / received')}</TableHead><TableHead>{L('Factuur', 'Invoice')}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {detail.purchases.length === 0 && <TableRow><TableCell colSpan={8} className="text-muted-foreground py-6 text-center">{L('Nog niet ingekocht via een inkooporder.', 'Not bought through a purchase order yet.')}</TableCell></TableRow>}
                {detail.purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{date(p.date)}</TableCell><TableCell>{p.supplier}</TableCell>
                    <TableCell><Badge variant="outline">{english ? PO_STATUS[p.status]?.[1] ?? p.status : PO_STATUS[p.status]?.[0] ?? p.status}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{count(p.quantity, english)}</TableCell>
                    <TableCell className="text-right tabular-nums">{count(p.received, english)}</TableCell>
                    {office && <TableCell className="text-right tabular-nums">{euro((p as { unit_cost_cents?: number | null }).unit_cost_cents ?? null, english)}</TableCell>}
                    <TableCell>{p.receivedAt ? date(p.receivedAt) : date(p.expected)}</TableCell><TableCell>{p.invoice ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="verkoop">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <CardDescription>{L('Verkopen en retouren van de laatste 12 maanden (laatste 100 getoond).', 'Sales and returns of the last 12 months (latest 100 shown).')}</CardDescription>
              {office && <Button asChild variant="outline" size="sm"><Link href={salesHref}>{L('Verkooprapport', 'Sales report')}</Link></Button>}
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader><TableRow>
                  <TableHead>{L('Datum', 'Date')}</TableHead><TableHead>{L('Kanaal', 'Channel')}</TableHead><TableHead>{L('Document', 'Document')}</TableHead>
                  <TableHead className="text-right">{L('Aantal', 'Qty')}</TableHead>
                  {office && <><TableHead className="text-right">{L('Omzet excl. btw', 'Revenue excl. VAT')}</TableHead><TableHead className="text-right">{L('Kostprijs', 'Cost')}</TableHead><TableHead className="text-right">{L('Winst', 'Profit')}</TableHead></>}
                </TableRow></TableHeader>
                <TableBody>
                  {detail.sales.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-6 text-center">{L('Nog geen verkoop.', 'No sales yet.')}</TableCell></TableRow>}
                  {detail.sales.map((s) => {
                    const money = s as { revenue_cents?: number; cost_cents?: number };
                    return (
                      <TableRow key={s.move_id}>
                        <TableCell>{stamp(s.created_at)}</TableCell>
                        <TableCell>{labelOf(CHANNELS, s.channel, english)}{s.shop ? ` · ${s.shop}` : ''}</TableCell>
                        <TableCell>{s.sales_invoice_id && office ? <Link className="underline" href={`/admin/facturen/${s.sales_invoice_id}`}>{s.document}</Link> : s.document ?? '—'}</TableCell>
                        <TableCell className={`text-right tabular-nums ${s.quantity < 0 ? 'text-red-600' : ''}`}>{count(s.quantity, english)}</TableCell>
                        {office && <>
                          <TableCell className="text-right tabular-nums">{euro(money.revenue_cents ?? null, english)}{s.revenue_estimated ? ' *' : ''}</TableCell>
                          <TableCell className="text-right tabular-nums">{euro(money.cost_cents ?? null, english)}{s.cost_estimated ? ' *' : ''}</TableCell>
                          <TableCell className="text-right tabular-nums">{euro((money.revenue_cents ?? 0) - (money.cost_cents ?? 0), english)}</TableCell>
                        </>}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {office && <p className="text-muted-foreground mt-2 text-xs">{L('* geschat: geen factuurregel of geen kostprijs op de boeking.', '* estimated: no invoice line or no cost on the movement.')}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reserveringen">
          <Card><CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{L('Bestelling', 'Order')}</TableHead><TableHead>{L('Webshop', 'Web shop')}</TableHead><TableHead>{L('Datum', 'Date')}</TableHead>
                <TableHead className="text-right">{L('Aantal', 'Qty')}</TableHead><TableHead className="text-right">{L('Gereserveerd', 'Reserved')}</TableHead><TableHead className="text-right">{L('Verzameld', 'Picked')}</TableHead><TableHead>{L('Status', 'State')}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {detail.reservations.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-6 text-center">{L('Geen open bestelregels.', 'No open order lines.')}</TableCell></TableRow>}
                {detail.reservations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell><Link className="underline" href={`/admin/bestellingen/${r.orderId}`}>{r.number}</Link></TableCell>
                    <TableCell>{r.shop}</TableCell><TableCell>{date(r.created_at)}</TableCell>
                    <TableCell className="text-right tabular-nums">{count(r.quantity, english)}</TableCell>
                    <TableCell className="text-right tabular-nums">{count(r.reserved, english)}</TableCell>
                    <TableCell className="text-right tabular-nums">{count(r.picked, english)}</TableCell>
                    <TableCell><Badge variant="outline">{r.state}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
