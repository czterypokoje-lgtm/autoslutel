import { RankedBars } from '../../_ui/charts';
import Link from 'next/link';
import ReportPreview from '../ReportPreview';
import { ArrowDownRight, Boxes, ChevronDown, ChevronLeft, ChevronRight, Clock3, Layers3, MapPin, PackageCheck, Search, Wallet } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PreviewText } from '@/app/admin/PreviewLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WAREHOUSE } from '@/config/install';
import { requireWarehouseUser, seesPrices } from '@/lib/crmSession';
import { fetchAll } from '@/lib/kfcOrders';
import type { Position } from '@/lib/kfcInventory';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { CRM_PREVIEW } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

const money = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const clock = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Amsterdam' });
const reportPath = '/admin/rapport/voorraad';
const pageSize = 25;
const integer = new Intl.NumberFormat('nl-NL');
const conditionStyle = {
  new: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  opened: 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
  used: 'bg-sky-500/10 text-sky-900 dark:text-sky-200',
};
function locationLabel(location: Level['kfc_locations']) {
  return location.technicians ? 'Servicebus · ' + location.technicians.name : [location.warehouse, location.shelf, location.box].join(' / ');
}

const conditions = { new: 'Nieuw', opened: 'Geopend', used: 'Gebruikt' } as const;

type Article = { code: string; sku: string | null; name: string; condition: keyof typeof conditions; acquisition: string; purchase_price_cents?: number | null };
type Level = { article_code: string; quantity: number; minimum: number; kfc_locations: { warehouse: string; shelf: string; box: string; kind: string; technicians: { name: string } | null } };

export default async function InventoryReport({ searchParams }: { searchParams: Promise<{ q?: string; state?: string; critical?: string; assembly?: string; page?: string; preview?: string }> }) {
  if (!WAREHOUSE) notFound();
  const office = seesPrices(await requireWarehouseUser('/admin/rapport/voorraad'));
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 80) : '';
  const state = typeof params.state === 'string' && Object.hasOwn(conditions, params.state) ? params.state : '';
  const critical = params.critical === '1';
  const assembly = params.assembly === '1';
  const at = new Date();
  const db = createSupabaseAdminClient();
  const [positions, articles, levels] = await Promise.all([
    fetchAll<Position>((a, b) => db.from('kfc_stock_position').select('article_code, physical, unusable, reserved, available, incoming')
      .or('physical.neq.0,reserved.neq.0,incoming.neq.0').order('article_code').range(a, b)),
    fetchAll<Article>((a, b) => db.from('kfc_articles').select('code, sku, name, condition, acquisition' + (office ? ', purchase_price_cents' : ''))
      .order('code').range(a, b) as unknown as PromiseLike<{ data: Article[] | null; error: { message: string } | null }>),
    fetchAll<Level>((a, b) => db.from('kfc_stock_levels').select('article_code, quantity, minimum, kfc_locations!inner(warehouse, shelf, box, kind, technicians(name))')
      .order('article_code').order('location_id').range(a, b) as unknown as PromiseLike<{ data: Level[] | null; error: { message: string } | null }>),
  ]);
  const stock = new Map(positions.map((row) => [row.article_code, row]));
  const bins = new Map<string, Level[]>();
  for (const level of levels) {
    const list = bins.get(level.article_code) ?? [];
    list.push(level);
    bins.set(level.article_code, list);
  }
  const needle = query.toLowerCase();
  const rows = articles.filter((article) => {
    if (needle && ![article.code, article.sku, article.name].some((value) => value?.toLowerCase().includes(needle))) return false;
    if ((state && article.condition !== state) || (assembly && article.acquisition !== 'assembly')) return false;
    const bin = bins.get(article.code) ?? [];
    if (critical) return bin.some((level) => level.kfc_locations.kind === 'shelf' && level.minimum > 0 && level.quantity <= level.minimum);
    return stock.has(article.code) || (needle && bin.length > 0);
  }).map((article) => ({ article, position: stock.get(article.code), locations: bins.get(article.code) ?? [] }));
  const totals = rows.reduce((sum, row) => {
    const physical = row.position?.physical ?? 0;
    const cost = row.article.purchase_price_cents;
    return {
      physical: sum.physical + physical,
      reserved: sum.reserved + (row.position?.reserved ?? 0),
      available: sum.available + (row.position?.available ?? 0),
      value: sum.value + (cost == null ? 0 : physical * cost),
      missing: sum.missing + (cost == null && physical !== 0 ? 1 : 0),
    };
  }, { physical: 0, reserved: 0, available: 0, value: 0, missing: 0 });

  const cards = [
    { label: 'Fysieke voorraad', value: integer.format(totals.physical), icon: Boxes, tone: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
    { label: 'Gereserveerd', value: integer.format(totals.reserved), icon: Layers3, tone: 'bg-amber-500/15 text-amber-800 dark:text-amber-200' },
    { label: 'Beschikbaar', value: integer.format(totals.available), icon: PackageCheck, tone: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' },
    ...(office ? [{ label: 'Voorraadwaarde', value: money.format(totals.value / 100), icon: Wallet, tone: 'bg-violet-500/10 text-violet-800 dark:text-violet-300' }] : []),
  ];
  const composition = (Object.entries(conditions) as [keyof typeof conditions,string][]).map(([key,label])=>({
    label,value:rows.reduce((sum,row)=>sum+(row.article.condition===key ? Number(row.position?.physical ?? 0) : 0),0),
  }));
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const requested = typeof params.page === 'string' && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  const page = Math.min(pages, Math.max(1, requested));
  const first = (page - 1) * pageSize;
  const visible = rows.slice(first, first + pageSize);
  const filtered = Boolean(query || state || critical || assembly);
  function pageHref(target: number) {
    const search = new URLSearchParams({ page: String(target) });
    if (query) search.set('q', query);
    if (state) search.set('state', state);
    if (critical) search.set('critical', '1');
    if (assembly) search.set('assembly', '1');
    return reportPath + '?' + search;
  }

  const back = pageHref(page);
  if (params.preview === '1') {
    return <ReportPreview back={back} columns={[{ id: "location", label: "Locaties" }, ...(office ? [{ id: "cost" as const, label: "Inkoopprijs" }] : [])]}>
      <h1><PreviewText>Voorraadstand</PreviewText></h1>
      <p><PreviewText>Peildatum</PreviewText> {at.toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam' })}</p>
      <p><PreviewText>Rapport opgehaald op</PreviewText> {clock.format(at)}{office ? ' · EUR' : ''}</p>
      <p>{query && <>{query} · </>}{state && <><PreviewText>{conditions[state as keyof typeof conditions]}</PreviewText> · </>}
        {critical && <><PreviewText>Lage voorraad</PreviewText> · </>}{assembly && <PreviewText>Alleen gemonteerd</PreviewText>}</p>
      <dl>{cards.map(({ label, value }) => <div key={label} data-report-column={label === "Voorraadwaarde" ? "cost" : undefined}><dt><PreviewText>{label}</PreviewText></dt><dd>{value}</dd></div>)}</dl>
      {office && <p data-report-column="cost"><PreviewText>Waardering tegen laatst bekende inkoopprijs.</PreviewText></p>}
      <table><thead><tr>{['Artikel', 'Conditie', 'Fysieke voorraad', 'Gereserveerd', 'Beschikbaar', 'Locaties', ...(office ? ['Inkoopprijs'] : [])]
        .map((label) => <th key={label} data-report-column={label === "Inkoopprijs" ? "cost" : label === "Locaties" ? "location" : undefined}><PreviewText>{label}</PreviewText></th>)}</tr></thead><tbody>
        {rows.map(({ article, position, locations }) => <tr key={article.code}>
          <td>{article.name}<br />{article.code}{article.sku && ' · ' + article.sku}</td>
          <td><PreviewText>{conditions[article.condition] ?? article.condition}</PreviewText></td>
          <td>{position?.physical ?? 0}</td><td>{position?.reserved ?? 0}</td><td>{position?.available ?? 0}</td>
          <td data-report-column="location">{locations.map(({ quantity, kfc_locations: loc }) => [locationLabel(loc), quantity].join(' / ')).join(' · ') || '—'}</td>
          {office && <td data-report-column="cost">{article.purchase_price_cents == null ? '—' : money.format(article.purchase_price_cents / 100)}</td>}
        </tr>)}
        {!rows.length && <tr><td colSpan={office ? 7 : 6}><PreviewText>Geen voorraad voor deze selectie.</PreviewText></td></tr>}
      </tbody></table>
    </ReportPreview>;
  }

  return <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 pb-8">
    <header className="relative isolate overflow-hidden rounded-2xl bg-slate-950 px-5 py-6 text-white sm:px-7 sm:py-7">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-r from-slate-950 via-slate-900 to-teal-900" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="rounded-xl bg-white/10 p-3 text-emerald-200"><Boxes size={25} aria-hidden="true" /></span>
          <h1 className="text-3xl font-semibold tracking-tight text-white!"><PreviewText>Voorraadstand</PreviewText></h1>
        </div>
        <p className="flex items-center gap-2 text-sm text-slate-200">
          <Clock3 size={15} aria-hidden="true" />
          <PreviewText>Rapport opgehaald op</PreviewText>
          <time dateTime={at.toISOString()}>{clock.format(at)}</time>
        </p>
        <div className="flex flex-wrap gap-2">
          {office && !CRM_PREVIEW && <Button asChild variant="secondary"><Link href="/admin/voorraad/bustransfer"><PreviewText>Voorraad verplaatsen</PreviewText></Link></Button>}
          {/* A plain anchor, not a Link: the route answers with a file to download, not a page to route to. */}
          {office && !CRM_PREVIEW && <Button asChild variant="secondary"><a href="/api/admin/voorraad/backup"><PreviewText>Back-up (Excel)</PreviewText></a></Button>}
          <Button asChild variant="secondary"><Link href={back + '&preview=1'}><PreviewText>PDF-voorbeeld</PreviewText></Link></Button>
        </div>
      </div>
    </header>

    <Card className="gap-0 shadow-sm">
      <CardContent>
        <form className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-52 flex-1 gap-1.5 text-sm font-medium">
            <PreviewText>Artikel of SKU</PreviewText>
            <span className="relative">
              <Search size={16} aria-hidden="true" className="text-muted-foreground pointer-events-none absolute left-3 top-3" />
              <input className="border-input bg-background h-10 w-full rounded-lg border pr-3 pl-9 font-normal" name="q" type="search" defaultValue={query} />
            </span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium"><PreviewText>Conditie</PreviewText>
            <select className="border-input bg-background h-10 min-w-32 rounded-lg border px-3 font-normal" name="state" defaultValue={state}>
              <option value=""><PreviewText>Alles</PreviewText></option>
              {Object.entries(conditions).map(([value, label]) => <option key={value} value={value}><PreviewText>{label}</PreviewText></option>)}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm has-checked:bg-amber-500/10">
              <input type="checkbox" name="critical" value="1" defaultChecked={critical} /><PreviewText>Lage voorraad</PreviewText>
            </label>
            <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm has-checked:bg-sky-500/10">
              <input type="checkbox" name="assembly" value="1" defaultChecked={assembly} /><PreviewText>Alleen gemonteerd</PreviewText>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" className="h-10"><PreviewText>Toepassen</PreviewText></Button>
            {filtered && <Button asChild variant="ghost" className="h-10"><Link href={reportPath}><PreviewText>Filters wissen</PreviewText></Link></Button>}
          </div>
        </form>
      </CardContent>
    </Card>

    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone }) => <Card key={label} className="gap-1 shadow-sm">
        <CardHeader className="flex items-center gap-3">
          <span className={`rounded-lg p-2.5 ${tone}`}><Icon size={19} aria-hidden="true" /></span>
          <div className="min-w-0">
            <CardDescription><PreviewText>{label}</PreviewText></CardDescription>
            <CardTitle className="mt-0.5 text-xl tabular-nums sm:text-2xl">{value}</CardTitle>
          </div>
        </CardHeader>
      </Card>)}
    </section>

    {composition.every(item=>item.value>=0) && <Card><CardHeader><CardTitle><PreviewText>Fysieke voorraad per staat</PreviewText></CardTitle></CardHeader><CardContent><RankedBars rows={composition} format={value=>integer.format(value)} /></CardContent></Card>}
    <Card className="gap-0 pb-0 shadow-sm">
      <CardHeader className="gap-2 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg"><PreviewText>Voorraad per artikel</PreviewText></CardTitle>
          <span className="text-muted-foreground text-xs tabular-nums">
            {rows.length > 0 ? `${integer.format(first + 1)}–${integer.format(first + visible.length)} / ${integer.format(rows.length)}` : integer.format(0)}
          </span>
        </div>
        <CardDescription><PreviewText>Reserveringen gelden per artikel. Locaties tonen de getelde aantallen.</PreviewText></CardDescription>
        {office && <CardDescription><PreviewText>Waardering tegen laatst bekende inkoopprijs.</PreviewText>
          {totals.missing > 0 && <span className="ml-2 text-amber-800 dark:text-amber-200">{totals.missing} <PreviewText>{totals.missing === 1 ? "artikel zonder bekende inkoopprijs" : "artikelen zonder bekende inkoopprijs"}</PreviewText></span>}
        </CardDescription>}
      </CardHeader>
      <CardContent className="border-t p-0">
        <Table className="min-w-[740px]">
          <TableHeader className="bg-muted/60"><TableRow>
            {['Artikel', 'Conditie', 'Fysieke voorraad', 'Gereserveerd', 'Beschikbaar', 'Locaties', ...(office ? ['Inkoopprijs'] : [])]
              .map((label, index) => <TableHead key={label} className={index >= 2 && index <= 4 ? 'text-right' : index === 0 ? 'pl-4' : undefined}><PreviewText>{label}</PreviewText></TableHead>)}
          </TableRow></TableHeader>
          <TableBody>
            {!rows.length && <TableRow><TableCell className="text-muted-foreground py-10 text-center" colSpan={office ? 7 : 6}><PreviewText>Geen voorraad voor deze selectie.</PreviewText></TableCell></TableRow>}
            {visible.map(({ article, position, locations }) => {
              const available = position?.available ?? 0;
              return <TableRow key={article.code} className="even:bg-muted/20">
                <TableCell className="max-w-80 py-3 pl-4 whitespace-normal">
                  <div className="font-medium">{article.sku ? <Link className="underline-offset-4 hover:underline" href={'/admin/voorraad/p?q=' + encodeURIComponent(article.sku)}>{article.name}</Link> : article.name}</div>
                  <span className="text-muted-foreground block text-xs">{article.code}{article.sku && ' · ' + article.sku}</span>
                </TableCell>
                <TableCell><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${conditionStyle[article.condition] ?? ''}`}><PreviewText>{conditions[article.condition] ?? article.condition}</PreviewText></span></TableCell>
                <TableCell className="text-right font-medium tabular-nums">{position?.physical ?? 0}</TableCell>
                <TableCell className="text-right tabular-nums">{position?.reserved || '0'}</TableCell>
                <TableCell className="text-right">
                  <span className={`inline-flex min-w-8 justify-center rounded-md px-2 py-0.5 font-semibold tabular-nums ${available > 0 ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' : 'bg-muted text-muted-foreground'}`}>
                    {available < 0 && <ArrowDownRight size={15} aria-hidden="true" />}{available}
                  </span>
                </TableCell>
                <TableCell>{locations.length ? <details className="group">
                  <summary className="bg-muted inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1 text-xs [&::-webkit-details-marker]:hidden">
                    <MapPin size={13} aria-hidden="true" />{locations.length} <PreviewText>{locations.length === 1 ? "locatie" : "locaties"}</PreviewText>
                    <ChevronDown size={13} aria-hidden="true" className="group-open:rotate-180" />
                  </summary>
                  {locations.map(({ quantity, kfc_locations: location }) => <div className="text-muted-foreground mt-1 text-xs" key={location.warehouse + '/' + location.shelf + '/' + location.box}>
                    {locationLabel(location)} · <strong className="text-foreground">{quantity}</strong>
                  </div>)}
                </details> : '—'}</TableCell>
                {office && <TableCell className="tabular-nums">{article.purchase_price_cents == null ? '—' : money.format(article.purchase_price_cents / 100)}</TableCell>}
              </TableRow>;
            })}
          </TableBody>
        </Table>
        {pages > 1 && <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          {page > 1 && <Button asChild variant="outline" size="sm"><Link href={pageHref(page - 1)}><ChevronLeft aria-hidden="true" /><PreviewText>Vorige pagina</PreviewText></Link></Button>}
          <span className="text-muted-foreground px-2 text-sm tabular-nums">{page} / {pages}</span>
          {page < pages && <Button asChild variant="outline" size="sm"><Link href={pageHref(page + 1)}><PreviewText>Volgende pagina</PreviewText><ChevronRight aria-hidden="true" /></Link></Button>}
        </div>}
      </CardContent>
    </Card>
  </main>;
}
