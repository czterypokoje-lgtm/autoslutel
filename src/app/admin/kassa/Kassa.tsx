'use client';
import { PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Banknote, CreditCard, Minus, Plus, Printer, ScanLine, Search, Trash2, Undo2, Wallet, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { euroToCents } from '@/lib/money';
import type { PayMethod, PosArticle, PosSummary, Receipt, RefundMethod, ReturnableReceipt, ZReport } from '@/lib/kfcPos';
import { fmt, METHOD_LABEL, PrintStyles, ZReportView } from './ZReportView';

const StockCamera = dynamic(() => import('../voorraad/StockCamera'));

/* ── money helpers: everything is integer cents, typed amounts go through euroToCents ── */
const asInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
/** For live totals: empty or unreadable counts as 0 (the unreadable case is flagged separately). */
const centsOr0 = (value: string) => { const c = euroToCents(value); return c === null || Number.isNaN(c) ? 0 : c; };
const unreadable = (value: string) => Number.isNaN(euroToCents(value));
const newKey = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const message = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause));

/** Phone-friendly fields: 16 px text and 44 px high on small screens. */
const FIELD = 'h-11 text-base md:h-9 md:text-sm';
const OFFICE_ONLY = 'Alleen kantoor of de eigenaar mag dit doen. Vraag hen om het te boeken.';

interface CartLine { article: PosArticle; quantity: number; unitPriceCents: number; discountCents: number; vatRate: number }
interface Customer { id: string; name: string; contact: string; vat: string; city: string }
interface Location { id: string; label: string; quarantine: boolean }

async function api<T>(init?: RequestInit & { query?: string }): Promise<T> {
  const response = await fetch(`/api/admin/kassa${init?.query ?? ''}`, {
    ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }, cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Fout ${response.status}`);
  return body as T;
}

const EMPTY_PAY: Record<PayMethod, string> = { cash: '', pin: '', other: '' };

/** Refund for q more of a line, the same pro-rata rule as kfc_pos_return (preview only; the server decides). */
function refundPreview(line: ReturnableReceipt['lines'][number], q: number) {
  if (q <= 0 || line.sold <= 0) return 0;
  return Math.round((line.lineTotalCents * (line.returned + q)) / line.sold) - Math.round((line.lineTotalCents * line.returned) / line.sold);
}

export default function Kassa({ initial, cashier, office }: { initial: PosSummary | null; cashier: string; office: boolean }) {
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

  /* receipt, closing, Z-report */
  const [done, setDone] = useState<Receipt | null>(null);
  const [closing, setClosing] = useState(false);
  const [counted, setCounted] = useState('');
  const [countedPin, setCountedPin] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [closeError, setCloseError] = useState('');
  const [zReport, setZReport] = useState<ZReport | null>(null);
  const [floatInput, setFloatInput] = useState('100,00');

  /* return */
  const [retOpen, setRetOpen] = useState(false);
  const [retQuery, setRetQuery] = useState('');
  const [retReceipt, setRetReceipt] = useState<ReturnableReceipt | null>(null);
  const [retQty, setRetQty] = useState<Record<string, number>>({});
  const [retMethod, setRetMethod] = useState<RefundMethod>('cash');
  const [locations, setLocations] = useState<Location[]>([]);
  const [retLocation, setRetLocation] = useState('');
  const [retReason, setRetReason] = useState('');
  const [retKey, setRetKey] = useState(newKey);
  const [retError, setRetError] = useState('');

  /* cash in / out */
  const [cashOpen, setCashOpen] = useState(false);
  const [cashDir, setCashDir] = useState<'in' | 'out'>('in');
  const [cashAmount, setCashAmount] = useState('');
  const [cashReason, setCashReason] = useState('');
  const [cashKey, setCashKey] = useState(newKey);
  const [cashError, setCashError] = useState('');

  const totalCents = useMemo(() => cart.reduce((sum, l) => sum + l.quantity * l.unitPriceCents - l.discountCents, 0), [cart]);
  const vatCents = useMemo(() => cart.reduce((sum, l) => {
    const incl = l.quantity * l.unitPriceCents - l.discountCents;
    return sum + (incl - incl / (1 + l.vatRate / 100));
  }, 0), [cart]);
  const paid = (Object.keys(payments) as PayMethod[]).reduce((sum, m) => sum + centsOr0(payments[m]), 0);
  const nonCash = centsOr0(payments.pin) + centsOr0(payments.other);
  const payUnreadable = (Object.keys(payments) as PayMethod[]).some((m) => unreadable(payments[m]));
  const changeCents = Math.max(0, paid - totalCents);
  const canPay = !!summary && cart.length > 0 && !payUnreadable && paid >= totalCents && nonCash <= totalCents && !busy;

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
    if (!office && article.priceCents === null) {
      setError(`"${article.name}" heeft geen verkoopprijs. Vraag kantoor om een prijs in te stellen.`);
      return;
    }
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
      setError(message(cause));
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
    const floatCents = euroToCents(floatInput);
    if (floatCents === null) { setError(t('Vul een geldig startbedrag in.')); return; }
    if (Number.isNaN(floatCents)) { setError('Het startbedrag is niet te lezen. Schrijf het als 100,00.'); return; }
    setBusy(true);
    setError('');
    try {
      const r = await api<{ summary: PosSummary }>({ method: 'POST', body: JSON.stringify({ action: 'open', floatCents }) });
      setSummary(r.summary);
      setZReport(null);
      focusSearch();
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    if (!summary || !canPay) return;
    setBusy(true);
    setError('');
    const pays = (Object.keys(payments) as PayMethod[])
      .map((method) => ({ method, tenderedCents: centsOr0(payments[method]) }))
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
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  /* ── closing ─────────────────────────────────────────────────────── */
  const countedCash = euroToCents(counted);
  const countedPinCents = euroToCents(countedPin);

  async function closeTill() {
    if (!summary) return;
    if (countedCash === null) { setCloseError('Vul het getelde contante geld in.'); return; }
    if (countedPinCents === null) { setCloseError('Vul het totaal van de pinautomaat in (0 als er niet gepind is).'); return; }
    if (Number.isNaN(countedCash) || Number.isNaN(countedPinCents)) { setCloseError('Een bedrag is niet te lezen. Schrijf het als 123,45.'); return; }
    setBusy(true);
    setCloseError('');
    try {
      const r = await api<{ zReport: ZReport }>({
        method: 'POST',
        body: JSON.stringify({ action: 'close', sessionId: summary.session.id, countedCents: countedCash, countedPinCents, note: closeNote }),
      });
      setZReport(r.zReport);
      setSummary(null);
      setClosing(false);
      setCounted('');
      setCountedPin('');
      setCloseNote('');
    } catch (cause) {
      setCloseError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  async function reprint(id: string) {
    try { setDone(await api<Receipt>({ query: `?bon=${id}` })); } catch (cause) { setError(message(cause)); }
  }

  /* ── return ──────────────────────────────────────────────────────── */
  async function openReturn(prefill?: string) {
    if (!office) { setError(`Retour: ${OFFICE_ONLY}`); return; }
    setError('');
    setRetError('');
    setRetOpen(true);
    if (!locations.length) {
      try {
        const r = await api<{ locations: Location[] }>({ query: '?locaties=1' });
        setLocations(r.locations);
        setRetLocation((current) => current || (r.locations.find((l) => !l.quarantine) ?? r.locations[0])?.id || '');
      } catch (cause) {
        setRetError(message(cause));
      }
    }
    if (prefill) { setRetQuery(''); await findReceipt(prefill); }
  }

  async function findReceipt(value: string) {
    const q = value.trim();
    if (!q) { setRetError('Vul het bonnummer in of scan de bon.'); return; }
    setRetError('');
    try {
      const found = await api<ReturnableReceipt>({ query: `?retour=${encodeURIComponent(q)}` });
      setRetReceipt(found);
      setRetQty({});
      if (!found.lines.some((l) => l.returnable > 0)) setRetError('Alles van deze bon is al retour gekomen.');
    } catch (cause) {
      setRetReceipt(null);
      setRetError(message(cause));
    }
  }

  const retLines = retReceipt ? retReceipt.lines.filter((l) => (retQty[l.id] ?? 0) > 0) : [];
  const retTotal = retReceipt ? retReceipt.lines.reduce((sum, l) => sum + refundPreview(l, retQty[l.id] ?? 0), 0) : 0;

  function resetReturn() {
    setRetReceipt(null);
    setRetQuery('');
    setRetQty({});
    setRetReason('');
    setRetError('');
    setRetKey(newKey());
  }

  async function submitReturn() {
    if (!summary || !retReceipt) return;
    if (!retLines.length) { setRetError('Kies minstens één artikel dat retour komt.'); return; }
    if (!retLocation) { setRetError('Kies de locatie waar het artikel terug komt.'); return; }
    setBusy(true);
    setRetError('');
    try {
      const r = await api<{ receipt: Receipt; summary: PosSummary | null }>({
        method: 'POST',
        body: JSON.stringify({
          action: 'return', sessionId: summary.session.id, key: retKey, invoiceId: retReceipt.invoiceId,
          lines: retLines.map((l) => ({ lineId: l.id, quantity: retQty[l.id] })),
          method: retMethod, locationId: retLocation, reason: retReason,
        }),
      });
      if (r.summary) setSummary(r.summary);
      setDone(r.receipt);
      setRetOpen(false);
      resetReturn();
    } catch (cause) {
      // Same key on retry: a return that did go through is not booked twice.
      setRetError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  /* ── cash in / out ───────────────────────────────────────────────── */
  async function submitCash() {
    if (!summary) return;
    if (cashDir === 'out' && !office) { setCashError(`Kas uit: ${OFFICE_ONLY}`); return; }
    const amountCents = euroToCents(cashAmount);
    if (amountCents === null || amountCents === 0) { setCashError('Vul een bedrag in.'); return; }
    if (Number.isNaN(amountCents)) { setCashError('Het bedrag is niet te lezen. Schrijf het als 25,00.'); return; }
    if (cashReason.trim().length < 3) { setCashError('Vul een reden in (minstens 3 tekens).'); return; }
    setBusy(true);
    setCashError('');
    try {
      const r = await api<{ summary: PosSummary | null }>({
        method: 'POST',
        body: JSON.stringify({ action: 'cash', sessionId: summary.session.id, key: cashKey, direction: cashDir, amountCents, reason: cashReason }),
      });
      if (r.summary) setSummary(r.summary);
      setCashOpen(false);
      setCashAmount('');
      setCashReason('');
      setCashKey(newKey());
    } catch (cause) {
      setCashError(message(cause));
    } finally {
      setBusy(false);
    }
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
            <Input id="pos-float" className={FIELD} inputMode="decimal" value={floatInput} onChange={(e) => setFloatInput(e.target.value)} />
            <Button className="h-11 md:h-9" disabled={busy} onClick={() => void openTill()}><Wallet className="size-4" aria-hidden="true" /><PreviewText>{"Kassa openen"}</PreviewText></Button>
            <Link href="/admin/kassa/sessies" className="text-sm underline underline-offset-4">Oude Z-rapporten bekijken</Link>
          </CardContent>
        </Card>
        {zReport && (
          <Card>
            <CardHeader><CardTitle className="flex items-center justify-between">
              <span>Z-rapport {zReport.zNumber ? `nr. ${zReport.zNumber}` : ''}</span>
              <Button size="sm" variant="ghost" aria-label={t('Sluiten')} onClick={() => setZReport(null)}><X className="size-4" /></Button>
            </CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <ZReportView report={zReport} />
              <Button className="h-11 md:h-9" onClick={() => window.print()}><Printer className="size-4" aria-hidden="true" />Z-rapport printen</Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  /* ── open till ───────────────────────────────────────────────────── */
  const cashSalesNet = summary.byMethod.cash;
  return (
    <div className="grid gap-4">
      <PrintStyles />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary"><PreviewText>{"Kassa open"}</PreviewText> · {new Date(summary.session.openedAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</Badge>
        <span className="text-muted-foreground">
          {summary.sales} <PreviewText>{"verkopen"}</PreviewText>{summary.returns > 0 && <> · {summary.returns} retour</>} · {fmt(summary.totalCents)} · <PreviewText>{"contant"}</PreviewText> {fmt(summary.byMethod.cash)} · PIN {fmt(summary.byMethod.pin)}
        </span>
        <span className="text-muted-foreground ml-auto">{cashier}</span>
        <Button size="sm" variant="outline" className="h-11 md:h-8" onClick={() => void openReturn()}><Undo2 className="size-4" aria-hidden="true" />Retour</Button>
        <Button size="sm" variant="outline" className="h-11 md:h-8" onClick={() => { setCashError(''); setCashDir('in'); setCashOpen(true); }}><Wallet className="size-4" aria-hidden="true" />Kas in/uit</Button>
        <Button size="sm" variant="outline" className="h-11 md:h-8" onClick={() => { setCloseError(''); setClosing(true); }}><PreviewText>{"Kassa sluiten (Z)"}</PreviewText></Button>
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
                  <div key={r.id} className="flex items-center gap-1">
                    <button type="button" onClick={() => void reprint(r.id)} className="hover:bg-muted flex min-h-11 flex-1 items-center justify-between rounded px-2 py-1 text-left md:min-h-0">
                      <span>{r.number} · {new Date(r.time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} · {r.credit ? 'retour' : r.client}</span>
                      <span className="font-medium">{fmt(r.totalCents)}</span>
                    </button>
                    {office && !r.credit && (
                      <Button size="sm" variant="ghost" className="h-11 md:h-7" aria-label={`Retour van ${r.number}`} onClick={() => void openReturn(r.id)}>
                        <Undo2 className="size-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <Link href="/admin/kassa/sessies" className="text-muted-foreground text-sm underline underline-offset-4">Oude Z-rapporten</Link>
        </div>

        {/* right: the receipt being built + payment */}
        <Card className="content-start">
          <CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-base">
            <span><PreviewText>{"Bon"}</PreviewText> ({cart.reduce((s, l) => s + l.quantity, 0)})</span>
            {cart.length > 0 && <Button size="sm" variant="ghost" onClick={() => { setCart([]); setPayments(EMPTY_PAY); focusSearch(); }}><PreviewText>{"Leegmaken"}</PreviewText></Button>}
          </CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {cart.length === 0 && <p className="text-muted-foreground py-6 text-center text-sm"><PreviewText>{"Scan een artikel om te beginnen."}</PreviewText></p>}
            {!office && cart.length > 0 && <p className="text-muted-foreground text-xs">Prijs en korting kan alleen kantoor aanpassen.</p>}
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
                    <Button size="icon" variant="outline" className="size-11 md:size-8" aria-label={t('Minder')} onClick={() => updateLine(index, { quantity: Math.max(1, line.quantity - 1) })}><Minus className="size-3" /></Button>
                    <Input className="h-11 w-14 text-center text-base md:h-8 md:w-12 md:text-sm" inputMode="numeric" aria-label={t('Aantal')} value={line.quantity}
                      onChange={(e) => { const n = parseInt(e.target.value, 10); if (n >= 1 && n <= 10000) updateLine(index, { quantity: n }); }} />
                    <Button size="icon" variant="outline" className="size-11 md:size-8" aria-label={t('Meer')} onClick={() => updateLine(index, { quantity: line.quantity + 1 })}><Plus className="size-3" /></Button>
                  </div>
                  {office ? (
                    <>
                      <Input key={`p-${line.article.code}-${line.unitPriceCents}`} className="h-11 w-24 text-base md:h-8 md:text-sm" inputMode="decimal" aria-label={t('Prijs incl. btw')} defaultValue={asInput(line.unitPriceCents)}
                        onBlur={(e) => {
                          const c = euroToCents(e.target.value);
                          if (c === null) return;
                          if (Number.isNaN(c)) { setError('De prijs is niet te lezen. Schrijf hem als 12,50.'); return; }
                          updateLine(index, { unitPriceCents: c, discountCents: Math.min(line.discountCents, line.quantity * c) });
                        }} />
                      <Input key={`d-${line.article.code}-${line.discountCents}`} className="h-11 w-20 text-base md:h-8 md:text-sm" inputMode="decimal" aria-label={t('Korting')} placeholder={t('korting')} defaultValue={line.discountCents ? asInput(line.discountCents) : ''}
                        onBlur={(e) => {
                          const c = euroToCents(e.target.value);
                          if (c !== null && Number.isNaN(c)) { setError('De korting is niet te lezen. Schrijf hem als 2,50.'); return; }
                          updateLine(index, { discountCents: Math.min(c ?? 0, line.quantity * line.unitPriceCents) });
                        }} />
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">{line.quantity} × {fmt(line.unitPriceCents)}</span>
                  )}
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
                  <Input id="pos-customer" className={FIELD} value={customerQuery} placeholder={t('Zakelijke klant zoeken of naam op bon')}
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
                  <Button type="button" variant="outline" className="h-11 w-28 justify-start md:h-9"
                    onClick={() => setPayments((p) => ({ ...p, [method]: asInput(Math.max(0, totalCents - (paid - centsOr0(p[method])))) }))}>
                    {method === 'cash' ? <Banknote className="size-4" /> : method === 'pin' ? <CreditCard className="size-4" /> : <Wallet className="size-4" />}
                    {t(METHOD_LABEL[method])}
                  </Button>
                  <Input className={FIELD} inputMode="decimal" aria-label={t(METHOD_LABEL[method])} value={payments[method]} placeholder="0,00"
                    aria-invalid={unreadable(payments[method]) || undefined}
                    onChange={(e) => setPayments((p) => ({ ...p, [method]: e.target.value }))} />
                </div>
              ))}
              {payUnreadable && <p className="text-destructive text-xs" role="alert">Een bedrag is niet te lezen. Schrijf het als 12,50.</p>}
              <div className="flex flex-wrap gap-1">
                {[500, 1000, 2000, 5000, 10000].map((c) => (
                  <Button key={c} size="sm" variant="secondary" className="h-11 md:h-8" onClick={() => setPayments((p) => ({ ...p, cash: asInput(centsOr0(p.cash) + c) }))}>+{fmt(c)}</Button>
                ))}
              </div>
              <div className="flex justify-between text-sm">
                <span><PreviewText>{"Betaald"}</PreviewText> {fmt(paid)}</span>
                {paid >= totalCents
                  ? <span className="font-semibold"><PreviewText>{"Wisselgeld"}</PreviewText> {fmt(changeCents)}</span>
                  : <span className="text-destructive"><PreviewText>{"Nog te betalen"}</PreviewText> {fmt(totalCents - paid)}</span>}
              </div>
              {nonCash > totalCents && <p className="text-destructive text-xs" role="alert"><PreviewText>{"PIN/overig mag niet hoger zijn dan het totaal."}</PreviewText></p>}
              <Button className="h-12 text-base" disabled={!canPay} onClick={() => void checkout()}>
                <PreviewText>{"Afrekenen"}</PreviewText> {fmt(totalCents)}
              </Button>
              <p className="text-muted-foreground text-xs"><PreviewText>{"F2 zoeken · F8 exact PIN · F9 exact contant"}</PreviewText></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* receipt after a sale or a return */}
      <Dialog open={!!done} onOpenChange={(open) => { if (!open) { setDone(null); focusSearch(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {done && done.totalCents < 0
                ? <>Retour geboekt · terug {fmt(-done.totalCents)}</>
                : <><PreviewText>{"Betaald"}</PreviewText>{done && done.changeCents > 0 && <> · <PreviewText>{"wisselgeld"}</PreviewText> {fmt(done.changeCents)}</>}</>}
            </DialogTitle>
            <DialogDescription>{done?.number}</DialogDescription>
          </DialogHeader>
          {done && <ReceiptView receipt={done} />}
          <div className="bg-background sticky bottom-0 flex gap-2 pt-2">
            <Button className="h-11 flex-1 md:h-9" onClick={() => window.print()}><Printer className="size-4" /><PreviewText>{"Bon printen"}</PreviewText></Button>
            <Button className="h-11 flex-1 md:h-9" variant="outline" onClick={() => { setDone(null); focusSearch(); }}><PreviewText>{"Volgende klant"}</PreviewText></Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* return */}
      <Dialog open={retOpen} onOpenChange={(open) => { setRetOpen(open); if (!open) resetReturn(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Retour</DialogTitle>
            <DialogDescription>Zoek de oorspronkelijke bon, kies wat terug komt en hoe het geld terug gaat.</DialogDescription>
          </DialogHeader>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void findReceipt(retQuery); }}>
            <Input className={FIELD} value={retQuery} onChange={(e) => setRetQuery(e.target.value)} autoComplete="off" enterKeyHint="search"
              aria-label="Bonnummer" placeholder="Bonnummer, bijv. I-00042 (of scan)" />
            <Button type="submit" variant="outline" className="h-11 md:h-9">Zoeken</Button>
          </form>
          {retReceipt && (
            <div className="grid gap-3">
              <div className="text-sm"><strong>{retReceipt.number}</strong> · {new Date(retReceipt.time).toLocaleString('nl-NL')} · {retReceipt.client} · {fmt(retReceipt.totalCents)}</div>
              <div className="grid gap-2">
                {retReceipt.lines.map((l) => {
                  const q = retQty[l.id] ?? 0;
                  const set = (n: number) => setRetQty((cur) => ({ ...cur, [l.id]: Math.max(0, Math.min(l.returnable, n)) }));
                  return (
                    <div key={l.id} className="grid gap-1 border-b pb-2 text-sm">
                      <div className="font-medium">{l.description}</div>
                      <div className="text-muted-foreground text-xs">Verkocht {l.sold} · al retour {l.returned} · {fmt(l.lineTotalCents)}</div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="size-11 md:size-8" disabled={q <= 0} aria-label={`Minder retour: ${l.description}`} onClick={() => set(q - 1)}><Minus className="size-3" /></Button>
                        <span className="w-8 text-center tabular-nums" aria-live="polite">{q}</span>
                        <Button size="icon" variant="outline" className="size-11 md:size-8" disabled={q >= l.returnable} aria-label={`Meer retour: ${l.description}`} onClick={() => set(q + 1)}><Plus className="size-3" /></Button>
                        <span className="text-muted-foreground text-xs">van {l.returnable}</span>
                        <span className="ml-auto font-medium">{q > 0 ? fmt(refundPreview(l, q)) : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <fieldset className="grid gap-1">
                <legend className="mb-1 text-sm font-medium">Geld terug via</legend>
                <div className="flex gap-2">
                  {(['cash', 'pin'] as RefundMethod[]).map((m) => (
                    <Button key={m} type="button" className="h-11 flex-1 md:h-9" variant={retMethod === m ? 'default' : 'outline'} aria-pressed={retMethod === m} onClick={() => setRetMethod(m)}>
                      {m === 'cash' ? <Banknote className="size-4" /> : <CreditCard className="size-4" />}{METHOD_LABEL[m]}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-1">
                <Label htmlFor="ret-location">Terug naar locatie</Label>
                <select id="ret-location" className={`${FIELD} border-input bg-background rounded-lg border px-2.5`} value={retLocation} onChange={(e) => setRetLocation(e.target.value)}>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.label}{l.quarantine ? ' (quarantaine, niet verkopen)' : ''}</option>)}
                </select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="ret-reason">Reden (optioneel)</Label>
                <Input id="ret-reason" className={FIELD} value={retReason} onChange={(e) => setRetReason(e.target.value)} placeholder="Bijv. verkeerde sleutel" />
              </div>
            </div>
          )}
          {retError && <p className="text-destructive text-sm" role="alert">{retError}</p>}
          {retReceipt && (
            <div className="bg-background sticky bottom-0 pt-2">
              <Button className="h-12 w-full text-base" disabled={busy || !retLines.length} onClick={() => void submitReturn()}>
                <Undo2 className="size-4" aria-hidden="true" />Retour boeken · {fmt(retTotal)} {retMethod === 'cash' ? 'contant' : 'PIN'} terug
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* cash in / out */}
      <Dialog open={cashOpen} onOpenChange={(open) => { setCashOpen(open); if (!open) setCashError(''); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Kas in / uit</DialogTitle>
            <DialogDescription>Geld in of uit de la zonder verkoop, bijvoorbeeld wisselgeld halen of geld naar de bank.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button type="button" className="h-11 flex-1 md:h-9" variant={cashDir === 'in' ? 'default' : 'outline'} aria-pressed={cashDir === 'in'} onClick={() => { setCashDir('in'); setCashError(''); }}>
              <ArrowDownToLine className="size-4" aria-hidden="true" />Kas in
            </Button>
            <Button type="button" className="h-11 flex-1 md:h-9" variant={cashDir === 'out' ? 'default' : 'outline'} aria-pressed={cashDir === 'out'}
              onClick={() => { setCashDir('out'); setCashError(office ? '' : `Kas uit: ${OFFICE_ONLY}`); }}>
              <ArrowUpFromLine className="size-4" aria-hidden="true" />Kas uit
            </Button>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="cash-amount">Bedrag</Label>
            <Input id="cash-amount" className={FIELD} inputMode="decimal" placeholder="0,00" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)}
              aria-invalid={unreadable(cashAmount) || undefined} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="cash-reason">Reden (verplicht)</Label>
            <Input id="cash-reason" className={FIELD} value={cashReason} onChange={(e) => setCashReason(e.target.value)}
              placeholder={cashDir === 'in' ? 'Bijv. wisselgeld van de bank' : 'Bijv. afgestort bij de bank'} />
          </div>
          <div className="text-muted-foreground text-sm">Nu in de la (verwacht): {fmt(summary.expectedCashCents)}</div>
          {cashError && <p className="text-destructive text-sm" role="alert">{cashError}</p>}
          <div className="bg-background sticky bottom-0 pt-2">
            <Button className="h-12 w-full text-base" disabled={busy || (cashDir === 'out' && !office)} onClick={() => void submitCash()}>
              {cashDir === 'in' ? 'Kas in boeken' : 'Kas uit boeken'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* closing the till */}
      <Dialog open={closing} onOpenChange={(open) => { setClosing(open); if (!open) setCloseError(''); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle><PreviewText>{"Kassa sluiten"}</PreviewText></DialogTitle>
            <DialogDescription>Tel het contante geld in de la (inclusief het startbedrag) en neem het dagtotaal van de pinautomaat over.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1 text-sm">
            <Row label={t('Startbedrag')} value={fmt(summary.session.openingFloatCents)} />
            <Row label="Contant (verkoop − retour)" value={fmt(cashSalesNet)} />
            {summary.cashInCents > 0 && <Row label="Kas in" value={fmt(summary.cashInCents)} />}
            {summary.cashOutCents > 0 && <Row label="Kas uit" value={fmt(-summary.cashOutCents)} />}
            <Row label={t('Verwacht in de la')} value={fmt(summary.expectedCashCents)} strong />
            <Row label="Verwacht op de pinautomaat" value={fmt(summary.expectedPinCents)} strong />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="pos-counted">Contant geteld</Label>
            <Input id="pos-counted" className={FIELD} inputMode="decimal" placeholder="0,00" value={counted} onChange={(e) => setCounted(e.target.value)}
              aria-invalid={unreadable(counted) || undefined} />
            {typeof countedCash === 'number' && !Number.isNaN(countedCash) && (
              <p className="text-sm">Verschil contant: <strong>{fmt(countedCash - summary.expectedCashCents)}</strong></p>
            )}
          </div>
          <div className="grid gap-1">
            <Label htmlFor="pos-counted-pin">Totaal pinautomaat</Label>
            <Input id="pos-counted-pin" className={FIELD} inputMode="decimal" placeholder="0,00" value={countedPin} onChange={(e) => setCountedPin(e.target.value)}
              aria-invalid={unreadable(countedPin) || undefined} />
            {typeof countedPinCents === 'number' && !Number.isNaN(countedPinCents) && (
              <p className="text-sm">Verschil PIN: <strong>{fmt(countedPinCents - summary.expectedPinCents)}</strong></p>
            )}
          </div>
          <div className="grid gap-1">
            <Label htmlFor="pos-note"><PreviewText>{"Opmerking"}</PreviewText></Label>
            <Input id="pos-note" className={FIELD} value={closeNote} onChange={(e) => setCloseNote(e.target.value)} />
          </div>
          {closeError && <p className="text-destructive text-sm" role="alert">{closeError}</p>}
          <div className="bg-background sticky bottom-0 pt-2">
            <Button className="h-12 w-full text-base" disabled={busy} onClick={() => void closeTill()}><PreviewText>{"Sluiten en Z-rapport maken"}</PreviewText></Button>
          </div>
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
      {receipt.creditOf && <div className="font-bold">RETOUR van bon {receipt.creditOf}</div>}
      <div>{receipt.number} · {new Date(receipt.time).toLocaleString('nl-NL')}</div>
      {receipt.client !== 'Kassaverkoop' && <div>{t('Klant')}: {receipt.client}</div>}
      <div className="my-2 border-t border-dashed" />
      {receipt.lines.map((l, i) => (
        <div key={i}>
          <div>{l.description}</div>
          <div className="flex justify-between"><span>{l.quantity} x {fmt(l.unitPriceCents)}{l.discountCents !== 0 && ` ${l.discountCents > 0 ? '-' : '+'}${fmt(Math.abs(l.discountCents))}`}</span><span>{fmt(l.totalCents)}</span></div>
        </div>
      ))}
      <div className="my-2 border-t border-dashed" />
      <div className="flex justify-between text-sm font-bold"><span>{t('Totaal')}</span><span>{fmt(receipt.totalCents)}</span></div>
      {receipt.vatByRate.map((v) => (
        <div key={v.rate} className="flex justify-between"><span>{t('btw')} {v.rate}% {t('over')} {fmt(v.baseCents)}</span><span>{fmt(v.vatCents)}</span></div>
      ))}
      <div className="my-2 border-t border-dashed" />
      {receipt.payments.map((p, i) => (
        <div key={i} className="flex justify-between"><span>{t(METHOD_LABEL[p.method])}{p.tenderedCents < 0 ? ' terug' : ''}</span><span>{fmt(p.tenderedCents)}</span></div>
      ))}
      {receipt.changeCents > 0 && <div className="flex justify-between"><span>{t('Wisselgeld')}</span><span>{fmt(receipt.changeCents)}</span></div>}
      <div className="mt-2 text-center">{t('Bedankt voor uw aankoop!')}</div>
    </div>
  );
}
