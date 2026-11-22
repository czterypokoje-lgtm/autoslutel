'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export async function postSync(body: unknown): Promise<Record<string, unknown> & { error?: string }> {
  const r = await fetch('/api/admin/kfc-woo-stock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
  const data = await r?.json().catch(() => null);
  return r?.ok ? (data ?? {}) : { error: data?.error ?? 'Mislukt.' };
}

type Result = { shop: string; mode: string; articles: number; updated: number; skipped: number; failed: number; error: string | null };
const summary = (results: Result[]) => results.length
  ? results.map((r) => `${r.shop}${r.mode === 'dry' ? ' (proef)' : ''}: ${r.updated} ${r.mode === 'dry' ? 'zou bijwerken' : 'bijgewerkt'}, ${r.skipped} gelijk, ${r.failed} fout${r.error ? ` · ${r.error}` : ''}`).join(' · ')
  : 'Niets te doen voor de webshops die aan staan.';

/** Queue-wide buttons: run now, dry run, queue everything. */
export function QueueActions({ anyActive }: { anyActive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  async function run(action: string, confirm?: string) {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(action); setNote('');
    const result = await postSync({ action });
    setBusy('');
    if (result.error) setNote(result.error);
    else if (action === 'enqueue-all') setNote(`${result.queued as number} artikelen in de wachtrij gezet.`);
    else if (action === 'preview') setNote(summary(result.results as Result[]));
    else setNote(result.skipped ? String(result.skipped) : `${result.claimed as number} artikelen verwerkt. ${summary(result.results as Result[])}`);
    router.refresh();
  }
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={!!busy || !anyActive} onClick={() => run('run')}>{busy === 'run' ? 'Bezig…' : 'Wachtrij nu verwerken'}</Button>
        <Button size="sm" variant="outline" disabled={!!busy || !anyActive} onClick={() => run('preview')}>{busy === 'preview' ? 'Bezig…' : 'Proefrun (niets versturen)'}</Button>
        <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run('enqueue-all', 'Alle gekoppelde artikelen opnieuw in de wachtrij zetten?')}>Alles opnieuw in de wachtrij</Button>
      </div>
      {note && <p role="status" className="text-muted-foreground text-sm">{note}</p>}
    </div>
  );
}

/** Push one article now, forced (also when its number did not change). */
export function PushOne({ anyActive }: { anyActive: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  return (
    <form className="grid gap-2" onSubmit={async (event) => {
      event.preventDefault();
      const article = code.trim().toUpperCase(); if (!article) return;
      setBusy(true); setNote('');
      const result = await postSync({ action: 'push-now', article });
      setBusy(false);
      setNote(result.error ?? ((result.results as Result[]).length ? summary(result.results as Result[]) : `${article} staat in geen enkele actieve webshop gekoppeld.`));
      router.refresh();
    }}>
      <div className="flex flex-wrap items-center gap-2">
        <input className="border-input h-9 w-56 rounded-md border bg-transparent px-2 text-sm" placeholder="Artikelcode, bv. KFC-1-2689" aria-label="Artikelcode" value={code} onChange={(e) => setCode(e.target.value)} disabled={busy} />
        <Button size="sm" disabled={busy || !anyActive || !code.trim()}>{busy ? 'Bezig…' : 'Nu pushen'}</Button>
      </div>
      {note && <p role="status" className="text-muted-foreground text-sm">{note}</p>}
    </form>
  );
}

/** Re-read one shop's products and rebuild its SKU mapping (read-only on the shop). */
export function RefreshMapping({ shop, configured }: { shop: string; configured: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  return (
    <div className="grid gap-1">
      <Button size="sm" variant="outline" disabled={busy || !configured} onClick={async () => {
        setBusy(true); setNote('Producten lezen…');
        const r = await postSync({ action: 'refresh-mapping', shop });
        setBusy(false);
        setNote(r.error ?? `${r.products} producten: ${r.ok} gekoppeld, ${r.unmapped} zonder artikel, ${r.ambiguous} dubbel, ${r.no_stock} zonder voorraadbeheer.`);
        router.refresh();
      }}>{busy ? 'Bezig…' : 'Koppelingen verversen'}</Button>
      {note && <span className="text-muted-foreground text-xs">{note}</span>}
    </div>
  );
}

/** Link one shop product to an article by hand, or remove the link. */
export function LinkArticle({ shop, product, variation, article, candidates }: { shop: string; product: number; variation: number; article: string | null; candidates: string[] }) {
  const router = useRouter();
  const [value, setValue] = useState(article ?? candidates[0] ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(next: string | null) {
    setBusy(true); setError('');
    const r = await postSync({ action: 'set-mapping', shop, product, variation, article: next });
    setBusy(false);
    if (r.error) setError(r.error); else router.refresh();
  }
  return (
    <form className="flex flex-wrap items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); save(value.trim() || null); }}>
      <input className="border-input h-8 w-36 rounded-md border bg-transparent px-2 text-xs" list={candidates.length ? `c-${shop}-${product}-${variation}` : undefined} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Artikelcode" aria-label="Artikelcode" disabled={busy} />
      {candidates.length > 0 && <datalist id={`c-${shop}-${product}-${variation}`}>{candidates.map((c) => <option key={c} value={c} />)}</datalist>}
      <Button size="sm" variant="outline" className="h-8" disabled={busy || !value.trim()}>Koppel</Button>
      {article && <Button size="sm" variant="ghost" className="h-8" type="button" disabled={busy} onClick={() => save(null)}>Loskoppelen</Button>}
      {error && <span className="text-destructive w-full text-xs">{error}</span>}
    </form>
  );
}
