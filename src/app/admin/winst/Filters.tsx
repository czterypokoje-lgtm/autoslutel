'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, RefreshCw } from 'lucide-react';
import { ui } from '../_ui';
import w from './winst.module.css';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** One-tap periods; the date fields stay for anything else. */
function presets(): { label: string; from: string; to: string }[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const q = Math.floor(m / 3) * 3;
  return [
    { label: 'Deze maand', from: iso(new Date(y, m, 1)), to: iso(now) },
    { label: 'Vorige maand', from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) },
    { label: 'Dit kwartaal', from: iso(new Date(y, q, 1)), to: iso(now) },
    { label: 'Dit jaar', from: iso(new Date(y, 0, 1)), to: iso(now) },
  ];
}

/**
 * The period, the download and the repair button.
 *
 * Native date inputs rather than a picker component: the browser already has
 * one, it works on a phone, and it needs no JavaScript to be correct.
 */
export default function Filters({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const [van, setVan] = useState(from);
  const [tot, setTot] = useState(to);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  function apply(event: React.FormEvent) {
    event.preventDefault();
    router.push(`/admin/winst?van=${van}&tot=${tot}`);
  }

  /*
   * Measures fuel for jobs that never got it — everything finished before this
   * feature existed, plus anything that happened while Google was unreachable.
   * Only touches rows where travel_km is still null, so running it twice is
   * harmless and running it after an outage is the fix.
   */
  async function backfill() {
    setBusy(true);
    setNote('');
    const response = await fetch('/api/admin/jobs/backfill-travel', { method: 'POST' }).catch(
      () => null
    );
    const result = await response?.json().catch(() => null);
    setNote(
      response?.ok
        ? `${result?.filled ?? 0} klus(sen) aangevuld, ${result?.skipped ?? 0} overgeslagen.`
        : (result?.error ?? 'Aanvullen mislukt.')
    );
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={apply} className={w.bar}>
      <div className={w.presets} role="group" aria-label="Periode">
        {presets().map((p) => (
          <button
            key={p.label}
            type="button"
            className={p.from === from && p.to === to ? w.presetOn : w.preset}
            onClick={() => router.push(`/admin/winst?van=${p.from}&tot=${p.to}`)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <label>
        <div className={w.label}>Van</div>
        <input type="date" value={van} onChange={(e) => setVan(e.target.value)} className={ui.input} />
      </label>
      <label>
        <div className={w.label}>Tot</div>
        <input type="date" value={tot} onChange={(e) => setTot(e.target.value)} className={ui.input} />
      </label>

      <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`}>
        Toon
      </button>

      <a className={ui.btn} href={`/api/admin/winst/export?van=${van}&tot=${tot}`}>
        <Download size={16} /> Excel
      </a>

      <button type="button" className={ui.btn} onClick={backfill} disabled={busy}>
        <RefreshCw size={16} /> {busy ? 'Bezig…' : 'Brandstof aanvullen'}
      </button>

      {note && <span className={w.note}>{note}</span>}
    </form>
  );
}
