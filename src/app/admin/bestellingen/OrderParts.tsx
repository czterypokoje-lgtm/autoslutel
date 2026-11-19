'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, PackageCheck, Tag, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Fulfilment, LineState, ShopLine, ShopOrder } from '@/lib/kfcOrders';

const api = '/api/admin/kfc-orders';
export const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
export const WHEN = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });

const LINE: Record<LineState, [string, 'default' | 'secondary' | 'outline' | 'destructive']> = {
  open: ['Open', 'outline'], short: ['Tekort', 'destructive'], reserved: ['Gereserveerd', 'default'],
  picked: ['Gepickt', 'secondary'], shipped: ['Verzonden', 'secondary'], cancelled: ['Geannuleerd', 'outline'],
};
const FULFILMENT: Record<Fulfilment, [string, 'default' | 'secondary' | 'outline' | 'destructive']> = {
  open: ['Te picken', 'default'], picked: ['Gepickt', 'secondary'], shipped: ['Verzonden', 'secondary'],
  cancelled: ['Geannuleerd', 'outline'], external: ['Door webshop afgehandeld', 'outline'],
};

export function LineBadge({ state }: { state: LineState }) { const [l, v] = LINE[state]; return <Badge variant={v}>{l}</Badge>; }
export function FulfilmentBadge({ value }: { value: Fulfilment }) { const [l, v] = FULFILMENT[value]; return <Badge variant={v}>{l}</Badge>; }

async function post(body: unknown): Promise<{ error?: string; writeback?: string }> {
  const r = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  const data = await r?.json().catch(() => null);
  return r?.ok ? (data ?? {}) : { error: data?.error ?? 'Opslaan mislukt.' };
}

/** Lines table with pick checkboxes and the ship button; used by the detail page and the pick list. */
export function OrderLines({ order, canAct }: { order: ShopOrder; canAct: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [scan, setScan] = useState('');
  const live = order.status === 'processing' && (order.fulfilment === 'open' || order.fulfilment === 'picked');
  const shippable = live && !!order.label_url && order.lines.filter((l) => l.state !== 'cancelled' && l.article_code).every((l) => l.state === 'picked' || l.state === 'reserved');
  const short = order.lines.filter((l) => l.state === 'short');

  async function run(key: string, body: unknown, done?: (r: { writeback?: string }) => void) {
    setBusy(key); setNote('');
    const result = await post(body);
    setBusy('');
    if (result.error) { setNote(result.error); return; }
    done?.(result);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3">
        <CardTitle className="text-base">{order.lines.length} {order.lines.length === 1 ? 'regel' : 'regels'}</CardTitle>
        <FulfilmentBadge value={order.fulfilment} />
        {short.length > 0 && <CardDescription>{short.length} {short.length === 1 ? 'regel wacht' : 'regels wachten'} op voorraad</CardDescription>}
        {canAct && live && (
          <form className="ml-auto flex items-center gap-2" onSubmit={(e) => {
            e.preventDefault();
            const code = scan.trim().toUpperCase(); if (!code) return;
            const hit = order.lines.find((l) => (l.sku && l.sku.toUpperCase() === code) || l.article_code === code);
            setScan('');
            if (!hit) { setNote(`${code}: niet in deze bestelling.`); return; }
            if (hit.state === 'picked') { setNote(`${hit.sku || code} is al gepickt.`); return; }
            if (hit.reserved <= 0) { setNote(`${hit.sku || code}: niets gereserveerd, eerst voorraad tellen of ontvangen.`); return; }
            run(hit.id, { action: 'pick', line: hit.id, picked: true });
          }}>
            <input className="border-input h-8 w-44 rounded-md border bg-transparent px-2 text-sm" placeholder="Scan artikel…" aria-label="Scan artikel" value={scan} onChange={(e) => setScan(e.target.value)} autoComplete="off" />
          </form>
        )}
        {canAct && live && (
          <Button size="sm" variant={order.label_url ? 'outline' : 'default'} disabled={busy === 'label'} onClick={() => run('label', { action: 'label', id: order.id }, (r) => {
            const url = (r as { label_url?: string }).label_url; if (url) window.open(url, '_blank', 'noopener');
          })}>
            <Tag className="size-4" /> {order.label_url ? 'Label opnieuw' : 'Verzendlabel'}
          </Button>
        )}
        {order.carrier && <span className="text-muted-foreground text-xs">{order.carrier}{order.tracking_code && ` · ${order.tracking_code}`}</span>}
        {canAct && live && (
          <Button size="sm" disabled={!shippable || busy === 'ship'}
            onClick={() => run('ship', { action: 'ship', id: order.id, key: crypto.randomUUID() }, (r) => setNote(r.writeback === 'pending' ? 'Verzonden. De webshop is nog niet bijgewerkt; dat gebeurt vannacht automatisch.' : 'Verzonden en in de webshop op afgerond gezet.'))}>
            <Truck className="size-4" /> {short.length ? 'Deels verzenden' : 'Verzenden'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {canAct && live && <TableHead className="w-10" />}
              <TableHead>Artikel</TableHead><TableHead>Locatie</TableHead>
              <TableHead className="text-right">Aantal</TableHead><TableHead className="text-right">Gereserveerd</TableHead>
              <TableHead>Beschikbaar nu</TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => <Line key={line.id} line={line} pickable={canAct && live} busy={busy} onPick={(picked) => run(line.id, { action: 'pick', line: line.id, picked })} />)}
          </TableBody>
        </Table>
        {note && <p className="text-muted-foreground px-6 py-3 text-sm">{note}</p>}
      </CardContent>
    </Card>
  );
}

function Line({ line, pickable, busy, onPick }: { line: ShopLine; pickable: boolean; busy: string; onPick: (picked: boolean) => void }) {
  const canPick = pickable && (line.state === 'reserved' || line.state === 'picked' || line.state === 'short') && line.reserved > 0;
  return (
    <TableRow className={line.state === 'picked' ? 'bg-muted/40' : undefined}>
      {pickable && <TableCell><input type="checkbox" aria-label="Gepickt" className="size-4" disabled={!canPick || busy === line.id} checked={line.state === 'picked'} onChange={(e) => onPick(e.target.checked)} /></TableCell>}
      <TableCell>
        <div className="font-medium">{line.sku || '—'}</div>
        <div className="text-muted-foreground max-w-96 truncate text-xs">{line.name}{!line.article_code && ' · niet gekoppeld aan een artikel'}</div>
      </TableCell>
      <TableCell className="whitespace-nowrap">{line.shelf ? `${line.shelf} / ${line.box}` : <span className="text-muted-foreground">—</span>}</TableCell>
      <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
      <TableCell className="text-right tabular-nums">{line.reserved}</TableCell>
      <TableCell className="text-xs">
        {line.article_code && (line.available !== undefined ? <>
          <span className="tabular-nums">{line.available}</span>
          {line.state === 'short' && (line.incoming ? <span className="text-muted-foreground"> · {line.incoming} onderweg</span> : <span className="text-muted-foreground"> · niets besteld</span>)}
        </> : null)}
      </TableCell>
      <TableCell><LineBadge state={line.state} /></TableCell>
    </TableRow>
  );
}

/** Backfill panel: imports one page per request until the shop reports no more. */
export function ImportPanel({ shops }: { shops: { shop: string; configured: boolean; orders: number }[] }) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, string>>({});
  async function run(shop: string, days: number) {
    let page = 1, inserted = 0, updated = 0;
    setState((s) => ({ ...s, [shop]: 'bezig…' }));
    for (;;) {
      const result = await post({ action: 'import', shop, page, days }) as { error?: string; inserted?: number; updated?: number; hasMore?: boolean; totalPages?: number };
      if (result.error) { setState((s) => ({ ...s, [shop]: result.error! })); return; }
      inserted += result.inserted ?? 0; updated += result.updated ?? 0;
      setState((s) => ({ ...s, [shop]: `pagina ${page}/${result.totalPages ?? '?'} · ${inserted} nieuw, ${updated} bijgewerkt` }));
      if (!result.hasMore || page >= 60) break;
      page++;
    }
    setState((s) => ({ ...s, [shop]: `klaar · ${inserted} nieuw, ${updated} bijgewerkt` }));
    router.refresh();
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Webshops importeren</CardTitle>
        <CardDescription>Haalt bestellingen op via de WooCommerce API. Daarna houden de webhooks en de nachtelijke controle alles bij.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3 text-sm sm:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Voorbeeldgegevens</span>
            <span className="text-muted-foreground text-xs">Zolang de webshops niet gekoppeld zijn: laad de voorbeeldbestellingen plus voorraad voor de 40 bestsellers, zodat reserveren, picken, verzenden en de rapporten echt werken.</span>
            <span className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" disabled={state.sample === 'bezig…'} onClick={async () => { setState((s) => ({ ...s, sample: 'bezig…' })); const r = await post({ action: 'sample-load' }) as { error?: string; orders?: number; lines?: number; stocked?: number }; setState((s) => ({ ...s, sample: r.error ?? `${r.orders} bestellingen, ${r.lines} regels, ${r.stocked} artikelen op voorraad gezet` })); router.refresh(); }}>Laad voorbeeldgegevens</Button>
              <Button size="sm" variant="ghost" onClick={async () => { if (!window.confirm('Alle bestellingen, reserveringen, voorraadbewegingen en voorraadstanden wissen?')) return; const r = await post({ action: 'sample-clear' }); setState((s) => ({ ...s, sample: r.error ?? 'Gewist.' })); router.refresh(); }}>Wis alles</Button>
            </span>
          </div>
          {state.sample && <span className="text-muted-foreground text-xs">{state.sample}</span>}
        </div>
        {shops.map(({ shop, configured, orders }) => (
          <div key={shop} className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between"><span className="font-medium">{shop}</span><span className="text-muted-foreground tabular-nums">{orders} orders</span></div>
            {configured ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => run(shop, 90)}><Download className="size-4" /> 90 dagen</Button>
                <Button size="sm" variant="outline" onClick={() => run(shop, 365)}>12 maanden</Button>
              </div>
            ) : <span className="text-muted-foreground text-xs">Geen API-sleutel ingesteld (WOO_… in Vercel).</span>}
            {state[shop] && <span className="text-muted-foreground text-xs">{state[shop]}</span>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function PickIcon() { return <PackageCheck className="size-4" />; }
