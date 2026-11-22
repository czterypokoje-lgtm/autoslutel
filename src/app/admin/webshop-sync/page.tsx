import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IS_KEYFORCARS } from '@/config/install';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { requireOfficeUser } from '@/lib/crmSession';
import { syncStatus, type PushMode } from '@/lib/kfcWooStock';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PushOne, QueueActions, RefreshMapping } from './SyncActions';

export const dynamic = 'force-dynamic';

const WHEN = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
const MODE: Record<PushMode, [string, 'default' | 'secondary' | 'outline' | 'destructive']> = {
  on: ['Live', 'default'], dry: ['Proef (dry run)', 'secondary'], off: ['Uit', 'outline'],
};
const KIND = { push: 'Push', dry_run: 'Proef', mapping: 'Koppelingen' } as const;
const when = (value: string | null | undefined) => (value ? WHEN.format(new Date(value)) : '—');

/** Stock push to the WooCommerce shops: per-shop switch, last runs, queue, errors. */
export default async function WebshopSyncPage() {
  if (!IS_KEYFORCARS || CRM_PREVIEW) notFound();
  await requireOfficeUser('/admin/webshop-sync');
  const status = await syncStatus();
  const anyActive = status.shops.some((shop) => shop.mode !== 'off');
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Webshop-voorraadsync</h1>
        <p className="text-muted-foreground text-sm">
          De CRM-voorraad is leidend. Na elke voorraadwijziging (verkoop, kassa, ontvangst, telling, retour, reservering) gaat het artikel in de wachtrij
          en krijgt elke webshop die het verkoopt het beschikbare aantal: op de plank min reserveringen min busvoorraad.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {status.shops.map((shop) => (
          <Card key={shop.shop}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">{shop.shop} <Badge variant={MODE[shop.mode][1]}>{MODE[shop.mode][0]}</Badge></CardTitle>
              <CardDescription>{shop.configured ? `WOO_…_STOCK_PUSH bepaalt live/proef/uit` : 'Geen API-sleutel ingesteld'}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div>Laatste push: {shop.lastPush ? <>{when(shop.lastPush.started_at)} · {shop.lastPush.updated} {shop.lastPush.kind === 'dry_run' ? 'zou bijwerken' : 'bijgewerkt'}{shop.lastPush.failed ? `, ${shop.lastPush.failed} fout` : ''}</> : '—'}</div>
              {shop.lastPush?.error && <div className="text-destructive text-xs">{shop.lastPush.error}</div>}
              <div>
                <Link className="underline-offset-2 hover:underline" href={`/admin/webshop-sync/koppelingen?shop=${shop.shop}`}>{shop.counts.ok} gekoppeld</Link>
                {' · '}<Link className="underline-offset-2 hover:underline" href={`/admin/webshop-sync/koppelingen?shop=${shop.shop}&status=unmapped`}>{shop.counts.unmapped} zonder artikel</Link>
                {' · '}<Link className="underline-offset-2 hover:underline" href={`/admin/webshop-sync/koppelingen?shop=${shop.shop}&status=ambiguous`}>{shop.counts.ambiguous} dubbel</Link>
                {' · '}<Link className="underline-offset-2 hover:underline" href={`/admin/webshop-sync/koppelingen?shop=${shop.shop}&status=no_stock`}>{shop.counts.no_stock} zonder voorraadbeheer</Link>
              </div>
              {shop.errors > 0 && <div className="text-destructive">{shop.errors} producten met een pushfout</div>}
              <div className="text-muted-foreground text-xs">Koppelingen ververst: {when(shop.lastMapping?.finished_at ?? shop.lastMapping?.started_at)}{shop.lastMapping?.error && ` · ${shop.lastMapping.error}`}</div>
              <RefreshMapping shop={shop.shop} configured={shop.configured} />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wachtrij</CardTitle>
          <CardDescription>{status.queue} artikelen in de wachtrij, {status.due} nu aan de beurt{status.retrying.length ? `, ${status.retrying.length} met herhaalpogingen` : ''}.{!anyActive && ' Alle webshops staan uit: de wachtrij blijft staan tot er één aan gaat.'}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <QueueActions anyActive={anyActive} />
          <div className="grid gap-1">
            <span className="text-sm font-medium">Eén artikel nu pushen</span>
            <PushOne anyActive={anyActive} />
          </div>
          {status.retrying.length > 0 && (
            <Table>
              <TableHeader><TableRow><TableHead>Artikel</TableHead><TableHead className="text-right">Pogingen</TableHead><TableHead>Volgende poging</TableHead><TableHead>Fout</TableHead></TableRow></TableHeader>
              <TableBody>
                {status.retrying.map((row) => (
                  <TableRow key={row.article_code}>
                    <TableCell className="font-medium">{row.article_code}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.attempts}</TableCell>
                    <TableCell className="whitespace-nowrap">{when(row.next_attempt_at)}</TableCell>
                    <TableCell className="text-muted-foreground max-w-md truncate text-xs">{row.last_error}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {status.productErrors.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Producten met een pushfout</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Webshop</TableHead><TableHead>SKU</TableHead><TableHead>Artikel</TableHead><TableHead>Fout</TableHead></TableRow></TableHeader>
              <TableBody>
                {status.productErrors.map((row) => (
                  <TableRow key={`${row.shop}-${row.sku}-${row.article_code}`}>
                    <TableCell>{row.shop}</TableCell><TableCell className="font-medium">{row.sku || '—'}</TableCell>
                    <TableCell>{row.article_code ?? '—'}</TableCell><TableCell className="text-muted-foreground max-w-md truncate text-xs">{row.push_error}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle className="text-base">Laatste runs</CardTitle></CardHeader>
        <CardContent className="p-0">
          {status.runs.length ? <Table>
            <TableHeader><TableRow><TableHead>Wanneer</TableHead><TableHead>Webshop</TableHead><TableHead>Soort</TableHead><TableHead className="text-right">Artikelen</TableHead><TableHead className="text-right">Bijgewerkt</TableHead><TableHead className="text-right">Fout</TableHead><TableHead>Melding</TableHead></TableRow></TableHeader>
            <TableBody>
              {status.runs.map((run) => {
                const preview = (run.detail?.preview as { sku: string; from: number | null; to: number }[] | undefined) ?? [];
                return (
                  <TableRow key={run.id}>
                    <TableCell className="whitespace-nowrap text-sm">{when(run.started_at)}</TableCell>
                    <TableCell>{run.shop}</TableCell>
                    <TableCell>{KIND[run.kind]}</TableCell>
                    <TableCell className="text-right tabular-nums">{run.articles}</TableCell>
                    <TableCell className="text-right tabular-nums">{run.updated}</TableCell>
                    <TableCell className="text-right tabular-nums">{run.failed || '—'}</TableCell>
                    <TableCell className="text-muted-foreground max-w-md text-xs">
                      {run.error && <span className="text-destructive block truncate">{run.error}</span>}
                      {preview.length > 0 && <span className="block truncate">{preview.slice(0, 8).map((p) => `${p.sku}: ${p.from ?? '?'}→${p.to}`).join(', ')}{preview.length > 8 && ' …'}</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table> : <p className="text-muted-foreground px-6 pb-6 text-sm">Nog geen runs.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
