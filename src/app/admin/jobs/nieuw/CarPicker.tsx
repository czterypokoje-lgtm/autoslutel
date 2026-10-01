'use client';

import { useMemo } from 'react';
import styles from '../jobs.module.css';

/** The slimmed catalogue sent to the browser: make → models with year span and key type. */
export interface PickerMake {
  make: string;
  models: { model: string; from: number | null; to: number | null; keyless: boolean; blade: boolean }[];
}

/** Services the office plans most; anything else goes through "Anders…". */
export const SERVICE_OPTIONS = [
  'Sleutel bijmaken',
  'Alle sleutels kwijt',
  'Sleutel repareren',
  'Slot of cilinder',
  'Auto openen zonder sleutel',
  'Contactslot vervangen',
  'Transponder programmeren',
];

const OTHER = '__anders__';
const THIS_YEAR = new Date().getFullYear();

/**
 * A dropdown with an escape hatch. Choosing "Anders…" swaps the list for a
 * text field, and a value that is not in the list (from an old lead, say)
 * opens straight in that text field, so nothing typed earlier is lost.
 */
function PickOrType({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  otherLabel = 'Anders…',
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  otherLabel?: string;
  disabled?: boolean;
}) {
  const known = value === '' || options.some((o) => o.value.toLowerCase() === value.toLowerCase());
  const typing = !known || value === OTHER;
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={id}>
        {label}
      </label>
      {typing ? (
        <div className={styles.pickTyped}>
          <input
            id={id}
            className={styles.control}
            autoFocus={value === OTHER}
            value={value === OTHER ? '' : value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value || OTHER)}
          />
          <button type="button" className={styles.pickBack} onClick={() => onChange('')}>
            Lijst
          </button>
        </div>
      ) : (
        <select
          id={id}
          className={styles.control}
          value={options.find((o) => o.value.toLowerCase() === value.toLowerCase())?.value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value={OTHER}>{otherLabel}</option>
        </select>
      )}
    </div>
  );
}

/** "" for the sentinel, so the form never saves the word "__anders__". */
export const clean = (v: string) => (v === OTHER ? '' : v);

export function ServicePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <PickOrType
      id="dienst"
      label="Dienst"
      value={value}
      onChange={onChange}
      placeholder="Kies een dienst"
      options={SERVICE_OPTIONS.map((s) => ({ value: s, label: s }))}
      otherLabel="Andere dienst…"
    />
  );
}

/**
 * Merk → model → bouwjaar, each a list built from the catalogue. The model
 * list only shows the chosen make's models, the year list only the years that
 * model was built, and a model that only exists with one kind of key sets the
 * key type by itself.
 */
export function CarPicker({
  cars,
  make,
  model,
  year,
  onMake,
  onModel,
  onYear,
  onKeyType,
}: {
  cars: PickerMake[];
  make: string;
  model: string;
  year: string;
  onMake: (v: string) => void;
  onModel: (v: string) => void;
  onYear: (v: string) => void;
  onKeyType: (v: '' | 'true' | 'false') => void;
}) {
  const current = useMemo(
    () => cars.find((c) => c.make.toLowerCase() === clean(make).toLowerCase()) ?? null,
    [cars, make]
  );
  const currentModel = current?.models.find((m) => m.model.toLowerCase() === clean(model).toLowerCase()) ?? null;

  const from = currentModel?.from ?? 1995;
  const to = Math.min(currentModel?.to ?? THIS_YEAR, THIS_YEAR);
  const years: string[] = [];
  for (let y = to; y >= Math.min(from, to); y--) years.push(String(y));

  return (
    <>
      <PickOrType
        id="merk"
        label="Automerk"
        value={make}
        onChange={(v) => {
          onMake(v);
          onModel('');
          onYear('');
        }}
        placeholder="Kies merk"
        options={cars.map((c) => ({ value: c.make, label: c.make }))}
        otherLabel="Ander merk…"
      />
      <PickOrType
        id="model"
        label="Model"
        value={model}
        disabled={!current}
        onChange={(v) => {
          onModel(v);
          onYear('');
          const m = current?.models.find((x) => x.model === v);
          if (m) onKeyType(m.keyless && !m.blade ? 'true' : m.blade && !m.keyless ? 'false' : '');
        }}
        placeholder={current ? 'Kies model' : 'Kies eerst een merk'}
        options={(current?.models ?? []).map((m) => ({
          value: m.model,
          label: m.from ? `${m.model} (${m.from}–${m.to ?? 'nu'})` : m.model,
        }))}
        otherLabel="Ander model…"
      />
      <PickOrType
        id="bouwjaar"
        label="Bouwjaar"
        value={year}
        onChange={onYear}
        placeholder="Kies bouwjaar"
        options={years.map((y) => ({ value: y, label: y }))}
        otherLabel="Ander jaar…"
      />
    </>
  );
}
