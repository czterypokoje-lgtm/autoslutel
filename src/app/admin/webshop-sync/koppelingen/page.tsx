import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IS_KEYFORCARS } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireOfficeUser } from '@/lib/crmSession';
import { isWooShop } from '@/lib/kfcWoo';
import { readMapping, SHOPS, type MappingStatus } from '@/lib/kfcWooStock';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LinkArticle } from '../SyncActions';

export const dynamic = 'force-dynamic';

const STATUS: Record<MappingStatus, [string, 'default' | 'secondary' | 'outline' | 'destructive']> = {
  ok: ['Gekoppeld', 'secondary'], unmapped: ['Geen artikel', 'destructive'], ambiguous: ['Dubbel', 'destructive'], no_stock: ['Geen voorraadbeheer', 'outline'],
};
const FILTERS: { key: string; label: string }[] = [
  { key: 'problems', label: 'Aandacht nodig' }, { key: 'unmapped', label: 'Geen artikel' }, { key: 'ambiguous', label: 'Dubbel' },
  { key: 'no_stock', label: 'Geen voorraadbeheer' }, { key: 'ok', label: 'Gekoppeld' }, { key: 'all', label: 'Alles' },
];
const LIMIT = 500;

/** Shop product ↔ article, built from SKU; unmapped and ambiguous first. */
export default async function MappingPage({ searchParams }: { searchParams: Promise<{ shop?: string; status?: string; q?: string }> }) {
  if (!IS_KEYFORCARS || CRM_PREVIEW) notFound();
  await requireOfficeUser('/admin/webshop-sync/koppelingen');
  const params = await searchParams;
  const shop = params.shop && isWooShop(params.shop) ? params.shop : undefined;
  const filter = FILTERS.some((f) => f.key === params.status) ? params.status! : 'problems';
  const q = (params.q ?? '').trim().toUpperCase();
  const rows = (await readMapping(shop, ['ok', 'unmapped', 'ambiguous', 'no_stock'].includes(filter) ? filter as MappingStatus : undefined))
    .filter((row) => filter !== 'problems' || row.status !== 'ok')
    .filter((row) => !q || row.sku.toUpperCase().includes(q) || row.name.toUpperCase().includes(q) || (row.article_code ?? '').includes(q));
  const href = (next: Record<string, string | undefined>) => {
    const search = new URLSearchParams(Object.entries({ shop, status: filter, q: params.q, ...next }).filter((e): e is [string, string] => !!e[1]));
    return `/admin/webshop-sync/koppelingen?${search}`;
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Webshopkoppelingen</h1>
        <Link className="text-muted-foreground text-sm underline-offset-2 hover:underline" href="/admin/webshop-sync">← Sync-status</Link>
      </div>
      <p className="text-muted-foreground text-sm">
        Elk webshopproduct (of variatie) hoort bij precies één artikel, op SKU. Alleen gekoppelde producten waarvoor de webshop voorraad beheert krijgen een aantal.
        Een handmatige koppeling blijft staan bij verversen. Dubbel = de SKU hoort bij meer artikelen, of staat twee keer in dezelfde webshop.
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link className={!shop ? 'font-semibold' : 'underline-offset-2 hover:underline'} href={href({ shop: undefined })}>Alle webshops</Link>
        {SHOPS.map((s) => <Link key={s} className={shop === s ? 'font-semibold' : 'underline-offset-2 hover:underline'} href={href({ shop: s })}>{s}</Link>)}
        <span className="text-muted-foreground">|</span>
        {FILTERS.map((f) => <Link key={f.key} className={filter === f.key ? 'font-semibold' : 'underline-offset-2 hover:underline'} href={href({ status: f.key })}>{f.label}</Link>)}
        <form className="ml-auto" action="/admin/webshop-sync/koppelingen">
          {shop && <input type="hidden" name="shop" value={shop} />}
          <input type="hidden" name="status" value={filter} />
          <input className="border-input h-8 w-56 rounded-md border bg-transparent px-2" name="q" defaultValue={params.q ?? ''} placeholder="Zoek SKU, naam of artikel" aria-label="Zoeken" />
        </form>
      </div>
      <Card>
        <CardContent className="p-0">
          {rows.length ? <Table>
            <TableHeader><TableRow>
              <TableHead>Webshop</TableHead><TableHead>SKU</TableHead><TableHead>Product</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">In webshop</TableHead><TableHead className="text-right">Laatst gepusht</TableHead><TableHead>Artikel</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.slice(0, LIMIT).map((row) => (
                <TableRow key={`${row.shop}-${row.woo_product_id}-${row.woo_variation_id}`}>
                  <TableCell className="text-xs">{row.shop}</TableCell>
                  <TableCell className="font-medium">{row.sku || <span className="text-muted-foreground">leeg</span>}</TableCell>
                  <TableCell className="max-w-72 truncate text-sm">{row.name}<span className="text-muted-foreground block text-xs">#{row.woo_product_id}{row.woo_variation_id ? ` / variatie ${row.woo_variation_id}` : ''}</span></TableCell>
                  <TableCell>
                    <Badge variant={STATUS[row.status][1]}>{STATUS[row.status][0]}</Badge>
                    {row.manual && <span className="text-muted-foreground block text-xs">handmatig</span>}
                    {row.status === 'ambiguous' && row.candidates.length > 0 && <span className="text-muted-foreground block text-xs">{row.candidates.join(', ')}</span>}
                    {row.push_error && <span className="text-destructive block max-w-48 truncate text-xs">{row.push_error}</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.shop_quantity ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.pushed_quantity ?? '—'}</TableCell>
                  <TableCell><LinkArticle shop={row.shop} product={row.woo_product_id} variation={row.woo_variation_id} article={row.article_code} candidates={row.candidates} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table> : <p className="text-muted-foreground p-6 text-sm">Geen producten in deze selectie. Nog nooit ververst? Gebruik &quot;Koppelingen verversen&quot; op de sync-status.</p>}
          {rows.length > LIMIT && <p className="text-muted-foreground px-6 py-3 text-xs">Eerste {LIMIT} van {rows.length}. Verfijn met de filters of zoek.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
