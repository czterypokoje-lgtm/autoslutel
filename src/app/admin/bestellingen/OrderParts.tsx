'use client';

import { PreviewProductName, PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, PackageCheck, Tag, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Fulfilment, LineState, ShopLine, ShopOrder } from '@/lib/kfcOrders';

const api = '/api/admin/kfc-orders';
/** shipOrder's message for KFC_NOT_PICKED (src/lib/kfcOrders.ts is server-only, so the text is repeated here). */
const SHIP_NOT_PICKED = 'Nog niet alles is gepickt. Pick eerst alle regels.';
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

export function LineBadge({ state }: { state: LineState }) { const [l, v] = LINE[state]; return <Badge variant={v}><PreviewText>{l}</PreviewText></Badge>; }
export function FulfilmentBadge({ value }: { value: Fulfilment }) { const [l, v] = FULFILMENT[value]; return <Badge variant={v}><PreviewText>{l}</PreviewText></Badge>; }

async function post(body: unknown): Promise<{ error?: string; writeback?: string; order?: ShopOrder }> {
  const r = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  const data = await r?.json().catch(() => null);
  return r?.ok ? (data ?? {}) : { error: data?.error ?? 'Opslaan mislukt.' };
}

/**
 * Lines table with pick checkboxes and the ship button; used by the detail
 * page and the pick list. With `onOrder` the caller takes the fresh order the
 * API returns and patches its own state; without it we fall back to a refresh.
 */
export function OrderLines({ order, canAct, onOrder }: { order: ShopOrder; canAct: boolean; onOrder?: (order: ShopOrder) => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const { t } = usePreviewLanguage();
  const [scan, setScan] = useState('');
  const [ticks, setTicks] = useState<Record<string, boolean>>({}); // optimistic pick ticks; only rolled back on failure
  const live = order.status === 'processing' && (order.fulfilment === 'open' || order.fulfilment === 'picked');
  // The same rule kfc_ship_order enforces (0138): every mapped line with a quantity is fully reserved and picked.
  // Unmapped and zero-quantity lines never block. The first unmet step is shown next to the button.
  const toShip = order.lines.filter((l) => l.state !== 'cancelled' && l.article_code && l.quantity > 0);
  const unreserved = toShip.filter((l) => l.reserved < l.quantity);
  const unpicked = toShip.filter((l) => !(l.state === 'picked' && l.picked >= l.quantity));
  const blocked = unreserved.length
    ? (toShip.every((l) => l.reserved <= 0) ? 'Niets gereserveerd: eerst voorraad ontvangen of tellen'
      : `Nog ${unreserved.length} ${unreserved.length === 1 ? 'regel' : 'regels'} niet volledig gereserveerd: eerst voorraad ontvangen of tellen`)
    : unpicked.length ? `Nog ${unpicked.length} ${unpicked.length === 1 ? 'regel' : 'regels'} te picken`
    : !order.label_url ? 'Maak eerst een verzendlabel' : '';
  const shippable = live && !blocked;
  const blockedId = useId();
  const short = order.lines.filter((l) => l.state === 'short');

  async function run(key: string, body: unknown, done?: (r: { writeback?: string }) => void): Promise<boolean> {
    setBusy(key); setNote('');
    const result = await post(body);
    setBusy('');
    if (result.error) {
      setNote(result.error);
      // The server saw a different pick state than this screen (another tab or device): show the real one.
      if (result.error === SHIP_NOT_PICKED) { setTicks({}); router.refresh(); }
      return false;
    }
    done?.(result);
    if (result.order && onOrder) onOrder(result.order); else router.refresh();
    return true;
  }

  async function pick(line: ShopLine, picked: boolean) {
    setTicks((t) => ({ ...t, [line.id]: picked }));
    if (!(await run(line.id, { action: 'pick', line: line.id, picked }))) setTicks((t) => { const n = { ...t }; delete n[line.id]; return n; });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3">
        <CardTitle className="text-base">{order.lines.length} {t(order.lines.length === 1 ? 'regel' : 'regels')}</CardTitle>
        <FulfilmentBadge value={order.fulfilment} />
        {short.length > 0 && <CardDescription>{short.length} {t(short.length === 1 ? 'regel wacht op voorraad' : 'regels wachten op voorraad')}</CardDescription>}
        {canAct && live && (
          <form className="ml-auto flex items-center gap-2" onSubmit={(e) => {
            e.preventDefault();
            const code = scan.trim().toUpperCase(); if (!code) return;
            const hit = order.lines.find((l) => (l.sku && l.sku.toUpperCase() === code) || l.article_code === code);
            setScan('');
            if (!hit) { setNote(`${code}: niet in deze bestelling.`); return; }
            if (hit.state === 'picked') { setNote(`${hit.sku || code} is al gepickt.`); return; }
            if (hit.reserved <= 0) { setNote(`${hit.sku || code}: niets gereserveerd, eerst voorraad tellen of ontvangen.`); return; }
            pick(hit, true);
          }}>
            <input className="border-input h-11 w-44 rounded-md border bg-transparent px-2 text-base sm:h-8 sm:text-sm" enterKeyHint="go" placeholder={t("Scan artikel…")} aria-label={t("Scan artikel")} value={scan} onChange={(e) => setScan(e.target.value)} autoComplete="off" />
          </form>
        )}
        {canAct && live && (
          <Button size="sm" variant={order.label_url ? 'outline' : 'default'} disabled={busy === 'label'} onClick={() => run('label', { action: 'label', id: order.id }, (r) => {
            const url = (r as { label_url?: string }).label_url; if (url) window.open(url, '_blank', 'noopener');
          })}>
            <Tag className="size-4" /> {t(order.label_url ? 'Label opnieuw' : 'Verzendlabel')}
          </Button>
        )}
        {order.carrier && <span className="text-muted-foreground text-xs">{order.carrier}{order.tracking_code && ` · ${order.tracking_code}`}</span>}
        {canAct && live && (
          <Button size="sm" disabled={!shippable || busy === 'ship'} aria-describedby={blocked ? blockedId : undefined}
            onClick={() => run('ship', { action: 'ship', id: order.id, key: crypto.randomUUID() }, (r) => setNote(r.writeback === 'pending' ? 'Verzonden. De webshop is nog niet bijgewerkt; dat gebeurt vannacht automatisch.' : 'Verzonden en in de webshop op afgerond gezet.'))}>
            <Truck className="size-4" /> {t('Verzenden')}
          </Button>
        )}
        {/* Why "Verzenden" is disabled; a live region like the scan note below, so a picker hears the next step. */}
        {canAct && live && (
          <span id={blockedId} role="status" aria-live="polite" className={blocked ? 'text-muted-foreground text-xs' : 'sr-only'}>{blocked ? t(blocked) : ''}</span>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {canAct && live && <TableHead className="w-10" />}
              <TableHead><PreviewText>{"Artikel"}</PreviewText></TableHead><TableHead><PreviewText>{"Locatie"}</PreviewText></TableHead>
              <TableHead className="text-right"><PreviewText>{"Aantal"}</PreviewText></TableHead><TableHead className="hidden text-right md:table-cell"><PreviewText>{"Gereserveerd"}</PreviewText></TableHead>
              <TableHead className="hidden md:table-cell"><PreviewText>{"Beschikbaar nu"}</PreviewText></TableHead><TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => <Line key={line.id} line={line} pickable={canAct && live} busy={busy} picked={ticks[line.id] ?? line.state === 'picked'} onPick={(p) => pick(line, p)} />)}
          </TableBody>
        </Table>
        {/* Always mounted, so a scan result ("al gepickt", "niet in deze bestelling") is announced without looking at the screen. */}
        <p role="status" aria-live="polite" className={note ? 'text-muted-foreground px-6 py-3 text-sm' : 'sr-only'}>{note ? t(note) : ''}</p>
      </CardContent>
    </Card>
  );
}

function Line({ line, pickable, busy, picked, onPick }: { line: ShopLine; pickable: boolean; busy: string; picked: boolean; onPick: (picked: boolean) => void }) {
  const { t } = usePreviewLanguage();
  const canPick = pickable && (line.state === 'reserved' || line.state === 'picked' || line.state === 'short') && line.reserved > 0;
  return (
    <TableRow className={picked ? 'bg-muted/40' : undefined}>
      {pickable && <TableCell><input type="checkbox" aria-label={t("Gepickt")} className="size-4" disabled={!canPick || busy === line.id} checked={picked} onChange={(e) => onPick(e.target.checked)} /></TableCell>}
      <TableCell>
        <div className="font-medium">{line.sku || '—'}</div>
        <div className="text-muted-foreground max-w-20 truncate text-xs md:max-w-96"><PreviewProductName sku={line.sku}>{line.name}</PreviewProductName>{!line.article_code && ' · ' + t('niet gekoppeld aan een artikel')}</div>
      </TableCell>
      <TableCell className="whitespace-nowrap">{line.shelf ? `${line.shelf} / ${line.box}` : <span className="text-muted-foreground">—</span>}</TableCell>
      <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
      <TableCell className="hidden text-right tabular-nums md:table-cell">{line.reserved}</TableCell>
      <TableCell className="hidden text-xs md:table-cell">
        {line.article_code && (line.available !== undefined ? <>
          <span className="tabular-nums">{line.available}</span>
          {line.state === 'short' && (line.incoming ? <span className="text-muted-foreground"> · {line.incoming} <PreviewText>{"onderweg"}</PreviewText></span> : <span className="text-muted-foreground"> · {t("niets besteld")}</span>)}
        </> : null)}
      </TableCell>
      <TableCell><LineBadge state={line.state} /></TableCell>
    </TableRow>
  );
}

export function ReturnLine({ line, maximum, locations }: {
  line: ShopLine; maximum: number; locations: { id: string; shelf: string; box: string }[];
}) {
  const router = useRouter();
  const { t } = usePreviewLanguage();
  const retry = useRef<{ quantity: number; location: string; key: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(maximum);
  const [note, setNote] = useState('');
  const available = Math.min(remaining, maximum);
  return (
    <form className="flex flex-wrap items-end gap-3" onSubmit={async (event) => {
      event.preventDefault();
      if (busy) return;
      const form = new FormData(event.currentTarget);
      const quantity = Number(form.get('quantity'));
      const location = String(form.get('location'));
      if (retry.current?.quantity !== quantity || retry.current.location !== location) {
        retry.current = { quantity, location, key: crypto.randomUUID() };
      }
      setBusy(true);
      const result = await post({ action: 'return', line: line.id, ...retry.current });
      setBusy(false);
      setNote(result.error ?? 'Retour geboekt.');
      if (!result.error) {
        retry.current = null;
        setRemaining(available - quantity);
        router.refresh();
      }
    }}>
      <div className="mr-auto">
        <PreviewProductName sku={line.sku}>{line.name}</PreviewProductName>
        <p className="text-muted-foreground text-sm">{available} {t('nog retour mogelijk')}</p>
      </div>
      <label className="grid gap-1 text-sm">
        {t('Aantal')}
        <input className="border-input h-9 w-20 rounded-md border bg-transparent px-2" name="quantity" type="number" min={1} max={available} defaultValue={1} required disabled={busy || !available} />
      </label>
      <label className="grid gap-1 text-sm">
        {t('Locatie')}
        <select className="border-input bg-background h-9 rounded-md border px-2" name="location" defaultValue="" required disabled={busy || !available}>
          <option value="" disabled>{t('Kies een retourlocatie')}</option>
          {locations.map((location) => <option key={location.id} value={location.id}>{location.shelf} / {location.box}</option>)}
        </select>
      </label>
      <Button size="sm" disabled={busy || !available || !locations.length}>{t('Retour boeken')}</Button>
      <p role="status" className="text-muted-foreground w-full text-sm">{t(note)}</p>
    </form>
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
        <CardTitle className="text-base"><PreviewText>{"Webshops importeren"}</PreviewText></CardTitle>
        <CardDescription><PreviewText>{"Haalt bestellingen op via de WooCommerce API. Daarna houden de webhooks en de nachtelijke controle alles bij."}</PreviewText></CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-3">
        <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3 text-sm sm:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium"><PreviewText>{"Voorbeeldgegevens"}</PreviewText></span>
            <span className="text-muted-foreground text-xs"><PreviewText>{"Zolang de webshops niet gekoppeld zijn: laad de voorbeeldbestellingen plus voorraad voor de 40 bestsellers, zodat reserveren, picken, verzenden en de rapporten echt werken."}</PreviewText></span>
            <span className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" disabled={state.sample === 'bezig…'} onClick={async () => { setState((s) => ({ ...s, sample: 'bezig…' })); const r = await post({ action: 'sample-load' }) as { error?: string; orders?: number; lines?: number; stocked?: number }; setState((s) => ({ ...s, sample: r.error ?? `${r.orders} bestellingen, ${r.lines} regels, ${r.stocked} artikelen op voorraad gezet` })); router.refresh(); }}><PreviewText>{"Laad voorbeeldgegevens"}</PreviewText></Button>
              <Button size="sm" variant="ghost" onClick={async () => { if (!window.confirm('Alle bestellingen, reserveringen, voorraadbewegingen en voorraadstanden wissen?')) return; const r = await post({ action: 'sample-clear' }); setState((s) => ({ ...s, sample: r.error ?? 'Gewist.' })); router.refresh(); }}><PreviewText>{"Wis alles"}</PreviewText></Button>
            </span>
          </div>
          {state.sample && <span className="text-muted-foreground text-xs">{state.sample}</span>}
        </div>
        {shops.map(({ shop, configured, orders }) => (
          <div key={shop} className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between"><span className="font-medium">{shop}</span><span className="text-muted-foreground tabular-nums">{orders} orders</span></div>
            {configured ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => run(shop, 90)}><Download className="size-4" /> <PreviewText>{"90 dagen"}</PreviewText></Button>
                <Button size="sm" variant="outline" onClick={() => run(shop, 365)}>12 maanden</Button>
              </div>
            ) : <span className="text-muted-foreground text-xs"><PreviewText>{"Geen API-sleutel ingesteld (WOO_… in Vercel)."}</PreviewText></span>}
            {state[shop] && <span className="text-muted-foreground text-xs">{state[shop]}</span>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Autosleutel24: its own webshop writes into `public.orders` in this same
 * database, so there is nothing to fetch — one request reads that table into
 * the ledger. No per-shop keys, no paging from the browser.
 */
export function OwnImportPanel({ orders, last }: { orders: number; last: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const { t } = usePreviewLanguage();
  async function run(days: number) {
    setBusy(true); setNote('bezig…');
    const result = await post({ action: 'import-own', days }) as { error?: string; fetched?: number; inserted?: number; updated?: number };
    setBusy(false);
    setNote(result.error ?? `klaar · ${result.inserted ?? 0} nieuw, ${result.updated ?? 0} bijgewerkt (${result.fetched ?? 0} gelezen)`);
    router.refresh();
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base"><PreviewText>{"Webshoporders importeren"}</PreviewText></CardTitle>
        <CardDescription><PreviewText>{"Haalt de bestellingen van autosleutel24.nl uit de webshoptabel in deze database. Daarna houdt de nachtelijke controle alles bij."}</PreviewText></CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground tabular-nums">{orders} orders</span>
        <span className="text-muted-foreground text-xs">{last ? `${t('laatste import')} ${WHEN.format(new Date(last))}` : t('nog niet geïmporteerd')}</span>
        <span className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run(90)}><Download className="size-4" /> <PreviewText>{"90 dagen"}</PreviewText></Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run(0)}><PreviewText>{"Alles"}</PreviewText></Button>
        </span>
        {note && <span className="text-muted-foreground w-full text-xs">{t(note)}</span>}
      </CardContent>
    </Card>
  );
}

export function PickIcon() { return <PackageCheck className="size-4" />; }
