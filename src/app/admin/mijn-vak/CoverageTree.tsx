'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Key, Radio, Search } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { SCENARIOS, type Scenario } from '@/lib/scenarios';
import type { CatalogMake } from '@/lib/carCatalog';
import styles from './tree.module.css';

export interface CoverageEntry {
  id: string;
  make: string;
  model: string | null;
  scenario: Scenario;
  from_year: number | null;
  to_year: number | null;
  excluded: boolean;
  keyless: boolean | null;
}

type KeyType = 'keyless' | 'blade';

const norm = (v: string) => v.trim().toLowerCase();

/**
 * The whole "which cars can you do" question, answered with two checkboxes
 * instead of a form.
 *
 * Every toggle here writes or removes a full set of four scenario rows in one
 * go — a technician who can cut a key can, in the ordinary case, also handle
 * a lost-all-keys job on the same car, and asking them to declare that four
 * times per model is precision nobody wants. A make-level checkbox is the
 * same action at the make instead of the model: `model = null` already means
 * "the whole make" everywhere else in the platform (capability.ts), so
 * checking it here is not a shortcut, it is the real, correct row.
 *
 * The list itself is our own catalogue (carCatalog.ts) rather than a generic
 * car database: nothing outside it is a car we can put a key on, so nothing
 * outside it belongs in this picker.
 */
export default function CoverageTree({
  technicianId,
  catalog,
  coverage,
}: {
  technicianId: string;
  catalog: CatalogMake[];
  coverage: CoverageEntry[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  /* make -> model|'' -> which key types are on, from the rows that exist */
  const state = useMemo(() => {
    const map = new Map<string, Map<string, Set<KeyType>>>();
    for (const row of coverage) {
      if (row.excluded || row.scenario !== 'bijmaken') continue;
      const make = norm(row.make);
      const model = row.model ? norm(row.model) : '';
      let models = map.get(make);
      if (!models) {
        models = new Map();
        map.set(make, models);
      }
      let types = models.get(model);
      if (!types) {
        types = new Set();
        models.set(model, types);
      }
      if (row.keyless === null) {
        types.add('keyless');
        types.add('blade');
      } else {
        types.add(row.keyless ? 'keyless' : 'blade');
      }
    }
    return map;
  }, [coverage]);

  const hasType = (make: string, model: string, type: KeyType): boolean =>
    state.get(norm(make))?.get(norm(model))?.has(type) ?? false;

  const filtered = useMemo(() => {
    const term = norm(search);
    if (!term) return catalog;
    return catalog
      .map((m) => {
        if (norm(m.make).includes(term)) return m;
        const models = m.models.filter((mo) => norm(mo.model).includes(term));
        return models.length ? { ...m, models } : null;
      })
      .filter((m): m is CatalogMake => m !== null);
  }, [catalog, search]);

  function toggleExpand(make: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(make)) next.delete(make);
      else next.add(make);
      return next;
    });
  }

  /**
   * Turn a key type on or off for a make (model = null) or a specific model.
   * On: one upsert per scenario. Off: one delete matching that exact row
   * shape — never a blanket delete, or turning off "keyless" would also
   * remove a separately-declared "blade" row for the same car.
   */
  async function setCoverage(make: string, model: string | null, type: KeyType, on: boolean) {
    const key = `${make}|${model ?? ''}|${type}`;
    setBusy(key);
    setError(null);

    const keylessValue = type === 'keyless';

    if (on) {
      const rows = SCENARIOS.map((scenario: Scenario) => ({
        technician_id: technicianId,
        make,
        model,
        scenario,
        keyless: keylessValue,
        excluded: false,
      }));
      const { error: upsertError } = await supabase
        .from('technician_coverage')
        .upsert(rows, { onConflict: 'technician_id,make,model,scenario,keyless' });
      if (upsertError) {
        setError(
          /does not exist|relation|column/i.test(upsertError.message)
            ? 'Voer supabase/migrations/0023_coverage_keyless.sql uit.'
            : upsertError.message
        );
      }
    } else {
      let query = supabase
        .from('technician_coverage')
        .delete()
        .eq('technician_id', technicianId)
        .ilike('make', make)
        .eq('keyless', keylessValue);
      query = model ? query.ilike('model', model) : query.is('model', null);
      const { error: deleteError } = await query;
      if (deleteError) setError(deleteError.message);
    }

    setBusy(null);
    router.refresh();
  }

  const totalOn = coverage.filter((r) => !r.excluded && r.scenario === 'bijmaken').length;

  return (
    <div>
      {error && <p className={styles.errorNote}>{error}</p>}

      <div className={styles.searchRow}>
        <Search size={15} strokeWidth={2} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Zoek merk of model, bijv. Toyota of Prius"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className={styles.summary}>{totalOn} aangevinkt</span>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <Key size={13} strokeWidth={2} /> = met sleutel (contactslot)
        </span>
        <span className={styles.legendItem}>
          <Radio size={13} strokeWidth={2} /> = keyless (start-knop)
        </span>
      </div>

      <div className={styles.tree}>
        {filtered.length === 0 && <div className={styles.empty}>Niets gevonden voor &ldquo;{search}&rdquo;.</div>}

        {filtered.map((makeRow) => {
          const isOpen = expanded.has(makeRow.make) || (search.length > 0 && filtered.length <= 6);
          const makeHasBlade = makeRow.models.some((m) => m.nonKeyless);
          const makeHasKeyless = makeRow.models.some((m) => m.keyless);
          const bladeOn = hasType(makeRow.make, '', 'blade');
          const keylessOn = hasType(makeRow.make, '', 'keyless');

          return (
            <div key={makeRow.make} className={styles.makeCard}>
              <button type="button" className={styles.makeHead} onClick={() => toggleExpand(makeRow.make)}>
                {isOpen ? <ChevronDown size={16} strokeWidth={2} /> : <ChevronRight size={16} strokeWidth={2} />}
                <span className={styles.makeName}>{makeRow.make}</span>
                <span className={styles.makeCount}>{makeRow.models.length} modellen</span>
              </button>

              <div className={styles.makeQuick}>
                <span className={styles.quickLabel}>Hele merk, alle jaren:</span>
                {makeHasBlade && (
                  <button
                    type="button"
                    className={`${styles.toggle} ${bladeOn ? styles.toggleOn : ''}`}
                    disabled={busy === `${makeRow.make}||blade`}
                    onClick={() => setCoverage(makeRow.make, null, 'blade', !bladeOn)}
                  >
                    <Key size={13} strokeWidth={2} /> Sleutel
                  </button>
                )}
                {makeHasKeyless && (
                  <button
                    type="button"
                    className={`${styles.toggle} ${keylessOn ? styles.toggleOn : ''}`}
                    disabled={busy === `${makeRow.make}||keyless`}
                    onClick={() => setCoverage(makeRow.make, null, 'keyless', !keylessOn)}
                  >
                    <Radio size={13} strokeWidth={2} /> Keyless
                  </button>
                )}
              </div>

              {isOpen && (
                <div className={styles.modelList}>
                  {makeRow.models.map((model) => {
                    const modelBladeOn = hasType(makeRow.make, model.model, 'blade') || bladeOn;
                    const modelKeylessOn = hasType(makeRow.make, model.model, 'keyless') || keylessOn;
                    const years =
                      model.fromYear || model.toYear
                        ? `${model.fromYear ?? '…'}–${model.toYear ?? 'nu'}`
                        : 'alle jaren';

                    return (
                      <div key={model.model} className={styles.modelRow}>
                        <span className={styles.modelName}>{model.model}</span>
                        <span className={styles.modelYears}>{years}</span>
                        <span className={styles.modelToggles}>
                          {model.nonKeyless && (
                            <button
                              type="button"
                              className={`${styles.toggleSm} ${modelBladeOn ? styles.toggleOn : ''}`}
                              disabled={bladeOn || busy === `${makeRow.make}|${model.model}|blade`}
                              title={bladeOn ? 'Al gedekt via heel merk' : 'Sleutel'}
                              onClick={() => setCoverage(makeRow.make, model.model, 'blade', !modelBladeOn)}
                            >
                              <Key size={12} strokeWidth={2} />
                            </button>
                          )}
                          {model.keyless && (
                            <button
                              type="button"
                              className={`${styles.toggleSm} ${modelKeylessOn ? styles.toggleOn : ''}`}
                              disabled={keylessOn || busy === `${makeRow.make}|${model.model}|keyless`}
                              title={keylessOn ? 'Al gedekt via heel merk' : 'Keyless'}
                              onClick={() => setCoverage(makeRow.make, model.model, 'keyless', !modelKeylessOn)}
                            >
                              <Radio size={12} strokeWidth={2} />
                            </button>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
