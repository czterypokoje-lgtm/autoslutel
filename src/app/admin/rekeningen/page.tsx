import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BRAND, IS_KEYFORCARS, WAREHOUSE } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { findArticlesByScan } from '@/lib/kfcInventory';
import { listCustomers } from '@/lib/kfcReceivables';
import { purchaseFacts, supplierAging, supplierOptions, type PurchaseFact } from '@/lib/kfcSuppliers';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: `Debiteuren & crediteuren | ${BRAND.name}` };

/*
 * Cari reports (0130): customer and supplier aging, purchases per supplier /
 * period / article, open purchase orders, late deliveries and the purchase
 * price history of one article (found by scan: barcode, SKU, code or supplier
 * reference, the same lookup as the purchase order form). Office only.
 */

const VIEWS = [
  ['debiteuren', 'Ouderdom debiteuren'], ['crediteuren', 'Ouderdom crediteuren'], ['inkoop', 'Inkoop per periode'],
  ['open', 'Open inkooporders'], ['laat', 'Te late leveringen'], ['prijzen', 'Inkoopprijshistorie'],
] as const;
type View = (typeof VIEWS)[number][0];
const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const money = (cents: number | null | undefined) => (cents == null ? '—' : MONEY.format(cents / 100));
const isoDate = (value: string | undefined) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined);
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
const BUCKETS = [['not_due', 'Niet vervallen'], ['d1_30', '0–30'], ['d31_60', '31–60'], ['d61_90', '61–90'], ['d90p', '90+']] as const;

type Params = { view?: string; van?: string; tot?: string; groep?: string; leverancier?: string; scan?: string; artikel?: string };

export default async function RekeningenPage({ searchParams }: { searchParams: Promise<Params> }) {
  if (!WAREHOUSE || CRM_PREVIEW) notFound();
  await requireOfficeUser('/admin/rekeningen');
  const params = await searchParams;
  const view: View = VIEWS.some(([key]) => key === params.view) ? (params.view as View) : 'debiteuren';
  const title = VIEWS.find(([key]) => key === view)![1];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>Debiteuren & crediteuren</PreviewText></h1>
          <p className="text-muted-foreground text-sm"><PreviewText>{title}</PreviewText> · {new Date().toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam' })}</p>
        </div>
        <PrintButton />
      </div>
      <nav className="flex flex-wrap gap-1 self-start rounded-lg border p-1 print:hidden">
        {VIEWS.map(([key, label]) => (
          <Button key={key} asChild size="sm" variant={view === key ? 'default' : 'ghost'}><Link href={`/admin/rekeningen?view=${key}`}><PreviewText>{label}</PreviewText></Link></Button>
        ))}
      </nav>
      {view === 'debiteuren' && <CustomerAging />}
      {view === 'crediteuren' && <SupplierAging />}
      {view === 'inkoop' && <Purchases params={params} />}
      {view === 'open' && <OpenOrders late={false} />}
      {view === 'laat' && <OpenOrders late params={params} />}
      {view === 'prijzen' && <PriceHistory params={params} />}
    </div>
  );
}

function AgingTable({ rows, link, statement }: {
  rows: { id: string; name: string; terms_days: number; open_cents: number; not_due: number; d1_30: number; d31_60: number; d61_90: number; d90p: number; oldest_overdue: string | null }[];
  link: (id: string) => string; statement?: (id: string) => string;
}) {
  const sum = (key: (typeof BUCKETS)[number][0] | 'open_cents') => rows.reduce((s, r) => s + Number(r[key]), 0);
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead><PreviewText>Rekening</PreviewText></TableHead><TableHead><PreviewText>Termijn</PreviewText></TableHead>
            {BUCKETS.map(([key, label]) => <TableHead key={key} className="text-right"><PreviewText>{label}</PreviewText></TableHead>)}
            <TableHead className="text-right"><PreviewText>Saldo</PreviewText></TableHead><TableHead><PreviewText>Oudste vervallen</PreviewText></TableHead>
            {statement && <TableHead className="print:hidden" />}
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={10} className="text-muted-foreground py-8 text-center"><PreviewText>Niets open.</PreviewText></TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell><Link className="font-medium underline-offset-4 hover:underline" href={link(r.id)}>{r.name}</Link></TableCell>
                <TableCell className="text-muted-foreground">{r.terms_days} d</TableCell>
                {BUCKETS.map(([key]) => <TableCell key={key} className={`text-right tabular-nums ${key !== 'not_due' && r[key] > 0 ? 'text-destructive' : ''}`}>{r[key] ? money(r[key]) : '—'}</TableCell>)}
                <TableCell className="text-right font-medium tabular-nums">{money(r.open_cents)}</TableCell>
                <TableCell className="text-muted-foreground">{r.oldest_overdue ?? '—'}</TableCell>
                {statement && <TableCell className="print:hidden"><Link className="text-sm underline underline-offset-4" href={statement(r.id)} target="_blank">Ekstre</Link></TableCell>}
              </TableRow>
            ))}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter><TableRow>
              <TableCell colSpan={2}><PreviewText>Totaal</PreviewText> · {rows.length}</TableCell>
              {BUCKETS.map(([key]) => <TableCell key={key} className="text-right tabular-nums">{money(sum(key))}</TableCell>)}
              <TableCell className="text-right tabular-nums">{money(sum('open_cents'))}</TableCell><TableCell colSpan={statement ? 2 : 1} />
            </TableRow></TableFooter>
          )}
        </Table>
      </CardContent>
    </Card>
  );
}

async function CustomerAging() {
  const rows = (await listCustomers()).filter((r) => r.open_cents !== 0 || r.overdue_cents !== 0)
    .sort((a, b) => b.overdue_cents - a.overdue_cents || b.open_cents - a.open_cents)
    .map((r) => ({ ...r, name: r.company }));
  return <AgingTable rows={rows} link={(id) => IS_KEYFORCARS ? `/admin/klanten/${id}` : `/admin/klanten/relaties?account=${id}`}
    statement={IS_KEYFORCARS ? (id) => `/admin/klanten/${id}/ekstre` : undefined} />;
}

async function SupplierAging() {
  const rows = (await supplierAging()).sort((a, b) => b.overdue_cents - a.overdue_cents || b.open_cents - a.open_cents);
  return <AgingTable rows={rows} link={(id) => `/admin/leveranciers/${id}?tab=saldo`} statement={(id) => `/admin/leveranciers/${id}/ekstre`} />;
}

/** Purchases in a period, grouped by supplier, article or month. Ordered value and received value, excl. btw. */
async function Purchases({ params }: { params: Params }) {
  const to = isoDate(params.tot) ?? today();
  const from = isoDate(params.van) ?? `${to.slice(0, 4)}-01-01`;
  const group = params.groep === 'artikel' || params.groep === 'maand' ? params.groep : 'leverancier';
  const supplier = params.leverancier && /^[a-f0-9-]{36}$/i.test(params.leverancier) ? params.leverancier : undefined;
  const [facts, suppliers] = await Promise.all([
    // 'closed' (0139): goods received on an order that was closed short are still purchases.
    purchaseFacts({ from, to, supplier, statuses: ['ordered', 'received', 'closed'] }),
    supplierOptions(),
  ]);
  const groups = new Map<string, { key: string; label: string; sub: string; lines: number; orders: Set<string>; quantity: number; received: number; ordered_cents: number; received_cents: number; unpriced: number }>();
  for (const f of facts) {
    const key = group === 'leverancier' ? f.supplier_id ?? f.supplier_name : group === 'artikel' ? f.article_code : f.order_date.slice(0, 7);
    const label = group === 'leverancier' ? f.supplier_name : group === 'artikel' ? f.article_name ?? f.article_code : f.order_date.slice(0, 7);
    const sub = group === 'artikel' ? `${f.article_code}${f.sku ? ` · ${f.sku}` : ''}` : '';
    const g = groups.get(key) ?? { key, label, sub, lines: 0, orders: new Set<string>(), quantity: 0, received: 0, ordered_cents: 0, received_cents: 0, unpriced: 0 };
    g.lines++; g.orders.add(f.po_id); g.quantity += f.quantity; g.received += f.received;
    g.ordered_cents += f.ordered_cents ?? 0; g.received_cents += f.received_cents ?? 0;
    if (f.unit_cost_cents == null) g.unpriced++;
    groups.set(key, g);
  }
  const rows = [...groups.values()].sort((a, b) => (group === 'maand' ? b.key.localeCompare(a.key) : b.ordered_cents - a.ordered_cents));
  const total = (key: 'quantity' | 'received' | 'ordered_cents' | 'received_cents') => rows.reduce((s, r) => s + r[key], 0);
  return (
    <>
      <form className="flex flex-wrap items-end gap-3 print:hidden">
        <input type="hidden" name="view" value="inkoop" />
        <label className="grid gap-1 text-sm"><PreviewText>Van</PreviewText><Input type="date" name="van" defaultValue={from} /></label>
        <label className="grid gap-1 text-sm"><PreviewText>Tot en met</PreviewText><Input type="date" name="tot" defaultValue={to} /></label>
        <label className="grid gap-1 text-sm"><PreviewText>Groeperen op</PreviewText>
          <select name="groep" defaultValue={group} className="border-input bg-background h-9 rounded-md border px-3 text-sm">
            <option value="leverancier">Leverancier</option><option value="artikel">Artikel</option><option value="maand">Maand</option>
          </select></label>
        <label className="grid gap-1 text-sm"><PreviewText>Leverancier</PreviewText>
          <select name="leverancier" defaultValue={supplier ?? ''} className="border-input bg-background h-9 rounded-md border px-3 text-sm">
            <option value="">Alle</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></label>
        <Button size="sm"><PreviewText>Toon</PreviewText></Button>
      </form>
      <Card>
        <CardHeader><CardTitle className="text-base">{from} – {to}</CardTitle><CardDescription><PreviewText>Bestelde en ontvangen inkoop excl. btw, op besteldatum. Concepten en geannuleerde orders tellen niet mee.</PreviewText></CardDescription></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead><PreviewText>{group === 'leverancier' ? 'Leverancier' : group === 'artikel' ? 'Artikel' : 'Maand'}</PreviewText></TableHead>
              <TableHead className="text-right"><PreviewText>Orders</PreviewText></TableHead><TableHead className="text-right"><PreviewText>Besteld</PreviewText></TableHead>
              <TableHead className="text-right"><PreviewText>Ontvangen</PreviewText></TableHead><TableHead className="text-right"><PreviewText>Bestelwaarde</PreviewText></TableHead>
              <TableHead className="text-right"><PreviewText>Ontvangen waarde</PreviewText></TableHead>{group === 'artikel' && <TableHead className="text-right"><PreviewText>Gem. prijs</PreviewText></TableHead>}
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-8 text-center"><PreviewText>Geen inkoop in deze periode.</PreviewText></TableCell></TableRow>}
              {rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell>
                    {group === 'leverancier' && /^[a-f0-9-]{36}$/i.test(r.key) ? <Link className="font-medium underline-offset-4 hover:underline" href={`/admin/leveranciers/${r.key}?tab=inkooporders`}>{r.label}</Link>
                      : group === 'artikel' ? <Link className="font-medium underline-offset-4 hover:underline" href={`/admin/rekeningen?view=prijzen&artikel=${encodeURIComponent(r.key)}`}>{r.label}</Link> : <span className="font-medium">{r.label}</span>}
                    {r.sub && <div className="text-muted-foreground text-xs">{r.sub}</div>}
                    {r.unpriced > 0 && <div className="text-muted-foreground text-xs">{r.unpriced} <PreviewText>regels zonder prijs</PreviewText></div>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.orders.size}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.received}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(r.ordered_cents)}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(r.received_cents)}</TableCell>
                  {group === 'artikel' && <TableCell className="text-right tabular-nums">{r.quantity ? money(Math.round(r.ordered_cents / r.quantity)) : '—'}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
            {rows.length > 0 && <TableFooter><TableRow>
              <TableCell><PreviewText>Totaal</PreviewText></TableCell><TableCell />
              <TableCell className="text-right tabular-nums">{total('quantity')}</TableCell><TableCell className="text-right tabular-nums">{total('received')}</TableCell>
              <TableCell className="text-right tabular-nums">{money(total('ordered_cents'))}</TableCell><TableCell className="text-right tabular-nums">{money(total('received_cents'))}</TableCell>
              {group === 'artikel' && <TableCell />}
            </TableRow></TableFooter>}
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * Open purchase order lines (late = false), or deliveries that are late:
 * still open past the expected date, plus lines received after it (in the
 * chosen period).
 */
async function OpenOrders({ late, params = {} }: { late: boolean; params?: Params }) {
  const now = today();
  const open = (await purchaseFacts({ statuses: late ? ['ordered'] : ['draft', 'ordered'] })).filter((f) => f.open_quantity > 0 && (!late || (f.expected_on != null && f.expected_on < now)));
  open.sort((a, b) => (a.expected_on ?? '9999').localeCompare(b.expected_on ?? '9999') || a.supplier_name.localeCompare(b.supplier_name));
  let receivedLate: PurchaseFact[] = [];
  const to = isoDate(params.tot) ?? now;
  const from = isoDate(params.van) ?? `${to.slice(0, 4)}-01-01`;
  if (late) {
    receivedLate = (await purchaseFacts({ from, to, statuses: ['ordered', 'received', 'closed'] }))
      .filter((f) => f.expected_on && f.last_receipt_at && f.last_receipt_at.slice(0, 10) > f.expected_on)
      .sort((a, b) => (b.last_receipt_at ?? '').localeCompare(a.last_receipt_at ?? ''));
  }
  const bySupplier = new Map<string, { name: string; lines: number; value: number }>();
  for (const f of open) {
    const key = f.supplier_id ?? f.supplier_name;
    const s = bySupplier.get(key) ?? { name: f.supplier_name, lines: 0, value: 0 };
    s.lines++; s.value += f.open_quantity * (f.unit_cost_cents ?? 0);
    bySupplier.set(key, s);
  }
  return (
    <>
      {bySupplier.size > 1 && (
        <div className="flex flex-wrap gap-2">
          {[...bySupplier.entries()].map(([key, s]) => <Badge key={key} variant="outline">{s.name} · {s.lines} · {money(s.value)}</Badge>)}
        </div>
      )}
      <Card>
        <CardHeader><CardTitle className="text-base"><PreviewText>{late ? 'Nog niet geleverd, verwachte datum voorbij' : 'Openstaande regels'}</PreviewText> · {open.length}</CardTitle></CardHeader>
        <CardContent className="p-0"><LineTable rows={open} mode={late ? 'late' : 'open'} now={now} /></CardContent>
      </Card>
      {late && (
        <>
          <form className="flex flex-wrap items-end gap-3 print:hidden">
            <input type="hidden" name="view" value="laat" />
            <label className="grid gap-1 text-sm"><PreviewText>Besteld van</PreviewText><Input type="date" name="van" defaultValue={from} /></label>
            <label className="grid gap-1 text-sm"><PreviewText>Tot en met</PreviewText><Input type="date" name="tot" defaultValue={to} /></label>
            <Button size="sm"><PreviewText>Toon</PreviewText></Button>
          </form>
          <Card>
            <CardHeader><CardTitle className="text-base"><PreviewText>Te laat ontvangen</PreviewText> · {receivedLate.length}</CardTitle><CardDescription><PreviewText>Laatste ontvangst na de verwachte datum.</PreviewText></CardDescription></CardHeader>
            <CardContent className="p-0"><LineTable rows={receivedLate} mode="received" now={now} /></CardContent>
          </Card>
        </>
      )}
    </>
  );
}

function LineTable({ rows, mode, now }: { rows: PurchaseFact[]; mode: 'open' | 'late' | 'received'; now: string }) {
  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead><PreviewText>Leverancier</PreviewText></TableHead><TableHead><PreviewText>Artikel</PreviewText></TableHead><TableHead><PreviewText>Besteld op</PreviewText></TableHead>
        <TableHead><PreviewText>Verwacht</PreviewText></TableHead>{mode === 'received' && <TableHead><PreviewText>Ontvangen</PreviewText></TableHead>}
        <TableHead className="text-right"><PreviewText>Besteld</PreviewText></TableHead><TableHead className="text-right"><PreviewText>Open</PreviewText></TableHead>
        <TableHead className="text-right"><PreviewText>Open waarde</PreviewText></TableHead><TableHead className="text-right"><PreviewText>Dagen te laat</PreviewText></TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {rows.length === 0 && <TableRow><TableCell colSpan={9} className="text-muted-foreground py-8 text-center"><PreviewText>Niets gevonden.</PreviewText></TableCell></TableRow>}
        {rows.map((f) => {
          const lateDays = mode === 'received' ? daysBetween(f.expected_on!, f.last_receipt_at!.slice(0, 10)) : f.expected_on && f.expected_on < now ? daysBetween(f.expected_on, now) : 0;
          return (
            <TableRow key={f.line_id}>
              <TableCell>{f.supplier_id ? <Link className="underline-offset-4 hover:underline" href={`/admin/leveranciers/${f.supplier_id}?tab=inkooporders`}>{f.supplier_name}</Link> : f.supplier_name}{f.status === 'draft' && <Badge variant="outline" className="ml-2"><PreviewText>Concept</PreviewText></Badge>}</TableCell>
              <TableCell className="max-w-72"><div className="truncate">{f.article_name ?? f.article_code}</div><div className="text-muted-foreground text-xs">{f.article_code}{f.sku && ` · ${f.sku}`}</div></TableCell>
              <TableCell><Link className="underline-offset-4 hover:underline" href={`/admin/inkoop#purchase-${f.po_id}`}>{f.order_date}</Link></TableCell>
              <TableCell>{f.expected_on ?? '—'}</TableCell>
              {mode === 'received' && <TableCell>{f.last_receipt_at?.slice(0, 10)}</TableCell>}
              <TableCell className="text-right tabular-nums">{f.quantity}</TableCell>
              <TableCell className="text-right tabular-nums">{f.open_quantity}</TableCell>
              <TableCell className="text-right tabular-nums">{f.unit_cost_cents == null ? '—' : money(f.open_quantity * f.unit_cost_cents)}</TableCell>
              <TableCell className="text-right tabular-nums">{lateDays > 0 ? <Badge variant="destructive">{lateDays}</Badge> : '—'}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** Purchase price history of one article: every priced order line, oldest first, and the agreed price per supplier. */
async function PriceHistory({ params }: { params: Params }) {
  const scan = params.scan?.trim().slice(0, 80) ?? '';
  let article = params.artikel && params.artikel.length <= 80 ? params.artikel : '';
  let choices: { id: string; name: string; sku: string }[] = [];
  if (!article && scan) {
    const found = await findArticlesByScan(scan);
    if (found.length === 1) article = found[0].id;
    else choices = found;
  }
  const db = createSupabaseAdminClient();
  const [info, facts, agreed] = article ? await Promise.all([
    db.from('kfc_articles').select('code, name, sku, purchase_price_cents, supplier_ref').eq('code', article).maybeSingle(),
    purchaseFacts({ article }),
    db.from('kfc_supplier_articles').select('supplier_id, supplier_sku, price_cents, last_price_cents, min_qty, lead_time_days, preferred, kfc_suppliers (name)').eq('article_code', article),
  ]) : [null, [] as PurchaseFact[], null];
  const history = facts.filter((f) => f.unit_cost_cents != null && f.status !== 'cancelled').sort((a, b) => a.order_date.localeCompare(b.order_date));
  return (
    <>
      <form className="flex flex-wrap items-end gap-3 print:hidden">
        <input type="hidden" name="view" value="prijzen" />
        <label className="grid gap-1 text-sm"><PreviewText>Scan of typ barcode, SKU, artikelcode of leveranciersreferentie</PreviewText>
          <Input name="scan" defaultValue={scan} autoFocus autoComplete="off" maxLength={80} className="w-80" /></label>
        <Button size="sm"><PreviewText>Zoek</PreviewText></Button>
      </form>
      {scan && !article && choices.length === 0 && <p className="text-muted-foreground text-sm"><PreviewText>Onbekend artikel.</PreviewText></p>}
      {choices.length > 0 && (
        <Card><CardHeader><CardTitle className="text-base"><PreviewText>Meerdere artikelen gevonden</PreviewText></CardTitle></CardHeader>
          <CardContent><ul className="grid gap-1 text-sm">{choices.map((c) => <li key={c.id}><Link className="underline underline-offset-4" href={`/admin/rekeningen?view=prijzen&artikel=${encodeURIComponent(c.id)}`}>{c.id} · {c.sku} · {c.name}</Link></li>)}</ul></CardContent></Card>
      )}
      {article && info?.data && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">{info.data.name}</CardTitle>
              <CardDescription>{info.data.code}{info.data.sku && ` · ${info.data.sku}`}{info.data.supplier_ref && ` · ref ${info.data.supplier_ref}`} · <PreviewText>kostprijs nu</PreviewText> {money(info.data.purchase_price_cents)}</CardDescription></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead><PreviewText>Leverancier</PreviewText></TableHead><TableHead><PreviewText>Art.nr. leverancier</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Afgesproken</PreviewText></TableHead><TableHead className="text-right"><PreviewText>Laatst betaald</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Min.</PreviewText></TableHead><TableHead className="text-right"><PreviewText>Levertijd</PreviewText></TableHead></TableRow></TableHeader>
                <TableBody>
                  {(agreed?.data ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground py-6 text-center"><PreviewText>Nog geen leverancier gekoppeld.</PreviewText></TableCell></TableRow>}
                  {(agreed?.data ?? []).map((a) => (
                    <TableRow key={a.supplier_id}>
                      <TableCell><Link className="underline-offset-4 hover:underline" href={`/admin/leveranciers/${a.supplier_id}?tab=artikelen`}>{(a.kfc_suppliers as unknown as { name: string } | null)?.name ?? '—'}</Link>{a.preferred && <Badge variant="secondary" className="ml-2"><PreviewText>voorkeur</PreviewText></Badge>}</TableCell>
                      <TableCell>{a.supplier_sku ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(a.price_cents)}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(a.last_price_cents)}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.min_qty}</TableCell>
                      <TableCell className="text-right tabular-nums">{a.lead_time_days ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base"><PreviewText>Prijshistorie</PreviewText> · {history.length}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead><PreviewText>Besteld op</PreviewText></TableHead><TableHead><PreviewText>Leverancier</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Aantal</PreviewText></TableHead><TableHead className="text-right"><PreviewText>Prijs per stuk</PreviewText></TableHead>
                  <TableHead className="text-right"><PreviewText>Verschil</PreviewText></TableHead><TableHead><PreviewText>Factuur</PreviewText></TableHead></TableRow></TableHeader>
                <TableBody>
                  {history.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground py-6 text-center"><PreviewText>Nog geen inkoop met prijs.</PreviewText></TableCell></TableRow>}
                  {history.map((f, i) => {
                    const previous = i > 0 ? history[i - 1].unit_cost_cents! : null;
                    const change = previous ? ((f.unit_cost_cents! - previous) / previous) * 100 : null;
                    return (
                      <TableRow key={f.line_id}>
                        <TableCell><Link className="underline-offset-4 hover:underline" href={`/admin/inkoop#purchase-${f.po_id}`}>{f.order_date}</Link></TableCell>
                        <TableCell>{f.supplier_name}</TableCell>
                        <TableCell className="text-right tabular-nums">{f.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(f.unit_cost_cents)}</TableCell>
                        <TableCell className={`text-right tabular-nums ${change && change > 0 ? 'text-destructive' : ''}`}>{change == null || change === 0 ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1).replace('.', ',')}%`}</TableCell>
                        <TableCell className="text-muted-foreground">{f.invoice_ref ?? ''}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
