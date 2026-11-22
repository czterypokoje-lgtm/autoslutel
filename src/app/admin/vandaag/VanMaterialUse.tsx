'use client';

import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { VanStock } from '@/lib/vanStock';

type Operation = { id: string; article: string; location: string; target: string; quantity: number; error?: string };
type VanContext = { stock: VanStock; pending: Operation[]; busy: boolean; record: (operation: Operation) => void };
const Van = createContext<VanContext | null>(null);

export function VanMaterialQueue({ owner, stock, children }: { owner: string; stock: VanStock; children: ReactNode }) {
  const router = useRouter();
  const prefix = 'crm:van-material:' + owner + ':';
  const [pending, setPending] = useState<Operation[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const running = useRef(false);

  function read() {
    return Object.keys(localStorage).filter((key) => key.startsWith(prefix)).map((key) => {
      try { return JSON.parse(localStorage.getItem(key) ?? 'null') as Operation | null; }
      catch { return null; }
    }).filter((operation): operation is Operation => operation !== null);
  }

  async function sync() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    let synced = 0;
    try {
      const current = read();
      setPending(current);
      if (!navigator.onLine) return;
      for (const operation of current) {
        const { error, ...payload } = operation;
        try {
          const response = await fetch('/api/admin/van-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'use', ...payload }),
            signal: AbortSignal.timeout(15000),
          });
          const result = await response.json().catch(() => null);
          if (response.ok && result?.ok === true) {
            localStorage.removeItem(prefix + operation.id);
            synced++;
          } else if (response.status < 500 && ![408, 429].includes(response.status) && localStorage.getItem(prefix + operation.id)) {
            localStorage.setItem(prefix + operation.id, JSON.stringify({
              ...payload, error: result?.error ?? error ?? 'Synchronisatie geweigerd.',
            }));
          }
        } catch {
          break; // The stored operation keeps its ID even if the request reached the server.
        }
      }
      setPending(read());
    } catch {
      setNotice('Lokale opslag is niet beschikbaar.');
    } finally {
      running.current = false;
      setBusy(false);
      if (synced) {
        setNotice(synced === 1 ? '1 materiaalboeking gesynchroniseerd.' : synced + ' materiaalboekingen gesynchroniseerd.');
        router.refresh();
      }
    }
  }

  const syncRef = useRef(sync);
  useEffect(() => { syncRef.current = sync; });
  useEffect(() => {
    const resume = () => { void syncRef.current(); };
    const storageChanged = (event: StorageEvent) => {
      if (event.key?.startsWith(prefix) && event.oldValue === null) resume();
    };
    const timer = window.setTimeout(resume, 0);
    window.addEventListener('online', resume);
    window.addEventListener('focus', resume);
    window.addEventListener('storage', storageChanged);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('online', resume);
      window.removeEventListener('focus', resume);
      window.removeEventListener('storage', storageChanged);
    };
  }, [prefix]);
  useEffect(() => {
    if (!pending.some((operation) => !operation.error)) return;
    const timer = window.setInterval(() => {
      if (navigator.onLine) void syncRef.current();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [pending]);

  function record(operation: Operation) {
    if (running.current) return;
    const queued = read();
    if (queued.some((item) => item.target === operation.target && item.article === operation.article)) {
      throw new Error('Synchroniseer eerst de open boeking voor dit artikel.');
    }
    const available = stock.items.find((item) => item.code === operation.article)?.quantity ?? 0;
    const waiting = queued.filter((item) => item.article === operation.article).reduce((sum, item) => sum + item.quantity, 0);
    if (operation.quantity > available - waiting) throw new Error('Onvoldoende voorraad in de servicebus.');
    localStorage.setItem(prefix + operation.id, JSON.stringify(operation));
    setNotice('');
    void sync();
  }

  return (
    <Van.Provider value={{ stock, pending, busy, record }}>
      {(pending.length > 0 || notice) && (
        <div className="mx-auto my-2 max-w-2xl rounded-lg border bg-card p-3 text-sm text-card-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span role="status">{pending.length ? pending.length + ' materiaalboeking(en) wachten op synchronisatie.' : notice}</span>
            {pending.length > 0 && <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void sync()}>Opnieuw synchroniseren</Button>}
          </div>
          {pending.map((operation) => (
            <p key={operation.id} className={operation.error ? 'text-destructive' : 'text-muted-foreground'}>
              {operation.quantity} × {operation.article}{operation.error && ' · ' + operation.error}
            </p>
          ))}
        </div>
      )}
      {children}
    </Van.Provider>
  );
}

export default function VanMaterialUse({ jobId }: { jobId: string }) {
  const van = useContext(Van);
  const [article, setArticle] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  if (!van) return null;
  const { stock, pending, busy, record } = van;
  const selected = stock.items.find((item) => item.code === article);
  const waiting = pending.filter((operation) => operation.article === article).reduce((sum, operation) => sum + operation.quantity, 0);
  const available = (selected?.quantity ?? 0) - waiting;
  const alreadyQueued = pending.some((operation) => operation.target === jobId && operation.article === article);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      record({ id: crypto.randomUUID(), article, location: stock.location, target: jobId, quantity });
      setArticle('');
      setQuantity(1);
      setError('');
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Lokaal opslaan mislukt.');
    }
  }

  return (
    <form onSubmit={submit} className="mx-3 mb-3 space-y-3 rounded-lg border bg-card p-3 text-sm text-card-foreground">
      <div>
        <h3 className="font-semibold">Materiaal uit de servicebus</h3>
        <p className="text-muted-foreground">Locatie: {stock.label}</p>
      </div>
      {stock.items.length ? (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem]">
          <label className="grid gap-1">
            Artikel
            <select required value={article} onChange={(event) => setArticle(event.target.value)} className="h-9 w-full rounded-md border bg-background px-2">
              <option value="">Kies een artikel</option>
              {stock.items.map((item) => <option key={item.code} value={item.code}>{item.name} · {item.code} ({item.quantity})</option>)}
            </select>
          </label>
          <label className="grid gap-1">
            Aantal
            <Input required type="number" min={1} max={Math.max(1, available)} step={1} value={quantity} onChange={(event) => setQuantity(event.target.valueAsNumber || 0)} />
          </label>
        </div>
      ) : <p className="text-muted-foreground">Geen artikelen in deze servicebus.</p>}
      {selected && <p className="text-muted-foreground">Beschikbaar: {Math.max(0, available)} · Boeking: {quantity} × {selected.name}</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {alreadyQueued && <p className="text-muted-foreground">Voor dit artikel wacht al een boeking.</p>}
      {stock.items.length > 0 && <Button type="submit" disabled={busy || alreadyQueued || quantity < 1 || quantity > available}>Gebruik vastleggen</Button>}
    </form>
  );
}
