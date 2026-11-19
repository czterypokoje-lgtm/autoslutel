'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { BankLine, Suggestion } from '@/lib/kfcBank';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const api = '/api/admin/kfc-bank';
async function post(body: unknown): Promise<{ error?: string; added?: number; skipped?: number; ignored?: number }> {
  const r = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  const data = await r?.json().catch(() => null);
  return r?.ok ? (data ?? {}) : { error: data?.error ?? 'Opslaan mislukt.' };
}
const TABS: ['open' | 'matched' | 'ignored', string, string][] = [['open', 'transacties', 'Te koppelen'], ['matched', 'betalingen', 'Gekoppeld'], ['ignored', 'rekeningen', 'Apart gezet']];

export default function KfcBank({ view, lines, suggestions, customers }: { view: 'open' | 'matched' | 'ignored'; lines: BankLine[]; suggestions: Record<string, Suggestion[]>; customers: { id: string; company: string }[] }) {
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [choice, setChoice] = useState<Record<string, string>>({});

  async function upload(f: File) {
    setBusy('upload'); setNote('');
    const r = await post({ action: 'import', text: await f.text() });
    setBusy('');
    setNote(r.error ?? `${r.added} regels toegevoegd (${r.ignored} apart gezet: uitgaand of betaalprovider), ${r.skipped} al bekend.`);
    router.refresh();
  }
  async function act(key: string, body: unknown) {
    setBusy(key); setNote('');
    const r = await post(body);
    setBusy(''); if (r.error) setNote(r.error);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bank</h1>
          <p className="text-muted-foreground text-sm">Bankafschrift (CAMT.053 of CSV) naast de openstaande facturen. Een ontvangen bedrag koppelt u aan een klant; dat boekt de betaling.</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={file} type="file" accept=".xml,.csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button size="sm" disabled={busy === 'upload'} onClick={() => file.current?.click()}><Upload className="size-4" /> Afschrift importeren</Button>
          <Button asChild size="sm" variant="outline"><Link href="/admin/klanten?view=overdue">Vervallen klanten</Link></Button>
        </div>
      </div>
      <div className="flex max-w-full gap-1 self-start overflow-x-auto rounded-lg border p-1">
        {TABS.map(([key, slug, label]) => <Button key={key} asChild size="sm" variant={view === key ? 'default' : 'ghost'}><Link href={`/admin/bank/${slug}`}>{label}</Link></Button>)}
      </div>
      {note && <p className="text-muted-foreground text-sm">{note}</p>}
      <Card>
        <CardHeader><CardTitle className="text-base">{TABS.find((t) => t[0] === view)?.[2]} · {lines.length}</CardTitle><CardDescription>{view === 'open' ? 'Ontvangen bedragen zonder boeking. Het voorstel (★) komt uit factuurnummer, bedrag of klantnaam.' : view === 'matched' ? 'Geboekt als betaling op de rekening van de klant.' : 'Uitgaand, betaalprovider-uitbetalingen (Mollie e.d.) en handmatig apart gezet.'}</CardDescription></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Datum</TableHead><TableHead>Tegenpartij</TableHead><TableHead>Omschrijving</TableHead><TableHead className="text-right">Bedrag</TableHead><TableHead>{view === 'open' ? 'Koppelen aan' : view === 'matched' ? 'Boeking' : 'Reden'}</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {lines.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground py-10 text-center">{view === 'open' ? 'Niets te koppelen. Importeer een afschrift.' : 'Nog niets.'}</TableCell></TableRow>}
              {lines.map((line) => {
                const sug = suggestions[line.id] ?? [];
                const picked = choice[line.id] ?? (sug[0] ? `${sug[0].customer_id}|${sug[0].invoice_entry_id ?? ''}` : '');
                return (
                  <TableRow key={line.id}>
                    <TableCell className="whitespace-nowrap">{line.booked_on}</TableCell>
                    <TableCell><div className="font-medium">{line.counterparty_name ?? '—'}</div><div className="text-muted-foreground text-xs">{line.counterparty_iban}</div></TableCell>
                    <TableCell className="text-muted-foreground max-w-80 truncate text-xs">{line.description}</TableCell>
                    <TableCell className={`text-right tabular-nums ${line.amount_cents < 0 ? 'text-muted-foreground' : 'font-medium'}`}>{MONEY.format(line.amount_cents / 100)}</TableCell>
                    <TableCell>
                      {view === 'open' && (
                        <select className="border-input h-8 max-w-72 rounded-md border bg-transparent px-2 text-sm" value={picked} onChange={(e) => setChoice({ ...choice, [line.id]: e.target.value })}>
                          <option value="">Kies klant…</option>
                          {sug.map((s) => <option key={`${s.customer_id}|${s.invoice_entry_id ?? ''}`} value={`${s.customer_id}|${s.invoice_entry_id ?? ''}`}>★ {s.company}{s.invoice_number ? ` · ${s.invoice_number}` : ''} ({s.reason})</option>)}
                          {customers.filter((c) => !sug.some((s) => s.customer_id === c.id)).map((c) => <option key={c.id} value={`${c.id}|`}>{c.company}</option>)}
                        </select>
                      )}
                      {view === 'matched' && <Badge variant="secondary">betaling #{line.matched_entry_id}</Badge>}
                      {view === 'ignored' && <Badge variant="outline">{line.ignore_reason}</Badge>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {view === 'open' && <>
                        <Button size="sm" disabled={!picked || busy === line.id} onClick={() => { const [customer, inv] = picked.split('|'); act(line.id, { action: 'match', line: line.id, customer, invoice_entry_id: inv ? Number(inv) : null, key: crypto.randomUUID() }); }}>Boek</Button>
                        <Button size="sm" variant="ghost" disabled={busy === line.id} onClick={() => act(line.id, { action: 'status', line: line.id, status: 'ignored' })}>Apart</Button>
                      </>}
                      {view === 'ignored' && line.amount_cents > 0 && <Button size="sm" variant="ghost" onClick={() => act(line.id, { action: 'status', line: line.id, status: 'open' })}>Terug</Button>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
