import { PreviewText } from '@/app/admin/PreviewLanguage';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { reports } from '@/lib/kfcReports';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : '—');

/** Margin, stock value, receivables and dead stock, all from the ledgers. */
export default async function KfcReports() {
  const { margin, stock, aging } = await reports();
  const totals = margin.reduce((s, m) => ({ revenue: s.revenue + m.revenue_cents, cost: s.cost + m.cost_cents - m.returned_cost_cents, priced: s.priced + m.priced_revenue_cents, refunds: s.refunds + m.refunds_cents }), { revenue: 0, cost: 0, priced: 0, refunds: 0 });
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-2xl font-semibold tracking-tight"><PreviewText>{"Winst & rapporten"}</PreviewText></h1><p className="text-muted-foreground text-sm"><PreviewText>{"Marge uit verzonden regels tegen de inkoopprijs op het moment van verkoop; voorraadwaarde tegen inkoopprijs; openstaande debiteuren naar vervaldatum."}</PreviewText></p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="pb-1"><CardDescription><PreviewText>{"Brutomarge 12 maanden"}</PreviewText></CardDescription><CardTitle className="text-2xl tabular-nums">{MONEY.format((totals.priced - totals.refunds - totals.cost) / 100)}</CardTitle></CardHeader><CardContent className="text-muted-foreground text-xs">op {pct(totals.priced, totals.revenue)} <PreviewText>{"van de omzet met bekende kostprijs"}</PreviewText></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardDescription><PreviewText>{"Voorraadwaarde"}</PreviewText></CardDescription><CardTitle className="text-2xl tabular-nums">{MONEY.format(stock.value_cents / 100)}</CardTitle></CardHeader><CardContent className="text-muted-foreground text-xs">{stock.articles_with_stock} artikelen op voorraad · {stock.unpriced} <PreviewText>{"zonder inkoopprijs (niet meegeteld)"}</PreviewText></CardContent></Card>
        <Card className={aging.overdue > 0 ? 'border-destructive/40' : undefined}><CardHeader className="pb-1"><CardDescription><PreviewText>{"Debiteuren open · vervallen"}</PreviewText></CardDescription><CardTitle className="text-2xl tabular-nums">{MONEY.format(aging.open / 100)} <span className="text-destructive text-base">· {MONEY.format(aging.overdue / 100)}</span></CardTitle></CardHeader><CardContent className="text-muted-foreground text-xs"><Link className="underline-offset-4 hover:underline" href="/admin/klanten?view=overdue"><PreviewText>{"vervallen klanten →"}</PreviewText></Link></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardDescription><PreviewText>{"Dode voorraad (90 dagen niet verkocht)"}</PreviewText></CardDescription><CardTitle className="text-2xl tabular-nums">{stock.dead.length} <span className="text-muted-foreground text-base">art. · {stock.dead_units} <PreviewText>{"st."}</PreviewText></span></CardTitle></CardHeader><CardContent className="text-muted-foreground text-xs"><PreviewText>{"op voorraad, geen verkoopboeking in 90 dagen"}</PreviewText></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base"><PreviewText>{"Ouderdom debiteuren"}</PreviewText></CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {([['Nog niet vervallen', aging.not_due], ['1–30', aging.d1_30], ['31–60', aging.d31_60], ['61–90', aging.d61_90], ['> 90', aging.d90p]] as [string, number][]).map(([l, v]) => <div key={l} className="rounded-lg border p-3"><div className="text-muted-foreground text-xs"><PreviewText>{l}</PreviewText></div><div className="font-semibold tabular-nums">{MONEY.format(v / 100)}</div></div>)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base"><PreviewText>{"Marge per maand en webshop"}</PreviewText></CardTitle><CardDescription><PreviewText>{"Netto-omzet excl. btw na terugbetalingen. Kostprijs alleen waar een inkoopprijs bekend was op het moment van verkoop."}</PreviewText></CardDescription></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead><PreviewText>{"Maand"}</PreviewText></TableHead><TableHead><PreviewText>{"Webshop"}</PreviewText></TableHead><TableHead className="text-right"><PreviewText>{"Stuks"}</PreviewText></TableHead><TableHead className="text-right"><PreviewText>{"Netto-omzet"}</PreviewText></TableHead><TableHead className="text-right"><PreviewText>{"Kostprijs"}</PreviewText></TableHead><TableHead className="text-right"><PreviewText>{"Marge"}</PreviewText></TableHead><TableHead className="text-right"><PreviewText>{"Met kostprijs"}</PreviewText></TableHead></TableRow></TableHeader>
            <TableBody>
              {margin.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-8 text-center"><PreviewText>{"Nog geen verzonden bestellingen."}</PreviewText></TableCell></TableRow>}
              {margin.map((m) => <TableRow key={`${m.month}${m.shop}`}><TableCell>{m.month}</TableCell><TableCell>{m.shop}</TableCell><TableCell className="text-right tabular-nums">{m.units}</TableCell><TableCell className="text-right tabular-nums">{MONEY.format((m.revenue_cents - m.refunds_cents) / 100)}</TableCell><TableCell className="text-right tabular-nums">{MONEY.format((m.cost_cents - m.returned_cost_cents) / 100)}</TableCell><TableCell className="text-right font-medium tabular-nums">{(m.priced_revenue_cents || m.refunds_cents || m.returned_cost_cents) ? MONEY.format((m.priced_revenue_cents - m.refunds_cents - m.cost_cents + m.returned_cost_cents) / 100) : '—'}</TableCell><TableCell className="text-muted-foreground text-right">{pct(m.priced_revenue_cents, m.revenue_cents)}</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {stock.dead.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base"><PreviewText>{"Dode voorraad"}</PreviewText></CardTitle><CardDescription><PreviewText>{"Niet bijbestellen; eerst tellen, dan afprijzen of retourneren."}</PreviewText></CardDescription></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead><PreviewText>{"Artikel"}</PreviewText></TableHead><TableHead className="text-right"><PreviewText>{"Op voorraad"}</PreviewText></TableHead></TableRow></TableHeader>
              <TableBody>{stock.dead.map((d) => <TableRow key={d.code}><TableCell><Link className="font-medium underline-offset-4 hover:underline" href={`/admin/voorraad/p?q=${encodeURIComponent(d.sku)}`}>{d.sku}</Link></TableCell><TableCell>{d.name}</TableCell><TableCell className="text-right tabular-nums">{d.quantity}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
