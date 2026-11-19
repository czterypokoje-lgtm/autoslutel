'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PurchaseOrder } from '@/lib/kfcInventory';

const api = '/api/admin/inkoop';
const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const DAY = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' });
const STATUS: Record<PurchaseOrder['status'], [string, 'default' | 'secondary' | 'outline' | 'destructive']> = {
  draft: ['Concept', 'outline'], ordered: ['Besteld', 'default'], received: ['Ontvangen', 'secondary'], cancelled: ['Geannuleerd', 'destructive'],
};
type CatalogItem = { id: string; name: string; sku: string };
type DraftLine = { article: string; label: string; quantity: string; cost: string };

async function post(body: unknown): Promise<string | null> {
  const response = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  if (response?.ok) return null;
  return (await response?.json().catch(() => null))?.error ?? 'Opslaan mislukt.';
}

export default function Inkoop({ orders, canEdit }: { orders: PurchaseOrder[]; canEdit: boolean }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function run(key: string, body: unknown) {
    setBusy(key); setError('');
    const problem = await post(body);
    setBusy('');
    if (problem) { setError(problem); return; }
    router.refresh();
  }

  const open = orders.filter((o) => o.status === 'draft' || o.status === 'ordered');
  const closed = orders.filter((o) => o.status === 'received' || o.status === 'cancelled');

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-destructive text-sm">{error}</p>}
      {canEdit && <NewOrder onSaved={() => router.refresh()} />}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Open <span className="text-muted-foreground font-normal">· {open.length}</span></h2>
        {open.length === 0
          ? <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">Niets besteld. Het bestelvoorstel onder Voorraad opent hier een concept.</p>
          : open.map((order) => <Order key={order.id} order={order} canEdit={canEdit} busy={busy} run={run} />)}
      </section>
      {closed.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Afgehandeld <span className="text-muted-foreground font-normal">· {closed.length}</span></h2>
          {closed.slice(0, 20).map((order) => <Order key={order.id} order={order} canEdit={false} busy={busy} run={run} />)}
        </section>
      )}
    </div>
  );
}

function Order({ order, canEdit, busy, run }: { order: PurchaseOrder; canEdit: boolean; busy: string; run: (key: string, body: unknown) => Promise<void> }) {
  const [label, variant] = STATUS[order.status];
  const [receiving, setReceiving] = useState<Record<string, { quantity: string; shelf: string; box: string }>>({});
  const field = (line: string, key: 'quantity' | 'shelf' | 'box', value: string) =>
    setReceiving((all) => ({ ...all, [line]: { ...(all[line] ?? { quantity: '', shelf: '', box: '' }), [key]: value } }));
  const showCost = order.lines.some((l) => l.unit_cost_cents !== null);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3">
        <CardTitle className="text-base">{order.supplier}</CardTitle>
        <Badge variant={variant}>{label}</Badge>
        <CardDescription>
          {order.status === 'ordered' && order.expected_on ? `verwacht ${DAY.format(new Date(order.expected_on))}` : `aangemaakt ${DAY.format(new Date(order.created_at))}`}
          {order.note && ` · ${order.note}`}
        </CardDescription>
        {canEdit && order.status === 'draft' && (
          <div className="ml-auto flex gap-2">
            <Button size="sm" disabled={busy === order.id} onClick={() => run(order.id, { action: 'status', id: order.id, status: 'ordered' })}>Markeer als besteld</Button>
            <Button size="sm" variant="outline" disabled={busy === order.id} onClick={() => run(order.id, { action: 'status', id: order.id, status: 'cancelled' })}>Annuleer</Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artikel</TableHead><TableHead>SKU</TableHead>
              <TableHead className="text-right">Besteld</TableHead><TableHead className="text-right">Ontvangen</TableHead><TableHead className="text-right">Open</TableHead>
              {showCost && <TableHead className="text-right">Inkoopprijs</TableHead>}
              {order.status === 'ordered' && <TableHead>Ontvangst boeken</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => {
              const openQty = line.quantity - line.received;
              const draft = receiving[line.id] ?? { quantity: '', shelf: '', box: '' };
              const key = `${order.id}/${line.id}`;
              return (
                <TableRow key={line.id}>
                  <TableCell className="max-w-72 truncate font-medium">{line.name}</TableCell>
                  <TableCell>{line.sku}</TableCell>
                  <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{line.received}</TableCell>
                  <TableCell className="text-right tabular-nums">{openQty}</TableCell>
                  {showCost && <TableCell className="text-right tabular-nums">{line.unit_cost_cents === null ? '—' : MONEY.format(line.unit_cost_cents / 100)}</TableCell>}
                  {order.status === 'ordered' && (
                    <TableCell>
                      {openQty > 0 ? (
                        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault();
                          run(key, { action: 'receive', line: line.id, quantity: Number(draft.quantity || openQty), shelf: draft.shelf, box: draft.box, key: crypto.randomUUID() }); }}>
                          <Input className="w-20" type="number" min={1} max={openQty} placeholder={String(openQty)} value={draft.quantity} onChange={(e) => field(line.id, 'quantity', e.target.value)} />
                          <Input className="w-28" placeholder="Stelling" required value={draft.shelf} onChange={(e) => field(line.id, 'shelf', e.target.value.toUpperCase())} />
                          <Input className="w-24" placeholder="Bak" required value={draft.box} onChange={(e) => field(line.id, 'box', e.target.value.toUpperCase())} />
                          <Button size="sm" disabled={busy === key}>Ontvangen</Button>
                        </form>
                      ) : <span className="text-muted-foreground text-sm">compleet</span>}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function NewOrder({ onSaved }: { onSaved: () => void }) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [supplier, setSupplier] = useState('');
  const [expected, setExpected] = useState('');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/voorraad-local?catalog=1').then((r) => (r.ok ? r.json() : [])).then((items: CatalogItem[]) => setCatalog(items.map(({ id, name, sku }) => ({ id, name, sku })))).catch(() => undefined);
  }, []);
  const matches = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (q.length < 2) return [];
    return catalog.filter((item) => item.sku.toUpperCase().includes(q) || item.name.toUpperCase().includes(q)).slice(0, 8);
  }, [catalog, search]);

  const add = (item: CatalogItem) => {
    if (!lines.some((line) => line.article === item.id)) setLines([...lines, { article: item.id, label: `${item.sku} · ${item.name}`, quantity: '10', cost: '' }]);
    setSearch('');
  };
  const edit = (index: number, key: 'quantity' | 'cost', value: string) => setLines(lines.map((line, i) => (i === index ? { ...line, [key]: value } : line)));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    const problem = await post({
      action: 'create', supplier, expected_on: expected || null, note,
      lines: lines.map((line) => ({ article: line.article, quantity: Number(line.quantity), unit_cost_cents: line.cost === '' ? null : Math.round(Number(line.cost.replace(',', '.')) * 100) })),
    });
    setBusy(false);
    if (problem) { setError(problem); return; }
    setSupplier(''); setExpected(''); setNote(''); setLines([]);
    onSaved();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nieuwe inkooporder</CardTitle>
        <CardDescription>Een concept; bestellen en ontvangen gebeurt per order hieronder.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="grid gap-1.5"><Label htmlFor="po-supplier">Leverancier</Label><Input id="po-supplier" required value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="bijv. KeyDIY Europe" /></div>
            <div className="grid gap-1.5"><Label htmlFor="po-expected">Verwacht op</Label><Input id="po-expected" type="date" value={expected} onChange={(e) => setExpected(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="po-note">Notitie</Label><Input id="po-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="optioneel" /></div>
          <div className="relative grid gap-1.5">
            <Label htmlFor="po-search">Artikel toevoegen</Label>
            <Input id="po-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="SKU of naam, minimaal 2 tekens" autoComplete="off" />
            {matches.length > 0 && (
              <div className="bg-popover text-popover-foreground absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-auto rounded-md border shadow-md">
                {matches.map((item) => (
                  <button type="button" key={item.id} onClick={() => add(item)} className="hover:bg-accent block w-full px-3 py-2 text-left text-sm">
                    <span className="font-medium">{item.sku}</span> <span className="text-muted-foreground">· {item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {lines.length > 0 && (
            <Table>
              <TableHeader><TableRow><TableHead>Artikel</TableHead><TableHead className="w-28 text-right">Aantal</TableHead><TableHead className="w-40 text-right">Inkoopprijs € (optioneel)</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={line.article}>
                    <TableCell className="max-w-96 truncate">{line.label}</TableCell>
                    <TableCell className="text-right"><Input className="ml-auto w-24" type="number" min={1} required value={line.quantity} onChange={(e) => edit(index, 'quantity', e.target.value)} /></TableCell>
                    <TableCell className="text-right"><Input className="ml-auto w-28" inputMode="decimal" value={line.cost} onChange={(e) => edit(index, 'cost', e.target.value)} placeholder="—" /></TableCell>
                    <TableCell><Button type="button" variant="ghost" size="icon" aria-label="Regel verwijderen" onClick={() => setLines(lines.filter((_, i) => i !== index))}><Trash2 className="size-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div><Button disabled={busy || lines.length === 0}>Concept opslaan</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
