'use client';

import { PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Balance, Customer } from '@/lib/kfcReceivables';
import { ACCOUNT_PROBLEMS, accountProblem, customerFromForm, normalizeIban, normalizeKvk, normalizeVat } from '@/lib/accountValidation';
import AccountFields from './AccountFields';

export const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const api = '/api/admin/kfc-klanten';

export async function post(body: unknown): Promise<{ error?: string; id?: string }> {
  const r = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  const data = await r?.json().catch(() => null);
  return r?.ok ? (data ?? {}) : { error: data?.error ?? 'Opslaan mislukt.' };
}

export default function KfcCustomers({ rows, view, q }: { rows: (Customer & Balance)[]; view: 'all' | 'overdue'; q: string }) {
  const router = useRouter();
  const overdueTotal = rows.reduce((s, r) => s + r.overdue_cents, 0);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight"><PreviewText>{"Klanten"}</PreviewText></h1>
          <p className="text-muted-foreground text-sm"><PreviewText>{"Zakelijke klanten met een rekening: dealers, slotenmakers, garages."}</PreviewText> {rows.length} <PreviewText>{view === 'overdue' ? 'met vervallen bedragen' : 'klanten'}</PreviewText>{overdueTotal > 0 && ` · ${MONEY.format(overdueTotal / 100)} vervallen`}.</p>
        </div>
        <div className="flex gap-2">
          <form method="get" action="/admin/klanten" className="relative">
            {view === 'overdue' && <input type="hidden" name="view" value="overdue" />}
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input name="q" defaultValue={q} placeholder="Zoek bedrijf" className="w-56 pl-8" />
          </form>
          <CustomerDialog onSaved={(id) => router.push(`/admin/klanten/${id}`)} />
        </div>
      </div>
      <div className="flex gap-1 self-start rounded-lg border p-1">
        <Button asChild size="sm" variant={view === 'all' ? 'default' : 'ghost'}><Link href="/admin/klanten"><PreviewText>{"Alle klanten"}</PreviewText></Link></Button>
        <Button asChild size="sm" variant={view === 'overdue' ? 'default' : 'ghost'}><Link href="/admin/klanten?view=overdue"><PreviewText>{"Vadesi geçen · Vervallen"}</PreviewText></Link></Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead><PreviewText>{"Bedrijf"}</PreviewText></TableHead><TableHead><PreviewText>{"Termijn"}</PreviewText></TableHead><TableHead className="text-right">Open</TableHead><TableHead className="text-right"><PreviewText>{"Vervallen"}</PreviewText></TableHead><TableHead><PreviewText>{"Oudste vervallen"}</PreviewText></TableHead><TableHead><PreviewText>{"Laatste boeking"}</PreviewText></TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground py-10 text-center"><PreviewText>{view === 'overdue' ? 'Niets vervallen.' : 'Nog geen klanten. Maak de eerste aan.'}</PreviewText></TableCell></TableRow>}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link className="font-medium underline-offset-4 hover:underline" href={`/admin/klanten/${r.id}`}>{r.company}</Link>{r.city && <span className="text-muted-foreground text-xs"> · {r.city}</span>}</TableCell>
                  <TableCell className="text-muted-foreground">{r.terms_days} <PreviewText>{"dagen"}</PreviewText></TableCell>
                  <TableCell className="text-right tabular-nums">{MONEY.format(r.open_cents / 100)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.overdue_cents > 0 ? <Badge variant="destructive">{MONEY.format(r.overdue_cents / 100)}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-muted-foreground">{r.oldest_overdue ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{r.last_entry ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Open or edit a customer account. One form for every cari (AccountFields):
 * a company needs KvK, BTW, address and invoice e-mail; the server checks
 * the same rules again (kfcReceivables.cleanCustomer).
 */
export function CustomerDialog({ customer, onSaved }: { customer?: Customer; onSaved: (id: string) => void }) {
  const { t } = usePreviewLanguage();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    const payload = customerFromForm(new FormData(e.currentTarget));
    const problem = accountProblem({
      kind: payload.account_kind, name: payload.company, kvk: normalizeKvk(payload.kvk), vat_number: normalizeVat(payload.vat_number), street: payload.street,
      postcode: payload.postcode, city: payload.city, country: payload.country.toUpperCase(), invoice_email: payload.invoice_email, email: payload.email,
      iban: normalizeIban(payload.iban), terms_days: payload.terms_days, credit_limit_cents: payload.credit_limit_cents,
    });
    if (problem) { setError(ACCOUNT_PROBLEMS[problem]); return; }
    setBusy(true);
    const result = await post(customer ? { action: 'update', id: customer.id, customer: payload } : { action: 'create', customer: payload });
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    setOpen(false); onSaved(customer?.id ?? result.id!);
  }
  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); setError(''); }}>
      <DialogTrigger asChild>{customer ? <Button variant="outline" size="sm"><PreviewText>{"Gegevens wijzigen"}</PreviewText></Button> : <Button size="sm"><Plus className="size-4" /> <PreviewText>{"Nieuwe klant"}</PreviewText></Button>}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{customer ? customer.company : t('Nieuw klantaccount')}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid gap-4">
          <AccountFields initial={customer ?? {}} defaultKind="company" idPrefix={customer ? `c-${customer.id}` : 'c-new'} />
          {error && <p role="alert" className="text-destructive text-sm">{t(error)}</p>}
          <div><Button disabled={busy}><PreviewText>{customer ? 'Opslaan' : 'Klant aanmaken'}</PreviewText></Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
