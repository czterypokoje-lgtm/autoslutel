import React from 'react';

export default function FilterBar() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Left side: Sort by */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Sort by:</span>
        <div style={{ 
          background: '#fff', 
          border: '1px solid #fff', 
          borderRadius: '4px', 
          padding: '0.4rem 0.75rem', 
          fontSize: '0.85rem', 
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          Created on
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>

      {/* Center: Product Count */}
      <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>
        (1563 products)
      </div>

      {/* Right side: View modes & Per page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        
        {/* Grid / List Toggles */}
        <div style={{ display: 'flex', gap: '0.2rem' }}>
          <button style={{ background: '#1e293b', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
          <button style={{ background: '#fff', color: '#cbd5e1', border: 'none', borderRadius: '4px', padding: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path></svg>
          </button>
        </div>

        {/* Per page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            background: '#fff', 
            border: '1px solid #fff', 
            borderRadius: '4px', 
            padding: '0.4rem 0.75rem', 
            fontSize: '0.85rem', 
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            20
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>per page</span>
        </div>

      </div>

    </div>
  );
}
