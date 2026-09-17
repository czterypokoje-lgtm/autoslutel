'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePrice } from './actions';
import DeletePriceButton from './DeletePriceButton';
import { SCENARIO_INFO, type Scenario } from '@/lib/scenarios';
import styles from './tarieven.module.css';

const SCENARIOS = Object.entries(SCENARIO_INFO) as [keyof typeof SCENARIO_INFO, { label: string }][];

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export interface PriceRowData {
  id: string;
  make: string;
  model: string | null;
  scenario: Scenario;
  from_year: number | null;
  to_year: number | null;
  keyless: boolean | null;
  price: number;
  note: string | null;
}

/**
 * One tarief, readable at a glance and editable in place.
 *
 * Every field is editable, not just the price: a row is keyed on
 * make/model/scenario/keyless, so a typo in the make or a row that should
 * have been one model rather than the whole brand could previously only be
 * fixed by deleting it and typing all eight fields again.
 */
export default function PriceRow({ row }: { row: PriceRowData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [make, setMake] = useState(row.make);
  const [model, setModel] = useState(row.model ?? '');
  const [scenario, setScenario] = useState<string>(row.scenario);
  const [fromYear, setFromYear] = useState(row.from_year === null ? '' : String(row.from_year));
  const [toYear, setToYear] = useState(row.to_year === null ? '' : String(row.to_year));
  const [keyless, setKeyless] = useState(row.keyless === null ? '' : String(row.keyless));
  const [price, setPrice] = useState(String(row.price));
  const [note, setNote] = useState(row.note ?? '');

  function cancel() {
    // Back to what is actually stored, so an abandoned edit leaves nothing behind.
    setMake(row.make);
    setModel(row.model ?? '');
    setScenario(row.scenario);
    setFromYear(row.from_year === null ? '' : String(row.from_year));
    setToYear(row.to_year === null ? '' : String(row.to_year));
    setKeyless(row.keyless === null ? '' : String(row.keyless));
    setPrice(String(row.price));
    setNote(row.note ?? '');
    setError('');
    setEditing(false);
  }

  async function save() {
    setBusy(true);
    setError('');
    const result = await updatePrice(row.id, {
      make,
      model,
      scenario,
      fromYear,
      toYear,
      keyless,
      price,
      note,
    });
    setBusy(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <tr>
        <td className={styles.strong}>{row.make}</td>
        <td className={row.model ? undefined : styles.muted}>{row.model ?? 'Heel merk'}</td>
        <td>{SCENARIO_INFO[row.scenario]?.label ?? row.scenario}</td>
        <td className={styles.muted}>
          {row.from_year || row.to_year ? `${row.from_year ?? ''}–${row.to_year ?? ''}` : '—'}
        </td>
        <td className={styles.muted}>
          {row.keyless === true ? 'Keyless' : row.keyless === false ? 'Baard/contact' : 'Beide'}
        </td>
        <td className={styles.money}>{MONEY.format(row.price)}</td>
        <td className={styles.muted}>{row.note ?? ''}</td>
        <td className={styles.rowActions}>
          <button className={styles.ghostBtn} onClick={() => setEditing(true)}>
            Bewerken
          </button>
          <DeletePriceButton id={row.id} />
        </td>
      </tr>
    );
  }

  return (
    <tr className={styles.editingRow}>
      <td>
        <input
          className={styles.cellInput}
          value={make}
          onChange={(e) => setMake(e.target.value)}
          aria-label="Merk"
        />
      </td>
      <td>
        <input
          className={styles.cellInput}
          value={model}
          placeholder="leeg = heel merk"
          onChange={(e) => setModel(e.target.value)}
          aria-label="Model"
        />
      </td>
      <td>
        <select
          className={styles.cellInput}
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          aria-label="Scenario"
        >
          {SCENARIOS.map(([value, info]) => (
            <option key={value} value={value}>
              {info.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <div className={styles.yearPair}>
          <input
            className={styles.cellInput}
            type="number"
            value={fromYear}
            placeholder="vanaf"
            onChange={(e) => setFromYear(e.target.value)}
            aria-label="Bouwjaar vanaf"
          />
          <input
            className={styles.cellInput}
            type="number"
            value={toYear}
            placeholder="tot"
            onChange={(e) => setToYear(e.target.value)}
            aria-label="Bouwjaar tot"
          />
        </div>
      </td>
      <td>
        <select
          className={styles.cellInput}
          value={keyless}
          onChange={(e) => setKeyless(e.target.value)}
          aria-label="Sleuteltype"
        >
          <option value="">Beide</option>
          <option value="true">Keyless</option>
          <option value="false">Baard/contact</option>
        </select>
      </td>
      <td>
        <input
          className={styles.cellInput}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          aria-label="Prijs in euro"
        />
      </td>
      <td>
        <input
          className={styles.cellInput}
          value={note}
          placeholder="Optioneel"
          onChange={(e) => setNote(e.target.value)}
          aria-label="Notitie"
        />
        {error && <p className={styles.rowError}>{error}</p>}
      </td>
      <td className={styles.rowActions}>
        <button className={styles.saveBtn} onClick={save} disabled={busy}>
          {busy ? 'Opslaan…' : 'Opslaan'}
        </button>
        <button className={styles.ghostBtn} onClick={cancel} disabled={busy}>
          Annuleren
        </button>
      </td>
    </tr>
  );
}
