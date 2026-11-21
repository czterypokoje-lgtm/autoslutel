'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Pencil, Printer, ShoppingCart, Trash2, Undo2, Wallet } from 'lucide-react';
import { PreviewProductName, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Supplier, SupplierArticle, SupplierBalance, SupplierContact, SupplierEntry, SupplierOrder } from '@/lib/kfcSuppliers';
import { ENTRY_LABEL, SupplierDialog, money, post, toCents } from '../shared';

export const TABS = ['gegevens', 'artikelen', 'inkooporders', 'facturen', 'betalingen', 'ekstre', 'saldo'] as const;
export type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  gegevens: 'Gegevens', artikelen: 'Artikelen en prijzen', inkooporders: 'Inkooporders', facturen: 'Facturen', betalingen: 'Betalingen', ekstre: 'Ekstre', saldo: 'Saldo',
};
const PO_STATUS: Record<SupplierOrder['status'], [string, 'default' | 'secondary' | 'outline' | 'destructive']> = {
  draft: ['Concept', 'outline'], ordered: ['Besteld', 'default'], received: ['Ontvangen', 'secondary'], cancelled: ['Geannuleerd', 'destructive'],
};
const BUCKETS: [keyof SupplierBalance, string][] = [['not_due', 'Nog niet vervallen'], ['d1_30', '0–30 dagen'], ['d31_60', '31–60'], ['d61_90', '61–90'], ['d90p', '> 90']];
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());

/**
 * Retry-safe ledger writes: the same payload re-sent (a double click, a retry
 * after a timeout) reuses its idempotency key; a changed payload, or the next
 * booking after a success, gets a new one.
 */
function useEntryKey() {
  const last = useRef<{ fingerprint: string; key: string } | null>(null);
  return {
    keyFor(payload: unknown) {
      const fingerprint = JSON.stringify(payload);
      if (last.current?.fingerprint !== fingerprint) last.current = { fingerprint, key: crypto.randomUUID() };
      return last.current.key;
    },
    done() { last.current = null; },
  };
}

interface Props {
  supplier: Supplier; balance: SupplierBalance; contacts: SupplierContact[]; entries: SupplierEntry[]; openInvoices: SupplierEntry[];
  articles: SupplierArticle[]; orders: SupplierOrder[]; initialTab: Tab; invoiceForOrder: string | null;
}

export default function SupplierCard({ supplier, balance, contacts, entries, openInvoices, articles, orders, initialTab, invoiceForOrder }: Props) {
  const router = useRouter();
  const { t } = usePreviewLanguage();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [notice, setNotice] = useState('');
  const [invoiceFor, setInvoiceFor] = useState<string | null | undefined>(invoiceForOrder ?? undefined);
  const [paying, setPaying] = useState(false);
  const refresh = (message = '') => { setNotice(message); router.refresh(); };
  const invoices = entries.filter((e) => e.entry_type === 'invoice' || e.entry_type === 'opening');
  const payments = entries.filter((e) => ['payment', 'credit_note', 'refund', 'write_off'].includes(e.entry_type));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2"><Link href="/admin/leveranciers">← {t('Leveranciers')}</Link></Button>
          <h1 className="text-2xl font-semibold tracking-tight">{supplier.name} {!supplier.active && <Badge variant="outline">{t('Inactief')}</Badge>}</h1>
          <p className="text-muted-foreground text-sm">{[supplier.kvk && `KvK ${supplier.kvk}`, supplier.vat_number && `Btw ${supplier.vat_number}`, supplier.iban].filter(Boolean).join(' · ')}</p>
          <p className="text-muted-foreground text-sm">{t('Betalingstermijn')} {supplier.terms_days} {t('dagen')}{supplier.lead_time_days != null && ` · ${t('levertijd')} ${supplier.lead_time_days} ${t('dagen')}`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline"><Link href={`/admin/inkoop?leverancier=${supplier.id}`}><ShoppingCart className="size-4" /> {t('Nieuwe inkooporder')}</Link></Button>
          <Button size="sm" variant="outline" onClick={() => setInvoiceFor(null)}><FileText className="size-4" /> {t('Inkoopfactuur boeken')}</Button>
          <Button size="sm" onClick={() => setPaying(true)}><Wallet className="size-4" /> {t('Betaling boeken')}</Button>
          <Button asChild size="sm" variant="outline"><Link href={`/admin/leveranciers/${supplier.id}/ekstre`} target="_blank"><Printer className="size-4" /> Ekstre</Link></Button>
          <SupplierDialog supplier={supplier} onSaved={() => refresh(t('Opgeslagen.'))} />
        </div>
      </div>
      {notice && <p role="status" className="text-muted-foreground text-sm">{notice}</p>}

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList className="h-auto flex-wrap">
          {TABS.map((key) => <TabsTrigger key={key} value={key}>{t(TAB_LABEL[key])}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="gegevens" className="grid gap-4 md:grid-cols-2">
          <Details supplier={supplier} />
          <Contacts supplier={supplier.id} contacts={contacts} onChange={refresh} />
        </TabsContent>

        <TabsContent value="artikelen"><Articles supplier={supplier.id} articles={articles} onChange={refresh} /></TabsContent>

        <TabsContent value="inkooporders">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('Inkooporders')}</CardTitle><CardDescription>{t('Bestellen en ontvangen gebeurt onder Inkoop; hier boekt u de factuur bij een order.')}</CardDescription></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{t('Datum')}</TableHead><TableHead>Status</TableHead><TableHead>{t('Verwacht')}</TableHead>
                  <TableHead className="text-right">{t('Ontvangen / besteld')}</TableHead><TableHead className="text-right">{t('Orderwaarde')}</TableHead>
                  <TableHead className="text-right">{t('Ontvangen waarde')}</TableHead><TableHead className="text-right">{t('Gefactureerd')}</TableHead><TableHead />
                </TableRow></TableHeader>
                <TableBody>
                  {orders.length === 0 && <TableRow><TableCell colSpan={8} className="text-muted-foreground py-8 text-center">{t('Nog geen inkooporders.')}</TableCell></TableRow>}
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell><Link className="underline-offset-4 hover:underline" href={`/admin/inkoop#purchase-${o.id}`}>{(o.ordered_at ?? o.created_at).slice(0, 10)}</Link>{o.invoice_ref && <span className="text-muted-foreground text-xs"> · {o.invoice_ref}</span>}</TableCell>
                      <TableCell><Badge variant={PO_STATUS[o.status][1]}>{t(PO_STATUS[o.status][0])}</Badge></TableCell>
                      <TableCell>{o.late ? <Badge variant="destructive">{o.expected_on}</Badge> : o.expected_on ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{o.received} / {o.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(o.ordered_cents)}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(o.received_cents)}</TableCell>
                      <TableCell className="text-right tabular-nums">{o.invoiced_cents ? money(o.invoiced_cents) : '—'}</TableCell>
                      <TableCell>{o.status !== 'cancelled' && o.status !== 'draft' && <Button size="sm" variant="outline" onClick={() => setInvoiceFor(o.id)}>{t('Factuur boeken')}</Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facturen">
          <EntryTable title={t('Inkoopfacturen')} rows={invoices} orders={orders} empty={t('Nog geen inkoopfacturen geboekt.')} onChange={refresh} />
        </TabsContent>
        <TabsContent value="betalingen">
          <EntryTable title={t('Betalingen en creditnota\'s')} rows={payments} orders={orders} empty={t('Nog geen betalingen geboekt.')} onChange={refresh} />
        </TabsContent>
        <TabsContent value="ekstre">
          <EntryTable title={t('Ekstre · Rekeningoverzicht')} rows={entries} orders={orders} empty={t('Nog geen boekingen.')} running onChange={refresh}
            action={<Button asChild size="sm" variant="outline"><Link href={`/admin/leveranciers/${supplier.id}/ekstre`} target="_blank"><Printer className="size-4" /> {t('Afdrukken')}</Link></Button>} />
        </TabsContent>

        <TabsContent value="saldo" className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardHeader className="pb-1"><CardDescription>{t('Saldo (te betalen)')}</CardDescription><CardTitle className="text-3xl tabular-nums">{money(balance.open_cents)}</CardTitle></CardHeader>
              <CardContent className="text-muted-foreground text-xs">{balance.open_cents < 0 ? t('Tegoed bij de leverancier') : t('Wat wij nog moeten betalen')}</CardContent></Card>
            <Card className={balance.overdue_cents > 0 ? 'border-destructive/50 bg-destructive/5' : undefined}><CardHeader className="pb-1"><CardDescription>{t('Vervallen')}</CardDescription><CardTitle className="text-3xl tabular-nums">{money(balance.overdue_cents)}</CardTitle></CardHeader>
              <CardContent className="text-muted-foreground text-xs">{balance.oldest_overdue ? `${t('oudste vervaldatum')} ${balance.oldest_overdue}` : t('niets over de vervaldatum')}</CardContent></Card>
            <Card><CardHeader className="pb-1"><CardDescription>{t('In bestelling')}</CardDescription><CardTitle className="text-3xl tabular-nums">{money(balance.on_order_cents)}</CardTitle></CardHeader>
              <CardContent className="text-muted-foreground text-xs">{balance.open_pos} {t('open inkooporders')} · {balance.late_pos} {t('te laat')}</CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">{t('Ouderdom · Yaşlandırma')}</CardTitle><CardDescription>{t('Open inkoopfacturen naar vervaldatum.')}</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {BUCKETS.map(([key, label]) => (
                <div key={key} className={`rounded-lg border p-3 ${Number(balance[key]) > 0 && key !== 'not_due' ? 'border-destructive/40' : ''}`}>
                  <div className="text-muted-foreground text-xs">{t(label)}</div>
                  <div className="font-semibold tabular-nums">{money(Number(balance[key]))}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <EntryTable title={t('Open facturen')} rows={openInvoices} orders={orders} empty={t('Niets open.')} onChange={refresh} />
        </TabsContent>
      </Tabs>

      <InvoiceDialog supplier={supplier} orders={orders} order={invoiceFor} onClose={() => setInvoiceFor(undefined)} onSaved={() => { setInvoiceFor(undefined); setTab('facturen'); refresh(t('Inkoopfactuur geboekt.')); }} />
      <PaymentDialog supplier={supplier} open={paying} openInvoices={openInvoices} onClose={() => setPaying(false)} onSaved={() => { setPaying(false); setTab('betalingen'); refresh(t('Geboekt.')); }} />
    </div>
  );
}

function Details({ supplier: s }: { supplier: Supplier }) {
  const { t } = usePreviewLanguage();
  const rows: [string, React.ReactNode][] = [
    ['Contactpersoon', s.contact_name], ['Telefoon', s.phone], ['E-mail', s.email && <a className="underline" href={`mailto:${s.email}`}>{s.email}</a>],
    ['Bestel-e-mail', s.order_email && <a className="underline" href={`mailto:${s.order_email}`}>{s.order_email}</a>], ['Website', s.website],
    ['Adres', s.street && `${s.street}, ${s.postcode ?? ''} ${s.city ?? ''} · ${s.country}`], ['KvK', s.kvk], ['Btw-nummer', s.vat_number], ['IBAN', s.iban], ['BIC', s.bic],
    ['Ons klantnummer', s.customer_number], ['Minimaal orderbedrag', s.min_order_cents != null && money(s.min_order_cents)], ['Notitie', s.note],
  ];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t('Gegevens')}</CardTitle></CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          {rows.filter(([, value]) => value).map(([label, value]) => <div key={label} className="contents"><dt className="text-muted-foreground">{t(label)}</dt><dd className="break-words">{value}</dd></div>)}
        </dl>
      </CardContent>
    </Card>
  );
}

function Contacts({ supplier, contacts, onChange }: { supplier: string; contacts: SupplierContact[]; onChange: (message?: string) => void }) {
  const { t } = usePreviewLanguage();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setBusy(true); setError('');
    const result = await post({ action: 'contact_add', supplier, contact: values });
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    form.reset(); onChange(t('Contactpersoon toegevoegd.'));
  }
  async function remove(id: string) {
    if (!window.confirm(t('Contactpersoon verwijderen?'))) return;
    const result = await post({ action: 'contact_remove', supplier, contact: id });
    if (result.error) setError(result.error); else onChange();
  }
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t('Contactpersonen')}</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        <ul className="divide-y text-sm">
          {contacts.length === 0 && <li className="text-muted-foreground py-2">{t('Nog geen contactpersonen.')}</li>}
          {contacts.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-2 py-2">
              <div><div className="font-medium">{c.name}{c.position && <span className="text-muted-foreground font-normal"> · {c.position}</span>}</div>
                <div className="text-muted-foreground">{[c.email, c.phone].filter(Boolean).join(' · ')}</div></div>
              <Button variant="ghost" size="icon" aria-label={t('Verwijderen')} onClick={() => remove(c.id)}><Trash2 className="size-4" /></Button>
            </li>
          ))}
        </ul>
        <form onSubmit={add} className="grid gap-2 sm:grid-cols-2">
          <Input name="name" required maxLength={120} placeholder={t('Naam')} aria-label={t('Naam')} />
          <Input name="position" maxLength={80} placeholder={t('Functie')} aria-label={t('Functie')} />
          <Input name="email" type="email" maxLength={200} placeholder={t('E-mail')} aria-label={t('E-mail')} />
          <Input name="phone" type="tel" maxLength={40} placeholder={t('Telefoon')} aria-label={t('Telefoon')} />
          {error && <p role="alert" className="text-destructive text-sm sm:col-span-2">{t(error)}</p>}
          <div><Button size="sm" disabled={busy}>{t('Contactpersoon toevoegen')}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

type ArticleDraft = { article: string; label: string; supplier_sku: string; price: string; min_qty: string; lead: string; preferred: boolean; note: string };
const EMPTY_DRAFT: ArticleDraft = { article: '', label: '', supplier_sku: '', price: '', min_qty: '1', lead: '', preferred: false, note: '' };

/** Supplier articles and agreed prices. Articles are found by scanning or typing a barcode, SKU, code or supplier reference (?scan=). */
function Articles({ supplier, articles, onChange }: { supplier: string; articles: SupplierArticle[]; onChange: (message?: string) => void }) {
  const { t } = usePreviewLanguage();
  const [scan, setScan] = useState('');
  const [matches, setMatches] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [draft, setDraft] = useState<ArticleDraft>(EMPTY_DRAFT);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');
  const request = useRef(0);
  const priceRef = useRef<HTMLInputElement>(null);

  function choose(item: { id: string; name: string; sku: string }) {
    const existing = articles.find((a) => a.article_code === item.id);
    setDraft(existing ? fromArticle(existing) : { ...EMPTY_DRAFT, article: item.id, label: `${item.id} · ${item.name}` });
    setMatches([]); setScan('');
    setTimeout(() => priceRef.current?.focus(), 0);
  }
  async function lookup() {
    const value = scan.trim();
    if (!value) return;
    const mine = ++request.current;
    setError('');
    const response = await fetch('/api/admin/inkoop?scan=' + encodeURIComponent(value)).catch(() => null);
    if (mine !== request.current) return;
    if (!response || (!response.ok && response.status !== 404)) { setError('Artikelen zoeken mislukt.'); return; }
    const body = response.ok ? await response.json() : null;
    if (body?.articles?.length) setMatches(body.articles);
    else if (body?.article) choose(body.article);
    else setError('Onbekend artikel. Maak het eerst aan onder Inkoop of Voorraad.');
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const price = toCents(draft.price);
    if (price !== null && (!Number.isFinite(price) || price < 0)) { setError('Controleer de inkoopprijs.'); return; }
    setBusy(true); setError('');
    const result = await post({
      action: 'article_save', supplier, article: draft.article, supplier_sku: draft.supplier_sku, price_cents: price,
      min_qty: draft.min_qty === '' ? 1 : Number(draft.min_qty), lead_time_days: draft.lead === '' ? null : Number(draft.lead), preferred: draft.preferred, note: draft.note,
    });
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    setDraft(EMPTY_DRAFT); onChange(t('Artikelprijs opgeslagen.'));
    document.getElementById('sa-scan')?.focus();
  }
  async function remove(code: string) {
    if (!window.confirm(t('Artikel bij deze leverancier verwijderen?'))) return;
    const result = await post({ action: 'article_remove', supplier, article: code });
    if (result.error) setError(result.error); else onChange();
  }
  const needle = filter.trim().toLowerCase();
  const shown = needle ? articles.filter((a) => [a.article_code, a.name, a.sku, a.supplier_sku].some((v) => v?.toLowerCase().includes(needle))) : articles;

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader><CardTitle className="text-base">{draft.article ? draft.label : t('Artikel toevoegen of prijs wijzigen')}</CardTitle>
          <CardDescription>{t('Scan of typ een barcode, SKU, artikelcode of leveranciersreferentie en druk op Enter.')}</CardDescription></CardHeader>
        <CardContent className="grid gap-3">
          <div className="relative">
            <Input id="sa-scan" value={scan} autoComplete="off" placeholder={t('Barcode / artikelcode')} aria-label={t('Barcode / artikelcode')}
              onChange={(e) => { request.current++; setMatches([]); setScan(e.target.value); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void lookup(); } }} />
            {matches.length > 0 && (
              <div className="bg-popover absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-auto rounded-md border shadow-md">
                {matches.map((m) => <button type="button" key={m.id} onClick={() => choose(m)} className="hover:bg-accent block w-full px-3 py-2 text-left text-sm">
                  <span className="font-medium">{m.sku} · {m.id}</span> <span className="text-muted-foreground">· <PreviewProductName sku={m.sku}>{m.name}</PreviewProductName></span></button>)}
              </div>
            )}
          </div>
          {draft.article && (
            <form onSubmit={save} className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5"><Label htmlFor="sa-price">{t('Inkoopprijs € (excl. btw)')}</Label><Input ref={priceRef} id="sa-price" inputMode="decimal" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label htmlFor="sa-sku">{t('Artikelnr. leverancier')}</Label><Input id="sa-sku" maxLength={80} value={draft.supplier_sku} onChange={(e) => setDraft({ ...draft, supplier_sku: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label htmlFor="sa-min">{t('Minimale afname')}</Label><Input id="sa-min" type="number" min={1} value={draft.min_qty} onChange={(e) => setDraft({ ...draft, min_qty: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label htmlFor="sa-lead">{t('Levertijd (dagen)')}</Label><Input id="sa-lead" type="number" min={0} max={365} value={draft.lead} onChange={(e) => setDraft({ ...draft, lead: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label htmlFor="sa-note">{t('Notitie')}</Label><Input id="sa-note" maxLength={300} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></div>
              <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" className="size-4" checked={draft.preferred} onChange={(e) => setDraft({ ...draft, preferred: e.target.checked })} /> {t('Voorkeursleverancier')}</label>
              <div className="flex gap-2 sm:col-span-3"><Button size="sm" disabled={busy}>{t('Opslaan')}</Button><Button type="button" size="sm" variant="outline" onClick={() => setDraft(EMPTY_DRAFT)}>{t('Annuleren')}</Button></div>
            </form>
          )}
          {error && <p role="alert" className="text-destructive text-sm">{t(error)}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3">
          <CardTitle className="text-base">{t('Artikelen van deze leverancier')} <span className="text-muted-foreground font-normal">· {articles.length}</span></CardTitle>
          <Input className="ml-auto w-56" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t('Filter')} aria-label={t('Filter')} />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t('Artikel')}</TableHead><TableHead>{t('Art.nr. leverancier')}</TableHead><TableHead className="text-right">{t('Afgesproken prijs')}</TableHead>
              <TableHead className="text-right">{t('Laatst betaald')}</TableHead><TableHead className="text-right">{t('Kostprijs artikel')}</TableHead>
              <TableHead className="text-right">{t('Min.')}</TableHead><TableHead className="text-right">{t('Levertijd')}</TableHead><TableHead>{t('Laatst besteld')}</TableHead><TableHead className="w-20" />
            </TableRow></TableHeader>
            <TableBody>
              {shown.length === 0 && <TableRow><TableCell colSpan={9} className="text-muted-foreground py-8 text-center">{t('Nog geen artikelen. Ze komen er ook vanzelf bij met elke inkooporder.')}</TableCell></TableRow>}
              {shown.map((a) => (
                <TableRow key={a.article_code}>
                  <TableCell className="max-w-72"><div className="truncate font-medium"><PreviewProductName sku={a.sku}>{a.name}</PreviewProductName></div><div className="text-muted-foreground text-xs">{a.article_code}{a.sku && ` · ${a.sku}`}{a.preferred && <Badge variant="secondary" className="ml-2">{t('voorkeur')}</Badge>}</div></TableCell>
                  <TableCell>{a.supplier_sku ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(a.price_cents)}</TableCell>
                  <TableCell className={`text-right tabular-nums ${a.last_price_cents != null && a.price_cents != null && a.last_price_cents > a.price_cents ? 'text-destructive' : ''}`}>{money(a.last_price_cents)}</TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">{money(a.article_price_cents)}</TableCell>
                  <TableCell className="text-right tabular-nums">{a.min_qty}</TableCell>
                  <TableCell className="text-right tabular-nums">{a.lead_time_days ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{a.last_ordered_at?.slice(0, 10) ?? '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button variant="ghost" size="icon" aria-label={t('Wijzigen')} onClick={() => { setDraft(fromArticle(a)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" aria-label={t('Verwijderen')} onClick={() => remove(a.article_code)}><Trash2 className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const fromArticle = (a: SupplierArticle): ArticleDraft => ({
  article: a.article_code, label: `${a.article_code} · ${a.name}`, supplier_sku: a.supplier_sku ?? '',
  price: a.price_cents == null ? '' : String(a.price_cents / 100).replace('.', ','), min_qty: String(a.min_qty), lead: a.lead_time_days == null ? '' : String(a.lead_time_days),
  preferred: a.preferred, note: a.note ?? '',
});

/** Ledger rows: invoices, payments, or the full statement with a running balance. Mistakes are reversed, never edited. */
function EntryTable({ title, rows, orders, empty, running = false, action, onChange }: {
  title: string; rows: SupplierEntry[]; orders: SupplierOrder[]; empty: string; running?: boolean; action?: React.ReactNode; onChange: (message?: string) => void;
}) {
  const { t } = usePreviewLanguage();
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState('');
  const now = today();
  const orderDate = new Map(orders.map((o) => [o.id, (o.ordered_at ?? o.created_at).slice(0, 10)]));
  async function reverse(entry: SupplierEntry) {
    if (!window.confirm(`${t('Boeking')} #${entry.id} (${t(ENTRY_LABEL[entry.entry_type])} ${money(Math.abs(entry.amount_cents))}) ${t('tegenboeken?')}`)) return;
    setBusy(entry.id); setError('');
    const result = await post({ action: 'reverse', entry: entry.id, key: crypto.randomUUID() });
    setBusy(0);
    if (result.error) setError(result.error); else onChange(t('Tegengeboekt.'));
  }
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3"><CardTitle className="text-base">{title}</CardTitle><div className="ml-auto">{action}</div></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t('Datum')}</TableHead><TableHead>{t('Soort')}</TableHead><TableHead>{t('Factuurnr.')}</TableHead><TableHead>{t('Vervalt')}</TableHead>
            <TableHead className="text-right">{t('Debet')}</TableHead><TableHead className="text-right">{t('Credit')}</TableHead>
            <TableHead className="text-right">{running ? t('Saldo') : 'Open'}</TableHead><TableHead className="w-10" />
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-muted-foreground py-8 text-center">{empty}</TableCell></TableRow>}
            {rows.map((e) => {
              const overdue = (e.open_cents ?? 0) > 0 && !!e.due_date && e.due_date < now;
              return (
                <TableRow key={e.id} className={e.reversed ? 'text-muted-foreground line-through' : undefined}>
                  <TableCell className="whitespace-nowrap">{e.entry_date}</TableCell>
                  <TableCell><Badge variant={e.entry_type === 'invoice' ? 'default' : e.entry_type === 'reversal' ? 'outline' : 'secondary'}>{t(ENTRY_LABEL[e.entry_type])}</Badge></TableCell>
                  <TableCell className="text-sm">{e.invoice_ref ?? ''}{e.purchase_order_id && <Link className="text-muted-foreground ml-1 text-xs underline" href={`/admin/inkoop#purchase-${e.purchase_order_id}`}>PO {orderDate.get(e.purchase_order_id) ?? ''}</Link>}{e.note && <div className="text-muted-foreground text-xs">{e.note}</div>}</TableCell>
                  <TableCell>{overdue ? <Badge variant="destructive">{e.due_date}</Badge> : e.due_date ?? ''}</TableCell>
                  {/* Crediteur: a purchase invoice is credit (we owe more), a payment or credit note is debit. */}
                  <TableCell className="text-right tabular-nums">{e.amount_cents < 0 ? money(-e.amount_cents) : ''}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.amount_cents > 0 ? money(e.amount_cents) : ''}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{running ? money(e.running_cents ?? 0) : e.open_cents != null ? money(e.open_cents) : ''}</TableCell>
                  <TableCell>{e.entry_type !== 'reversal' && !e.reversed && <Button variant="ghost" size="icon" aria-label={t('Tegenboeken')} disabled={busy === e.id} onClick={() => reverse(e)}><Undo2 className="size-4" /></Button>}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {error && <p role="alert" className="text-destructive px-6 py-3 text-sm">{t(error)}</p>}
      </CardContent>
    </Card>
  );
}

/** Purchase invoice (inkoopfactuur): the supplier's number, date, total incl. btw, btw, optionally the order it belongs to. */
function InvoiceDialog({ supplier, orders, order, onClose, onSaved }: { supplier: Supplier; orders: SupplierOrder[]; order: string | null | undefined; onClose: () => void; onSaved: () => void }) {
  const { t } = usePreviewLanguage();
  const [form, setForm] = useState({ ref: '', date: today(), due: '', amount: '', vat: '', po: '', note: '' });
  const [opened, setOpened] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const entryKey = useEntryKey();
  if (order !== opened) {
    setOpened(order);
    if (order !== undefined) {
      const po = orders.find((o) => o.id === order);
      setForm({ ref: po?.invoice_ref ?? '', date: today(), due: '', amount: '', vat: '', po: po?.id ?? '', note: '' });
      setError('');
    }
  }
  const po = orders.find((o) => o.id === form.po);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const amount = toCents(form.amount);
    const vat = toCents(form.vat) ?? 0;
    if (amount === null || !Number.isFinite(amount) || amount <= 0) { setError('Controleer het bedrag.'); return; }
    if (!Number.isFinite(vat) || vat < 0 || vat > amount) { setError('Controleer het btw-bedrag.'); return; }
    setBusy(true); setError('');
    const payload = { action: 'entry', supplier: supplier.id, type: 'invoice', amount_cents: amount, vat_cents: vat, invoice_ref: form.ref, entry_date: form.date, due_date: form.due || null, purchase_order: form.po || null, note: form.note };
    const result = await post({ ...payload, key: entryKey.keyFor(payload) });
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    entryKey.done();
    onSaved();
  }
  return (
    <Dialog open={order !== undefined} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{t('Inkoopfactuur boeken')} · {supplier.name}</DialogTitle>
          <DialogDescription>{t('Vervaldatum leeg = factuurdatum + betalingstermijn')} ({supplier.terms_days} {t('dagen')}).</DialogDescription></DialogHeader>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5"><Label htmlFor="pi-ref">{t('Factuurnummer leverancier')}</Label><Input id="pi-ref" required maxLength={80} value={form.ref} onChange={(e) => setForm({ ...form, ref: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label htmlFor="pi-po">{t('Inkooporder')}</Label>
            <select id="pi-po" className="border-input bg-background h-9 rounded-md border px-3 text-sm" value={form.po} onChange={(e) => setForm({ ...form, po: e.target.value })}>
              <option value="">{t('Geen (losse factuur)')}</option>
              {orders.filter((o) => o.status !== 'cancelled').map((o) => <option key={o.id} value={o.id}>{(o.ordered_at ?? o.created_at).slice(0, 10)} · {money(o.ordered_cents)}{o.invoice_ref ? ` · ${o.invoice_ref}` : ''}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5"><Label htmlFor="pi-date">{t('Factuurdatum')}</Label><Input id="pi-date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label htmlFor="pi-due">{t('Vervaldatum')}</Label><Input id="pi-due" type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label htmlFor="pi-amount">{t('Totaal incl. btw €')}</Label><Input id="pi-amount" inputMode="decimal" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div className="grid gap-1.5"><Label htmlFor="pi-vat">{t('Waarvan btw €')}</Label><Input id="pi-vat" inputMode="decimal" value={form.vat} onChange={(e) => setForm({ ...form, vat: e.target.value })} placeholder="0" /></div>
          {po && <p className="text-muted-foreground text-xs sm:col-span-2">{t('Order: besteld')} {money(po.ordered_cents)} · {t('ontvangen')} {money(po.received_cents)} {t('excl. btw')}{po.invoiced_cents ? ` · ${t('al gefactureerd')} ${money(po.invoiced_cents)}` : ''}.</p>}
          <div className="grid gap-1.5 sm:col-span-2"><Label htmlFor="pi-note">{t('Omschrijving')}</Label><Input id="pi-note" maxLength={300} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          {error && <p role="alert" className="text-destructive text-sm sm:col-span-2">{t(error)}</p>}
          <div className="sm:col-span-2"><Button disabled={busy}>{t('Boeken')}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type PaymentType = 'payment' | 'credit_note' | 'refund' | 'opening' | 'write_off';

function PaymentDialog({ supplier, open, openInvoices, onClose, onSaved }: { supplier: Supplier; open: boolean; openInvoices: SupplierEntry[]; onClose: () => void; onSaved: () => void }) {
  const { t } = usePreviewLanguage();
  const [type, setType] = useState<PaymentType>('payment');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [invoice, setInvoice] = useState('');
  const [ref, setRef] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const entryKey = useEntryKey();
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) { setType('payment'); setAmount(''); setDate(today()); setInvoice(''); setRef(''); setNote(''); setError(''); }
  }
  const allocates = type === 'payment' || type === 'credit_note' || type === 'write_off';
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cents = toCents(amount);
    if (cents === null || !Number.isFinite(cents) || cents === 0 || (type !== 'opening' && cents < 0)) { setError('Controleer het bedrag.'); return; }
    setBusy(true); setError('');
    const payload = {
      action: 'entry', supplier: supplier.id, type, amount_cents: cents, entry_date: date, invoice_ref: ref || null, note,
      allocations: allocates && invoice ? [{ invoice_entry_id: Number(invoice), amount_cents: Math.abs(cents) }] : null,
    };
    const result = await post({ ...payload, key: entryKey.keyFor(payload) });
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    entryKey.done();
    onSaved();
  }
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('Boeking voor')} {supplier.name}</DialogTitle>
          <DialogDescription>{supplier.iban ? `IBAN ${supplier.iban}` : t('Geen IBAN bekend.')}</DialogDescription></DialogHeader>
        <form onSubmit={save} className="grid gap-3">
          <div className="grid gap-1.5"><Label htmlFor="sp-type">{t('Soort')}</Label>
            <select id="sp-type" className="border-input bg-background h-9 rounded-md border px-3 text-sm" value={type} onChange={(e) => setType(e.target.value as PaymentType)}>
              <option value="payment">{t('Betaling aan leverancier')}</option><option value="credit_note">{t('Creditnota van leverancier')}</option>
              <option value="refund">{t('Terugbetaling ontvangen')}</option><option value="write_off">{t('Afboeken (klein restant)')}</option><option value="opening">{t('Beginsaldo (± bedrag)')}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="sp-amount">{t('Bedrag €')}</Label><Input id="sp-amount" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="sp-date">{t('Datum')}</Label><Input id="sp-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          {allocates && openInvoices.length > 0 && (
            <div className="grid gap-1.5"><Label htmlFor="sp-inv">{t('Op factuur')}</Label>
              <select id="sp-inv" className="border-input bg-background h-9 rounded-md border px-3 text-sm" value={invoice} onChange={(e) => setInvoice(e.target.value)}>
                <option value="">{t('Oudste vervaldatum eerst (automatisch)')}</option>
                {openInvoices.map((i) => <option key={i.id} value={i.id}>{i.invoice_ref ?? t(ENTRY_LABEL[i.entry_type])} · {t('vervalt')} {i.due_date ?? '—'} · open {money(i.open_cents ?? 0)}</option>)}
              </select>
            </div>
          )}
          {type === 'credit_note' && <div className="grid gap-1.5"><Label htmlFor="sp-ref">{t('Nummer creditnota')}</Label><Input id="sp-ref" maxLength={80} value={ref} onChange={(e) => setRef(e.target.value)} /></div>}
          <div className="grid gap-1.5"><Label htmlFor="sp-note">{t('Omschrijving')}</Label><Input id="sp-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('bijv. bankoverschrijving 19 nov')} /></div>
          {error && <p role="alert" className="text-destructive text-sm">{t(error)}</p>}
          <div><Button disabled={busy}>{t('Boeken')}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
