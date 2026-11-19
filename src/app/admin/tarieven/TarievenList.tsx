'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import PriceRow, { type PriceRowData } from './PriceRow';
import { SCENARIO_INFO } from '@/lib/scenarios';
import styles from './tarieven.module.css';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const SCENARIOS = Object.entries(SCENARIO_INFO) as [string, { label: string }][];

/**
 * The price list, short enough to scan: one fold per brand with its count and
 * price range, a search box and a scenario filter. A search opens every
 * matching brand; otherwise all brands start closed.
 */
export default function TarievenList({ rows }: { rows: PriceRowData[] }) {
  const [q, setQ] = useState('');
  const [scenario, setScenario] = useState<string>('all');

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (scenario !== 'all' && r.scenario !== scenario) return false;
      if (!term) return true;
      return `${r.make} ${r.model ?? ''} ${r.note ?? ''}`.toLowerCase().includes(term);
    });
    const byMake = new Map<string, PriceRowData[]>();
    for (const r of filtered) {
      const key = r.make.trim().toLowerCase();
      byMake.set(key, [...(byMake.get(key) ?? []), r]);
    }
    return [...byMake.values()]
      .map((list) => {
        const prices = list.map((r) => r.price);
        return { name: list[0].make, list, min: Math.min(...prices), max: Math.max(...prices) };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'nl'));
  }, [rows, q, scenario]);

  const searching = q.trim().length > 0;
  const total = groups.reduce((n, g) => n + g.list.length, 0);

  return (
    <>
      <div className={styles.filterBar}>
        <label className={styles.searchField}>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek merk of model, bijv. Golf"
            aria-label="Zoek tarief"
          />
        </label>
        <div className={styles.chips} role="group" aria-label="Scenario">
          <button type="button" className={scenario === 'all' ? styles.chipOn : styles.chipBtn} onClick={() => setScenario('all')}>
            Alles
          </button>
          {SCENARIOS.map(([key, info]) => (
            <button
              key={key}
              type="button"
              className={scenario === key ? styles.chipOn : styles.chipBtn}
              onClick={() => setScenario(key)}
            >
              {info.label}
            </button>
          ))}
        </div>
        <span className={styles.count}>
          {total} tarieven · {groups.length} merken
        </span>
      </div>

      {groups.length === 0 ? (
        <p className={styles.empty}>Geen tarief gevonden.</p>
      ) : (
        <div className={styles.groups}>
          {groups.map((g) => (
            <details key={`${g.name}-${searching}`} className={styles.group} open={searching}>
              <summary className={styles.groupHead}>
                <span className={styles.groupName}>{g.name}</span>
                <span className={styles.groupMeta}>
                  {g.list.length} {g.list.length === 1 ? 'tarief' : 'tarieven'}
                </span>
                <span className={styles.groupRange}>
                  {g.min === g.max ? MONEY.format(g.min) : `${MONEY.format(g.min)} – ${MONEY.format(g.max)}`}
                </span>
              </summary>
              <div className={styles.wrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Merk</th>
                      <th>Model</th>
                      <th>Scenario</th>
                      <th>Bouwjaar</th>
                      <th>Sleutel</th>
                      <th style={{ textAlign: 'right' }}>Prijs</th>
                      <th>Notitie</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.list.map((row) => (
                      <PriceRow key={row.id} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
