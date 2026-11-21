'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Technician = { id: string; name: string; active: boolean };
type Bin = { id: string; shelf: string; box: string };

export default function VanTransferForm({ technicians, bins }: { technicians: Technician[]; bins: Bin[] }) {
  const operation = useRef<{ id: string; fingerprint: string } | null>(null);
  const sending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [toVan, setToVan] = useState(true);
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);
  const selectStyle = 'h-9 w-full rounded-md border bg-background px-2';
  const options = technicians.filter((tech) => !toVan || tech.active);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const values = new FormData(event.currentTarget);
    const payload = {
      action: 'transfer',
      article: String(values.get('article')).trim().toUpperCase(),
      quantity: Number(values.get('quantity')),
      location: String(values.get('bin')),
      target: String(values.get('technician')),
      toVan,
    };
    const fingerprint = JSON.stringify(payload);
    if (operation.current?.fingerprint !== fingerprint) operation.current = { id: crypto.randomUUID(), fingerprint };
    sending.current = true;
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch('/api/admin/van-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: operation.current.id }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) throw new Error(result?.error ?? 'Opslaan mislukt.');
      operation.current = null;
      setStatus({ text: 'Verplaatsing geboekt in het voorraadjournaal.', error: false });
    } catch (issue) {
      setStatus({ text: issue instanceof Error ? issue.message : 'Opslaan mislukt.', error: true });
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="grid gap-4 text-sm">
        <label className="grid gap-1">
          Richting
          <select className={selectStyle} value={toVan ? 'bus' : 'magazijn'} onChange={(event) => setToVan(event.target.value === 'bus')}>
            <option value="bus">Hoofdmagazijn naar servicebus</option>
            <option value="magazijn">Servicebus naar hoofdmagazijn</option>
          </select>
        </label>
        <label className="grid gap-1">
          Artikelcode
          <Input name="article" required maxLength={50} autoCapitalize="characters" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            Magazijnlocatie
            <select name="bin" className={selectStyle} required defaultValue="">
              <option value="" disabled>Kies een locatie</option>
              {bins.map((bin) => <option key={bin.id} value={bin.id}>{bin.shelf} / {bin.box}</option>)}
            </select>
          </label>
          <label className="grid gap-1">
            Servicebus
            <select name="technician" className={selectStyle} required defaultValue="" key={String(toVan)}>
              <option value="" disabled>Kies een servicebus</option>
              {options.map((tech) => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
            </select>
          </label>
        </div>
        <label className="grid max-w-32 gap-1">
          Aantal
          <Input name="quantity" type="number" required min={1} max={2147483647} step={1} defaultValue={1} />
        </label>
        {status && <p role={status.error ? 'alert' : 'status'} className={status.error ? 'text-destructive' : 'text-muted-foreground'}>{status.text}</p>}
        <Button type="submit" className="justify-self-start" disabled={!bins.length || !options.length}>Verplaatsen</Button>
      </fieldset>
    </form>
  );
}
