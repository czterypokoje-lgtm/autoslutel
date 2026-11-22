'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { usePreviewLanguage } from '../PreviewLanguage';
import { CRM_READONLY } from '@/lib/readonly';
import styles from './keyforcars.module.css';

export default function SalePriceEditor({code, name}: {code: string; name: string}) {
  const {english} = usePreviewLanguage();
  const [previous, setPrevious] = useState<number | null>();
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [reload, setReload] = useState(0);
  const url = '/api/admin/article-price?code=' + encodeURIComponent(code);
  const format = (cents: number) => (cents / 100).toFixed(2).replace('.', english ? '.' : ',');

  useEffect(() => {
    const abort = new AbortController();
    fetch(url, {signal: abort.signal, cache:'no-store'}).then(async response => {
      if (!response.ok) throw Error();
      const {cents} = await response.json();
      if (!abort.signal.aborted) {
        setPrevious(cents);
        setAmount(cents === null ? '' : (cents / 100).toFixed(2).replace('.', english ? '.' : ','));
        setMessage('');
      }
    }).catch(() => { if (!abort.signal.aborted) setMessage('load'); });
    return () => abort.abort();
  }, [url, reload, english]);

  const normalized = amount.trim().replace(',', '.');
  const cents = /^\d+(?:\.\d{1,2})?$/.test(normalized) ? Math.round(Number(normalized) * 100) : NaN;
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || previous === undefined || !Number.isInteger(cents) || cents > 2147483647) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(url, {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cents, previous})});
      if (response.status === 409) {
        setPrevious(undefined);
        setMessage('conflict');
      } else if (response.ok) {
        setPrevious(cents);
        setAmount(format(cents));
        setMessage('saved');
      } else setMessage('error');
    } catch { setMessage('error'); }
    finally { setBusy(false); }
  }
  const feedback: Record<string,string> = {
    load: english ? 'Could not load price.' : 'Prijs laden mislukt.',
    conflict: english ? 'The price changed. Reload the current price.' : 'De prijs is gewijzigd. Laad de huidige prijs opnieuw.',
    saved: english ? 'Price saved.' : 'Prijs opgeslagen.',
    error: english ? 'Could not save price.' : 'Opslaan mislukt.',
  };
  return <form onSubmit={save} className={styles.panel}>
    <label className="grid gap-1" htmlFor="article-sale-price">
      <strong>{english ? 'Selling price (€)' : 'Verkoopprijs (€)'}</strong>
      <span className="text-muted-foreground text-sm">{name} · {code}</span>
    </label>
    <div className="mt-2 flex flex-wrap gap-2">
      <input id="article-sale-price" className="w-32 rounded-md border px-3 py-2" inputMode="decimal" required
        pattern="[0-9]+([.,][0-9]{1,2})?" value={amount} placeholder={previous === null ? '—' : ''}
        disabled={busy || previous === undefined || CRM_READONLY}
        onChange={event=>{setAmount(event.target.value);setMessage('');}} />
      <button className={styles.primary} disabled={CRM_READONLY || busy || previous === undefined || !Number.isInteger(cents) || cents > 2147483647 || cents === previous}>
        {english ? 'Save price' : 'Prijs opslaan'}
      </button>
      {(message === 'load' || message === 'conflict') && <button className={styles.secondary} type="button" onClick={()=>setReload(value=>value+1)}>{english ? 'Reload' : 'Opnieuw laden'}</button>}
    </div>
    <span role="status">{feedback[message]}</span>
  </form>;
}
