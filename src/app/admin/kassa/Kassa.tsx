'use client';
import { PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Banknote, CreditCard, Minus, Plus, Printer, ScanLine, Search, Trash2, Wallet, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PayMethod, PosArticle, PosSummary, Receipt } from '@/lib/kfcPos';

const StockCamera = dynamic(() => import('../voorraad/StockCamera'));

/* ── money helpers: everything is integer cents ─────────────────────── */
const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const fmt = (cents: number) => euro.format(cents / 100);
const asInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
/** "12,50", "12.5", "€ 12", "1.250,00" → cents; empty/invalid → null. */
function parseCents(value: string): number | null {
  const clean = value.replace(/[€\s]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 && n < 1_000_000 ? Math.round(n * 100) : null;
}
const newKey = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

interface CartLine { article: PosArticle; quantity: number; unitPriceCents: number; discountCents: number; vatRate: number }
interface Customer { id: string; name: string; contact: string; vat: string; city: string }

async function api<T>(init?: RequestInit & { query?: string }): Promise<T> {
  const response = await fetch(`/api/admin/kassa${init?.query ?? ''}`, {
    ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }, cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Fout ${response.status}`);
  return body as T;
}

const METHOD_LABEL: Record<PayMethod, string> = { cash: 'Contant', pin: 'PIN', other: 'Overig' };
const EMPTY_PAY: Record<PayMethod, string> = { cash: '', pin: '', other: '' };

export default function Kassa({ initial, cashier }: { initial: PosSummary | null; cashier: string }) {
  const { t } = usePreviewLanguage();
  const [summary, setSummary] = useState<PosSummary | null>(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /* search / scan */
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PosArticle[]>([]);
  const [camera, setCamera] = useState(false);
  const [scanning, setScanning] = useState(false);

  /* cart + payment */
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saleKey, setSaleKey] = useState(newKey);
  const [payments, setPayments] = useState<Record<PayMethod, string>>(EMPTY_PAY);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  /* dialogs */
  const [done, setDone] = useState<Receipt | null>(null);
  const [closing, setClosing] = useState(false);
  const [counted, setCounted] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [zReport, setZReport] = useState<PosSummary | null>(null);
  const [floatInput, setFloatInput] = useState('100,00');

  const totalCents = useMemo(() => cart.reduce((sum, l) => sum + l.quantity * l.unitPriceCents - l.discountCents, 0), [cart]);
  const vatCents = useMemo(() => cart.reduce((sum, l) => {
    const incl = l.quantity * l.unitPriceCents - l.discountCents;
    return sum + (incl - incl / (1 + l.vatRate / 100));
  }, 0), [cart]);
  const paid = (Object.keys(payments) as PayMethod[]).reduce((sum, m) => sum + (parseCents(payments[m]) ?? 0), 0);
  const nonCash = (parseCents(payments.pin) ?? 0) + (parseCents(payments.other) ?? 0);
  const changeCents = Math.max(0, paid - totalCents);
  const canPay = !!summary && cart.length > 0 && paid >= totalCents && nonCash <= totalCents && !busy;

  const focusSearch = useCallback(() => { setTimeout(() => search.current?.focus(), 0); }, []);
  useEffect(() => { focusSearch(); }, [focusSearch]);

  /* F2 = search, F8 = exact PIN, F9 = exact cash */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'F2') { event.preventDefault(); focusSearch(); }
      if (event.key === 'F8' && totalCents > 0) { event.preventDefault(); setPayments({ ...EMPTY_PAY, pin: asInput(totalCents) }); }
      if (event.key === 'F9' && totalCents > 0) { event.preventDefault(); setPayments({ ...EMPTY_PAY, cash: asInput(totalCents) }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusSearch, totalCents]);

  function addToCart(article: PosArticle) {
    setCart((current) => {
      const index = current.findIndex((l) => l.article.code === article.code);
      if (index >= 0) {
        const next = [...current];
        next[index] = { ...next[index], quantity: next[index].quantity + 1 };
        return next;
      }
      return [...current, { article, quantity: 1, unitPriceCents: article.priceCents ?? 0, discountCents: 0, vatRate: 21 }];
    });
    setResults([]);
    setQuery('');
    focusSearch();
  }

  async function lookup(value: string) {
    const q = value.trim();
    if (!q) return;
    setError('');
    try {
      const found = await api<{ exact: boolean; articles: PosArticle[] }>({ query: `?q=${encodeURIComponent(q)}` });
      if (found.exact && found.articles.length === 1) addToCart(found.articles[0]);
      else if (!found.articles.length) setError(`${t('Geen artikel gevonden voor')} "${q}"`);
      else setResults(found.articles);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  async function scanPhoto(file: File) {
    setCamera(false);
    setScanning(true);
    try {
      const { scanPhotos } = await import('../voorraad/bulkScanPool');
      let codes: string[] = [];
      await scanPhotos([file], { onResult: (result) => { codes = [...new Set(result.codes.map((c) => c.text.trim()).filter(Boolean))]; } });
      if (codes.length === 1) await lookup(codes[0]);
      else if (codes.length > 1) setError(t('Meerdere codes op de foto; scan één etiket tegelijk.'));
      else setError(t('Geen barcode gevonden op de foto.'));
    } catch {
      setError(t('Scannen mislukt.'));
    } finally {
      setScanning(false);
    }
  }

  function updateLine(index: number, patch: Partial<CartLine>) {
    setCart((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  useEffect(() => {
    if (customerQuery.trim().length < 2) return;
    const timer = setTimeout(() => {
      api<{ customers: Customer[] }>({ query: `?klant=${encodeURIComponent(customerQuery)}` })
        .then((r) => setCustomers(r.customers)).catch(() => setCustomers([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  async function openTill() {
    const floatCents = parseCents(floatInput);
    if (floatCents === null) { setError(t('Vul een geldig startbedrag in.')); return; }
    setBusy(true);
    setError('');
    try {
      const r = await api<{ summary: PosSummary }>({ method: 'POST', body: JSON.stringify({ action: 'open', floatCents }) });
      setSummary(r.summary);
      setZReport(null);
      focusSearch();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    if (!summary || !canPay) return;
    setBusy(true);
    setError('');
    const pays = (Object.keys(payments) as PayMethod[])
      .map((method) => ({ method, tenderedCents: parseCents(payments[method]) ?? 0 }))
      .filter((p) => p.tenderedCents > 0);
    try {
      const r = await api<{ receipt: Receipt; summary: PosSummary | null }>({
        method: 'POST',
        body: JSON.stringify({
          action: 'sell', sessionId: summary.session.id, key: saleKey,
          lines: cart.map((l) => ({ article: l.article.code, quantity: l.quantity, unitPriceCents: l.unitPriceCents, discountCents: l.discountCents, vatRate: l.vatRate })),
          payments: pays, customerId: customer?.id ?? null, clientName: customer ? customer.name : customerQuery,
        }),
      });
      setDone(r.receipt);
      if (r.summary) setSummary(r.summary);
      setCart([]);
      setPayments(EMPTY_PAY);
      setCustomer(null);
      setCustomerQuery('');
      setCustomers([]);
      setSaleKey(newKey());
    } catch (cause) {
      // The key stays the same, so pressing Afrekenen again cannot sell twice.
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function closeTill() {
    if (!summary) return;
    const countedCents = parseCents(counted);
    if (countedCents === null) { setError(t('Vul het getelde bedrag in.')); return; }
    setBusy(true);
    setError('');
    try {
      const r = await api<{ zReport: PosSummary }>({ method: 'POST', body: JSON.stringify({ action: 'close', sessionId: summary.session.id, countedCents, note: closeNote }) });
      setZReport(r.zReport);
      setSummary(null);
      setClosing(false);
      setCounted('');
      setCloseNote('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  async function reprint(id: string) {
    try { setDone(await api<Receipt>({ query: `?bon=${id}` })); } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  }

  /* ── closed till ─────────────────────────────────────────────────── */
  if (!summary) {
    return (
      <div className="grid gap-4 md:max-w-md">
        <PrintStyles />
        {error && <p className="text-destructive text-sm" role="alert">{error}</p>}
        <Card>
          <CardHeader><CardTitle><PreviewText>{"Kassa openen"}</PreviewText></CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-muted-foreground text-sm"><PreviewText>{"Tel het wisselgeld in de la en vul het startbedrag in."}</PreviewText></p>
            <Label htmlFor="pos-float"><PreviewText>{"Startbedrag (wisselgeld)"}</PreviewText></Label>
            <Input id="pos-float" inputMode="decimal" value={floatInput} onChange={(e) => setFloatInput(e.target.value)} />
            <Button disabled={busy} onClick={() => void openTill()}><Wallet className="size-4" aria-hidden="true" /><PreviewText>{"Kassa openen"}</PreviewText></Button>
          </CardContent>
        </Card>
        {zReport && <ZReport report={zReport} onClose={() => setZReport(null)} />}
      </div>
    );
  }

  /* ── open till ───────────────────────────────────────────────────── */
  return (
    <div className="grid gap-4">
      <PrintStyles />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary"><PreviewText>{"Kassa open"}</PreviewText> · {new Date(summary.session.openedAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</Badge>
        <span className="text-muted-foreground">{summary.sales} <PreviewText>{"verkopen"}</PreviewText> · {fmt(summary.totalCents)} · <PreviewText>{"contant"}</PreviewText> {fmt(summary.byMethod.cash)} · PIN {fmt(summary.byMethod.pin)}</span>
        <span className="text-muted-foreground ml-auto">{cashier}</span>
        <Button size="sm" variant="outline" onClick={() => setClosing(true)}><PreviewText>{"Kassa sluiten (Z)"}</PreviewText></Button>
      </div>
      {error && <p className="text-destructive text-sm" role="alert">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* left: scan + results */}
        <div className="grid content-start gap-3">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void lookup(query); }}>
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
              <Input ref={search} className="h-11 pl-9 text-base" value={query} onChange={(e) => setQuery(e.target.value)}
                autoComplete="off" enterKeyHint="search" aria-label={t('Scan barcode of zoek artikel')}
                placeholder={t('Scan barcode of zoek artikel (F2)')} />
            </div>
            <Button type="submit" className="h-11"><PreviewText>{"Zoeken"}</PreviewText></Button>
            <Button type="button" variant="outline" className="h-11" disabled={scanning} onClick={() => setCamera(true)}>
              <ScanLine className="size-4" aria-hidden="true" /><PreviewText>{"Camera"}</PreviewText>
            </Button>
          </form>
          {camera && <StockCamera onClose={() => setCamera(false)} onPhoto={(file) => void scanPhoto(file)} />}
          {results.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((a) => (
                <button key={a.code} type="button" onClick={() => addToCart(a)}
                  className="hover:bg-muted rounded-lg border p-3 text-left transition-colors">
                  <div className="line-clamp-2 text-sm font-medium">{a.name}</div>
                  <div className="text-muted-foreground mt-1 text-xs">{a.sku || a.code}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-semibold">{a.priceCents === null ? '—' : fmt(a.priceCents)}</span>
                    <Badge variant={a.onHand > 0 ? 'secondary' : 'destructive'}>{a.onHand} <PreviewText>{"op voorraad"}</PreviewText></Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!results.length && summary.recent.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base"><PreviewText>{"Laatste bonnen"}</PreviewText></CardTitle></CardHeader>
              <CardContent className="grid gap-1 text-sm">
                {summary.recent.slice(0, 8).map((r) => (
                  <button key={r.id} type="button" onClick={() => void reprint(r.id)} className="hover:bg-muted flex justify-between rounded px-2 py-1 text-left">
                    <span>{r.number} · {new Date(r.time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} · {r.client}</span>
                    <span className="font-medium">{fmt(r.totalCents)}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* right: the receipt being built + payment */}
        <Card className="content-start">
          <CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-base">
            <span><PreviewText>{"Bon"}</PreviewText> ({cart.reduce((s, l) => s + l.quantity, 0)})</span>
            {cart.length > 0 && <Button size="sm" variant="ghost" onClick={() => { setCart([]); setPayments(EMPTY_PAY); focusSearch(); }}><PreviewText>{"Leegmaken"}</PreviewText></Button>}
          </CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {cart.length === 0 && <p className="text-muted-foreground py-6 text-center text-sm"><PreviewText>{"Scan een artikel om te beginnen."}</PreviewText></p>}
            {cart.map((line, index) => (
              <div key={line.article.code} className="grid gap-1 border-b pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{line.article.name}</div>
                    <div className="text-muted-foreground text-xs">{line.article.sku || line.article.code}
                      {line.article.onHand < line.quantity && <span className="text-destructive"> · <PreviewText>{"voorraad"}</PreviewText> {line.article.onHand}</span>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" aria-label={t('Verwijderen')} onClick={() => setCart((c) => c.filter((_, i) => i !== index))}><Trash2 className="size-4" /></Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center">
                    <Button size="icon" variant="outline" className="size-8" aria-label={t('Minder')} onClick={() => updateLine(index, { quantity: Math.max(1, line.quantity - 1) })}><Minus className="size-3" /></Button>
                    <Input className="h-8 w-12 text-center" inputMode="numeric" aria-label={t('Aantal')} value={line.quantity}
                      onChange={(e) => { const n = parseInt(e.target.value, 10); if (n >= 1 && n <= 10000) updateLine(index, { quantity: n }); }} />
                    <Button size="icon" variant="outline" className="size-8" aria-label={t('Meer')} onClick={() => updateLine(index, { quantity: line.quantity + 1 })}><Plus className="size-3" /></Button>
                  </div>
                  <Input key={`p-${line.article.code}-${line.unitPriceCents}`} className="h-8 w-24" inputMode="decimal" aria-label={t('Prijs incl. btw')} defaultValue={asInput(line.unitPriceCents)}
                    onBlur={(e) => { const c = parseCents(e.target.value); if (c !== null) updateLine(index, { unitPriceCents: c, discountCents: Math.min(line.discountCents, line.quantity * c) }); }} />
                  <Input key={`d-${line.article.code}-${line.discountCents}`} className="h-8 w-20" inputMode="decimal" aria-label={t('Korting')} placeholder={t('korting')} defaultValue={line.discountCents ? asInput(line.discountCents) : ''}
                    onBlur={(e) => { const c = parseCents(e.target.value) ?? 0; updateLine(index, { discountCents: Math.min(c, line.quantity * line.unitPriceCents) }); }} />
                  <span className="ml-auto text-sm font-semibold">{fmt(line.quantity * line.unitPriceCents - line.discountCents)}</span>
                </div>
              </div>
            ))}

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-lg font-semibold"><PreviewText>{"Totaal"}</PreviewText></span>
              <span className="text-2xl font-bold">{fmt(totalCents)}</span>
            </div>
            <div className="text-muted-foreground -mt-2 text-right text-xs"><PreviewText>{"waarvan btw"}</PreviewText> {fmt(Math.round(vatCents))}</div>

            {/* customer */}
            <div className="grid gap-1">
              <Label htmlFor="pos-customer"><PreviewText>{"Klant (optioneel)"}</PreviewText></Label>
              {customer ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{customer.name}{customer.vat && <span className="text-muted-foreground"> · {customer.vat}</span>}</span>
                  <Button size="icon" variant="ghost" className="size-6" aria-label={t('Klant weghalen')} onClick={() => setCustomer(null)}><X className="size-3" /></Button>
                </div>
              ) : (
                <>
                  <Input id="pos-customer" value={customerQuery} placeholder={t('Zakelijke klant zoeken of naam op bon')}
                    onChange={(e) => { setCustomerQuery(e.target.value); if (e.target.value.trim().length < 2) setCustomers([]); }} />
                  {customers.length > 0 && (
                    <div className="grid rounded-md border text-sm">
                      {customers.map((c) => (
                        <button key={c.id} type="button" className="hover:bg-muted px-3 py-1.5 text-left" onClick={() => { setCustomer(c); setCustomers([]); }}>
                          {c.name}<span className="text-muted-foreground"> {c.contact && `· ${c.contact}`} {c.city && `· ${c.city}`}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* payment */}
            <div className="grid gap-2">
              {(['cash', 'pin', 'other'] as PayMethod[]).map((method) => (
                <div key={method} className="flex items-center gap-2">
                  <Button type="button" variant="outline" className="w-28 justify-start"
                    onClick={() => setPayments((p) => ({ ...p, [method]: asInput(Math.max(0, totalCents - (paid - (parseCents(p[method]) ?? 0)))) }))}>
                    {method === 'cash' ? <Banknote className="size-4" /> : method === 'pin' ? <CreditCard className="size-4" /> : <Wallet className="size-4" />}
                    {t(METHOD_LABEL[method])}
                  </Button>
                  <Input inputMode="decimal" aria-label={t(METHOD_LABEL[method])} value={payments[method]} placeholder="0,00"
                    onChange={(e) => setPayments((p) => ({ ...p, [method]: e.target.value }))} />
                </div>
              ))}
              <div className="flex flex-wrap gap-1">
                {[500, 1000, 2000, 5000, 10000].map((c) => (
                  <Button key={c} size="sm" variant="secondary" onClick={() => setPayments((p) => ({ ...p, cash: asInput((parseCents(p.cash) ?? 0) + c) }))}>+{fmt(c)}</Button>
                ))}
              </div>
              <div className="flex justify-between text-sm">
                <span><PreviewText>{"Betaald"}</PreviewText> {fmt(paid)}</span>
                {paid >= totalCents
                  ? <span className="font-semibold"><PreviewText>{"Wisselgeld"}</PreviewText> {fmt(changeCents)}</span>
                  : <span className="text-destructive"><PreviewText>{"Nog te betalen"}</PreviewText> {fmt(totalCents - paid)}</span>}
              </div>
              {nonCash > totalCents && <p className="text-destructive text-xs"><PreviewText>{"PIN/overig mag niet hoger zijn dan het totaal."}</PreviewText></p>}
              <Button className="h-12 text-base" disabled={!canPay} onClick={() => void checkout()}>
                <PreviewText>{"Afrekenen"}</PreviewText> {fmt(totalCents)}
              </Button>
              <p className="text-muted-foreground text-xs"><PreviewText>{"F2 zoeken · F8 exact PIN · F9 exact contant"}</PreviewText></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* receipt after a sale */}
      <Dialog open={!!done} onOpenChange={(open) => { if (!open) { setDone(null); focusSearch(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle><PreviewText>{"Betaald"}</PreviewText>{done && done.changeCents > 0 && <> · <PreviewText>{"wisselgeld"}</PreviewText> {fmt(done.changeCents)}</>}</DialogTitle>
            <DialogDescription>{done?.number}</DialogDescription>
          </DialogHeader>
          {done && <ReceiptView receipt={done} />}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => window.print()}><Printer className="size-4" /><PreviewText>{"Bon printen"}</PreviewText></Button>
            <Button className="flex-1" variant="outline" onClick={() => { setDone(null); focusSearch(); }}><PreviewText>{"Volgende klant"}</PreviewText></Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* closing the till */}
      <Dialog open={closing} onOpenChange={setClosing}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle><PreviewText>{"Kassa sluiten"}</PreviewText></DialogTitle>
            <DialogDescription><PreviewText>{"Tel het contante geld in de la, inclusief het startbedrag."}</PreviewText></DialogDescription>
          </DialogHeader>
          <div className="grid gap-1 text-sm">
            <Row label={t('Startbedrag')} value={fmt(summary.session.openingFloatCents)} />
            <Row label={t('Contant ontvangen')} value={fmt(summary.byMethod.cash)} />
            <Row label={t('Verwacht in de la')} value={fmt(summary.expectedCashCents)} strong />
          </div>
          <Label htmlFor="pos-counted"><PreviewText>{"Geteld"}</PreviewText></Label>
          <Input id="pos-counted" inputMode="decimal" value={counted} onChange={(e) => setCounted(e.target.value)} />
          {parseCents(counted) !== null && (
            <p className="text-sm"><PreviewText>{"Verschil"}</PreviewText>: <strong>{fmt((parseCents(counted) ?? 0) - summary.expectedCashCents)}</strong></p>
          )}
          <Label htmlFor="pos-note"><PreviewText>{"Opmerking"}</PreviewText></Label>
          <Input id="pos-note" value={closeNote} onChange={(e) => setCloseNote(e.target.value)} />
          <Button disabled={busy} onClick={() => void closeTill()}><PreviewText>{"Sluiten en Z-rapport maken"}</PreviewText></Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex justify-between ${strong ? 'font-semibold' : ''}`}><span>{label}</span><span>{value}</span></div>;
}

/** The receipt, also what goes to the 80 mm printer (see PrintStyles). */
function ReceiptView({ receipt }: { receipt: Receipt }) {
  const { t } = usePreviewLanguage();
  const b = receipt.biller;
  return (
    <div className="pos-print rounded-md border p-3 font-mono text-xs leading-5">
      <div className="text-center font-bold">{b.name}</div>
      {(b.street || b.city) && <div className="text-center">{[b.street, [b.postcode, b.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</div>}
      {b.phone && <div className="text-center">{b.phone}</div>}
      {(b.kvk || b.btw) && <div className="text-center">{b.kvk && `KvK ${b.kvk}`}{b.kvk && b.btw && ' · '}{b.btw && `btw ${b.btw}`}</div>}
      <div className="my-2 border-t border-dashed" />
      <div>{receipt.number} · {new Date(receipt.time).toLocaleString('nl-NL')}</div>
      {receipt.client !== 'Kassaverkoop' && <div>{t('Klant')}: {receipt.client}</div>}
      <div className="my-2 border-t border-dashed" />
      {receipt.lines.map((l, i) => (
        <div key={i}>
          <div>{l.description}</div>
          <div className="flex justify-between"><span>{l.quantity} x {fmt(l.unitPriceCents)}{l.discountCents > 0 && ` -${fmt(l.discountCents)}`}</span><span>{fmt(l.totalCents)}</span></div>
        </div>
      ))}
      <div className="my-2 border-t border-dashed" />
      <div className="flex justify-between text-sm font-bold"><span>{t('Totaal')}</span><span>{fmt(receipt.totalCents)}</span></div>
      {receipt.vatByRate.map((v) => (
        <div key={v.rate} className="flex justify-between"><span>{t('btw')} {v.rate}% {t('over')} {fmt(v.baseCents)}</span><span>{fmt(v.vatCents)}</span></div>
      ))}
      <div className="my-2 border-t border-dashed" />
      {receipt.payments.map((p, i) => (
        <div key={i} className="flex justify-between"><span>{t(METHOD_LABEL[p.method])}</span><span>{fmt(p.tenderedCents)}</span></div>
      ))}
      {receipt.changeCents > 0 && <div className="flex justify-between"><span>{t('Wisselgeld')}</span><span>{fmt(receipt.changeCents)}</span></div>}
      <div className="mt-2 text-center">{t('Bedankt voor uw aankoop!')}</div>
    </div>
  );
}

function ZReport({ report, onClose }: { report: PosSummary; onClose: () => void }) {
  const { t } = usePreviewLanguage();
  const s = report.session;
  const expected = s.expectedCashCents ?? report.expectedCashCents;
  const diff = (s.countedCashCents ?? 0) - expected;
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center justify-between">
        <span><PreviewText>{"Z-rapport"}</PreviewText></span>
        <Button size="sm" variant="ghost" aria-label={t('Sluiten')} onClick={onClose}><X className="size-4" /></Button>
      </CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        <div className="pos-print grid gap-1 font-mono text-xs leading-5">
          <div className="font-bold">{t('Z-rapport')} · {t('kassa')} {s.register}</div>
          <div>{t('Geopend')}: {new Date(s.openedAt).toLocaleString('nl-NL')}</div>
          {s.closedAt && <div>{t('Gesloten')}: {new Date(s.closedAt).toLocaleString('nl-NL')}</div>}
          <div className="my-1 border-t border-dashed" />
          <Row label={t('Aantal verkopen')} value={String(report.sales)} />
          <Row label={t('Omzet incl. btw')} value={fmt(report.totalCents)} strong />
          <Row label={t('Contant')} value={fmt(report.byMethod.cash)} />
          <Row label="PIN" value={fmt(report.byMethod.pin)} />
          <Row label={t('Overig')} value={fmt(report.byMethod.other)} />
          <div className="my-1 border-t border-dashed" />
          <Row label={t('Startbedrag')} value={fmt(s.openingFloatCents)} />
          <Row label={t('Verwacht in de la')} value={fmt(expected)} />
          <Row label={t('Geteld')} value={fmt(s.countedCashCents ?? 0)} />
          <Row label={t('Verschil')} value={fmt(diff)} strong />
          {s.note && <div>{t('Opmerking')}: {s.note}</div>}
        </div>
        <Button onClick={() => window.print()}><Printer className="size-4" /><PreviewText>{"Z-rapport printen"}</PreviewText></Button>
      </CardContent>
    </Card>
  );
}

/** Print only the receipt / Z-report, sized for an 80 mm thermal printer. */
function PrintStyles() {
  return (
    <style>{`@media print {
      @page { size: 80mm auto; margin: 4mm; }
      body * { visibility: hidden !important; }
      .pos-print, .pos-print * { visibility: visible !important; }
      .pos-print { position: fixed; left: 0; top: 0; width: 72mm; border: 0 !important; padding: 0 !important; color: #000; background: #fff; }
    }`}</style>
  );
}
