'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { AlertTriangle, Banknote, Boxes, CreditCard, PackageCheck, ShoppingCart, TrendingDown, TrendingUp, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, RankedBars } from '@/app/admin/_ui/charts';
import { count, euro, formatCell, labelOf, CHANNELS } from '@/lib/kfcReportColumns';
import type { OwnerDashboard } from '@/lib/kfcOwnerDashboard';
import { usePreviewLanguage } from '../../PreviewLanguage';

function Tile({ title, value, foot, icon, tone, href }: { title: string; value: ReactNode; foot?: ReactNode; icon?: ReactNode; tone?: 'ok' | 'warn' | 'stop'; href?: string }) {
  const border = tone === 'stop' ? 'border-t-red-500' : tone === 'warn' ? 'border-t-amber-500' : tone === 'ok' ? 'border-t-emerald-500' : 'border-t-slate-300';
  const body = (
    <Card className={`h-full gap-1 border-t-2 py-4 ${border} ${href ? 'hover:bg-accent/50 transition-colors' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
        <CardDescription>{title}</CardDescription>
        {icon && <span className="text-muted-foreground [&>svg]:size-4" aria-hidden="true">{icon}</span>}
      </CardHeader>
      <CardContent className="px-4">
        <div className="text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
        {foot && <div className="text-muted-foreground mt-1 text-xs">{foot}</div>}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

/**
 * The owner's one-screen view of KeyForCars: what was sold and earned today,
 * this week and this month (against the same days last month), what the stock
 * is worth and where it is short, what is on order, what still has to ship and
 * how the till was paid. Every tile links to the report behind it.
 */
export default function OwnerDashboardView({ data }: { data: OwnerDashboard }) {
  const { english } = usePreviewLanguage();
  const L = (nl: string, en: string) => (english ? en : nl);
  const { periods: p } = data;
  const vsLast = p.lastMonthToDate.revenue ? Math.round((p.month.revenue - p.lastMonthToDate.revenue) / p.lastMonthToDate.revenue * 1000) / 10 : null;
  const pct = (v: number | null) => (v === null ? '—' : `${v}%`);
  const analyse = (query: string) => `/admin/voorraad/analyse?${query}`;
  const shortage = data.stock.low + data.stock.zero + data.stock.negative;
  const till = data.till;
  const tillTotal = (k: 'today' | 'week' | 'month') => (till ? till[k].cash + till[k].pin + till[k].other : 0);

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">{L('Eigenaarsoverzicht', 'Owner overview')}</h1>
          <p className="text-muted-foreground text-sm">{L('Omzet en brutowinst excl. btw op leverdatum; voorraad tegen inkoopprijs.', 'Revenue and gross profit excl. VAT by delivery date; stock at purchase price.')} {formatCell(data.today, 'date', english)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link href={analyse('r=sales&group=day')}>{L('Verkoop', 'Sales')}</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href={analyse('r=profit')}>{L('Brutowinst', 'Gross profit')}</Link></Button>
          <Button asChild variant="outline" size="sm"><Link href={analyse('r=reorder')}>{L('Bestelvoorstel', 'Reorder')}</Link></Button>
          <Button asChild variant="outline" size="sm"><a href="/admin/voorraad/artikelen">{L('Artikellijst', 'Item list')}</a></Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={L('Omzet', 'Revenue')}>
        <Tile title={L('Omzet vandaag', 'Revenue today')} value={euro(p.today.revenue, english)} icon={<ShoppingCart />}
          href={analyse(`r=sales&group=article&from=${data.today}&to=${data.today}`)}
          foot={`${L('Winst', 'Profit')} ${euro(p.today.profit, english)} · ${pct(p.today.margin)} · ${L('gisteren', 'yesterday')} ${euro(p.yesterday.revenue, english)}`} />
        <Tile title={L('Omzet deze week', 'Revenue this week')} value={euro(p.week.revenue, english)} icon={<ShoppingCart />}
          href={analyse(`r=sales&group=day&from=${data.monday}&to=${data.today}`)}
          foot={`${L('Winst', 'Profit')} ${euro(p.week.profit, english)} · ${pct(p.week.margin)} · ${count(p.week.units, english)} ${L('stuks', 'units')}`} />
        <Tile title={L('Omzet deze maand', 'Revenue this month')} value={euro(p.month.revenue, english)} icon={vsLast !== null && vsLast < 0 ? <TrendingDown /> : <TrendingUp />}
          tone={vsLast === null ? undefined : vsLast >= 0 ? 'ok' : 'warn'} href={analyse(`r=sales&group=day&from=${data.monthStart}&to=${data.today}`)}
          foot={`${vsLast === null ? '' : `${vsLast > 0 ? '+' : ''}${vsLast}% `}${L('t.o.v. zelfde dagen vorige maand', 'vs same days last month')} (${euro(p.lastMonthToDate.revenue, english)})`} />
        <Tile title={L('Brutowinst deze maand', 'Gross profit this month')} value={euro(p.month.profit, english)} icon={<TrendingUp />}
          href={analyse(`r=profit&from=${data.monthStart}&to=${data.today}`)}
          foot={`${L('Marge', 'Margin')} ${pct(p.month.margin)} · ${L('vorige maand', 'last month')} ${pct(p.lastMonthToDate.margin)}${data.refundsMonth ? ` · ${L('terugbetaald', 'refunded')} ${euro(data.refundsMonth, english)}` : ''}`} />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={L('Voorraad en inkoop', 'Stock and purchasing')}>
        <Tile title={L('Voorraadwaarde', 'Stock value')} value={euro(data.stock.value, english)} icon={<Boxes />} href={analyse('r=balance&group=warehouse')}
          tone={data.stock.unpriced ? 'warn' : undefined}
          foot={`${count(data.stock.inStock, english)} ${L('artikelen op voorraad', 'items in stock')}${data.stock.unpriced ? ` · ${count(data.stock.unpriced, english)} ${L('zonder kostprijs', 'without cost')}` : ''}`} />
        <Tile title={L('Tekort', 'Short')} value={count(shortage, english)} icon={<AlertTriangle />} tone={data.stock.negative ? 'stop' : shortage ? 'warn' : 'ok'}
          href="/admin/voorraad/artikelen?state=tekort"
          foot={`${count(data.stock.low, english)} ${L('laag', 'low')} · ${count(data.stock.zero, english)} ${L('nul', 'zero')} · ${count(data.stock.negative, english)} ${L('negatief', 'negative')}`} />
        <Tile title={L('Open inkooporders', 'Open purchase orders')} value={count(data.purchasing.ordered, english)} icon={<Truck />} href="/admin/inkoop"
          tone={data.purchasing.overdue ? 'warn' : undefined}
          foot={`${euro(data.purchasing.openValue, english)} ${L('onderweg', 'incoming')} · ${count(data.purchasing.drafts, english)} ${L('concept', 'draft')}${data.purchasing.overdue ? ` · ${count(data.purchasing.overdue, english)} ${L('te laat', 'late')} (${data.purchasing.overdueSuppliers.join(', ')})` : ''}`} />
        <Tile title={L('Open webshopbestellingen', 'Open web-shop orders')} value={count(data.webshop.open, english)} icon={<PackageCheck />} href="/admin/bestellingen/picken"
          tone={data.webshop.olderThan2Days ? 'warn' : undefined}
          foot={`${euro(data.webshop.value, english)} ${L('excl. btw', 'excl. VAT')}${data.webshop.olderThan2Days ? ` · ${count(data.webshop.olderThan2Days, english)} ${L('ouder dan 2 dagen', 'older than 2 days')}` : ''}`} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader><CardTitle>{L('Omzet per dag, laatste 30 dagen (€ excl. btw)', 'Revenue per day, last 30 days (€ excl. VAT)')}</CardTitle></CardHeader>
          <CardContent>
            <BarChart reportStyle bars={data.chart.map((d) => ({ label: `${Number(d.day.slice(8))}/${Number(d.day.slice(5, 7))}`, value: d.revenue / 100 }))}
              format={(v) => euro(Math.round(v) * 100, english).replace(/,00$/, '')} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{L('Kassa: contant en pin (incl. btw)', 'Till: cash and card (incl. VAT)')}</CardTitle></CardHeader>
          <CardContent>
            {!till ? (
              <p className="text-muted-foreground text-sm">{L('De kassa is op deze installatie nog niet in gebruik. Zodra er afgerekend wordt, staat hier de verdeling contant / pin.', 'The till is not in use on this installation yet. Once sales are rung up, the cash / card split shows here.')}</p>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead></TableHead><TableHead className="text-right">{L('Vandaag', 'Today')}</TableHead>
                  <TableHead className="text-right">{L('Week', 'Week')}</TableHead><TableHead className="text-right">{L('Maand', 'Month')}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {([['cash', L('Contant', 'Cash'), <Banknote key="c" className="size-4" />], ['pin', L('Pin', 'Card'), <CreditCard key="p" className="size-4" />], ['other', L('Overig', 'Other'), null]] as const).map(([key, label, icon]) => (
                    <TableRow key={key}>
                      <TableCell className="flex items-center gap-2">{icon}{label}</TableCell>
                      {(['today', 'week', 'month'] as const).map((k) => <TableCell key={k} className="text-right tabular-nums">{euro(till[k][key], english)}</TableCell>)}
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-semibold">{L('Totaal', 'Total')}</TableCell>
                    {(['today', 'week', 'month'] as const).map((k) => <TableCell key={k} className="text-right font-semibold tabular-nums">{euro(tillTotal(k), english)}</TableCell>)}
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>{L('Top 10 deze maand', 'Top 10 this month')}</CardTitle>
            <Button asChild variant="outline" size="sm"><Link href={analyse(`r=top&basis=omzet&from=${data.monthStart}&to=${data.today}`)}>{L('Topverkopers', 'Top sellers')}</Link></Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>{L('Artikel', 'Item')}</TableHead><TableHead className="text-right">{L('Stuks', 'Units')}</TableHead>
                <TableHead className="text-right">{L('Omzet', 'Revenue')}</TableHead><TableHead className="text-right">{L('Winst', 'Profit')}</TableHead><TableHead className="text-right">{L('Marge', 'Margin')}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.top.length === 0 && <TableRow><TableCell colSpan={5} className="text-muted-foreground py-6 text-center">{L('Deze maand nog niets verkocht.', 'Nothing sold this month yet.')}</TableCell></TableRow>}
                {data.top.map((t) => (
                  <TableRow key={t.code}>
                    <TableCell className="max-w-80 whitespace-normal"><Link className="hover:underline" href={`/admin/voorraad/artikel/${encodeURIComponent(t.code)}`}>{t.name}</Link><span className="text-muted-foreground block font-mono text-xs">{t.code}</span></TableCell>
                    <TableCell className="text-right tabular-nums">{count(t.units, english)}</TableCell>
                    <TableCell className="text-right tabular-nums">{euro(t.revenue, english)}</TableCell>
                    <TableCell className="text-right tabular-nums">{euro(t.profit, english)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct(t.margin)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{L('Omzet per kanaal deze maand', 'Revenue by channel this month')}</CardTitle></CardHeader>
          <CardContent>
            <RankedBars rows={data.channels.map((c) => ({ label: labelOf(CHANNELS, c.channel, english), value: c.revenue / 100 }))} format={(v) => euro(Math.round(v * 100), english)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
