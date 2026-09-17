'use client';

import { useState } from 'react';
import { adjustOwnStock } from './actions';
import { stockStatus } from '@/lib/stockStatus';
import { GROUP_INFO, STOCK_GROUPS, type StockGroup } from '@/lib/stockCategory';
import styles from './BusDashboard.module.css';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/** The same "op" / "bijna op" marking, wherever an article is listed. */
function StockBadge({ status }: { status: 'out' | 'low' | 'ok' }) {
  if (status === 'ok') return null;
  return (
    <span className={status === 'out' ? styles.stockBadgeStop : styles.stockBadgeWarn}>
      {status === 'out' ? 'Op' : 'Bijna op'}
    </span>
  );
}

interface StockItem {
  id: string;
  description: string;
  quantity: number;
  min_quantity: number;
  unit_cost: number | string | null;
  group?: string | null;
}

interface StockMove {
  id: number | string;
  description: string;
  delta: number | string;
  quantity_after: number | string;
  reason: string;
  changed_at: string;
}

export default function BusDashboard({
  myStock,
  centralStock,
  otherTechs,
  moves = [],
}: {
  myStock: any[];
  centralStock: any[];
  otherTechs: any[];
  moves?: StockMove[];
}) {
  /*
   * A local, mutable copy of the prop. Every +/- used to wait for the full
   * round trip — the server action, then router.refresh() re-fetching this
   * whole page's data — before the number on screen moved at all, with one
   * shared `loading` flag freezing every other item's buttons in the
   * meantime. This is what lets a tap change the number immediately: update
   * here first, fire the real transfer in the background, and only correct
   * it if the server actually refuses.
   */
  const [stock, setStock] = useState(myStock);
  /** Which article is mid-transfer, so only *that* row's buttons wait. */
  const [pending, setPending] = useState<Set<string>>(new Set());
  /** Why a transfer was refused, in the monteur's own words. */
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  /** null = every group; otherwise only that one. */
  const [group, setGroup] = useState<StockGroup | null>(null);

  // Stats calculation
  const totalProducts = stock.length;
  const activeProducts = stock.filter(item => item.quantity > 0).length;

  const filteredStock = stock.filter(
    (item) =>
      item.description.toLowerCase().includes(search.toLowerCase()) &&
      (group === null || item.group === group)
  );

  /*
   * Per-group totals, from the full van rather than the filtered view — the
   * chips have to keep showing what is in each group while one of them is
   * selected, or picking a group would empty every other chip's count.
   */
  const perGroup = STOCK_GROUPS.map((g) => {
    const items: StockItem[] = stock.filter((item: StockItem) => item.group === g.id);
    return {
      ...g,
      count: items.length,
      units: items.reduce((total, item) => total + Number(item.quantity ?? 0), 0),
      value: items.reduce(
        (total, item) => total + Number(item.quantity ?? 0) * Number(item.unit_cost ?? 0),
        0
      ),
      short: items.filter((item) => stockStatus(item) !== 'ok').length,
    };
  }).filter((g) => g.count > 0);

  async function adjustStock(description: string, delta: number) {
    if (pending.has(description)) return;
    const current = stock.find((i) => i.description === description);
    if (!current || current.quantity + delta < 0) return;

    setNotice(null);
    setPending((prev) => new Set(prev).add(description));
    setStock((prev) =>
      prev.map((i) => (i.description === description ? { ...i, quantity: i.quantity + delta } : i))
    );

    // The action answers with a reason rather than throwing, so the monteur is
    // told which rule stopped them instead of "er ging iets mis".
    const result = await adjustOwnStock(description, delta);

    setPending((prev) => {
      const next = new Set(prev);
      next.delete(description);
      return next;
    });

    if ('error' in result) {
      // The server refused — put the number back and say why, rather than
      // leave the screen showing a quantity that was never actually moved.
      setStock((prev) =>
        prev.map((i) => (i.description === description ? { ...i, quantity: current.quantity } : i))
      );
      setNotice(result.error);
      return;
    }

    // No router.refresh(): the local state above is already correct, and a
    // full page re-fetch here would only reintroduce the wait this exists
    // to remove. A real navigation to this page still picks up server truth.
  }

  const handleAddStock = (description: string, qty: number) => adjustStock(description, qty);
  const handleRemoveStock = (description: string, qty: number) => adjustStock(description, -qty);

  return (
    <div className={styles.container}>
      {notice && (
        <p
          style={{
            margin: '0 0 14px',
            padding: '10px 12px',
            borderRadius: 'var(--crm-r-sm)',
            background: 'var(--crm-stop-bg)',
            color: 'var(--crm-stop)',
            fontSize: 13,
          }}
        >
          {notice}
        </p>
      )}

      {/*
        The page owns the heading and the figures now. What stood here was a
        template header plus four stat tiles with the numbers typed into them —
        "325" and "12%" — which is worse than no figures at all: a technician
        cannot tell a placeholder from a reading of their own van.
      */}

      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Wat er in de bus ligt</h2>
          <div className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="Zoek een artikel" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--crm-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>

        {perGroup.length > 1 && (
          <div className={styles.groupChips}>
            <button
              type="button"
              className={group === null ? styles.chipOn : styles.chip}
              onClick={() => setGroup(null)}
            >
              Alles
              <span className={styles.chipCount}>{stock.length}</span>
            </button>
            {perGroup.map((g) => (
              <button
                key={g.id}
                type="button"
                className={group === g.id ? styles.chipOn : styles.chip}
                onClick={() => setGroup(group === g.id ? null : g.id)}
                title={`${g.units} stuks · ${MONEY.format(g.value)}`}
              >
                <span aria-hidden="true">{g.icon}</span>
                {g.label}
                <span className={styles.chipCount}>{g.count}</span>
                {g.short > 0 && <span className={styles.chipShort} title="bijna op of op" />}
              </button>
            ))}
          </div>
        )}

        <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '40px', paddingLeft: '1.5rem' }}>
                <input type="checkbox" style={{ borderRadius: '4px', border: '1px solid var(--crm-rule2)' }} />
              </th>
              <th>
                <div className={styles.thContent}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                  Artikel
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Stukprijs
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                  Waarde
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Aantal
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.map((item) => {
              // `unit_cost` is real when a confirmed invoice line named this
              // article (crm_confirm_invoice, 0019); otherwise it is simply
              // not known yet, and "—" says that honestly instead of a price
              // nobody paid.
              const unitPrice: number | null = item.unit_cost === null || item.unit_cost === undefined
                ? null
                : Number(item.unit_cost);
              const totalAmount = unitPrice === null ? null : unitPrice * item.quantity;

              return (
                <tr key={item.id}>
                  <td style={{ paddingLeft: '1.5rem' }}>
                    <input type="checkbox" style={{ borderRadius: '4px', border: '1px solid var(--crm-rule2)' }} />
                  </td>
                  <td>
                    <div className={styles.productCell}>
                      {/* The kind of part, so the eye can sort the list before
                          reading a single article code. */}
                      <div
                        className={styles.groupIcon}
                        title={GROUP_INFO[(item.group as StockGroup) ?? 'overig']?.label}
                      >
                        {GROUP_INFO[(item.group as StockGroup) ?? 'overig']?.icon ?? '📦'}
                      </div>
                      {item.description}
                      <StockBadge status={stockStatus(item)} />
                    </div>
                  </td>
                  <td>{unitPrice === null ? '—' : MONEY.format(unitPrice)}</td>
                  <td>{totalAmount === null ? '—' : MONEY.format(totalAmount)}</td>
                  <td>
                    <div className={styles.qtyControl}>
                      <button 
                        className={styles.qtyBtn} 
                        onClick={() => handleRemoveStock(item.description, 1)}
                        disabled={pending.has(item.description) || item.quantity === 0}
                      >−</button>
                      <input type="text" className={styles.qtyInput} value={item.quantity} readOnly />
                      <button
                        className={styles.qtyBtn}
                        onClick={() => handleAddStock(item.description, 1)}
                        disabled={pending.has(item.description)}
                      >+</button>
                      <button
                        className={styles.addBtn}
                        onClick={() => handleAddStock(item.description, 1)}
                        disabled={pending.has(item.description)}
                      >
                        Add
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {filteredStock.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--crm-muted)' }}>
                  Niets in uw bus dat hierop lijkt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {/*
          The table's five columns and a stepper control do not fit a phone —
          the same problem the leads list had. Below the breakpoint this is
          the same stock, one card per article, +/- reachable with a thumb
          instead of a table cell.
        */}
        <div className={styles.cards}>
          {filteredStock.map((item) => {
            const unitPrice: number | null = item.unit_cost === null || item.unit_cost === undefined
              ? null
              : Number(item.unit_cost);
            const totalAmount = unitPrice === null ? null : unitPrice * item.quantity;

            return (
              <div key={item.id} className={styles.stockCard}>
                <div className={styles.stockCardHead}>
                  <span style={{ fontSize: '1.3rem' }}>
                    {GROUP_INFO[(item.group as StockGroup) ?? 'overig']?.icon ?? '📦'}
                  </span>
                  <span className={styles.stockCardName}>{item.description}</span>
                  <StockBadge status={stockStatus(item)} />
                </div>

                <div className={styles.stockCardPrice}>
                  <span>{unitPrice === null ? '—' : MONEY.format(unitPrice)}</span>
                  {totalAmount !== null && (
                    <span className={styles.stockCardTotal}>{MONEY.format(totalAmount)} totaal</span>
                  )}
                </div>

                <div className={styles.qtyControl}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => handleRemoveStock(item.description, 1)}
                    disabled={pending.has(item.description) || item.quantity === 0}
                  >−</button>
                  <input type="text" className={styles.qtyInput} value={item.quantity} readOnly />
                  <button
                    className={styles.qtyBtn}
                    onClick={() => handleAddStock(item.description, 1)}
                    disabled={pending.has(item.description)}
                  >+</button>
                  <button
                    className={styles.addBtn}
                    onClick={() => handleAddStock(item.description, 1)}
                    disabled={pending.has(item.description)}
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}

          {filteredStock.length === 0 && (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--crm-muted)' }}>
              Niets in uw bus dat hierop lijkt.
            </p>
          )}
        </div>

        {/*
          The footer used to carry pages 1 2 3 4 … that were not wired to
          anything — a van holds a few dozen article types, so there is nothing
          to page through. It says how many there are instead.
        */}
        <div className={styles.tableFooter}>
          <div>
            {filteredStock.length === myStock.length
              ? `${myStock.length} artikel(en) in uw bus`
              : `${filteredStock.length} van ${myStock.length} artikelen`}
          </div>
        </div>
      </div>

      {/*
        Analysis: where the value sits, and what has moved.

        Deliberately two readings rather than a wall of tiles. Which groups
        hold the money answers "what is this van worth and in what", and the
        movement list answers "what changed" — the two questions a stock page
        is actually opened for. Both come from real rows; nothing is modelled
        or projected.
      */}
      {perGroup.length > 0 && (
        <div className={styles.analysis}>
          <div className={styles.analysisCard}>
            <h3 className={styles.analysisTitle}>Waarde per soort</h3>
            <div className={styles.bars}>
              {[...perGroup]
                .sort((a, b) => b.value - a.value)
                .map((g) => {
                  const top = Math.max(...perGroup.map((x) => x.value), 1);
                  return (
                    <div key={g.id} className={styles.barRow}>
                      <span className={styles.barLabel}>
                        <span aria-hidden="true">{g.icon}</span> {g.label}
                      </span>
                      <span className={styles.barTrack}>
                        <span
                          className={styles.barFill}
                          style={{ width: `${Math.round((g.value / top) * 100)}%` }}
                        />
                      </span>
                      <span className={styles.barValue}>{MONEY.format(g.value)}</span>
                      <span className={styles.barUnits}>{g.units} st.</span>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className={styles.analysisCard}>
            <h3 className={styles.analysisTitle}>Laatste mutaties</h3>
            {moves.length === 0 ? (
              <p className={styles.analysisEmpty}>
                Nog geen mutaties vastgelegd. De geschiedenis begint zodra
                0039_stock_history.sql is uitgevoerd.
              </p>
            ) : (
              <ul className={styles.moveList}>
                {moves.slice(0, 12).map((move) => {
                  const delta = Number(move.delta);
                  return (
                    <li key={String(move.id)} className={styles.moveRow}>
                      <span className={delta < 0 ? styles.moveOut : styles.moveIn}>
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                      <span className={styles.moveName}>{move.description}</span>
                      <span className={styles.moveMeta}>
                        {move.reason} ·{' '}
                        {new Date(move.changed_at).toLocaleDateString('nl-NL', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                      <span className={styles.moveAfter}>→ {Number(move.quantity_after)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
