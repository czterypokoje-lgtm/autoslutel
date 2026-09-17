'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Search } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { SCENARIOS, SCENARIO_INFO, type Scenario } from '@/lib/scenarios';
import type { CatalogMake } from '@/lib/carCatalog';
import { TOP_BRANDS, brandRank, isTopBrand } from '@/lib/topBrands';
import styles from './prices.module.css';

export interface PriceEntry {
  id: string;
  make: string;
  model: string | null;
  scenario: Scenario;
  from_year: number | null;
  to_year: number | null;
  excluded: boolean;
  keyless: boolean | null;
  price: number | string | null;
}

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

interface Draft {
  model: string;
  fromYear: string;
  toYear: string;
  scenario: Scenario;
  keyless: string; // '' = beide
  price: string;
}

const EMPTY_DRAFT: Draft = {
  model: '',
  fromYear: '',
  toYear: '',
  scenario: 'bijmaken',
  keyless: '',
  price: '',
};

function toIntOrNull(v: string): number | null {
  const n = Number(v);
  return v.trim() && Number.isInteger(n) && n > 1950 && n < 2100 ? n : null;
}

function keylessLabel(v: boolean | null): string {
  return v === true ? 'Keyless' : v === false ? 'Baard/contact' : 'Beide';
}

/**
 * A monteur's own price list, which is the same declaration as their coverage:
 * a priced row means "I do this car, for this much", and it is what makes them
 * reachable by dispatch (see coversCar in lib/capability.ts).
 *
 * Organised brand-first because that is how the question arrives — a monteur
 * knows they do Volkswagens and wants to say what a Golf costs, not to scroll
 * one flat list of every car ever made. The twenty makes that actually turn up
 * in real jobs come first; everything else is behind "overige merken".
 */
export default function PriceTree({
  technicianId,
  catalog,
  rows: initialRows,
  readOnly = false,
}: {
  technicianId: string;
  catalog: CatalogMake[];
  rows: PriceEntry[];
  /** The office viewing someone else's list: visible, not editable. */
  readOnly?: boolean;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<PriceEntry[]>(initialRows);
  const [openMake, setOpenMake] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const byMake = useMemo(() => {
    const map = new Map<string, PriceEntry[]>();
    for (const row of rows) {
      const key = row.make.toLowerCase();
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return map;
  }, [rows]);

  /* Top twenty first, then the rest of the catalogue alphabetically. */
  const makes = useMemo(() => {
    const names = new Map<string, string>();
    for (const b of TOP_BRANDS) names.set(b.toLowerCase(), b);
    for (const m of catalog) if (!names.has(m.make.toLowerCase())) names.set(m.make.toLowerCase(), m.make);
    // A make a monteur already priced always shows, even outside the catalogue.
    for (const r of rows) if (!names.has(r.make.toLowerCase())) names.set(r.make.toLowerCase(), r.make);

    const all = [...names.values()];
    const q = search.trim().toLowerCase();
    const filtered = q ? all.filter((m) => m.toLowerCase().includes(q)) : all;
    return filtered.sort((a, b) => {
      const ra = brandRank(a);
      const rb = brandRank(b);
      return ra !== rb ? ra - rb : a.localeCompare(b, 'nl');
    });
  }, [catalog, rows, search]);

  const modelsFor = (make: string): string[] =>
    catalog.find((m) => m.make.toLowerCase() === make.toLowerCase())?.models.map((m) => m.model) ?? [];

  const draftFor = (make: string): Draft => drafts[make] ?? EMPTY_DRAFT;
  const setDraft = (make: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [make]: { ...(d[make] ?? EMPTY_DRAFT), ...patch } }));

  function explain(message: string): string {
    if (/column .*price|does not exist|schema cache/i.test(message)) {
      return 'De prijskolom bestaat nog niet — voer supabase/migrations/0038_technician_pricing.sql uit.';
    }
    if (/duplicate key|unique/i.test(message)) {
      return 'Je hebt al een prijs voor deze combinatie van model, scenario en sleuteltype.';
    }
    return message;
  }

  async function addRow(make: string) {
    const draft = draftFor(make);
    const priceValue = Number(draft.price.replace(',', '.'));
    if (!draft.price.trim() || !Number.isFinite(priceValue) || priceValue <= 0) {
      setError('Vul een geldige prijs in.');
      return;
    }

    setBusy(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from('technician_coverage')
      .insert({
        technician_id: technicianId,
        make,
        model: draft.model.trim() || null,
        scenario: draft.scenario,
        keyless: draft.keyless === '' ? null : draft.keyless === 'true',
        from_year: toIntOrNull(draft.fromYear),
        to_year: toIntOrNull(draft.toYear),
        excluded: false,
        price: priceValue,
      })
      .select('id, make, model, scenario, from_year, to_year, excluded, keyless, price')
      .single();
    setBusy(false);

    if (insertError) {
      setError(explain(insertError.message));
      return;
    }
    setRows((r) => [...r, data as PriceEntry]);
    setDrafts((d) => ({ ...d, [make]: EMPTY_DRAFT }));
  }

  async function updatePrice(id: string, value: string) {
    const priceValue = Number(value.replace(',', '.'));
    if (!Number.isFinite(priceValue) || priceValue < 0) return;

    const previous = rows;
    setRows((r) => r.map((row) => (row.id === id ? { ...row, price: priceValue } : row)));
    const { error: updateError } = await supabase
      .from('technician_coverage')
      .update({ price: priceValue })
      .eq('id', id);
    if (updateError) {
      setRows(previous);
      setError(explain(updateError.message));
    }
  }

  async function removeRow(id: string) {
    if (!confirm('Deze prijs verwijderen? Je krijgt deze klussen dan niet meer aangeboden.')) return;
    const previous = rows;
    setRows((r) => r.filter((row) => row.id !== id));
    const { error: deleteError } = await supabase.from('technician_coverage').delete().eq('id', id);
    if (deleteError) {
      setRows(previous);
      setError(explain(deleteError.message));
    }
  }

  return (
    <div className={styles.wrap}>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.searchRow}>
        <Search size={15} aria-hidden="true" />
        <input
          className={styles.search}
          placeholder="Zoek een merk…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.brandGrid}>
        {makes.map((make) => {
          const mine = byMake.get(make.toLowerCase()) ?? [];
          const open = openMake === make;
          return (
            <div key={make} className={open ? `${styles.brandCard} ${styles.brandCardOpen}` : styles.brandCard}>
              <button
                type="button"
                className={styles.brandHead}
                onClick={() => setOpenMake(open ? null : make)}
                aria-expanded={open}
              >
                {open ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}
                <span className={styles.brandName}>{make}</span>
                {mine.length > 0 && <span className={styles.count}>{mine.length}</span>}
                {!isTopBrand(make) && <span className={styles.rare}>overig</span>}
              </button>

              {open && (
                <div className={styles.brandBody}>
                  {mine.length === 0 ? (
                    <p className={styles.empty}>Nog geen prijzen voor {make}.</p>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Model</th>
                          <th>Bouwjaar</th>
                          <th>Scenario</th>
                          <th>Sleutel</th>
                          <th style={{ textAlign: 'right' }}>Prijs</th>
                          {!readOnly && <th />}
                        </tr>
                      </thead>
                      <tbody>
                        {mine.map((row) => (
                          <tr key={row.id}>
                            <td className={row.model ? styles.strong : styles.muted}>
                              {row.model ?? 'Heel merk'}
                            </td>
                            <td className={styles.muted}>
                              {row.from_year || row.to_year
                                ? `${row.from_year ?? ''}–${row.to_year ?? ''}`
                                : 'alle'}
                            </td>
                            <td>{SCENARIO_INFO[row.scenario]?.label ?? row.scenario}</td>
                            <td className={styles.muted}>{keylessLabel(row.keyless)}</td>
                            <td className={styles.money}>
                              {readOnly ? (
                                row.price == null ? (
                                  <span className={styles.muted}>geen prijs</span>
                                ) : (
                                  MONEY.format(Number(row.price))
                                )
                              ) : (
                                <input
                                  className={styles.priceInput}
                                  defaultValue={row.price == null ? '' : String(row.price)}
                                  placeholder="—"
                                  inputMode="decimal"
                                  aria-label={`Prijs voor ${row.model ?? make}`}
                                  onBlur={(e) => {
                                    if (e.target.value.trim() === '') return;
                                    void updatePrice(row.id, e.target.value);
                                  }}
                                />
                              )}
                            </td>
                            {!readOnly && (
                              <td>
                                <button
                                  type="button"
                                  className={styles.ghostBtn}
                                  onClick={() => void removeRow(row.id)}
                                >
                                  Verwijderen
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {!readOnly && (
                    <div className={styles.addRow}>
                      <select
                        className={styles.cell}
                        value={draftFor(make).model}
                        onChange={(e) => setDraft(make, { model: e.target.value })}
                        aria-label="Model"
                      >
                        <option value="">Heel merk</option>
                        {modelsFor(make).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <input
                        className={styles.cell}
                        type="number"
                        placeholder="vanaf"
                        value={draftFor(make).fromYear}
                        onChange={(e) => setDraft(make, { fromYear: e.target.value })}
                        aria-label="Bouwjaar vanaf"
                      />
                      <input
                        className={styles.cell}
                        type="number"
                        placeholder="tot"
                        value={draftFor(make).toYear}
                        onChange={(e) => setDraft(make, { toYear: e.target.value })}
                        aria-label="Bouwjaar tot"
                      />
                      <select
                        className={styles.cell}
                        value={draftFor(make).scenario}
                        onChange={(e) => setDraft(make, { scenario: e.target.value as Scenario })}
                        aria-label="Scenario"
                      >
                        {SCENARIOS.map((s) => (
                          <option key={s} value={s}>
                            {SCENARIO_INFO[s].label}
                          </option>
                        ))}
                      </select>
                      <select
                        className={styles.cell}
                        value={draftFor(make).keyless}
                        onChange={(e) => setDraft(make, { keyless: e.target.value })}
                        aria-label="Sleuteltype"
                      >
                        <option value="">Beide</option>
                        <option value="true">Keyless</option>
                        <option value="false">Baard/contact</option>
                      </select>
                      <input
                        className={styles.cell}
                        placeholder="€ prijs"
                        inputMode="decimal"
                        value={draftFor(make).price}
                        onChange={(e) => setDraft(make, { price: e.target.value })}
                        aria-label="Prijs"
                      />
                      <button
                        type="button"
                        className={styles.addBtn}
                        disabled={busy}
                        onClick={() => void addRow(make)}
                      >
                        <Plus size={14} aria-hidden="true" />
                        {busy ? 'Bezig…' : 'Toevoegen'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
