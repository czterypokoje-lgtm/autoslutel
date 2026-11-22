'use client';

import { useEffect, useRef, useState } from 'react';
import { PreviewText, usePreviewLanguage } from '@/app/admin/PreviewLanguage';
import { Button } from '@/components/ui/button';

type Reservation = { id: string; article_code: string; quantity: number; state: 'reserved' | 'used' | 'released' };
type Stock = {
  reservations: Reservation[];
  locations: { id: string; shelf: string; box: string }[];
  canReserve: boolean;
  canRelease: boolean;
};

const labels = { reserved: 'Gereserveerd', used: 'Gebruikt', released: 'Vrijgegeven' };

export default function JobWarehouseStock({ jobId }: { jobId: string }) {
  const { t } = usePreviewLanguage();
  const url = '/api/admin/jobs/' + jobId + '/warehouse-stock';
  const [stock, setStock] = useState<Stock | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const retry = useRef<{ article: string; quantity: number; id: string } | null>(null);

  useEffect(() => {
    if (window.location.hash !== '#warehouse-stock-' + jobId) return;
    const controller = new AbortController();
    void fetch(url, { cache: 'no-store', signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error();
      const data: Stock = await response.json();
      if (!controller.signal.aborted) setStock(data);
    }).catch(() => {
      if (!controller.signal.aborted) setNote('Voorraad lezen mislukt.');
    });
    return () => controller.abort();
  }, [jobId, url]);

  async function load() {
    const response = await fetch(url, { cache: 'no-store' }).catch(() => null);
    if (response?.ok) setStock(await response.json());
    else setNote('Voorraad lezen mislukt.');
  }

  async function run(payload: Record<string, unknown>) {
    setBusy(true);
    setNote('');
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    }).catch(() => null);
    if (response?.ok) {
      if (payload.action === 'reserve') retry.current = null;
      await load();
    } else {
      const body = await response?.json().catch(() => null);
      setNote(body?.error ?? 'Opslaan mislukt.');
    }
    setBusy(false);
  }

  return <section id={'warehouse-stock-' + jobId} className="grid gap-3 rounded-lg border p-3">
    <div>
      <Button size="sm" variant="outline" disabled={busy} aria-expanded={Boolean(stock)} onClick={async () => {
        if (stock) { setStock(null); return; }
        setBusy(true);
        setNote('');
        await load();
        setBusy(false);
      }}><PreviewText>Magazijnvoorraad voor deze klus</PreviewText></Button>
    </div>
    {stock && <>
      {stock.canReserve && <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const article = String(form.get('article')).trim().toUpperCase();
        const quantity = Number(form.get('quantity'));
        if (retry.current?.article !== article || retry.current.quantity !== quantity) {
          retry.current = { article, quantity, id: crypto.randomUUID() };
        }
        void run({ action: 'reserve', ...retry.current });
      }}>
        <label className="grid gap-1 text-sm">{t('Artikelcode')}<input className="border-input rounded-md border bg-transparent px-2 py-1" name="article" required maxLength={50} /></label>
        <label className="grid gap-1 text-sm">{t('Aantal')}<input className="border-input w-20 rounded-md border bg-transparent px-2 py-1" name="quantity" type="number" min={1} max={2147483647} defaultValue={1} required /></label>
        <Button size="sm" disabled={busy}>{t('Reserveren')}</Button>
      </form>}
      {stock.reservations.length ? <ul className="grid gap-2">
        {stock.reservations.map((item) => <li key={item.id} className="flex flex-wrap items-center gap-2 text-sm">
          <span>{item.article_code} · {item.quantity} × · {t(labels[item.state])}</span>
          {item.state === 'reserved' && <>
            <form className="flex flex-wrap items-center gap-2" onSubmit={(event) => {
              event.preventDefault();
              void run({ action: 'use', id: item.id, location: new FormData(event.currentTarget).get('location') });
            }}>
              <select className="border-input bg-background rounded-md border px-2 py-1" aria-label={t('Locatie')} name="location" defaultValue="" required disabled={busy}>
                <option value="" disabled>{t('Locatie')}</option>
                {stock.locations.map((location) => <option key={location.id} value={location.id}>{location.shelf} / {location.box}</option>)}
              </select>
              <Button size="sm" disabled={busy || !stock.locations.length}>{t('Gebruik bevestigen')}</Button>
            </form>
            {stock.canRelease && <Button size="sm" variant="outline" disabled={busy} onClick={() => run({ action: 'release', id: item.id })}>{t('Vrijgeven')}</Button>}
          </>}
        </li>)}
      </ul> : <p className="text-muted-foreground text-sm">{t('Geen magazijnreserveringen.')}</p>}
    </>}
    {note && <p role="status" className="text-sm">{t(note)}</p>}
  </section>;
}
