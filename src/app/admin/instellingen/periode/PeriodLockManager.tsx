'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PeriodLockState } from '@/lib/kfcPeriodLock';

/* Phone: 16px text and 44px targets; desktop keeps the compact size. */
const FIELD = 'h-11 text-base md:h-9 md:text-sm';
const BUTTON = 'h-11 md:h-9';

const day = (iso: string | null) =>
  iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' }) : '—';
const moment = (iso: string) =>
  new Date(iso).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Amsterdam' });
const person = (email: string | null, id: string | null) => email ?? (id ? `${id.slice(0, 8)}…` : '—');

export default function PeriodLockManager({ initial, canManage, defaultUntil, latest }: {
  initial: PeriodLockState; canManage: boolean; defaultUntil: string; /** yesterday: today cannot be locked */ latest: string;
}) {
  const [state, setState] = useState(initial);
  const [until, setUntil] = useState(defaultUntil);
  const [reopenUntil, setReopenUntil] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [pending, start] = useTransition();
  const lock = state.lock;

  function send(body: { until: string | null; note?: string }, success: string) {
    setError('');
    setDone('');
    start(async () => {
      try {
        const res = await fetch('/api/admin/kfc-period', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setError(data.error ?? 'Opslaan mislukt.'); return; }
        setState(data as PeriodLockState);
        setNote('');
        setReopenUntil('');
        setDone(success);
      } catch {
        setError('Geen verbinding. Probeer het opnieuw.');
      }
    });
  }

  function close(event: FormEvent) {
    event.preventDefault();
    if (!until) { setError('Kies een datum.'); return; }
    send({ until }, `Afgesloten t/m ${day(until)}.`);
  }

  function reopen(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) { setError('Schrijf bij heropenen kort waarom.'); return; }
    const target = reopenUntil || null;
    if (target && lock && target >= lock.locked_until) { setError('Kies een datum vóór de huidige afsluitdatum, of laat het veld leeg om alles te heropenen.'); return; }
    send({ until: target, note: note.trim() }, target ? `Heropend: nu afgesloten t/m ${day(target)}.` : 'Heropend: er is geen periode meer afgesloten.');
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {lock ? <Lock className="size-5" aria-hidden /> : <LockOpen className="size-5" aria-hidden />}
            {lock ? `Boeken afgesloten t/m ${day(lock.locked_until)}` : 'Geen periode afgesloten'}
          </CardTitle>
          {lock && (
            <CardDescription>
              Door {person(lock.set_by_email, lock.set_by)} op {moment(lock.set_at)}{lock.note ? ` — ${lock.note}` : ''}
            </CardDescription>
          )}
        </CardHeader>
        {canManage ? (
          <CardContent className="grid gap-6">
            <form onSubmit={close} className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_auto] sm:items-end">
              <div className="grid gap-1.5">
                <Label htmlFor="period-until">Afsluiten t/m</Label>
                <Input id="period-until" type="date" className={FIELD} value={until} max={latest}
                  onChange={(e) => setUntil(e.target.value)} required />
              </div>
              <Button type="submit" className={BUTTON} disabled={pending}><Lock /> Sluit af t/m</Button>
            </form>

            {lock && (
              <form onSubmit={reopen} className="grid gap-3 border-t pt-4">
                <p className="text-sm font-medium">Heropenen</p>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
                  <div className="grid gap-1.5">
                    <Label htmlFor="period-reopen">Nieuwe afsluitdatum (leeg = alles open)</Label>
                    <Input id="period-reopen" type="date" className={FIELD} value={reopenUntil} onChange={(e) => setReopenUntil(e.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="period-note">Waarom heropenen? (verplicht)</Label>
                    <Input id="period-note" className={FIELD} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} required
                      placeholder="Bijv. factuur 2026-0412 had een verkeerd bedrag" />
                  </div>
                </div>
                <div><Button type="submit" variant="outline" className={BUTTON} disabled={pending}><LockOpen /> Heropenen</Button></div>
              </form>
            )}
          </CardContent>
        ) : (
          <CardContent><p className="text-muted-foreground text-sm">Alleen de eigenaar kan een periode afsluiten of heropenen.</p></CardContent>
        )}
      </Card>

      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      {done && <p role="status" className="text-sm text-emerald-700">{done}</p>}

      <Card>
        <CardHeader><CardTitle>Geschiedenis</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Door</TableHead>
                <TableHead>Oud → nieuw</TableHead>
                <TableHead>Notitie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.log.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">{moment(row.set_at)}</TableCell>
                  <TableCell>{person(row.set_by_email, row.set_by)}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.old_until ? day(row.old_until) : 'open'} → {row.new_until ? day(row.new_until) : 'open'}</TableCell>
                  <TableCell className="whitespace-normal">{row.note ?? ''}</TableCell>
                </TableRow>
              ))}
              {state.log.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-muted-foreground py-6 text-center">Nog geen wijzigingen.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
