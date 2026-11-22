'use client';

import { PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AssemblyRow } from '@/lib/kfcInventory';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
type Item = { id: string; name: string; sku: string };
type Part = Item & { shelf: string; box: string; quantity: string };

/** Search the catalogue; Enter on an exact code/SKU/EAN falls back to the database (same lookup as Inkoop). */
function ArticlePicker({ id, label, catalog, onPick }: { id: string; label: string; catalog: Item[]; onPick: (item: Item) => void }) {
  const { t } = usePreviewLanguage();
  const [search, setSearch] = useState('');
  const [missing, setMissing] = useState(false);
  const matches = useMemo(() => {
    const q = search.trim().toUpperCase();
    return q.length < 2 ? [] : catalog.filter((i) => i.sku.toUpperCase().includes(q) || i.name.toUpperCase().includes(q) || i.id === q).slice(0, 8);
  }, [catalog, search]);
  const pick = (item: Item) => { onPick(item); setSearch(''); setMissing(false); };
  async function lookup() {
    if (matches.length === 1) { pick(matches[0]); return; }
    const response = await fetch(`/api/admin/inkoop?scan=${encodeURIComponent(search.trim())}`).catch(() => null);
    if (response?.ok) pick(((await response.json()) as { article: Item }).article); else setMissing(true);
  }
  return (
    <div className="relative grid gap-1.5">
      <Label htmlFor={id}><PreviewText>{label}</PreviewText></Label>
      <Input id={id} value={search} autoComplete="off" placeholder={t('SKU, naam of scan de barcode')}
        onChange={(e) => { setSearch(e.target.value); setMissing(false); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void lookup(); } }} />
      {missing && <p className="text-destructive text-xs"><PreviewText>{"Niet gevonden. Maak het artikel eerst aan (Inkoop of Artikelen)."}</PreviewText></p>}
      {matches.length > 0 && (
        <div className="bg-popover text-popover-foreground absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-auto rounded-md border shadow-md">
          {matches.map((item) => (
            <button type="button" key={item.id} onClick={() => pick(item)} className="hover:bg-accent block w-full px-3 py-2 text-left text-sm">
              <span className="font-medium">{item.sku || item.id}</span> <span className="text-muted-foreground">· {item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Montage({ initial, prices }: { initial: AssemblyRow[]; prices: boolean }) {
  const { t, english } = usePreviewLanguage();
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [output, setOutput] = useState<Item | null>(null);
  const [shelf, setShelf] = useState('');
  const [box, setBox] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [labour, setLabour] = useState('');
  const [parts, setParts] = useState<Part[]>([]);
  const [costs, setCosts] = useState<Record<string, number | null>>({});
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  // One key per filled-in form: a double click or a retry books the assembly once.
  const [key, setKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    fetch('/api/admin/voorraad-local?catalog=1').then((r) => (r.ok ? r.json() : [])).then((items: Item[]) => setCatalog(items.map(({ id, name, sku }) => ({ id, name, sku })))).catch(() => undefined);
  }, []);
  const codes = parts.map((p) => p.id).join(',');
  useEffect(() => {
    if (!prices || !codes) return;
    fetch(`/api/admin/montage?costs=${encodeURIComponent(codes)}`).then((r) => (r.ok ? r.json() : { costs: {} })).then((b) => setCosts(b.costs ?? {})).catch(() => undefined);
  }, [codes, prices]);

  const qty = Math.max(1, Number(quantity) || 1);
  const labourCents = labour === '' ? 0 : Math.round(Number(labour.replace(',', '.')) * 100);
  const unknown = parts.some((p) => costs[p.id] == null);
  const partsCents = parts.reduce((sum, p) => sum + (costs[p.id] ?? 0) * (Number(p.quantity) || 0), 0);
  const unitCents = unknown ? null : Math.round((partsCents + labourCents) / qty);
  const editPart = (i: number, field: 'shelf' | 'box' | 'quantity', value: string) => setParts(parts.map((p, n) => (n === i ? { ...p, [field]: value } : p)));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!output) { setError(t('Kies het product dat je maakt.')); return; }
    setBusy(true); setError(''); setDone('');
    const response = await fetch('/api/admin/montage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ output: output.id, shelf, box, quantity: qty, labour_cents: labourCents, key,
        components: parts.map((p) => ({ article: p.id, shelf: p.shelf, box: p.box, quantity: Number(p.quantity) })) }),
    }).catch(() => null);
    const body = await response?.json().catch(() => null);
    setBusy(false);
    if (!response?.ok) { setError(body?.error ?? 'Opslaan mislukt.'); return; }
    setRows([body.assembly as AssemblyRow, ...rows.filter((r) => r.id !== body.assembly.id)]);
    setDone(`${qty} × ${output.name}`);
    setOutput(null); setParts([]); setQuantity('1'); setLabour(''); setKey(crypto.randomUUID());
  }

  const day = new Intl.DateTimeFormat(english ? 'en-GB' : 'nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle><PreviewText>{"Nieuwe montage"}</PreviewText></CardTitle>
          <CardDescription><PreviewText>{"Ontbreekt er een onderdeel op de plank, dan wordt er niets geboekt."}</PreviewText></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_1fr]">
              {output
                ? <div className="grid gap-1.5"><Label><PreviewText>{"Product dat je maakt"}</PreviewText></Label>
                    <div className="flex items-center gap-2 text-sm"><span className="font-medium">{output.sku || output.id}</span> · {output.name}
                      <Button type="button" size="sm" variant="ghost" onClick={() => setOutput(null)}><PreviewText>{"Wijzig"}</PreviewText></Button></div></div>
                : <ArticlePicker id="mo-output" label="Product dat je maakt" catalog={catalog} onPick={setOutput} />}
              <div className="grid gap-1.5"><Label htmlFor="mo-shelf"><PreviewText>{"Stelling"}</PreviewText></Label><Input id="mo-shelf" required value={shelf} onChange={(e) => setShelf(e.target.value.toUpperCase())} placeholder="A-01" /></div>
              <div className="grid gap-1.5"><Label htmlFor="mo-box"><PreviewText>{"Bak"}</PreviewText></Label><Input id="mo-box" required value={box} onChange={(e) => setBox(e.target.value.toUpperCase())} placeholder="02" /></div>
              <div className="grid gap-1.5"><Label htmlFor="mo-qty"><PreviewText>{"Aantal"}</PreviewText></Label><Input id="mo-qty" type="number" min={1} max={1000} required value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
            </div>

            <ArticlePicker id="mo-part" label="Onderdeel toevoegen" catalog={catalog}
              onPick={(item) => { if (item.id !== output?.id && !parts.some((p) => p.id === item.id)) setParts([...parts, { ...item, shelf: '', box: '', quantity: '1' }]); }} />

            {parts.length > 0 && (
              <Table>
                <TableHeader><TableRow>
                  <TableHead><PreviewText>{"Onderdeel"}</PreviewText></TableHead><TableHead className="w-28"><PreviewText>{"Stelling"}</PreviewText></TableHead>
                  <TableHead className="w-24"><PreviewText>{"Bak"}</PreviewText></TableHead><TableHead className="w-24 text-right"><PreviewText>{"Aantal"}</PreviewText></TableHead>
                  {prices && <TableHead className="w-28 text-right"><PreviewText>{"Kostprijs"}</PreviewText></TableHead>}<TableHead className="w-12" />
                </TableRow></TableHeader>
                <TableBody>
                  {parts.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell className="max-w-72 truncate"><span className="font-medium">{p.sku || p.id}</span> · {p.name}</TableCell>
                      <TableCell><Input required value={p.shelf} onChange={(e) => editPart(i, 'shelf', e.target.value.toUpperCase())} aria-label={t('Stelling')} /></TableCell>
                      <TableCell><Input required value={p.box} onChange={(e) => editPart(i, 'box', e.target.value.toUpperCase())} aria-label={t('Bak')} /></TableCell>
                      <TableCell className="text-right"><Input className="ml-auto w-20" type="number" min={1} required value={p.quantity} onChange={(e) => editPart(i, 'quantity', e.target.value)} aria-label={t('Aantal')} /></TableCell>
                      {prices && <TableCell className="text-right tabular-nums">{costs[p.id] == null ? <span className="text-amber-700"><PreviewText>{"onbekend"}</PreviewText></span> : MONEY.format(costs[p.id]! / 100)}</TableCell>}
                      <TableCell><Button type="button" variant="ghost" size="icon" aria-label={t('Regel verwijderen')} onClick={() => setParts(parts.filter((_, n) => n !== i))}><Trash2 className="size-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {prices && (
              <div className="grid gap-4 sm:grid-cols-[1fr_2fr] sm:items-end">
                <div className="grid gap-1.5"><Label htmlFor="mo-labour"><PreviewText>{"Arbeid € (optioneel)"}</PreviewText></Label><Input id="mo-labour" inputMode="decimal" value={labour} onChange={(e) => setLabour(e.target.value)} placeholder="0,00" /></div>
                <p className="text-sm" aria-live="polite">
                  <PreviewText>{"Kostprijs per stuk"}</PreviewText>:{' '}
                  {parts.length === 0 ? '—' : unitCents === null
                    ? <span className="text-amber-700"><PreviewText>{"onbekend (een onderdeel heeft geen kostprijs)"}</PreviewText></span>
                    : <strong className="tabular-nums">{MONEY.format(unitCents / 100)}</strong>}
                </p>
              </div>
            )}

            {error && <p className="text-destructive text-sm"><PreviewText>{error}</PreviewText></p>}
            {done && <p className="text-sm text-green-700"><PreviewText>{"Gemonteerd"}</PreviewText>: {done}</p>}
            <div><Button disabled={busy || !output || parts.length === 0}><PreviewText>{"Monteren"}</PreviewText></Button></div>
          </form>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold"><PreviewText>{"Laatste montages"}</PreviewText></h2>
        {rows.length === 0
          ? <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm"><PreviewText>{"Nog geen montages."}</PreviewText></p>
          : (
            <Table>
              <TableHeader><TableRow>
                <TableHead><PreviewText>{"Wanneer"}</PreviewText></TableHead><TableHead><PreviewText>{"Product"}</PreviewText></TableHead>
                <TableHead className="text-right"><PreviewText>{"Aantal"}</PreviewText></TableHead><TableHead><PreviewText>{"Onderdelen"}</PreviewText></TableHead>
                {prices && <TableHead className="text-right"><PreviewText>{"Kostprijs per stuk"}</PreviewText></TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{day.format(new Date(r.created_at))}</TableCell>
                    <TableCell className="max-w-64 truncate">{r.output_name}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{r.components.map((c) => `${c.quantity}× ${c.article}`).join(', ')}</TableCell>
                    {prices && <TableCell className="text-right tabular-nums">{r.unit_cost_cents === null ? <PreviewText>{"onbekend"}</PreviewText> : MONEY.format(r.unit_cost_cents / 100)}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </section>
    </div>
  );
}
