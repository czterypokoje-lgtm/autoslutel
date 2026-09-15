'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../klanten/klanten.module.css';
import jobStyles from '../../jobs/jobs.module.css';

const TYPES = [
  { value: 'afdracht', label: 'Afdracht — monteur geeft geld af' },
  { value: 'uitbetaling', label: 'Uitbetaling — bedrijf betaalt monteur' },
  { value: 'verdienste', label: 'Verdienste — wat de monteur heeft verdiend' },
  { value: 'correctie', label: 'Correctie' },
];

export default function LedgerForm({ technicianId }: { technicianId: string }) {
  const router = useRouter();
  const [entryType, setEntryType] = useState('afdracht');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('-1');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');

    const response = await fetch(`/api/admin/technicians/${technicianId}/ledger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry_type: entryType,
        amount,
        note,
        ...(entryType === 'correctie' ? { direction: Number(direction) } : {}),
      }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Boeken mislukt.');
      setSaving(false);
      return;
    }

    setAmount('');
    setNote('');
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <div className={jobStyles.field}>
        <label className={jobStyles.fieldLabel} htmlFor="type">Soort</label>
        <select
          id="type"
          className={jobStyles.control}
          value={entryType}
          onChange={(e) => setEntryType(e.target.value)}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {entryType === 'correctie' && (
        <div className={jobStyles.field} style={{ marginTop: 10 }}>
          <label className={jobStyles.fieldLabel} htmlFor="dir">Richting</label>
          <select
            id="dir"
            className={jobStyles.control}
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          >
            <option value="1">Monteur is dit méér schuldig</option>
            <option value="-1">Monteur is dit mínder schuldig</option>
          </select>
        </div>
      )}

      <div className={jobStyles.field} style={{ marginTop: 10 }}>
        <label className={jobStyles.fieldLabel} htmlFor="bedrag">Bedrag (€)</label>
        <input
          id="bedrag"
          className={jobStyles.control}
          inputMode="decimal"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className={jobStyles.field} style={{ marginTop: 10 }}>
        <label className={jobStyles.fieldLabel} htmlFor="reden">
          Reden {entryType === 'correctie' && '(verplicht)'}
        </label>
        <input
          id="reden"
          className={jobStyles.control}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className={jobStyles.actions}>
        <button className={jobStyles.primary} type="submit" disabled={saving}>
          {saving ? 'Boeken…' : 'Boeken'}
        </button>
        {error && <div className={jobStyles.error}>{error}</div>}
      </div>
      <span className={styles.note} />
    </form>
  );
}
