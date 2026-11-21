'use client';

import { PreviewProductName, PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PurchaseOrder } from '@/lib/kfcInventory';
import Link from 'next/link';
import { SupplierDialog } from '@/app/admin/leveranciers/shared';

const api = '/api/admin/inkoop';
const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const STATUS: Record<PurchaseOrder['status'], [string, 'default' | 'secondary' | 'outline' | 'destructive']> = {
  draft: ['Concept', 'outline'], ordered: ['Besteld', 'default'], received: ['Ontvangen', 'secondary'], cancelled: ['Geannuleerd', 'destructive'],
};
type CatalogItem = { tracking?: string; cost?: string; id: string; name: string; sku: string };
type DraftLine = { article: string; label: string; quantity: string; cost: string };
type SupplierOption = { id: string; name: string; terms_days: number; lead_time_days: number | null; active: boolean; city: string | null };
type SupplierPrice = { price_cents: number | null; supplier_sku: string | null; min_qty: number };
const centsToInput = (cents: number) => String(cents / 100).replace('.', ',');

async function post(body: unknown): Promise<string | null> {
  const response = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  if (response?.ok) return null;
  return (await response?.json().catch(() => null))?.error ?? 'Opslaan mislukt.';
}

export default function Inkoop({ orders, canEdit, initialSupplier = '' }: { orders: PurchaseOrder[]; canEdit: boolean; initialSupplier?: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function run(key: string, body: unknown) {
    setBusy(key); setError('');
    const problem = await post(body);
    setBusy('');
    if (problem) { setError(problem); return false; }
    router.refresh();
    return true;
  }

  const open = orders.filter((o) => o.status === 'draft' || o.status === 'ordered');
  const closed = orders.filter((o) => o.status === 'received' || o.status === 'cancelled');

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-destructive text-sm"><PreviewText>{error}</PreviewText></p>}
      {canEdit && <NewOrder initialSupplier={initialSupplier} onSaved={() => router.refresh()} />}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Open <span className="text-muted-foreground font-normal">· {open.length}</span></h2>
        {open.length === 0
          ? <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm"><PreviewText>{"Niets besteld. Het bestelvoorstel onder Voorraad opent hier een concept."}</PreviewText></p>
          : open.map((order) => <Order key={order.id} order={order} canEdit={canEdit} office={canEdit} busy={busy} run={run} />)}
      </section>
      {closed.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold"><PreviewText>{"Afgehandeld"}</PreviewText> <span className="text-muted-foreground font-normal">· {closed.length}</span></h2>
          {closed.slice(0, 20).map((order) => <Order key={order.id} order={order} canEdit={false} office={canEdit} busy={busy} run={run} />)}
        </section>
      )}
    </div>
  );
}

/** Base64 without a data: prefix, in chunks so a 10 MB PDF does not overflow the call stack. */
async function toBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/**
 * Supplier invoice number and the invoice/receipt itself (0111). Editable on every
 * order, closed ones too: the paperwork often arrives after the goods.
 */
function InvoiceBox({ order, office, busy, run }: { order: PurchaseOrder; office: boolean; busy: string; run: (key: string, body: unknown) => Promise<boolean> }) {
  const { t } = usePreviewLanguage();
  const [ref, setRef] = useState(order.invoice_ref ?? '');
  const [problem, setProblem] = useState('');
  if (!office) return order.invoice_ref ? <p className="text-muted-foreground w-full text-sm">{t('Factuurnr.')} {order.invoice_ref}</p> : null;

  async function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setProblem(t('Bestand is groter dan 10 MB.')); return; }
    setProblem('');
    await run(`${order.id}/doc`, { action: 'document', id: order.id, type: file.type, data: await toBase64(file) });
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-3 text-sm">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(`${order.id}/ref`, { action: 'invoice_ref', id: order.id, invoice_ref: ref }); }}>
        <Input className="w-56" maxLength={80} value={ref} onChange={(e) => setRef(e.target.value)} placeholder={t('Factuurnummer leverancier')} aria-label={t('Factuurnummer leverancier')} />
        <Button size="sm" variant="outline" disabled={busy === `${order.id}/ref` || ref === (order.invoice_ref ?? '')}>{t('Opslaan')}</Button>
      </form>
      <a href={'/admin/uitgaven/nieuw?inkoop='+order.id} className="underline">{t('Niet-voorraadkosten registreren')}</a>
      {order.supplier_id && order.status !== 'draft' && order.status !== 'cancelled' && <Link href={`/admin/leveranciers/${order.supplier_id}?po=${order.id}`} className="underline underline-offset-4">{t('Inkoopfactuur boeken (crediteur)')}</Link>}
      {order.document_type && <a className="underline underline-offset-4" href={`${api}?document=${order.id}`} target="_blank" rel="noreferrer">{t('Factuur bekijken')}</a>}
      <label className={`cursor-pointer underline underline-offset-4 ${busy === `${order.id}/doc` ? 'pointer-events-none opacity-50' : ''}`}>
        {order.document_type ? t('Vervangen') : t('Factuur of bon toevoegen')}
        <input type="file" className="sr-only" accept="application/pdf,image/jpeg,image/png" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
      {problem && <span className="text-destructive">{problem}</span>}
    </div>
  );
}

function Order({ order, canEdit, office, busy, run }: { order: PurchaseOrder; canEdit: boolean; office: boolean; busy: string; run: (key: string, body: unknown) => Promise<boolean> }) {
  const { english, t } = usePreviewLanguage();
  const day = new Intl.DateTimeFormat(english ? 'en-GB' : 'nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Amsterdam' });
  const [label, variant] = STATUS[order.status];
  const [receiving, setReceiving] = useState<Record<string, { quantity: string; shelf: string; box: string }>>({});
  const field = (line: string, key: 'quantity' | 'shelf' | 'box', value: string) =>
    setReceiving((all) => ({ ...all, [line]: { ...(all[line] ?? { quantity: '', shelf: '', box: '' }), [key]: value } }));
  const receiptKeys = useRef(new Map<string,{fingerprint:string;id:string}>());
  const [photoError,setPhotoError] = useState('');
  const showCost = order.lines.some((l) => l.unit_cost_cents !== null);

  return (
    <Card id={'purchase-'+order.id}>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3">
        <CardTitle className="text-base">{office && order.supplier_id ? <Link className="underline-offset-4 hover:underline" href={`/admin/leveranciers/${order.supplier_id}`}>{order.supplier}</Link> : order.supplier}</CardTitle>
        <Badge variant={variant}>{t(label)}</Badge>
        <CardDescription>
          {order.status === 'ordered' && order.expected_on ? `${english ? "expected" : "verwacht"} ${day.format(new Date(order.expected_on))}` : `${english ? "created" : "aangemaakt"} ${day.format(new Date(order.created_at))}`}
          {order.note && ` · ${order.note}`}
        </CardDescription>
        {canEdit && order.status === 'draft' && (
          <div className="ml-auto flex gap-2">
            <Button size="sm" disabled={busy === order.id} onClick={() => run(order.id, { action: 'status', id: order.id, status: 'ordered' })}><PreviewText>{"Markeer als besteld"}</PreviewText></Button>
            <Button size="sm" variant="outline" disabled={busy === order.id} onClick={() => run(order.id, { action: 'status', id: order.id, status: 'cancelled' })}><PreviewText>{"Annuleer"}</PreviewText></Button>
          </div>
        )}
        <InvoiceBox order={order} office={office} busy={busy} run={run} />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><PreviewText>{"Artikel"}</PreviewText></TableHead><TableHead>SKU</TableHead>
              <TableHead className="text-right"><PreviewText>{"Besteld"}</PreviewText></TableHead><TableHead className="text-right"><PreviewText>{"Ontvangen"}</PreviewText></TableHead><TableHead className="text-right">Open</TableHead>
              {showCost && <TableHead className="text-right"><PreviewText>{"Inkoopprijs"}</PreviewText></TableHead>}
              {order.status === 'ordered' && <TableHead><PreviewText>{"Ontvangst boeken"}</PreviewText></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => {
              const openQty = line.quantity - line.received;
              const draft = receiving[line.id] ?? { quantity: '', shelf: '', box: '' };
              const key = `${order.id}/${line.id}`;
              return (
                <TableRow key={line.id}>
                  <TableCell className="max-w-72 truncate font-medium"><PreviewProductName sku={line.sku}>{line.name}</PreviewProductName>{line.photos.map((id,index) => <a key={id} className="block underline" href={api+'?receiptPhoto='+id} target="_blank" rel="noreferrer">{t('Productfoto')} {index+1}</a>)}</TableCell>
                  <TableCell>{line.sku}</TableCell>
                  <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{line.received}</TableCell>
                  <TableCell className="text-right tabular-nums">{openQty}</TableCell>
                  {showCost && <TableCell className="text-right tabular-nums">{line.unit_cost_cents === null ? '—' : MONEY.format(line.unit_cost_cents / 100)}</TableCell>}
                  {order.status === 'ordered' && (
                    <TableCell>
                      {openQty > 0 ? (
                        <form className="flex flex-wrap gap-2" onSubmit={async (e) => {
                          e.preventDefault();
                          const form = e.currentTarget;
                          const values = new FormData(form);
                          const file = values.get('photo');
                          if (file instanceof File && file.size > 2097152) { setPhotoError(t('Maximaal 2 MB')); return; }
                          try {
                            const image = file instanceof File && file.size ? await toBase64(file) : null;
                            const payload = { action:'receive', line:line.id, quantity:Number(draft.quantity), shelf:draft.shelf, box:draft.box, scan:String(values.get('scan') || '').trim(), photo:image, mime:image && file instanceof File ? file.type : null };
                            const fingerprint = JSON.stringify([line.received,payload]);
                            let receipt = receiptKeys.current.get(line.id);
                            if (receipt?.fingerprint !== fingerprint) {
                              receipt = { fingerprint, id:crypto.randomUUID() };
                              receiptKeys.current.set(line.id,receipt);
                            }
                            setPhotoError('');
                            if (await run(key,{...payload,key:receipt.id})) {
                              form.reset();
                              field(line.id,'quantity','');
                            }
                          } catch { setPhotoError(t('Foto lezen mislukt.')); }
                        }}>
                          <Input className="w-36" name="scan" maxLength={80} placeholder={t("Barcode / artikelcode")} aria-label={t("Barcode / artikelcode")} />
                          <label className="text-xs">{t('Productfoto')} <input type="file" name="photo" accept="image/jpeg,image/png" /></label>
                          {photoError && <span role="alert">{photoError}</span>}
                          <Input className="w-20" type="number" required min={1} max={openQty} placeholder={String(openQty)} value={draft.quantity} onChange={(e) => field(line.id, 'quantity', e.target.value)} />
                          <Input className="w-28" placeholder={t("Stelling")} required value={draft.shelf} onChange={(e) => field(line.id, 'shelf', e.target.value.toUpperCase())} />
                          <Input className="w-24" placeholder={t("Bak")} required value={draft.box} onChange={(e) => field(line.id, 'box', e.target.value.toUpperCase())} />
                          <Button size="sm" disabled={busy === key}><PreviewText>{"Ontvangen"}</PreviewText></Button>
                        </form>
                      ) : <span className="text-muted-foreground text-sm"><PreviewText>{"compleet"}</PreviewText></span>}
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

/** Active suppliers for the picker; reloaded after a new supplier is made from the form. */
function useSuppliers() {
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [failed, setFailed] = useState(false);
  const load = () => fetch('/api/admin/leveranciers').then((r) => (r.ok ? r.json() : Promise.reject())).then((body: { suppliers: SupplierOption[] }) => { setSuppliers(body.suppliers); setFailed(false); }).catch(() => setFailed(true));
  useEffect(() => { void load(); }, []);
  return { suppliers, failed, reload: load };
}

function NewOrder({ onSaved, initialSupplier }: { onSaved: () => void; initialSupplier: string }) {
  const { t } = usePreviewLanguage();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  // The supplier is an account (0130), not free text: picked from the list, or made on the spot.
  const { suppliers, failed: suppliersFailed, reload: reloadSuppliers } = useSuppliers();
  const [supplierId, setSupplierId] = useState(initialSupplier);
  const [prices, setPrices] = useState<{ supplier: string; map: Record<string, SupplierPrice> }>({ supplier: '', map: {} });
  const [expected, setExpected] = useState('');
  const [note, setNote] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/voorraad-local?catalog=1').then((r) => (r.ok ? r.json() : [])).then((items: CatalogItem[]) => setCatalog(items.map(({ id, name, sku }) => ({ id, name, sku })))).catch(() => undefined);
  }, []);
  const scanRequest = useRef(0);
  const [scanMatches, setScanMatches] = useState<CatalogItem[]>([]);
  const suggestions = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (q.length < 2) return [];
    return catalog.filter((item) => item.sku.toUpperCase().includes(q) || item.name.toUpperCase().includes(q)).slice(0, 8);
  }, [catalog, search]);

  const matches = scanMatches.length ? scanMatches : suggestions;
  // Picking a supplier loads its agreed prices; lines without a typed price take them.
  useEffect(() => {
    if (!supplierId) return;
    let current = true;
    fetch('/api/admin/leveranciers?prices=' + supplierId).then((r) => (r.ok ? r.json() : { prices: {} })).then((body: { prices: Record<string, SupplierPrice> }) => {
      if (!current) return;
      setPrices({ supplier: supplierId, map: body.prices });
      setLines((current) => current.map((line) => line.cost === '' && body.prices[line.article]?.price_cents != null ? { ...line, cost: centsToInput(body.prices[line.article].price_cents!) } : line));
    }).catch(() => undefined);
    return () => { current = false; };
  }, [supplierId]);
  const add = (item: CatalogItem) => {
    setScanMatches([]);
    scanRequest.current++;
    const agreed = prices.supplier === supplierId ? prices.map[item.id] : undefined;
    const quantity = item.tracking === 'serial' ? 1 : Math.max(10, agreed?.min_qty ?? 1);
    const label = `${item.id} · ${item.name}${agreed?.supplier_sku ? ` · ${t('lev.')} ${agreed.supplier_sku}` : ''}`;
    const cost = agreed?.price_cents != null ? centsToInput(agreed.price_cents) : item.cost ?? '';
    setLines(current => current.some(line => line.article === item.id) ? current : [...current, { article: item.id, label, quantity: String(quantity), cost }]);
    setSearch('');
    document.getElementById('po-search')?.focus();
  };

  // S2: a scanner types the code and presses Enter. One catalogue hit → add it; none → ask the
  // database (cards opened since the catalogue was built, and EANs); still nothing → quick card.
  const [quick, setQuick] = useState<{ name: string; sku: string; ean: string; ref: string } | null>(null);
  async function lookup(value: string) {
    const request = ++scanRequest.current;
    const scan = value.trim();
    if (!scan) return;
    setError('');
    const response = await fetch(api + '?scan=' + encodeURIComponent(scan)).catch(() => null);
    if (request !== scanRequest.current) return;
    if (!response || (!response.ok && response.status !== 404)) {
      setError('Artikelen zoeken mislukt.'); return;
    }
    const result = response.ok ? await response.json() : null;
    if (request !== scanRequest.current) return;
    if (result?.articles?.length) { setScanMatches(result.articles); return; }
    if (result?.article) add(result.article);

    else setQuick(/^\d{8,14}$/.test(scan) ? { name: '', sku: '', ean: scan, ref: scan } : { name: '', sku: '', ean: '', ref: scan });
  }
  const edit = (index: number, key: 'quantity' | 'cost', value: string) => setLines(lines.map((line, i) => (i === index ? { ...line, [key]: value } : line)));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    const problem = await post({
      action: 'create', supplier_id: supplierId, supplier: suppliers.find((s) => s.id === supplierId)?.name ?? '', expected_on: expected || null, note, invoice_ref: invoiceRef,
      lines: lines.map((line) => ({ article: line.article, quantity: Number(line.quantity), unit_cost_cents: line.cost === '' ? null : Math.round(Number(line.cost.replace(',', '.')) * 100) })),
    });
    setBusy(false);
    if (problem) { setError(problem); return; }
    setSupplierId(''); setExpected(''); setNote(''); setInvoiceRef(''); setLines([]);
    onSaved();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle><PreviewText>{"Nieuwe inkooporder"}</PreviewText></CardTitle>
        <CardDescription><PreviewText>{"Een concept; bestellen en ontvangen gebeurt per order hieronder."}</PreviewText></CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="grid gap-1.5">
              <Label htmlFor="po-supplier"><PreviewText>{"Leverancier"}</PreviewText></Label>
              <div className="flex gap-2">
                <select id="po-supplier" required value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="border-input bg-background h-9 min-w-0 flex-1 rounded-md border px-3 text-sm">
                  <option value="">{t('Kies een leverancier…')}</option>
                  {suppliers.filter((s) => s.active || s.id === supplierId).map((s) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` · ${s.city}` : ''}</option>)}
                </select>
                <SupplierDialog onSaved={(id) => { void reloadSuppliers().then(() => setSupplierId(id)); }} trigger={<Button type="button" variant="outline" size="sm">{t('Nieuw')}</Button>} />
              </div>
              {suppliersFailed && <span className="text-destructive text-xs">{t('Leveranciers laden mislukt.')}</span>}
              {supplierId && <Link className="text-muted-foreground text-xs underline underline-offset-4" href={`/admin/leveranciers/${supplierId}`}>{t('Leverancierskaart')}{(() => { const s = suppliers.find((x) => x.id === supplierId); return s ? ` · ${s.terms_days} ${t('dagen')}${s.lead_time_days != null ? ` · ${t('levertijd')} ${s.lead_time_days} ${t('dagen')}` : ''}` : ''; })()}</Link>}
            </div>
            <div className="grid gap-1.5"><Label htmlFor="po-expected"><PreviewText>{"Verwacht op"}</PreviewText></Label><Input id="po-expected" type="date" value={expected} onChange={(e) => setExpected(e.target.value)} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="po-note"><PreviewText>{"Notitie"}</PreviewText></Label><Input id="po-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("optioneel")} /></div>
            <div className="grid gap-1.5"><Label htmlFor="po-invoice"><PreviewText>{"Factuurnummer leverancier"}</PreviewText></Label><Input id="po-invoice" maxLength={80} value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder={t("optioneel")} /></div>
          </div>
          <div className="relative grid gap-1.5">
            <Label htmlFor="po-search"><PreviewText>{"Artikel toevoegen"}</PreviewText></Label>
            <Input id="po-search" value={search} onChange={(e) => { scanRequest.current++; setScanMatches([]); setSearch(e.target.value); }} placeholder={t("Barcode, SKU of leveranciersreferentie")} autoComplete="off"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void lookup(search); } }} />
            {search.trim().length >= 2 && matches.length === 0 && (
              <button type="button" className="text-left text-sm underline underline-offset-4" onClick={() => void lookup(search)}>
                <PreviewText>{"Niet in de lijst? Zoek op barcode of maak een nieuw artikel"}</PreviewText>
              </button>
            )}
            {matches.length > 0 && (
              <div className="bg-popover text-popover-foreground absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-auto rounded-md border shadow-md">
                {matches.map((item) => (
                  <button type="button" key={item.id} onClick={() => add(item)} className="hover:bg-accent block w-full px-3 py-2 text-left text-sm">
                    <span className="font-medium">{item.sku} · {item.id}</span> <span className="text-muted-foreground">· <PreviewProductName sku={item.sku}>{item.name}</PreviewProductName></span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {lines.length > 0 && (
            <Table>
              <TableHeader><TableRow><TableHead><PreviewText>{"Artikel"}</PreviewText></TableHead><TableHead className="w-28 text-right"><PreviewText>{"Aantal"}</PreviewText></TableHead><TableHead className="w-40 text-right"><PreviewText>{"Inkoopprijs € (optioneel)"}</PreviewText></TableHead><TableHead className="w-12" /></TableRow></TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={line.article}>
                    <TableCell className="max-w-96 truncate">{line.label}</TableCell>
                    <TableCell className="text-right"><Input className="ml-auto w-24" type="number" min={1} required value={line.quantity} onChange={(e) => edit(index, 'quantity', e.target.value)} /></TableCell>
                    <TableCell className="text-right"><Input className="ml-auto w-28" inputMode="decimal" value={line.cost} onChange={(e) => edit(index, 'cost', e.target.value)} placeholder="—" /></TableCell>
                    <TableCell><Button type="button" variant="ghost" size="icon" aria-label={t("Regel verwijderen")} onClick={() => setLines(lines.filter((_, i) => i !== index))}><Trash2 className="size-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {error && <p className="text-destructive text-sm"><PreviewText>{error}</PreviewText></p>}
          <div><Button disabled={busy || lines.length === 0 || !supplierId}><PreviewText>{"Concept opslaan"}</PreviewText></Button></div>
        </form>
      </CardContent>
      <QuickArticle draft={quick} onClose={() => setQuick(null)} onCreated={(item) => { setQuick(null); add(item); }} />
    </Card>
  );
}

/**
 * Minimum card for an unknown scan (spec S2). Saving adds the article to the order
 * being drafted and puts the cursor back in the search, so receiving can go on.
 * The server returns the existing card when the SKU or EAN already exists.
 */
function QuickArticle({ draft, onClose, onCreated }: { draft: { name: string; sku: string; ean: string; ref: string } | null; onClose: () => void; onCreated: (item: CatalogItem) => void }) {
  const { t } = usePreviewLanguage();
  const [form, setForm] = useState({ name: '', sku: '', ean: '', ref: '', condition: 'new', category: 'Werkplaats', tracking: 'quantity', cost: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [opened, setOpened] = useState<typeof draft>(null);
  if (draft !== opened) { setOpened(draft); if (draft) { setForm({ ...draft, condition: 'new', category: 'Werkplaats', tracking: 'quantity', cost: '' }); setError(''); } }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    const response = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'article', ...form, cost: form.cost === '' ? null : Math.round(Number(form.cost) * 100) }) }).catch(() => null);
    const body = await response?.json().catch(() => null);
    setBusy(false);
    if (!response?.ok) { setError(body?.error ?? 'Opslaan mislukt.'); return; }
    onCreated({ ...body.article, cost: form.cost });
  }

  return (
    <Sheet open={draft !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle><PreviewText>{"Nieuw artikel"}</PreviewText></SheetTitle>
          <SheetDescription><PreviewText>{"Onbekende code. Vul het minimum in; het artikel komt meteen op deze inkooporder."}</PreviewText></SheetDescription>
        </SheetHeader>
        <form onSubmit={save} className="grid gap-4 px-4">
          <div className="grid gap-1.5"><Label htmlFor="qa-name"><PreviewText>{"Artikelnaam"}</PreviewText></Label><Input id="qa-name" required maxLength={180} autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label htmlFor="qa-sku">SKU</Label><Input id="qa-sku" maxLength={80} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} /></div>
          <div className="grid gap-1.5"><Label htmlFor="qa-ean">EAN</Label><Input id="qa-ean" inputMode="numeric" pattern="\d{8,14}" value={form.ean} onChange={(e) => setForm({ ...form, ean: e.target.value.trim() })} placeholder={t("optioneel")} /></div>
          <Label htmlFor="qa-ref"><PreviewText>Leveranciersreferentie</PreviewText></Label>
          <Input id="qa-ref" maxLength={80} value={form.ref} onChange={e => setForm({...form, ref:e.target.value})} />
          <Label htmlFor="qa-category"><PreviewText>Categorie</PreviewText></Label>
          <Input id="qa-category" required maxLength={80} value={form.category} onChange={e => setForm({...form, category:e.target.value})} />
          <Label htmlFor="qa-tracking"><PreviewText>Registratie</PreviewText></Label>
          <select id="qa-tracking" disabled={form.condition === 'used'} value={form.condition === 'used' ? 'serial' : form.tracking} onChange={e => setForm({...form, tracking:e.target.value})}><option value="quantity">{t('Aantal')}</option><option value="serial">{t('Serienummer')}</option></select>
          <Label htmlFor="qa-cost"><PreviewText>Inkoopprijs € (optioneel)</PreviewText></Label>
          <Input id="qa-cost" type="number" min="0" step="0.01" value={form.cost} onChange={e => setForm({...form, cost:e.target.value})} />
          <fieldset className="grid gap-1.5">
            <legend className="text-sm font-medium"><PreviewText>{"Staat"}</PreviewText></legend>
            <div className="flex flex-wrap gap-4 text-sm">
              {([['new', 'Nieuw'], ['opened', 'Geopend'], ['used', 'Tweedehands']] as const).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2">
                  <input type="radio" name="qa-condition" value={value} checked={form.condition === value} onChange={() => setForm({ ...form, condition: value })} />
                  <PreviewText>{label}</PreviewText>
                </label>
              ))}
            </div>
            {form.condition === 'used' && <p className="text-muted-foreground text-xs"><PreviewText>{"Tweedehands krijgt een eigen kaart en een eigen intern etiket, ook zonder barcode."}</PreviewText></p>}
          </fieldset>
          {error && <p className="text-destructive text-sm"><PreviewText>{error}</PreviewText></p>}
          <div className="flex gap-2">
            <Button disabled={busy}><PreviewText>{"Artikel toevoegen"}</PreviewText></Button>
            <Button type="button" variant="outline" onClick={onClose}><PreviewText>{"Annuleren"}</PreviewText></Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
