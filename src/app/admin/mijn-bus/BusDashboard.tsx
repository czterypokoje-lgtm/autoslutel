'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { transferStock } from './actions';
import styles from './BusDashboard.module.css';

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

      <div className={styles.header}>
        <h1 className={styles.title}>Mijn bus</h1>
        <button className={styles.filterBtn}>
          Filter
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        </button>
      </div>

      {/* STATS ROW (ONE CONTAINER) */}
      <div className={styles.statsContainer}>
        <div className={styles.statSection}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Artikelen in de bus</span>
            <div className={styles.statIcon} style={{color: '#4f46e5', background: '#e0e7ff'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            </div>
          </div>
          <div className={styles.statBottom}>
            <span className={styles.statValue}>{totalProducts.toLocaleString()}</span>
            <span className={`${styles.statBadge} ${styles.statBadgeRed}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg> 12%
            </span>
          </div>
        </div>

        <div className={styles.statSection}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Op voorraad</span>
            <div className={styles.statIcon} style={{color: '#2563eb', background: '#dbeafe'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            </div>
          </div>
          <div className={styles.statBottom}>
            <span className={styles.statValue}>{activeProducts.toLocaleString()}</span>
            <span className={`${styles.statBadge} ${styles.statBadgeGreen}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg> 12%
            </span>
          </div>
        </div>

        <div className={styles.statSection}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>In het magazijn</span>
            <div className={styles.statIcon} style={{color: '#4f46e5', background: '#e0e7ff'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
          </div>
          <div className={styles.statBottom}>
            <span className={styles.statValue}>525</span>
            <span className={`${styles.statBadge} ${styles.statBadgeRed}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg> 12%
            </span>
          </div>
        </div>

        <div className={styles.statSection}>
          <div className={styles.statTop}>
            <span className={styles.statLabel}>Bijna op</span>
            <div className={styles.statIcon} style={{color: '#4f46e5', background: '#e0e7ff'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
          </div>
          <div className={styles.statBottom}>
            <span className={styles.statValue}>325</span>
            <span className={`${styles.statBadge} ${styles.statBadgeRed}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg> 12%
            </span>
          </div>
        </div>
      </div>

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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '40px', paddingLeft: '1.5rem' }}>
                <input type="checkbox" style={{ borderRadius: '4px', border: '1px solid #d1d5db' }} />
              </th>
              <th>
                <div className={styles.thContent}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                  Product name
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  Vendor
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Unit price
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Texes
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                  Total amount
                </div>
              </th>
              <th>
                <div className={styles.thContent}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Quantity
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.map((item, idx) => {
              const unitPrice = 100.00;
              const totalAmount = unitPrice * item.quantity;
              
              // Generate a mock vendor based on index for the visual effect
              const vendors = [
                { name: 'Wade Warren', initial: 'W', color: '#e0e7ff', text: '#4f46e5' },
                { name: 'Courtney Henry', initial: 'C', color: '#ffedd5', text: '#ea580c' },
                { name: 'Jerome Bell', initial: 'J', color: '#dcfce7', text: '#16a34a' },
                { name: 'Annette Black', initial: 'A', color: '#f3e8ff', text: '#9333ea' },
                { name: 'Savannah Nguyen', initial: 'S', color: '#fce7f3', text: '#db2777' },
                { name: 'Kristin Watson', initial: 'K', color: '#e0e7ff', text: '#4f46e5' },
                { name: 'Arlene McCoy', initial: 'A', color: '#ffedd5', text: '#ea580c' },
                { name: 'Jane Cooper', initial: 'J', color: '#dcfce7', text: '#16a34a' },
                { name: 'Devon Lane', initial: 'D', color: '#fef08a', text: '#ca8a04' },
                { name: 'Brooklyn Simmons', initial: 'B', color: '#ccfbf1', text: '#0d9488' },
                { name: 'Leslie Alexander', initial: 'L', color: '#ffe4e6', text: '#e11d48' },
              ];
              const vendor = vendors[idx % vendors.length];

              return (
                <tr key={item.id}>
                  <td style={{ paddingLeft: '1.5rem' }}>
                    <input type="checkbox" style={{ borderRadius: '4px', border: '1px solid #d1d5db' }} />
                  </td>
                  <td>
                    <div className={styles.productCell}>
                      <div style={{ fontSize: '1.5rem' }}>📦</div>
                      {item.description}
                    </div>
                  </td>
                  <td>
                    <div className={styles.vendorCell}>
                      <div className={styles.vendorAvatar} style={{ background: vendor.color, color: vendor.text }}>
                        {vendor.initial}
                      </div>
                      {vendor.name}
                    </div>
                  </td>
                  <td>${unitPrice.toFixed(2)}</td>
                  <td>16%</td>
                  <td>MXN ${totalAmount.toFixed(2)}</td>
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
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className={styles.tableFooter}>
          <div>
            Viewing 1-{Math.min(13, filteredStock.length)} of {filteredStock.length} results
          </div>
          <div className={styles.pagination}>
            <button className={styles.pageBtn}>&lt;</button>
            <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
            <button className={styles.pageBtn}>2</button>
            <button className={styles.pageBtn}>3</button>
            <button className={styles.pageBtn}>4</button>
            <button className={styles.pageBtn}>...</button>
            <button className={styles.pageBtn}>&gt;</button>
          </div>
        </div>
      </div>

    </div>
  );
}
