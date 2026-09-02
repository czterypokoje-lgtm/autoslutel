'use client';
import React, { useState } from 'react';

interface BundleItem {
  id: string;
  name: string;
  price: number;
  selected: boolean;
}

interface BatteryData {
  slug: string;
  title: string;
  price: number;
  image: string;
}

export default function ProductBundleSection({ mainProductTitle, mainProductPrice, mainProductImage, batteryData }: { mainProductTitle: string, mainProductPrice: number, mainProductImage: string, batteryData: BatteryData | null }) {
  const [items, setItems] = useState<BundleItem[]>([
    { id: 'protection', name: 'Levenslange Garantie Plan', price: 6.95, selected: true },
    { id: 'batteries', name: batteryData?.title || 'Batterijen voor deze sleutel', price: batteryData?.price || 5.49, selected: true },
    { id: 'keychain', name: 'RVS Magnetische Sleutelhanger', price: 9.95, selected: true },
  ]);

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const calculateTotal = () => {
    const bundlePrice = items.filter(i => i.selected).reduce((sum, i) => sum + parseFloat(String(i.price)), 0);
    return (parseFloat(String(mainProductPrice)) + bundlePrice).toFixed(2);
  };

  return (
    <div style={{ marginTop: '3rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Banner */}
      <div style={{ background: '#111827', color: '#fff', textAlign: 'center', padding: '1rem', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.5px' }}>
        VAAK SAMEN GEKOCHT
      </div>
      <div style={{ background: '#fcd34d', color: '#78350f', textAlign: 'center', padding: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
        Bespaar 20% op batterijen en garantie wanneer je beide toevoegt. <span style={{ fontStyle: 'italic', fontWeight: 400 }}>(korting verrekend in winkelmand)</span>
      </div>

      <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Visual Bundle Row */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* Main Product */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '70px', height: '70px', position: 'relative' }}>
              <img src={mainProductImage || "/images/bmw-key-desktop.png"} alt="Main Product" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
          
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#94a3b8' }}>+</div>

          {/* Protection Plan */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: items.find(i => i.id === 'protection')?.selected ? 1 : 0.4 }}>
            <div style={{ width: '65px', height: '65px', background: '#1e3a8a', clipPath: 'polygon(50% 0%, 100% 20%, 100% 80%, 50% 100%, 0% 80%, 0% 20%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, padding: '0.5rem' }}>
              Levenslange<br/>Garantie
            </div>
            <div style={{ background: '#eab308', color: '#fff', padding: '0.1rem 0.4rem', fontSize: '0.65rem', fontWeight: 700, marginTop: '-8px', zIndex: 2, position: 'relative' }}>€6.95</div>
          </div>

          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#94a3b8' }}>+</div>

          {/* Batteries */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: items.find(i => i.id === 'batteries')?.selected ? 1 : 0.4, width: '80px', textAlign: 'center' }}>
            {batteryData?.image ? (
              <img src={batteryData.image} alt="Battery" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '60px', height: '60px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '2px', position: 'relative' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #cbd5e1', background: '#f8fafc' }}></div>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #cbd5e1', background: '#f8fafc' }}></div>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #cbd5e1', background: '#f8fafc' }}></div>
              </div>
            )}
            <div style={{ fontSize: '0.65rem', color: '#b93c20', fontWeight: 700, marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>
              {batteryData?.title?.includes('VL') ? 'Rechargeable' : 'Batterijen'}
            </div>
          </div>

          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#94a3b8' }}>+</div>

          {/* Keychain */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: items.find(i => i.id === 'keychain')?.selected ? 1 : 0.4 }}>
            <div style={{ width: '60px', height: '70px', border: '2px dashed #94a3b8', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </div>
          </div>

          {/* Total Box */}
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingLeft: '1rem', borderLeft: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.9rem', color: '#334155' }}>
              Totaalprijs: <span style={{ fontWeight: 800, color: '#0f172a' }}>€{calculateTotal()}</span>
            </div>
            <button style={{ 
              background: '#111827', 
              color: '#fff', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              marginTop: '0.5rem',
              cursor: 'pointer',
              borderRadius: '2px',
              whiteSpace: 'nowrap'
            }}>
              IN WINKELMAND
            </button>
          </div>

        </div>

        {/* Checkboxes List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
          <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            Kies opties voor alle geselecteerde producten
          </div>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#334155', cursor: 'pointer' }}>
            <input type="checkbox" checked={true} readOnly style={{ width: '16px', height: '16px', accentColor: '#111827' }} />
            <span><strong>Dit artikel:</strong> {mainProductTitle}</span>
            <span style={{ color: '#64748b' }}>€{parseFloat(String(mainProductPrice)).toFixed(2)}</span>
          </label>

          {items.map(item => (
            <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#334155', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={item.selected} 
                onChange={() => toggleItem(item.id)}
                style={{ width: '16px', height: '16px', accentColor: '#111827' }} 
              />
              <span style={{ textDecoration: item.selected ? 'none' : 'line-through', opacity: item.selected ? 1 : 0.6 }}>{item.name}</span>
              <span style={{ color: '#64748b', opacity: item.selected ? 1 : 0.6 }}>€{parseFloat(String(item.price)).toFixed(2)}</span>
            </label>
          ))}
          
        </div>

      </div>
    </div>
  );
}
