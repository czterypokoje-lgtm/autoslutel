'use client';

import { PreviewText } from '@/app/admin/PreviewLanguage';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Mail, Printer, Undo2, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomerDialog, MONEY, post } from './KfcCustomers';
import type { Balance, Customer, Entry, EntryType } from '@/lib/kfcReceivables';

const TYPE: Record<EntryType, string> = { invoice: 'Factuur', payment: 'Betaling', credit_note: 'Creditnota', refund: 'Terugbetaling', opening: 'Beginsaldo', write_off: 'Afgeboekt', reversal: 'Tegenboeking' };
const BUCKETS: [keyof Balance, string][] = [['not_due', 'Nog niet vervallen'], ['d1_30', '1–30 dagen'], ['d31_60', '31–60'], ['d61_90', '61–90'], ['d90p', '> 90']];

export default function KfcCustomerCard({ customer, balance, entries, openInvoices }: { customer: Customer; balance: Balance; entries: Entry[]; openInvoices: Entry[] }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(0);
  async function reverse(entry: Entry) {
    if (!window.confirm(`Boeking #${entry.id} (${TYPE[entry.entry_type]} ${MONEY.format(Math.abs(entry.amount_cents) / 100)}) tegenboeken?`)) return;
    setBusy(entry.id);
    const r = await post({ action: 'reverse', entry: entry.id, key: crypto.randomUUID() });
    setBusy(0); setNote(r.error ?? 'Tegengeboekt.'); router.refresh();
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2"><Link href="/admin/klanten">← Klanten</Link></Button>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.company}</h1>
          <p className="text-muted-foreground text-sm">{[customer.contact_name, customer.email, customer.phone].filter(Boolean).join(' · ')}</p>
          <p className="text-muted-foreground text-sm">{[customer.kvk && `KvK ${customer.kvk}`, customer.vat_number && `Btw ${customer.vat_number}`, customer.iban, customer.invoice_email && `Facturen: ${customer.invoice_email}`].filter(Boolean).join(' · ')}</p>
          {customer.street && <p className="text-muted-foreground text-sm">{customer.street}, {customer.postcode} {customer.city} {customer.country !== 'NL' && customer.country}</p>}
          {customer.account_kind === 'company' && !(customer.kvk || customer.country !== 'NL') && <p className="text-destructive text-sm"><PreviewText>{"KvK-nummer ontbreekt. Vul de bedrijfsgegevens aan."}</PreviewText></p>}
          <p className="text-muted-foreground text-sm">Betalingstermijn {customer.terms_days} <PreviewText>{"dagen"}</PreviewText>{customer.credit_limit_cents != null && ` · limiet ${MONEY.format(customer.credit_limit_cents / 100)}`}{customer.reverse_charge && ' · btw verlegd'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <EntryDialog customer={customer} openInvoices={openInvoices} onSaved={(m) => { setNote(m); router.refresh(); }} />
          <Button asChild variant="outline" size="sm"><Link href={`/admin/facturen/nieuw?klant=${customer.id}`}><FileText className="size-4" /> <PreviewText>{"Nieuwe factuur"}</PreviewText></Link></Button>
          <Button asChild variant="outline" size="sm"><Link href={`/admin/klanten/${customer.id}/ekstre`} target="_blank"><Printer className="size-4" /> Ekstre · Rekeningoverzicht</Link></Button>
          {customer.email && balance.overdue_cents > 0 && (
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${customer.email}?subject=${encodeURIComponent(`Herinnering openstaande facturen · ${customer.company}`)}&body=${encodeURIComponent(
                `Beste ${customer.contact_name ?? customer.company},\n\nVolgens onze administratie staan onderstaande facturen nog open:\n\n` +
                openInvoices.map((e) => `- ${e.invoice_number ?? 'Factuur'} van ${e.entry_date}, vervallen op ${e.due_date ?? '-'}: ${MONEY.format((e.open_cents ?? 0) / 100)}`).join('\n') +
                `\n\nTotaal open: ${MONEY.format(balance.open_cents / 100)}, waarvan vervallen ${MONEY.format(balance.overdue_cents / 100)}.\nZou u dit binnen 7 dagen willen voldoen? Is er al betaald, dan mag u dit bericht negeren.\n\nMet vriendelijke groet,\nKeyForCars`)}`}>
                <Mail className="size-4" /> Herinnering
              </a>
            </Button>
          )}
          <CustomerDialog customer={customer} onSaved={() => router.refresh()} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardHeader className="pb-1"><CardDescription><PreviewText>{"Open saldo · Açık bakiye"}</PreviewText></CardDescription><CardTitle className="text-3xl tabular-nums">{MONEY.format(balance.open_cents / 100)}</CardTitle></CardHeader><CardContent className="text-muted-foreground text-xs"><PreviewText>{balance.open_cents < 0 ? 'Tegoed van de klant' : 'Wat de klant nog moet betalen'}</PreviewText></CardContent></Card>
        <Card className={balance.overdue_cents > 0 ? 'border-destructive/50 bg-destructive/5' : undefined}><CardHeader className="pb-1"><CardDescription><PreviewText>{"Vervallen · Vadesi geçen"}</PreviewText></CardDescription><CardTitle className={`text-3xl tabular-nums ${balance.overdue_cents > 0 ? 'text-destructive' : ''}`}>{MONEY.format(balance.overdue_cents / 100)}</CardTitle></CardHeader><CardContent className="text-muted-foreground text-xs">{balance.oldest_overdue ? `oudste vervaldatum ${balance.oldest_overdue}` : 'niets over de vervaldatum'}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base"><PreviewText>{"Ouderdom · Yaşlandırma"}</PreviewText></CardTitle><CardDescription><PreviewText>{"Open facturen naar vervaldatum. Elke kolom is een link naar die facturen."}</PreviewText></CardDescription></CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {BUCKETS.map(([key, label]) => (
            <a key={key} href="#open" className={`rounded-lg border p-3 ${Number(balance[key]) > 0 && key !== 'not_due' ? 'border-destructive/40' : ''}`}>
              <div className="text-muted-foreground text-xs">{label}</div>
              <div className="font-semibold tabular-nums">{MONEY.format(Number(balance[key]) / 100)}</div>
            </a>
          ))}
        </CardContent>
      </Card>

      {openInvoices.length > 0 && (
        <Card id="open">
          <CardHeader><CardTitle className="text-base"><PreviewText>{"Open facturen"}</PreviewText></CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead><PreviewText>{"Factuur"}</PreviewText></TableHead><TableHead><PreviewText>{"Datum"}</PreviewText></TableHead><TableHead><PreviewText>{"Vervalt"}</PreviewText></TableHead><TableHead className="text-right"><PreviewText>{"Bedrag"}</PreviewText></TableHead><TableHead className="text-right">Open</TableHead></TableRow></TableHeader>
              <TableBody>
                {openInvoices.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.sales_invoice_id ? <Link className="font-medium underline-offset-4 hover:underline" href={`/admin/facturen/${e.sales_invoice_id}`}>{e.invoice_number ?? 'factuur'}</Link> : TYPE[e.entry_type]}</TableCell>
                    <TableCell>{e.entry_date}</TableCell>
                    <TableCell>{e.due_date && e.due_date < new Date().toISOString().slice(0, 10) ? <Badge variant="destructive">{e.due_date}</Badge> : e.due_date ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{MONEY.format(e.amount_cents / 100)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{MONEY.format((e.open_cents ?? 0) / 100)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base"><PreviewText>{"Boekingen"}</PreviewText></CardTitle><CardDescription><PreviewText>{"Nieuwste eerst. Een fout wordt tegengeboekt, nooit gewijzigd."}</PreviewText></CardDescription></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead><PreviewText>{"Datum"}</PreviewText></TableHead><TableHead><PreviewText>{"Soort"}</PreviewText></TableHead><TableHead><PreviewText>{"Omschrijving"}</PreviewText></TableHead><TableHead className="text-right"><PreviewText>{"Debet"}</PreviewText></TableHead><TableHead className="text-right">Credit</TableHead><TableHead className="text-right"><PreviewText>{"Saldo"}</PreviewText></TableHead><TableHead className="w-10" /></TableRow></TableHeader>
            <TableBody>
              {entries.length === 0 && <TableRow><TableCell colSpan={7} className="text-muted-foreground py-8 text-center"><PreviewText>{"Nog geen boekingen."}</PreviewText></TableCell></TableRow>}
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap">{e.entry_date}</TableCell>
                  <TableCell><Badge variant={e.entry_type === 'invoice' ? 'default' : e.entry_type === 'reversal' ? 'outline' : 'secondary'}>{TYPE[e.entry_type]}</Badge></TableCell>
                  <TableCell className="text-sm">{e.invoice_number ? <Link className="underline-offset-4 hover:underline" href={`/admin/facturen/${e.sales_invoice_id}`}>{e.note ?? e.invoice_number}</Link> : (e.note ?? '')}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.amount_cents > 0 ? MONEY.format(e.amount_cents / 100) : ''}</TableCell>
                  <TableCell className="text-right tabular-nums">{e.amount_cents < 0 ? MONEY.format(-e.amount_cents / 100) : ''}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{MONEY.format((e.running_cents ?? 0) / 100)}</TableCell>
                  <TableCell>{e.entry_type !== 'reversal' && <Button variant="ghost" size="icon" aria-label="Tegenboeken" disabled={busy === e.id} onClick={() => reverse(e)}><Undo2 className="size-4" /></Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {note && <p className="text-muted-foreground px-6 py-3 text-sm">{note}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function EntryDialog({ customer, openInvoices, onSaved }: { customer: Customer; openInvoices: Entry[]; onSaved: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'payment' | 'credit_note' | 'refund' | 'opening' | 'write_off'>('payment');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [text, setText] = useState('');
  const [invoice, setInvoice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const cents = Math.round(Number(amount.replace(',', '.')) * 100);
    const allocations = invoice ? [{ invoice_entry_id: Number(invoice), amount_cents: Math.abs(cents) }] : null;
    const r = await post({ action: 'entry', customer: customer.id, type, amount_cents: cents, entry_date: date, note: text, allocations, key: crypto.randomUUID() });
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    setOpen(false); setAmount(''); setText(''); setInvoice('');
    onSaved('Geboekt.');
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Wallet className="size-4" /> Tahsilat ekle · Betaling boeken</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Boeking voor {customer.company}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid gap-3">
          <div className="grid gap-1.5"><Label htmlFor="e-type"><PreviewText>{"Soort"}</PreviewText></Label>
            <select id="e-type" className="border-input h-9 rounded-md border bg-transparent px-3 text-sm" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="payment"><PreviewText>{"Betaling ontvangen"}</PreviewText></option><option value="credit_note"><PreviewText>{"Creditnota"}</PreviewText></option><option value="write_off"><PreviewText>{"Afboeken (klein restant)"}</PreviewText></option><option value="refund"><PreviewText>{"Terugbetaling aan klant"}</PreviewText></option><option value="opening"><PreviewText>{"Beginsaldo (± bedrag)"}</PreviewText></option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label htmlFor="e-amount"><PreviewText>{"Bedrag €"}</PreviewText></Label><Input id="e-amount" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="e-date"><PreviewText>{"Datum"}</PreviewText></Label><Input id="e-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          {(type === 'payment' || type === 'credit_note' || type === 'write_off') && openInvoices.length > 0 && (
            <div className="grid gap-1.5"><Label htmlFor="e-inv"><PreviewText>{"Op factuur"}</PreviewText></Label>
              <select id="e-inv" className="border-input h-9 rounded-md border bg-transparent px-3 text-sm" value={invoice} onChange={(e) => setInvoice(e.target.value)}>
                <option value=""><PreviewText>{"Oudste vervaldatum eerst (automatisch)"}</PreviewText></option>
                {openInvoices.map((i) => <option key={i.id} value={i.id}>{i.invoice_number ?? TYPE[i.entry_type]} · open {MONEY.format((i.open_cents ?? 0) / 100)}</option>)}
              </select>
            </div>
          )}
          <div className="grid gap-1.5"><Label htmlFor="e-note"><PreviewText>{"Omschrijving"}</PreviewText></Label><Input id="e-note" value={text} onChange={(e) => setText(e.target.value)} placeholder="bijv. bankoverschrijving 19 nov" /></div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div><Button disabled={busy}><PreviewText>{"Boeken"}</PreviewText></Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
