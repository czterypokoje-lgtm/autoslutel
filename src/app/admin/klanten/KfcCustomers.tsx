'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Balance, Customer, CustomerInput } from '@/lib/kfcReceivables';

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
          <h1 className="text-2xl font-semibold tracking-tight">Klanten</h1>
          <p className="text-muted-foreground text-sm">Zakelijke klanten met een rekening: dealers, slotenmakers, garages. {rows.length} {view === 'overdue' ? 'met vervallen bedragen' : 'klanten'}{overdueTotal > 0 && ` · ${MONEY.format(overdueTotal / 100)} vervallen`}.</p>
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
        <Button asChild size="sm" variant={view === 'all' ? 'default' : 'ghost'}><Link href="/admin/klanten">Alle klanten</Link></Button>
        <Button asChild size="sm" variant={view === 'overdue' ? 'default' : 'ghost'}><Link href="/admin/klanten?view=overdue">Vadesi geçen · Vervallen</Link></Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Bedrijf</TableHead><TableHead>Termijn</TableHead><TableHead className="text-right">Open</TableHead><TableHead className="text-right">Vervallen</TableHead><TableHead>Oudste vervallen</TableHead><TableHead>Laatste boeking</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground py-10 text-center">{view === 'overdue' ? 'Niets vervallen.' : 'Nog geen klanten. Maak de eerste aan.'}</TableCell></TableRow>}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><Link className="font-medium underline-offset-4 hover:underline" href={`/admin/klanten/${r.id}`}>{r.company}</Link>{r.city && <span className="text-muted-foreground text-xs"> · {r.city}</span>}</TableCell>
                  <TableCell className="text-muted-foreground">{r.terms_days} dagen</TableCell>
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

const FIELDS: [keyof CustomerInput, string, string?][] = [
  ['company', 'Bedrijfsnaam'], ['contact_name', 'Contactpersoon'], ['email', 'E-mail', 'email'], ['phone', 'Telefoon'], ['vat_number', 'Btw-nummer'],
  ['street', 'Straat en nummer'], ['postcode', 'Postcode'], ['city', 'Plaats'], ['country', 'Land (code)'], ['terms_days', 'Betalingstermijn (dagen)', 'number'],
];

export function CustomerDialog({ customer, onSaved }: { customer?: Customer; onSaved: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Record<string, string>>(() => Object.fromEntries(FIELDS.map(([k]) => [k, customer ? String(customer[k as keyof Customer] ?? '') : k === 'terms_days' ? '30' : k === 'country' ? 'NL' : ''])));
  const [limit, setLimit] = useState(customer?.credit_limit_cents != null ? String(customer.credit_limit_cents / 100) : '');
  const [reverse, setReverse] = useState(customer?.reverse_charge ?? false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const payload: CustomerInput = { ...form, terms_days: Number(form.terms_days), credit_limit_cents: limit === '' ? null : Math.round(Number(limit.replace(',', '.')) * 100), reverse_charge: reverse } as CustomerInput;
    const result = await post(customer ? { action: 'update', id: customer.id, customer: payload } : { action: 'create', customer: payload });
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    setOpen(false); onSaved(customer?.id ?? result.id!);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{customer ? <Button variant="outline" size="sm">Gegevens wijzigen</Button> : <Button size="sm"><Plus className="size-4" /> Nieuwe klant</Button>}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{customer ? customer.company : 'Nieuwe zakelijke klant'}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map(([key, label, type]) => (
            <div key={key} className={`grid gap-1.5 ${key === 'company' || key === 'street' ? 'sm:col-span-2' : ''}`}>
              <Label htmlFor={`c-${key}`}>{label}</Label>
              <Input id={`c-${key}`} type={type ?? 'text'} required={key === 'company'} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <div className="grid gap-1.5"><Label htmlFor="c-limit">Kredietlimiet € (leeg = geen)</Label><Input id="c-limit" inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} /></div>
          <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" className="size-4" checked={reverse} onChange={(e) => setReverse(e.target.checked)} /> Btw verlegd (EU-dealer)</label>
          {error && <p className="text-destructive text-sm sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2"><Button disabled={busy}>{customer ? 'Opslaan' : 'Klant aanmaken'}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
