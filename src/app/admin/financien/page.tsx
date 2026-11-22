import Link from 'next/link';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { EXPENSE_CATEGORIES } from '@/lib/expenseCaption';
import { shippingTestEnabled } from '@/lib/kfcShippingTest';
import { fetchAll } from '@/lib/kfcOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BankFlowChart, ExpenseDonut } from './FinanceCharts';
import { PreviewShortDate, PreviewText } from '../PreviewLanguage';

export const dynamic = 'force-dynamic';

const money = (cents: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
const dateKey = (date: Date) => date.toISOString().slice(0, 10);

type BankLine = { id: string; booked_on: string; amount_cents: number; counterparty_name: string | null; status: string };
type Receivable = { entry_id: number; due_date: string | null; open_cents: number; sales_invoice_id: string | null; sales_invoices: { invoice_number: string } | { invoice_number: string }[] | null };
type Expense = { amount: number; category: string };

export default async function FinanceOverview({ searchParams }: { searchParams: Promise<{ period?: string; chart?: string }> }) {
  await requireOfficeUser('/admin/financien');
  const params = await searchParams;
  const weekly = params.period !== 'month';
  const sample = shippingTestEnabled && params.chart !== 'bank';
  const period = weekly ? 'week' : 'month';
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date());
  const month = today.slice(0, 7) + '-01';
  const day = new Date(today + 'T00:00:00Z');
  const buckets = Array.from({ length: weekly ? 7 : 6 }, (_, index) => {
    const date = new Date(day);
    if (weekly) date.setUTCDate(date.getUTCDate() + index - 6);
    else { date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + index - 5); }
    return { key: dateKey(date).slice(0, weekly ? 10 : 7), date: dateKey(date), incoming: 0, outgoing: 0 };
  });
  const monthStart = buckets[0].date < month ? buckets[0].date : month;
  const db = createSupabaseAdminClient();
  const session = await createSupabaseServerClient();
  const [bank, expenses, receivables, recent] = await Promise.allSettled([
    fetchAll<BankLine>((from, to) => db.from('kfc_bank_lines').select('id,booked_on,amount_cents,counterparty_name,status').gte('booked_on', monthStart).lte('booked_on', today).order('id').range(from, to)),
    fetchAll<Expense>((from, to) => session.from('expenses').select('amount,category').eq('status', 'paid').gte('date_incurred', month).lte('date_incurred', today).order('id').range(from, to)),
    fetchAll<Receivable>((from, to) => db.from('kfc_invoice_open').select('entry_id,due_date,open_cents,sales_invoice_id,sales_invoices(invoice_number)').eq('entry_type', 'invoice').gt('open_cents', 0).order('entry_id').range(from, to)),
    db.from('kfc_bank_lines').select('id,booked_on,amount_cents,counterparty_name,status').lte('booked_on', today).order('booked_on', { ascending: false }).order('id').limit(5),
  ]);

  const chart = new Map(buckets.map((item) => [item.key, item]));
  const recordedBuckets = new Set<string>();
  let received = 0;
  for (const row of bank.status === 'fulfilled' ? bank.value : []) {
    if (row.booked_on >= month && row.amount_cents > 0 && row.status === 'matched') received += row.amount_cents;
    const bucket = chart.get(row.booked_on.slice(0, weekly ? 10 : 7));
    if (bucket) {
      recordedBuckets.add(bucket.key);
      bucket.incoming += Math.max(0, row.amount_cents);
      bucket.outgoing += Math.max(0, -row.amount_cents);
    }
  }
  const chartRows = sample ? buckets.flatMap((bucket, index) =>
    (weekly ? [1, 7, 13, 19] : [1, 8, 15, 22]).flatMap((slot, segment) => {
      const date = weekly ? bucket.date + 'T' + String(slot).padStart(2, '0') + ':00:00Z'
        : bucket.date.slice(0, 8) + String(slot).padStart(2, '0');
      const n = index * 4 + segment;
      return date.slice(0, 10) <= today ? [{
        date, tick: segment === 0,
        incoming: 7300 + n * 210 + (n * 793 % 3800),
        outgoing: 3200 + n * 145 + (n * 1733 % 6400),
      }] : [];
    })) : buckets.filter((row) => recordedBuckets.has(row.key));
  const categories = new Map<string, number>();
  for (const row of expenses.status === 'fulfilled' ? expenses.value : []) {
    const amount = Math.round(Number(row.amount) * 100);
    categories.set(row.category, (categories.get(row.category) ?? 0) + amount);
  }
  const paid = Array.from(categories.values()).reduce((a, b) => a + b, 0);
  const open = receivables.status === 'fulfilled' ? receivables.value : [];
  const overdue = open.filter((item) => item.due_date && item.due_date < today);
  const upcoming = open.filter((item) => item.due_date && item.due_date >= today)
    .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? '')).slice(0, 5);
  const totalOpen = (rows: Receivable[]) => rows.reduce((sum, row) => sum + Number(row.open_cents), 0);
  const recentRows = recent.status === 'fulfilled' && !recent.value.error ? recent.value.data : null;
  const stats = [
    { title: 'Gekoppelde ontvangsten', note: 'Deze maand op het bankafschrift', value: bank.status === 'fulfilled' ? received : null, href: '/admin/bank/betalingen' },
    { title: 'Betaalde uitgaven', note: 'Op uitgavedatum deze maand', value: expenses.status === 'fulfilled' ? paid : null, href: '/admin/uitgaven' },
    { title: 'Openstaande klantfacturen', note: 'Resterend na geboekte betalingen', value: receivables.status === 'fulfilled' ? totalOpen(open) : null, href: '/admin/facturen' },
    { title: 'Vervallen klantfacturen', note: 'Vervaldatum verstreken', value: receivables.status === 'fulfilled' ? totalOpen(overdue) : null, href: '/admin/klanten?view=overdue' },
  ];

  return <div className="grid gap-4">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-semibold tracking-tight"><PreviewText>Financieel overzicht</PreviewText></h1>
        <p className="text-muted-foreground text-sm"><PreviewShortDate iso={today} /></p></div>
      <nav className="flex flex-wrap gap-2">
        {([['/admin/facturen','Facturen'],['/admin/uitgaven','Uitgaven'],['/admin/bank/transacties','Bank']] as const).map(([href, name]) =>
          <Button key={href} asChild size="sm" variant="outline"><Link href={href}><PreviewText>{name}</PreviewText></Link></Button>)}
      </nav>
    </header>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stats.map((item) =>
      <Card key={item.title}>
        <CardHeader><CardDescription><Link className="hover:underline" href={item.href}><PreviewText>{item.title}</PreviewText></Link></CardDescription>
          <CardTitle className="text-2xl tabular-nums">{item.value === null ? '—' : money(item.value)}</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground text-xs"><PreviewText>{item.value === null ? 'Gegevens niet beschikbaar' : item.note}</PreviewText></CardContent>
      </Card>)}</div>
    <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
      <Card>
        <CardHeader><div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle><PreviewText>Inkomend en uitgaand</PreviewText></CardTitle>
          <div className="flex gap-1">{([['week','7 dagen'],['month','6 maanden']] as const).map(([id, label]) =>
            <Button key={id} size="sm" variant={(id === 'week') === weekly ? 'secondary' : 'ghost'} asChild>
              <Link aria-current={(id === 'week') === weekly ? 'page' : undefined} href={'?period=' + id + (sample ? '' : '&chart=bank')}><PreviewText>{label}</PreviewText></Link>
            </Button>)}</div>
        </div><CardDescription className="flex flex-wrap items-center justify-between gap-2">
          <PreviewText>{sample ? 'Voorbeeldgrafiek met gesimuleerde transacties' : 'Geïmporteerde bankbewegingen, inclusief overschrijvingen'}</PreviewText>
          {shippingTestEnabled && <Link className="underline underline-offset-4" href={'?period=' + period + '&chart=' + (sample ? 'bank' : 'sample')}>
            <PreviewText>{sample ? 'Toon bankafschrift' : 'Toon voorbeeldgrafiek'}</PreviewText>
          </Link>}
        </CardDescription></CardHeader>
        <CardContent>
          {!sample && bank.status === 'rejected' ? <PreviewText>Gegevens niet beschikbaar</PreviewText> : !chartRows.length ? <PreviewText>Geen bankbewegingen in deze periode</PreviewText> : <BankFlowChart rows={chartRows} weekly={weekly} />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle><PreviewText>Uitgaven per categorie</PreviewText></CardTitle>
          <CardDescription><PreviewText>Op uitgavedatum deze maand</PreviewText></CardDescription></CardHeader>
        <CardContent className="grid gap-3 text-sm">
          {expenses.status === 'rejected' ? <PreviewText>Gegevens niet beschikbaar</PreviewText> : !categories.size ? <PreviewText>Geen betaalde uitgaven in deze periode</PreviewText> :
            <ExpenseDonut total={paid} categories={[...categories].sort((a, b) => b[1] - a[1]).map(([category, amount]) =>
              ({ label: EXPENSE_CATEGORIES[category] ?? category, amount }))} />}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle><PreviewText>Recente bankbewegingen</PreviewText></CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {recentRows === null ? <PreviewText>Gegevens niet beschikbaar</PreviewText> : recentRows.length === 0 ? <PreviewText>Nog geen bankafschrift geïmporteerd</PreviewText> : recentRows.map((row) =>
            <Link key={row.id} href={'/admin/bank/' + (row.status === 'matched' ? 'betalingen' : row.status === 'ignored' ? 'rekeningen' : 'transacties') + '#' + row.id} className="flex justify-between gap-2 rounded border p-2 hover:bg-muted">
              <span><PreviewShortDate iso={row.booked_on} /> · {row.counterparty_name || '—'}</span><span className="tabular-nums">{money(row.amount_cents)}</span>
            </Link>)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle><PreviewText>Aankomende vervaldata</PreviewText></CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {receivables.status === 'rejected' ? <PreviewText>Gegevens niet beschikbaar</PreviewText> : !upcoming.length ? <PreviewText>Geen aankomende vervaldata</PreviewText> : upcoming.map((item) => {
            const invoice = Array.isArray(item.sales_invoices) ? item.sales_invoices[0] : item.sales_invoices;
            return <Link key={item.entry_id} href={item.sales_invoice_id ? '/admin/facturen/' + item.sales_invoice_id : '/admin/facturen'} className="flex justify-between gap-2 rounded border p-2 hover:bg-muted">
              <span>{invoice?.invoice_number ?? '#' + item.entry_id} · <PreviewShortDate iso={item.due_date ?? ''} /></span>
              <span className="tabular-nums">{money(Number(item.open_cents))}</span>
            </Link>;
          })}
        </CardContent>
      </Card>
    </div>
  </div>;
}
