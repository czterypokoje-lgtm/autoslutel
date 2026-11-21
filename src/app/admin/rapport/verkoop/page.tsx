import { BarChart } from '../../_ui/charts';
import Link from 'next/link';
import ReportPreview from '../ReportPreview';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requireOfficeUser } from '@/lib/crmSession';
import { fetchAll } from '@/lib/kfcOrders';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const datePart = new Intl.DateTimeFormat('sv-SE', {
  year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Amsterdam',
});
const money = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const statuses = ['verzonden', 'betaald'];
const validDate = (date: unknown): date is string => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
};

type Invoice = {
  id: string; invoice_number: string; issue_date: string; subtotal: number;
  total: number; paid_at: string | null; job_id: string | null;
};
type Line = {
  id: string; invoice_id: string; description: string; quantity: number;
  unit_price: number; discount: number; job_line_kind: 'product' | 'service' | null;
  sales_invoices: { invoice_number: string; issue_date: string; job_id: string | null };
};

export default async function SalesReport({ searchParams }: {
  searchParams: Promise<{ from?: string; to?: string; channel?: string; preview?: string }>;
}) {
  await requireOfficeUser('/admin/rapport/verkoop');
  const params = await searchParams;
  const today = datePart.format(new Date());
  const start = validDate(params.from) ? params.from : today.slice(0, 7) + '-01';
  const finish = validDate(params.to) ? params.to : today;
  const [from, to] = start <= finish ? [start, finish] : [finish, start];
  const channel = params.channel === 'job' || params.channel === 'other' ? params.channel : '';
  const db = await createSupabaseServerClient();
  const invoices = () => db.from('sales_invoices').select('id, invoice_number, issue_date, subtotal, total, paid_at, job_id').in('status', statuses);
  const [issued, paid, lines] = await Promise.all([
    fetchAll<Invoice>((a, b) => invoices().gte('issue_date', from).lte('issue_date', to).order('id').range(a, b)),
    fetchAll<Invoice>((a, b) => invoices().eq('status', 'betaald')
      .gte('paid_at', new Date(Date.parse(from) - 86_400_000).toISOString()).lt('paid_at', new Date(Date.parse(to) + 2 * 86_400_000).toISOString()).order('id').range(a, b)),
    fetchAll<Line>((a, b) => db.from('sales_invoice_lines')
      .select('id, invoice_id, description, quantity, unit_price, discount, job_line_kind, sales_invoices!inner(invoice_number, issue_date, job_id)')
      .in('sales_invoices.status', statuses).gte('sales_invoices.issue_date', from).lte('sales_invoices.issue_date', to)
      .order('id').range(a, b) as unknown as PromiseLike<{ data: Line[] | null; error: { message: string } | null }>),
  ]);
  const matchesChannel = (jobId: string | null) => !channel || Boolean(jobId) === (channel === 'job');
  const billed = issued.filter((row) => matchesChannel(row.job_id));
  const received = paid.filter((row) => {
    if (!row.paid_at || !matchesChannel(row.job_id)) return false;
    const day = datePart.format(new Date(row.paid_at));
    return day >= from && day <= to;
  });
  const details = lines.filter((line) => matchesChannel(line.sales_invoices.job_id))
    .sort((a, b) => b.sales_invoices.issue_date.localeCompare(a.sales_invoices.issue_date));
  const group = (line: Line) => line.job_line_kind === 'product' ? 'Product' : line.job_line_kind === 'service' ? 'Dienst' : 'Niet ingedeeld';
  const amount = (line: Line) => Math.round((line.quantity * line.unit_price - line.discount) * 100);
  const groups = ['Product', 'Dienst', 'Niet ingedeeld'] as const;
  const groupTotals = groups.map((label) => ({ label, cents: details.filter((line) => group(line) === label).reduce((sum, line) => sum + amount(line), 0) }));
  const cards = [
    { label: 'Gefactureerd excl. btw', value: money.format(billed.reduce((sum, row) => sum + Math.round(row.subtotal * 100), 0) / 100) },
    { label: 'Facturen betaald incl. btw', value: money.format(received.reduce((sum, row) => sum + Math.round(row.total * 100), 0) / 100) },
    { label: 'Verzonden facturen', value: billed.length },
  ];
  const months = new Map<string, number>();
  for (const invoice of billed) {
    const month = invoice.issue_date.slice(0,7);
    months.set(month,(months.get(month) ?? 0) + Number(invoice.subtotal));
  }
  const trend = [...months.entries()].sort(([a],[b]) => a.localeCompare(b));
  const filters = new URLSearchParams({ from, to, channel });
  const back = '/admin/rapport/verkoop?' + filters;
  if (params.preview === '1') {
    const printedAt = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Amsterdam' }).format(new Date());
    return <ReportPreview back={back} columns={[{ id: "price", label: "Eenheidsprijs" }, { id: "discount", label: "Korting" }]}>
      <h1><PreviewText>Verkoop & diensten</PreviewText></h1>
      <p>{from} – {to} · EUR · <PreviewText>{channel === 'job' ? 'Klusfacturen' : channel === 'other' ? 'Overige facturen' : 'Alle facturen'}</PreviewText></p>
      <p><PreviewText>Rapport opgehaald op</PreviewText> {printedAt}</p>
      <dl>{cards.map(({ label, value }) => <div key={label}><dt><PreviewText>{label}</PreviewText></dt><dd>{value}</dd></div>)}</dl>
      <dl>{groupTotals.map(({ label, cents }) => <div key={label}><dt><PreviewText>{label}</PreviewText></dt><dd>{money.format(cents / 100)}</dd></div>)}</dl>
      <table><thead><tr>{['Datum', 'Factuur', 'Type', 'Omschrijving', 'Aantal', 'Eenheidsprijs', 'Korting', 'Totaal excl. btw'].map((label) =>
        <th key={label} data-report-column={label === "Eenheidsprijs" ? "price" : label === "Korting" ? "discount" : undefined}><PreviewText>{label}</PreviewText></th>)}</tr></thead><tbody>
        {details.map((line) => <tr key={line.id}><td>{line.sales_invoices.issue_date}</td><td>{line.sales_invoices.invoice_number}</td>
          <td><PreviewText>{group(line)}</PreviewText></td><td>{line.description}</td><td>{line.quantity}</td>
          <td data-report-column="price">{money.format(line.unit_price)}</td><td data-report-column="discount">{money.format(line.discount)}</td><td>{money.format(amount(line) / 100)}</td></tr>)}
        {!details.length && <tr><td colSpan={8}><PreviewText>Geen uitgegeven factuurregels in deze periode.</PreviewText></td></tr>}
      </tbody></table>
    </ReportPreview>;
  }

  return <main className="flex flex-col gap-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight"><PreviewText>Verkoop & diensten</PreviewText></h1>
        <p className="text-muted-foreground text-sm"><PreviewText>Facturen op uitgiftedatum, betaalde facturen op betaaldatum.</PreviewText></p>
      </div>
      <div className="flex items-center gap-3">
        <Link className="text-sm underline" href="/admin/winst/webshop"><PreviewText>Webshopmarge</PreviewText></Link>
        <Button asChild variant="outline"><Link href={back + '&preview=1'}><PreviewText>PDF-voorbeeld</PreviewText></Link></Button>
      </div>
    </header>
    <form className="flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-sm"><PreviewText>Vanaf</PreviewText><input className="border-input rounded-md border bg-transparent px-2 py-1.5" type="date" name="from" defaultValue={from} /></label>
      <label className="grid gap-1 text-sm"><PreviewText>Tot en met</PreviewText><input className="border-input rounded-md border bg-transparent px-2 py-1.5" type="date" name="to" defaultValue={to} /></label>
      <label className="grid gap-1 text-sm"><PreviewText>Kanaal</PreviewText><select className="border-input bg-background rounded-md border px-2 py-1.5" name="channel" defaultValue={channel}>
        <option value=""><PreviewText>Alle facturen</PreviewText></option>
        <option value="job"><PreviewText>Klusfacturen</PreviewText></option>
        <option value="other"><PreviewText>Overige facturen</PreviewText></option>
      </select></label>
      <Button type="submit"><PreviewText>Toepassen</PreviewText></Button>
    </form>
    <Card className="border-t-4 border-t-sky-600"><CardHeader><CardTitle><PreviewText>Gefactureerd per maand</PreviewText></CardTitle></CardHeader>
      <CardContent><BarChart reportStyle bars={trend.map(([label, value]) => ({ label, value }))} format={value=>money.format(value)}/></CardContent></Card>
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((card) => <Card key={card.label}><CardHeader>
        <CardDescription><PreviewText>{card.label}</PreviewText></CardDescription>
        <CardTitle className="text-2xl tabular-nums">{card.value}</CardTitle>
      </CardHeader></Card>)}
    </div>
    <Card>
      <CardHeader>
        <CardTitle><PreviewText>Factuurregels</PreviewText></CardTitle>
        <CardDescription><PreviewText>Bedragen na korting, exclusief btw. Alleen uitgegeven facturen.</PreviewText></CardDescription>
      </CardHeader>
      <CardContent>
        {details.length > 0 ? <>
          <dl className="mb-4 grid gap-3 sm:grid-cols-3">
            {groupTotals.map(({ label, cents }) => <div key={label} className="rounded-md border p-3">
              <dt className="text-muted-foreground text-sm"><PreviewText>{label}</PreviewText></dt><dd className="font-semibold tabular-nums">{money.format(cents / 100)}</dd>
            </div>)}
          </dl>
          {details.length > 100 && <p className="text-muted-foreground mb-2 text-sm"><PreviewText>De tabel toont de meest recente 100 regels. De totalen omvatten alle geselecteerde regels.</PreviewText></p>}
          <Table><TableHeader><TableRow>
            {['Datum', 'Factuur', 'Type', 'Omschrijving', 'Aantal', 'Korting', 'Totaal excl. btw'].map((label) => <TableHead key={label}><PreviewText>{label}</PreviewText></TableHead>)}
          </TableRow></TableHeader><TableBody>
            {details.slice(0, 100).map((line) => <TableRow key={line.id}>
              <TableCell>{line.sales_invoices.issue_date}</TableCell>
              <TableCell><Link className="underline" href={'/admin/facturen/' + line.invoice_id}>{line.sales_invoices.invoice_number}</Link></TableCell>
              <TableCell><PreviewText>{group(line)}</PreviewText></TableCell><TableCell>{line.description}</TableCell>
              <TableCell>{line.quantity}</TableCell><TableCell>{money.format(line.discount)}</TableCell>
              <TableCell>{money.format(amount(line) / 100)}</TableCell>
            </TableRow>)}
          </TableBody></Table>
        </> : <p className="text-muted-foreground py-4 text-sm"><PreviewText>Geen uitgegeven factuurregels in deze periode.</PreviewText></p>}
      </CardContent>
    </Card>
  </main>;
}
