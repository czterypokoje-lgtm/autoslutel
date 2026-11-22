import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowDownLeft, ArrowUpRight, Boxes, PackageCheck } from 'lucide-react';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WAREHOUSE } from '@/config/install';
import { requireWarehouseUser, seesPrices } from '@/lib/crmSession';
import { moveLabel } from '@/lib/keyforcarsStock';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
const path = '/admin/rapport/voorraadbewegingen';
const date = new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Amsterdam' });
const when = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Amsterdam' });
const number = new Intl.NumberFormat('nl-NL');
const valid = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const labelFor = (reason: string) => moveLabel(reason === 'received' ? 'receive' : reason);
type Row = {
  id: number; created_at: string; code: string; name: string; sku: string | null; delta: number;
  reason: string; quantity_after: number | null; warehouse: string | null; shelf: string | null;
  box: string | null; order_id: string | null; sales_invoice_id: string | null; job_id: string | null; van_name: string | null;
};
type Report = { opening: number; closing: number; count: number; changes: { reason: string; incoming: number; outgoing: number }[]; rows: Row[] };

export default async function StockMovementReport({ searchParams }: {
  searchParams: Promise<{ from?: string; to?: string; q?: string; warehouse?: string; page?: string }>;
}) {
  if (!WAREHOUSE) notFound();
  const office = seesPrices(await requireWarehouseUser(path));
  const params = await searchParams;
  const today = date.format(new Date());
  const start = valid(params.from) ? params.from : today.slice(0, 7) + '-01';
  const end = valid(params.to) ? params.to : today;
  const [from, to] = start <= end ? [start, end] : [end, start];
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 80) : '';
  const warehouse = typeof params.warehouse === 'string' ? params.warehouse.slice(0, 80) : '';
  const page = typeof params.page === 'string' && /^\d{1,7}$/.test(params.page) ? Math.max(1, Number(params.page)) : 1;
  const db = createSupabaseAdminClient();
  const [result, locations] = await Promise.all([
    db.rpc('kfc_stock_movement_report', { p_from: from, p_to: to, p_query: q, p_warehouse: warehouse, p_page: page }),
    db.from('kfc_locations').select('warehouse').order('warehouse'),
  ]);
  if (result.error || locations.error) throw new Error('Voorraadbewegingen konden niet worden geladen.');
  const report = result.data as Report;
  const warehouses = [...new Set((locations.data ?? []).map((location) => location.warehouse))];
  const incoming = report.changes.reduce((sum, change) => sum + change.incoming, 0);
  const outgoing = report.changes.reduce((sum, change) => sum + change.outgoing, 0);
  const peak = Math.max(1,...report.changes.flatMap(change=>[change.incoming,change.outgoing]));
  const pages = Math.max(1, Math.ceil(report.count / 25));
  const href = (next: number) => path + '?' + new URLSearchParams({ from, to, q, warehouse, page: String(next) });

  return <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 pb-8">
    <header className="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-linear-to-r from-slate-950 to-teal-900 px-6 py-6 text-white">
      <div><h1 className="text-3xl font-semibold tracking-tight text-white!"><PreviewText>Voorraadbewegingen</PreviewText></h1>
        <p className="mt-1 text-sm text-slate-200"><PreviewText>Van beginvoorraad naar eindvoorraad.</PreviewText></p></div>
      <Link className="text-sm underline underline-offset-4" href="/admin/rapport/voorraad"><PreviewText>Voorraadstand</PreviewText></Link>
    </header>
    <Card><CardContent><form className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm"><PreviewText>Vanaf</PreviewText><input className="border-input rounded-lg border bg-transparent p-2" type="date" name="from" defaultValue={from} /></label>
      <label className="grid gap-1 text-sm"><PreviewText>Tot en met</PreviewText><input className="border-input rounded-lg border bg-transparent p-2" type="date" name="to" defaultValue={to} /></label>
      <label className="grid flex-1 gap-1 text-sm"><PreviewText>Artikel of SKU</PreviewText><input className="border-input min-w-36 rounded-lg border bg-transparent p-2" type="search" name="q" defaultValue={q} /></label>
      <label className="grid gap-1 text-sm"><PreviewText>Magazijn</PreviewText><select className="border-input bg-background rounded-lg border p-2" name="warehouse" defaultValue={warehouse}>
        <option value=""><PreviewText>Alle magazijnen</PreviewText></option>
        {warehouses.map((name) => <option key={name}>{name}</option>)}
      </select></label>
      <Button type="submit" className="h-10"><PreviewText>Toepassen</PreviewText></Button>
    </form></CardContent></Card>
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[
        { label: 'Beginvoorraad', value: report.opening, Icon: Boxes, color: 'text-sky-700 dark:text-sky-300' },
        { label: 'Inkomend', value: incoming, Icon: ArrowDownLeft, color: 'text-emerald-700 dark:text-emerald-300' },
        { label: 'Uitgaand', value: outgoing, Icon: ArrowUpRight, color: 'text-amber-700 dark:text-amber-300' },
        { label: 'Eindvoorraad', value: report.closing, Icon: PackageCheck, color: 'text-teal-700 dark:text-teal-300' },
      ].map(({ label, value, Icon, color }) => <Card key={label}><CardHeader className="flex items-center gap-3">
        <Icon aria-hidden="true" size={22} className={color} /><div><CardDescription><PreviewText>{label}</PreviewText></CardDescription>
          <CardTitle className="text-2xl tabular-nums">{number.format(value)}</CardTitle></div>
      </CardHeader></Card>)}
    </section>
    {report.changes.length > 0 && <Card>
      <CardHeader><CardTitle><PreviewText>Per bewegingstype</PreviewText></CardTitle>
        <CardDescription><PreviewText>Interne overboekingen worden apart getoond en tellen niet als inkoop of verkoop.</PreviewText></CardDescription>
      </CardHeader>
      <CardContent><div className="mb-5 grid gap-3" aria-hidden="true">{report.changes.map(change=><div key={change.reason} className="grid grid-cols-[8rem_1fr_1fr] items-center gap-2 text-xs"><PreviewText>{labelFor(change.reason)}</PreviewText><div className="flex justify-end"><span className="h-3 rounded-l bg-amber-500" style={{width:100*change.outgoing/peak+'%'}}/></div><span className="h-3 rounded-r bg-emerald-600" style={{width:100*change.incoming/peak+'%'}}/></div>)}</div><Table><TableHeader><TableRow>
        {['Type', 'Inkomend', 'Uitgaand', 'Netto'].map((label) => <TableHead key={label}><PreviewText>{label}</PreviewText></TableHead>)}
      </TableRow></TableHeader><TableBody>
        {report.changes.map((change) => <TableRow key={change.reason}><TableCell><PreviewText>{labelFor(change.reason)}</PreviewText></TableCell>
          <TableCell className="tabular-nums">{number.format(change.incoming)}</TableCell><TableCell className="tabular-nums">{number.format(change.outgoing)}</TableCell>
          <TableCell className="font-medium tabular-nums">{number.format(change.incoming - change.outgoing)}</TableCell>
        </TableRow>)}
      </TableBody></Table></CardContent>
    </Card>}
    <Card><CardHeader><CardTitle><PreviewText>Voorraadbewegingen</PreviewText></CardTitle></CardHeader>
      <CardContent><Table className="min-w-[780px]"><TableHeader><TableRow>
        {['Datum', 'Artikel', 'Type', 'Locatie', 'Aantal', 'Voorraad na boeking', 'Bron'].map((label) => <TableHead key={label}><PreviewText>{label}</PreviewText></TableHead>)}
      </TableRow></TableHeader><TableBody>
        {!report.rows.length && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-8 text-center"><PreviewText>Geen voorraadbewegingen in deze selectie.</PreviewText></TableCell></TableRow>}
        {report.rows.map((row) => <TableRow key={row.id}>
          <TableCell><time dateTime={row.created_at}>{when.format(new Date(row.created_at))}</time></TableCell>
          <TableCell className="max-w-64 whitespace-normal">{row.name}<span className="text-muted-foreground block text-xs">{row.sku || row.code}</span></TableCell>
          <TableCell><PreviewText>{labelFor(row.reason)}</PreviewText></TableCell>
          <TableCell>{row.van_name ? 'Servicebus · ' + row.van_name : [row.warehouse, row.shelf, row.box].filter(Boolean).join(' / ') || '—'}</TableCell>
          <TableCell className="font-semibold tabular-nums">{row.delta > 0 ? '+' : ''}{number.format(row.delta)}</TableCell>
          <TableCell className="tabular-nums">{row.quantity_after === null ? '—' : number.format(row.quantity_after)}</TableCell>
          <TableCell>{row.order_id ? <Link href={'/admin/bestellingen/' + row.order_id} className="underline"><PreviewText>Bestelling</PreviewText></Link>
            : row.job_id && office ? <Link href={'/admin/jobs/' + row.job_id + '#warehouse-stock-' + row.job_id} className="underline"><PreviewText>Klus</PreviewText></Link>
            : row.sales_invoice_id && office ? <Link href={'/admin/facturen/' + row.sales_invoice_id} className="underline"><PreviewText>Factuur</PreviewText></Link> : '—'}</TableCell>
        </TableRow>)}
      </TableBody></Table>
      {(pages > 1 || page > 1) && <div className="mt-4 flex items-center justify-end gap-2">
        {page > 1 && <Button asChild variant="outline" size="sm"><Link href={href(page > pages ? pages : page - 1)}><PreviewText>Vorige pagina</PreviewText></Link></Button>}
        <span className="text-muted-foreground text-sm">{Math.min(page, pages)} / {pages}</span>
        {page < pages && <Button asChild variant="outline" size="sm"><Link href={href(page + 1)}><PreviewText>Volgende pagina</PreviewText></Link></Button>}
      </div>}
      </CardContent>
    </Card>
  </main>;
}
