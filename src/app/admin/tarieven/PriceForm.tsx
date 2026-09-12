'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addPrice } from './actions';
import { SCENARIO_INFO } from '@/lib/scenarios';
import styles from './tarieven.module.css';

const SCENARIOS = Object.entries(SCENARIO_INFO) as [keyof typeof SCENARIO_INFO, { label: string }][];

export default function PriceForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setBusy(true);
    setError('');

    const result = await addPrice({
      make: String(form.get('make') ?? ''),
      model: String(form.get('model') ?? ''),
      scenario: String(form.get('scenario') ?? ''),
      fromYear: String(form.get('fromYear') ?? ''),
      toYear: String(form.get('toYear') ?? ''),
      keyless: String(form.get('keyless') ?? ''),
      price: String(form.get('price') ?? ''),
      note: String(form.get('note') ?? ''),
    });

    setBusy(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    formEl.reset();
    router.refresh();
  }

  return (
    <div className={styles.panel}>
      <h2>Nieuw tarief</h2>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.field}>
          <label htmlFor="make">Merk</label>
          <input id="make" name="make" required placeholder="Volkswagen" />
        </div>
        <div className={styles.field}>
          <label htmlFor="model">Model</label>
          <input id="model" name="model" placeholder="Golf (leeg = heel merk)" />
        </div>
        <div className={styles.field}>
          <label htmlFor="scenario">Scenario</label>
          <select id="scenario" name="scenario" defaultValue="bijmaken">
            {SCENARIOS.map(([value, info]) => (
              <option key={value} value={value}>
                {info.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="fromYear">Bouwjaar vanaf</label>
          <input id="fromYear" name="fromYear" type="number" placeholder="2005" />
        </div>
        <div className={styles.field}>
          <label htmlFor="toYear">Bouwjaar tot</label>
          <input id="toYear" name="toYear" type="number" placeholder="2012" />
        </div>
        <div className={styles.field}>
          <label htmlFor="keyless">Sleuteltype</label>
          <select id="keyless" name="keyless" defaultValue="">
            <option value="">Beide</option>
            <option value="true">Keyless</option>
            <option value="false">Baard/contact</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="price">Prijs (€)</label>
          <input id="price" name="price" required placeholder="195,00" />
        </div>
        <div className={styles.field}>
          <label htmlFor="note">Notitie</label>
          <input id="note" name="note" placeholder="Optioneel" />
        </div>
        <button className={styles.submit} type="submit" disabled={busy}>
          {busy ? 'Opslaan…' : 'Toevoegen'}
        </button>
      </form>
      {error && <p className={styles.note}>{error}</p>}
    </div>
  );
}
