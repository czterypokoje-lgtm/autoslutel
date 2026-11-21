'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PackageOpen, ScanLine } from 'lucide-react';
import { PreviewProductName } from '@/app/admin/PreviewLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ReturnCondition, ReturnLineStatus, ReturnPanel as Panel } from '@/lib/kfcReturns';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const WHEN = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });
const CONDITION: Record<ReturnCondition, string> = { new: 'Nieuw', opened: 'Geopend', defect: 'Defect, afgeschreven' };
const STATE: Record<ReturnLineStatus['state'], [string, 'default' | 'secondary' | 'outline' | 'destructive'] | null> = {
  none: null,
  expected: ['Retour verwacht', 'destructive'],
  partial: ['Deels retour', 'default'],
  done: ['Terugbetaald en retour', 'secondary'],
  unrefunded: ['Retour zonder terugbetaling', 'outline'],
};
type Location = { id: string; shelf: string; box: string; quarantine: boolean };

async function post(body: unknown): Promise<{ error?: string; lines?: string[] }> {
  const r = await fetch('/api/admin/kfc-returns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  const data = await r?.json().catch(() => null);
  return r?.ok ? (data ?? {}) : { error: data?.error ?? 'Opslaan mislukt.' };
}

/**
 * Refund ↔ return per line, plus "Retour ontvangen": scan the item (or press
 * the line's button), choose the condition and where it goes, book once.
 */
export function ReturnPanel({ orderId, panel, locations, canBook, prices }: { orderId: string; panel: Panel; locations: Location[]; canBook: boolean; prices: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [scan, setScan] = useState('');
  const [scanned, setScanned] = useState('');
  const [note, setNote] = useState('');
  const lines = new Map(panel.lines.map((line) => [line.id, line]));
  const relevant = panel.lines.filter((line) => line.shipped > 0 || line.refunded > 0 || line.returned > 0);
  if (!relevant.length && !panel.refunds.length) return null;

  async function onScan(event: React.FormEvent) {
    event.preventDefault();
    const code = scan.trim(); if (!code) return;
    setScan(''); setNote('');
    const result = await post({ action: 'scan', order: orderId, scan: code });
    if (result.error) { setNote(result.error); return; }
    const hits = (result.lines ?? []).map((id) => lines.get(id)).filter((line): line is ReturnLineStatus => !!line && line.open > 0);
    if (!hits.length) { setNote(`${code}: geen regel in deze bestelling die nog retour kan.`); return; }
    setScanned(code);
    setOpen(hits[0].id);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3">
        <div className="mr-auto grid gap-1">
          <CardTitle className="flex items-center gap-2"><PackageOpen className="size-4" /> Terugbetaling en retour</CardTitle>
          <CardDescription>
            Een terugbetaling in de webshop is geld; een retour is het artikel dat terugkomt. Boek de retour pas als het pakket binnen is.
            {panel.unassigned_refunds > 0 && ` ${panel.unassigned_refunds} terugbetaling(en) zonder regels: kies zelf de regel.`}
          </CardDescription>
        </div>
        {canBook && relevant.some((line) => line.open > 0) && (
          <form className="flex items-center gap-2" onSubmit={onScan}>
            <ScanLine className="text-muted-foreground size-4" />
            <input className="border-input h-8 w-48 rounded-md border bg-transparent px-2 text-sm" placeholder="Scan retourartikel…" aria-label="Scan retourartikel" value={scan} onChange={(e) => setScan(e.target.value)} autoComplete="off" />
          </form>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artikel</TableHead>
              <TableHead className="text-right">Verzonden</TableHead>
              <TableHead className="text-right">Terugbetaald</TableHead>
              <TableHead className="text-right">Retour ontvangen</TableHead>
              <TableHead>Status</TableHead>
              {canBook && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {relevant.map((line) => {
              const badge = STATE[line.state];
              return (
                <TableRow key={line.id}>
                  <TableCell>
                    <div className="font-medium">{line.sku || '—'}</div>
                    <div className="text-muted-foreground max-w-60 truncate text-xs md:max-w-96"><PreviewProductName sku={line.sku}>{line.name}</PreviewProductName>{!line.article_code && ' · niet gekoppeld aan een artikel'}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{line.shipped}</TableCell>
                  <TableCell className="text-right tabular-nums">{line.refunded || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{line.returned || '—'}{line.written_off > 0 && <span className="text-muted-foreground block text-xs">{line.written_off} afgeschreven</span>}</TableCell>
                  <TableCell>{badge ? <Badge variant={badge[1]}>{badge[0]}</Badge> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                  {canBook && <TableCell className="text-right">
                    {line.open > 0 && line.article_code && (
                      <Button size="sm" variant={line.state === 'expected' || line.state === 'partial' ? 'default' : 'outline'} onClick={() => { setScanned(''); setOpen(open === line.id ? null : line.id); }}>
                        Retour ontvangen
                      </Button>
                    )}
                  </TableCell>}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {note && <p role="status" className="text-muted-foreground px-6 text-sm">{note}</p>}
        {open && lines.get(open) && (
          <ReceiveForm key={open + scanned} line={lines.get(open)!} scan={scanned} locations={locations}
            refunds={panel.refunds.filter((refund) => !Object.keys(refund.lines).length || refund.lines[open])}
            onDone={(message) => { setOpen(null); setScanned(''); setNote(message); router.refresh(); }}
            onCancel={() => { setOpen(null); setScanned(''); }} />
        )}
        {(panel.refunds.length > 0 || panel.receipts.length > 0) && (
          <div className="grid gap-4 px-6 pb-6 md:grid-cols-2">
            {panel.refunds.length > 0 && <section className="grid gap-1 text-sm">
              <h3 className="font-medium">Terugbetalingen uit de webshop</h3>
              <ul className="divide-y">
                {panel.refunds.map((refund) => (
                  <li key={refund.id} className="py-1.5">
                    <span className="tabular-nums">#{refund.woo_refund_id}</span>
                    {refund.created_at && <> · <time dateTime={refund.created_at}>{WHEN.format(new Date(refund.created_at))}</time></>}
                    {prices && <> · {MONEY.format(refund.amount_cents / 100)}</>}
                    <span className="text-muted-foreground block text-xs">
                      {Object.keys(refund.lines).length
                        ? Object.entries(refund.lines).map(([line, qty]) => `${qty} × ${lines.get(line)?.sku || lines.get(line)?.name || '?'}`).join(', ')
                        : 'Alleen een bedrag, geen regels'}
                      {refund.reason && ` · ${refund.reason}`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>}
            {panel.receipts.length > 0 && <section className="grid gap-1 text-sm">
              <h3 className="font-medium">Retour ontvangen</h3>
              <ul className="divide-y">
                {panel.receipts.map((receipt) => (
                  <li key={receipt.id} className="py-1.5">
                    {receipt.quantity} × {lines.get(receipt.order_line_id)?.sku || lines.get(receipt.order_line_id)?.name}
                    {' · '}{receipt.condition ? CONDITION[receipt.condition] : 'Retour'}
                    {receipt.location && receipt.condition !== 'defect' && ` · ${receipt.location}`}
                    <span className="text-muted-foreground block text-xs">
                      <time dateTime={receipt.created_at}>{WHEN.format(new Date(receipt.created_at))}</time>
                      {receipt.refund_id && ' · bij terugbetaling #' + (panel.refunds.find((r) => r.id === receipt.refund_id)?.woo_refund_id ?? '?')}
                      {receipt.note && ` · ${receipt.note}`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReceiveForm({ line, scan, locations, refunds, onDone, onCancel }: {
  line: ReturnLineStatus; scan: string; locations: Location[]; refunds: Panel['refunds'];
  onDone: (message: string) => void; onCancel: () => void;
}) {
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [condition, setCondition] = useState<ReturnCondition>('new');
  const expected = Math.max(1, Math.min(line.open, line.refunded - line.returned || 1));
  const shelves = locations.filter((location) => !location.quarantine);
  const quarantine = locations.filter((location) => location.quarantine);

  return (
    <form className="mx-6 grid gap-3 rounded-lg border p-4" onSubmit={async (event) => {
      event.preventDefault();
      if (busy) return;
      const form = new FormData(event.currentTarget);
      const body = {
        line: line.id, quantity: Number(form.get('quantity')), condition,
        location: condition === 'defect' ? null : String(form.get('location') || '') || null,
        refund: String(form.get('refund') || '') || null, scan: scan || null, note: String(form.get('note') || '').trim() || null,
      };
      // Same input → same key, so a retry after a network error never books twice.
      const fingerprint = JSON.stringify(body);
      if (retry.current?.fingerprint !== fingerprint) retry.current = { fingerprint, key: crypto.randomUUID() };
      setBusy(true); setError('');
      const result = await post({ action: 'receive', ...body, key: retry.current.key });
      setBusy(false);
      if (result.error) { setError(result.error); return; }
      retry.current = null;
      onDone(condition === 'defect' ? `${body.quantity} × ${line.sku || line.name} retour geboekt en afgeschreven.` : `${body.quantity} × ${line.sku || line.name} retour op voorraad geboekt.`);
    }}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-medium">Retour ontvangen · {line.sku || line.name}</span>
        <span className="text-muted-foreground text-sm">{line.open} nog retour mogelijk{scan && ` · gescand: ${scan}`}</span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">
          Aantal
          <input className="border-input h-9 w-20 rounded-md border bg-transparent px-2" name="quantity" type="number" min={1} max={line.open} defaultValue={expected} required disabled={busy} />
        </label>
        <fieldset className="grid gap-1 text-sm">
          <legend className="mb-1">Staat</legend>
          <div className="flex flex-wrap gap-3">
            {(['new', 'opened', 'defect'] as const).map((value) => (
              <label key={value} className="flex items-center gap-1.5">
                <input type="radio" name="condition" value={value} checked={condition === value} onChange={() => setCondition(value)} disabled={busy} />
                {{ new: 'Nieuw', opened: 'Geopend', defect: 'Defect' }[value]}
              </label>
            ))}
          </div>
        </fieldset>
        {condition !== 'defect' ? (
          <label className="grid gap-1 text-sm">
            Locatie
            <select className="border-input bg-background h-9 rounded-md border px-2" name="location" defaultValue="" required disabled={busy}>
              <option value="" disabled>Kies een locatie</option>
              {shelves.map((location) => <option key={location.id} value={location.id}>{location.shelf} / {location.box}</option>)}
              {quarantine.map((location) => <option key={location.id} value={location.id}>{location.shelf} / {location.box} (niet verkoopbaar)</option>)}
            </select>
          </label>
        ) : <p className="text-muted-foreground max-w-xs text-xs">Defect gaat naar quarantaine en wordt meteen afgeschreven. Het telt als retour, niet als voorraad.</p>}
        {refunds.length > 0 && (
          <label className="grid gap-1 text-sm">
            Bij terugbetaling
            <select className="border-input bg-background h-9 rounded-md border px-2" name="refund" defaultValue={refunds[refunds.length - 1].id} disabled={busy}>
              <option value="">Geen</option>
              {refunds.map((refund) => <option key={refund.id} value={refund.id}>#{refund.woo_refund_id}</option>)}
            </select>
          </label>
        )}
        <label className="grid min-w-48 flex-1 gap-1 text-sm">
          Notitie
          <input className="border-input h-9 rounded-md border bg-transparent px-2" name="note" maxLength={300} disabled={busy} />
        </label>
      </div>
      {condition === 'opened' && <p className="text-muted-foreground text-xs">Geopend: kies een aparte bak, of quarantaine als het niet als nieuw verkocht mag worden.</p>}
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={busy || (condition !== 'defect' && !locations.length)}>{busy ? 'Bezig…' : 'Retour boeken'}</Button>
        <Button size="sm" type="button" variant="ghost" onClick={onCancel} disabled={busy}>Annuleren</Button>
        {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      </div>
    </form>
  );
}
