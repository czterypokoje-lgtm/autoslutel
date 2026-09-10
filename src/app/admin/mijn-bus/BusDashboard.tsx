'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { transferStock } from './actions';
import styles from './BusDashboard.module.css';

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export default function BusDashboard({
  myStock,
  centralStock,
  otherTechs,
  technicianId
}: {
  myStock: any[];
  centralStock: any[];
  otherTechs: any[];
  technicianId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  /** Why a transfer was refused, in the monteur's own words. */
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Stats calculation
  const totalProducts = myStock.length;
  const activeProducts = myStock.filter(item => item.quantity > 0).length;
  
  const filteredStock = myStock.filter(item => 
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddStock(description: string, qty: number) {
    if (loading) return;
    setLoading(true);
    setNotice(null);
    // The action answers with a reason rather than throwing, so the monteur is
    // told which rule stopped them instead of "er ging iets mis".
    const result = await transferStock(null, technicianId, description, qty);
    setLoading(false);
    if ('error' in result) {
      setNotice(result.error);
      return;
    }
    router.refresh();
  }

  async function handleRemoveStock(description: string, qty: number) {
    if (loading) return;
    setLoading(true);
    setNotice(null);
    const result = await transferStock(technicianId, null, description, qty);
    setLoading(false);
    if ('error' in result) {
      setNotice(result.error);
      return;
    }
    router.refresh();
  }

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
                      <div style={{ fontSize: '1.5rem' }}>📦</div>
                      {item.description}
                    </div>
                  </td>
                  <td>{unitPrice === null ? '—' : MONEY.format(unitPrice)}</td>
                  <td>{totalAmount === null ? '—' : MONEY.format(totalAmount)}</td>
                  <td>
                    <div className={styles.qtyControl}>
                      <button 
                        className={styles.qtyBtn} 
                        onClick={() => handleRemoveStock(item.description, 1)}
                        disabled={loading || item.quantity === 0}
                      >−</button>
                      <input type="text" className={styles.qtyInput} value={item.quantity} readOnly />
                      <button 
                        className={styles.qtyBtn} 
                        onClick={() => handleAddStock(item.description, 1)}
                        disabled={loading}
                      >+</button>
                      <button 
                        className={styles.addBtn}
                        onClick={() => handleAddStock(item.description, 1)}
                        disabled={loading}
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
                  <span style={{ fontSize: '1.3rem' }}>📦</span>
                  <span className={styles.stockCardName}>{item.description}</span>
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
                    disabled={loading || item.quantity === 0}
                  >−</button>
                  <input type="text" className={styles.qtyInput} value={item.quantity} readOnly />
                  <button
                    className={styles.qtyBtn}
                    onClick={() => handleAddStock(item.description, 1)}
                    disabled={loading}
                  >+</button>
                  <button
                    className={styles.addBtn}
                    onClick={() => handleAddStock(item.description, 1)}
                    disabled={loading}
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

    </div>
  );
}
