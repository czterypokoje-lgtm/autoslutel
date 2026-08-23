'use client';
import React, { useState, useEffect } from 'react';
import { VEHICLE_DATA, FALLBACK_MODELS, getYears } from '@/lib/vehicleData';

export default function VehicleFitmentWidget({ 
  defaultBrand = '',
  defaultModel = '',
  defaultYear = ''
}: { 
  defaultBrand?: string,
  defaultModel?: string,
  defaultYear?: string
}) {
  const [activeTab, setActiveTab] = useState<'kenteken' | 'handmatig'>('handmatig');
  
  // States for all dropdowns
  const [selectedBrand, setSelectedBrand] = useState<string>(defaultBrand || '');
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel || '');
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear || '');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');

  const allBrands = Object.keys(VEHICLE_DATA).sort();
  const availableModels = selectedBrand ? (VEHICLE_DATA[selectedBrand] || FALLBACK_MODELS) : [];
  const years = getYears();

  // Auto-select brand if defaultBrand is provided (e.g. from the URL/product)
  useEffect(() => {
    if (defaultBrand && !selectedBrand) {
      // Find matching brand case-insensitively
      const match = allBrands.find(b => b.toLowerCase() === defaultBrand.toLowerCase());
      if (match) setSelectedBrand(match);
    }
  }, [defaultBrand, allBrands, selectedBrand]);

  useEffect(() => {
    if (defaultModel) setSelectedModel(defaultModel);
    if (defaultYear) setSelectedYear(defaultYear);
  }, [defaultModel, defaultYear]);

  // Reset dependent fields when brand changes
  useEffect(() => {
    setSelectedModel('');
    setSelectedYear('');
    setSelectedOrigin('');
  }, [selectedBrand]);

  const isComplete = selectedBrand && selectedModel && selectedYear && selectedOrigin;

  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '1rem 1.5rem',
      marginBottom: '1.5rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ width: '48px', height: '48px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2.5 2.5 0 1 1-5 0m5 0a2.5 2.5 0 1 0-5 0m-7 0a2.5 2.5 0 1 1-5 0m5 0a2.5 2.5 0 1 0-5 0"></path></svg>
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>Controleer of het onderdeel past</h2>
          <p style={{ color: '#475569', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
            Voeg je voertuig toe om zeker te weten dat dit onderdeel past. Koop met een gerust hart: gratis retourneren.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid #cbd5e1', marginBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('kenteken')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 0', fontSize: '0.85rem', cursor: 'pointer',
            color: activeTab === 'kenteken' ? '#0f172a' : '#64748b',
            borderBottom: activeTab === 'kenteken' ? '2px solid #0f172a' : '2px solid transparent',
            fontWeight: activeTab === 'kenteken' ? 700 : 400
          }}>
          Via kenteken toevoegen
        </button>
        <button 
          onClick={() => setActiveTab('handmatig')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 0', fontSize: '0.85rem', cursor: 'pointer',
            color: activeTab === 'handmatig' ? '#0f172a' : '#64748b',
            borderBottom: activeTab === 'handmatig' ? '2px solid #0f172a' : '2px solid transparent',
            fontWeight: activeTab === 'handmatig' ? 700 : 400
          }}>
          Handmatig toevoegen
        </button>
      </div>

      {/* Forms */}
      {activeTab === 'kenteken' ? (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input type="text" placeholder="AB-123-C" style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '4px', textTransform: 'uppercase', flex: 1, maxWidth: '250px' }} />
          <button style={{ background: '#cbd5e1', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', fontWeight: 700, cursor: 'not-allowed' }}>Voertuig toevoegen</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          
          <select 
            value={selectedBrand} 
            onChange={(e) => setSelectedBrand(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', flex: '1 1 120px', fontSize: '0.85rem', color: selectedBrand ? '#0f172a' : '#64748b', background: '#fff' }}
          >
            <option value="">Merk</option>
            {allBrands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={!selectedBrand}
            style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', flex: '1 1 120px', fontSize: '0.85rem', color: selectedModel ? '#0f172a' : '#64748b', background: !selectedBrand ? '#f1f5f9' : '#fff' }}
          >
            <option value="">Model</option>
            {availableModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>

          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            disabled={!selectedModel}
            style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', flex: '1 1 120px', fontSize: '0.85rem', color: selectedYear ? '#0f172a' : '#64748b', background: !selectedModel ? '#f1f5f9' : '#fff' }}
          >
            <option value="">Bouwjaar</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select 
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
            disabled={!selectedYear}
            style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', flex: '1 1 120px', fontSize: '0.85rem', color: selectedOrigin ? '#0f172a' : '#64748b', background: !selectedYear ? '#f1f5f9' : '#fff' }}
          >
            <option value="">Herkomst</option>
            <option value="EU">EU (Europa)</option>
            <option value="USA">USA (Verenigde Staten)</option>
          </select>
          
          <button 
            disabled={!isComplete}
            style={{ 
              background: isComplete ? '#0f172a' : '#cbd5e1', 
              color: '#fff', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              borderRadius: '4px', 
              fontWeight: 700, 
              fontSize: '0.85rem', 
              cursor: isComplete ? 'pointer' : 'not-allowed', 
              flex: '1 1 120px',
              transition: 'background 0.2s'
            }}>
            Voertuig toevoegen
          </button>
        </div>
      )}

    </div>
  );
}
