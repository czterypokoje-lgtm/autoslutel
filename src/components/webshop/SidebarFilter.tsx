'use client';
import React, { useState } from 'react';

const accordionHeaderStyle = {
  fontSize: '0.9rem',
  fontWeight: 700,
  color: '#0f172a',
  padding: '1rem 0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  borderTop: '1px solid #e5e5e5'
};

const checkboxRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.75rem',
  fontSize: '0.85rem',
  color: '#0f172a',
  cursor: 'pointer'
};

export default function SidebarFilter() {
  const [search, setSearch] = useState('');

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#fff', border: '1px solid #e5e5e5', borderRadius: '4px', overflow: 'hidden' }}>
      
      {/* Brand Section */}
      <div style={{ padding: '0 1rem' }}>
        <div style={{ ...accordionHeaderStyle, borderTop: 'none' }}>
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:'8px'}}><polyline points="18 15 12 9 6 15"></polyline></svg> Brand</span>
        </div>
        
        <div style={{ paddingBottom: '1rem' }}>
          {[
            { name: 'Alpine', count: 1 },
            { name: 'Audeze', count: 1 },
            { name: 'Bose', count: 7 },
            { name: 'Brane Audio', count: 1 },
            { name: 'Devialet', count: 6 },
            { name: 'Ecoxgear', count: 9 },
          ].map(brand => (
            <label key={brand.name} style={checkboxRowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" style={{ width: '14px', height: '14px' }} />
                {brand.name}
              </div>
              <span>{brand.count}</span>
            </label>
          ))}
          <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem' }}>Show more</div>
        </div>
      </div>

      {/* Price Range Section */}
      <div style={{ padding: '0 1rem' }}>
        <div style={accordionHeaderStyle}>
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:'8px'}}><polyline points="18 15 12 9 6 15"></polyline></svg> Price Range</span>
        </div>
        
        <div style={{ paddingBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, marginRight: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#0f172a', marginBottom: '0.25rem' }}>Min</div>
              <input type="text" defaultValue="€30" style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', color: '#0f172a', marginBottom: '0.25rem' }}>Max</div>
              <input type="text" defaultValue="€1200" style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
            </div>
          </div>

          {/* Mock Slider */}
          <div style={{ position: 'relative', height: '8px', background: '#e5e5e5', borderRadius: '4px', marginTop: '0.5rem' }}>
            <div style={{ position: 'absolute', left: '10%', right: '20%', height: '100%', background: '#c2410c', borderRadius: '4px' }}></div>
            <div style={{ position: 'absolute', left: '10%', top: '50%', transform: 'translate(-50%, -50%)', width: '16px', height: '16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}></div>
            <div style={{ position: 'absolute', right: '20%', top: '50%', transform: 'translate(50%, -50%)', width: '16px', height: '16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}></div>
          </div>

        </div>
      </div>

      {/* Customer Rating Section */}
      <div style={{ padding: '0 1rem' }}>
        <div style={accordionHeaderStyle}>
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:'8px'}}><polyline points="18 15 12 9 6 15"></polyline></svg> Customer Rating</span>
        </div>
        
        <div style={{ paddingBottom: '1rem' }}>
          <label style={checkboxRowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" style={{ width: '14px', height: '14px' }} />
              <span style={{ color: '#eab308', fontSize: '0.9rem' }}>★★★★★</span> <span style={{fontSize: '0.85rem'}}>5 stars</span>
            </div>
            <span>64</span>
          </label>
          <label style={checkboxRowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" style={{ width: '14px', height: '14px' }} />
              <span style={{ color: '#eab308', fontSize: '0.9rem' }}>★★★★<span style={{color:'#cbd5e1'}}>★</span></span> <span style={{fontSize: '0.85rem'}}>4 stars & up</span>
            </div>
            <span>120</span>
          </label>
        </div>
      </div>

    </div>
  );
}
