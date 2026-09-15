'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Key, Radio, Search } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { SCENARIOS, SCENARIO_INFO, type Scenario } from '@/lib/scenarios';
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
 * per scenario instead of a form.
 *
 * Scoped to one scenario tab at a time on purpose — bijmaken (spare key),
 * alle sleutels kwijt (AKL), reparatie and slot/cilinder are genuinely
 * different jobs needing different tools and experience, and coversCar()
 * (capability.ts) already matches dispatch on the exact scenario a job needs.
 * An earlier version of this picker wrote all four scenarios at once when a
 * make was switched on — convenient to build, but it meant ticking "Toyota,
 * met sleutel" silently also claimed AKL and slot/cilinder for that car,
 * which is exactly the wrong side to be wrong on: capability.ts's own words,
 * "a job we accept and cannot do costs the call-out, the customer, and the
 * review." A make-level checkbox is still the same action at the make
 * instead of the model: `model = null` already means "the whole make"
 * everywhere else in the platform, so checking it here is not a shortcut, it
 * is the real, correct row — just for one scenario, not four.
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
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<Scenario>('bijmaken');
  /*
   * A local, mutable copy of the prop — same reasoning as BusDashboard's
   * stock stepper: setting up coverage means ticking many boxes in a row,
   * and waiting for a full router.refresh() per tap made that feel exactly
   * as slow as the stock stepper did before it got the same treatment.
   */
  const [rows, setRows] = useState(coverage);

  const supabase = createSupabaseBrowserClient();

  /** How many makes/models are on, per scenario — the tab bar's count badges. */
  const countByScenario = useMemo(() => {
    const counts = new Map<Scenario, number>();
    for (const row of rows) {
      if (row.excluded) continue;
      counts.set(row.scenario, (counts.get(row.scenario) ?? 0) + 1);
    }
    return counts;
  }, [rows]);

  /* make -> model|'' -> which key types are on, from the rows that exist, for the active scenario only */
  const state = useMemo(() => {
    const map = new Map<string, Map<string, Set<KeyType>>>();
    for (const row of rows) {
      if (row.excluded || row.scenario !== activeScenario) continue;
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
  }, [rows, activeScenario]);

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
   * Turn a key type on or off, for the active scenario, for a make
   * (model = null) or a specific model. On: one upsert. Off: one delete
   * matching that exact row shape — never a blanket delete, or turning off
   * "keyless" would also remove a separately-declared "blade" row, and never
   * across scenarios, or turning off "bijmaken" would also revoke AKL the
   * technician set up separately on the same car.
   *
   * Updates `rows` immediately and only reaches for the network in the
   * background — reverting on an actual failure — instead of waiting for a
   * full refetch to show a tap that already succeeded from the tapper's
   * point of view.
   */
  async function setCoverage(make: string, model: string | null, type: KeyType, on: boolean) {
    const key = `${activeScenario}|${make}|${model ?? ''}|${type}`;
    setBusy(key);
    setError(null);

    const keylessValue = type === 'keyless';
    const previous = rows;

    if (on) {
      const newRow: CoverageEntry = {
        id: `pending-${key}`,
        make,
        model,
        scenario: activeScenario,
        from_year: null,
        to_year: null,
        excluded: false,
        keyless: keylessValue,
      };
      setRows((prev) => [...prev, newRow]);

      const { error: upsertError } = await supabase.from('technician_coverage').upsert(
        [
          {
            technician_id: technicianId,
            make,
            model,
            scenario: activeScenario,
            keyless: keylessValue,
            excluded: false,
          },
        ],
        { onConflict: 'technician_id,make,model,scenario,keyless' }
      );
      if (upsertError) {
        setRows(previous);
        setError(
          /does not exist|relation|column/i.test(upsertError.message)
            ? 'Voer supabase/migrations/0023_coverage_keyless.sql uit.'
            : upsertError.message
        );
      }
    } else {
      setRows((prev) =>
        prev.filter((r) => {
          const sameScenario = r.scenario === activeScenario;
          const sameMake = norm(r.make) === norm(make);
          const sameModel = model ? norm(r.model ?? '') === norm(model) : r.model === null;
          const sameType = r.keyless === keylessValue;
          return !(sameScenario && sameMake && sameModel && sameType);
        })
      );

      let query = supabase
        .from('technician_coverage')
        .delete()
        .eq('technician_id', technicianId)
        .eq('scenario', activeScenario)
        .ilike('make', make)
        .eq('keyless', keylessValue);
      query = model ? query.ilike('model', model) : query.is('model', null);
      const { error: deleteError } = await query;
      if (deleteError) {
        setRows(previous);
        setError(deleteError.message);
      }
    }

    setBusy(null);
  }

  const totalOn = countByScenario.get(activeScenario) ?? 0;

  return (
    <div>
      {error && <p className={styles.errorNote}>{error}</p>}

      <div className={styles.scenarioTabs}>
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario}
            type="button"
            className={`${styles.scenarioTab} ${scenario === activeScenario ? styles.scenarioTabOn : ''}`}
            onClick={() => setActiveScenario(scenario)}
          >
            {SCENARIO_INFO[scenario].label}
            <span className={styles.scenarioTabCount}>{countByScenario.get(scenario) ?? 0}</span>
          </button>
        ))}
      </div>
      <p className={styles.scenarioNote}>
        Dekking is per situatie — een merk aanvinken bij &ldquo;{SCENARIO_INFO.bijmaken.label}&rdquo; betekent niet
        automatisch dat u ook &ldquo;{SCENARIO_INFO.alle_sleutels_kwijt.label}&rdquo; aankunt. Zet elke situatie apart aan.
      </p>

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
                    disabled={busy === `${activeScenario}|${makeRow.make}||blade`}
                    onClick={() => setCoverage(makeRow.make, null, 'blade', !bladeOn)}
                  >
                    <Key size={13} strokeWidth={2} /> Sleutel
                  </button>
                )}
                {makeHasKeyless && (
                  <button
                    type="button"
                    className={`${styles.toggle} ${keylessOn ? styles.toggleOn : ''}`}
                    disabled={busy === `${activeScenario}|${makeRow.make}||keyless`}
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
                              disabled={bladeOn || busy === `${activeScenario}|${makeRow.make}|${model.model}|blade`}
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
                              disabled={keylessOn || busy === `${activeScenario}|${makeRow.make}|${model.model}|keyless`}
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
