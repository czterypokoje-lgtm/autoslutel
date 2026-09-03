'use client';
import React, { useState } from 'react';
import { VEHICLE_DATA, FALLBACK_MODELS, getYears } from '@/lib/vehicleData';

import type { Fitment } from '@/lib/catalog';

export default function VehicleFitmentWidget({ 
  defaultBrand = '',
  defaultModel = '',
  defaultYear = '',
  fitment = []
}: { 
  defaultBrand?: string,
  defaultModel?: string,
  defaultYear?: string,
  fitment?: Fitment[]
}) {
  const [activeTab, setActiveTab] = useState<'kenteken' | 'handmatig'>('handmatig');
  
  /*
   * The defaults are the product's own make and model, rendered on the server
   * and unchanged for the life of this component, so they belong in the
   * initialiser. Three effects used to copy them into state after the first
   * paint, which React 19 rejects outright (react-hooks/set-state-in-effect)
   * and which cost an extra render each.
   *
   * The third of those effects cleared model, year and origin whenever the
   * brand changed — including the moment a kenteken lookup filled all three
   * in, so a successful lookup wiped its own answer.
   */
  const brandFromDefault =
    Object.keys(VEHICLE_DATA).find((b) => b.toLowerCase() === defaultBrand.toLowerCase()) ?? '';

  // States for all dropdowns
  const [selectedBrand, setSelectedBrand] = useState<string>(brandFromDefault);
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel || '');
  const [selectedYear, setSelectedYear] = useState<string>(defaultYear || '');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('');

  const [kenteken, setKenteken] = useState('');
  const [kentekenLoading, setKentekenLoading] = useState(false);
  const [kentekenError, setKentekenError] = useState('');


  const allBrands = Object.keys(VEHICLE_DATA).sort();
  const availableModels = selectedBrand ? (VEHICLE_DATA[selectedBrand] || FALLBACK_MODELS) : [];
  const years = getYears();

  /** Picking another make invalidates the model, year and origin below it. */
  const chooseBrand = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel('');
    setSelectedYear('');
    setSelectedOrigin('');
    setResult('idle');
  };

  
  const checkKenteken = async () => {
    if (!kenteken) return;
    setKentekenLoading(true);
    setKentekenError('');
    setResult('idle');
    try {
      const cleanK = kenteken.replace(/[^a-zA-Z0-9]/g, '');
      const res = await fetch(`/api/kenteken?kenteken=${cleanK}`);
      const data = await res.json();
      
      if (!res.ok || data.error) {
        setKentekenError(data.error || 'Kenteken niet gevonden');
        setKentekenLoading(false);
        return;
      }
      
      const { merk, handelsbenaming, datum_eerste_toelating } = data.data;
      const kBrand = (merk || '').toLowerCase();
      const kModel = (handelsbenaming || '').toLowerCase();
      const kYear = datum_eerste_toelating ? parseInt(datum_eerste_toelating.substring(0,4)) : 0;
      
      if (fitment.length === 0) {
        setResult('success');
        setKentekenLoading(false);
        return;
      }
      
      const isMatch = fitment.some(f => 
        kBrand.includes(f.make.toLowerCase()) &&
        (kModel.includes(f.model.toLowerCase()) || f.model.toLowerCase().includes(kModel)) &&
        kYear >= f.from && kYear <= f.to
      );
      
      setSelectedBrand(merk || '');
      setSelectedModel(handelsbenaming || '');
      setSelectedYear(kYear.toString());
      setResult(isMatch ? 'success' : 'fail');
    } catch (e) {
      setKentekenError('Fout bij ophalen kenteken');
    }
    setKentekenLoading(false);
  };

  const isComplete = selectedBrand && selectedModel && selectedYear && selectedOrigin;

  const [result, setResult] = useState<'idle' | 'success' | 'fail'>('idle');

  const checkFitment = () => {
    if (!selectedBrand || !selectedModel || !selectedYear) return;
    
    // If no fitment data is available on the product at all, we assume it's generic
    if (fitment.length === 0) {
      setResult('success');
      return;
    }

    const yearNum = parseInt(selectedYear);
    
    const isMatch = fitment.some(f => 
      f.make.toLowerCase() === selectedBrand.toLowerCase() &&
      f.model.toLowerCase() === selectedModel.toLowerCase() &&
      yearNum >= f.from && yearNum <= f.to
    );

    setResult(isMatch ? 'success' : 'fail');
  };

  /*
   * The outcome is cleared where the input changes, not in an effect watching
   * the three fields. That effect also ran after a kenteken lookup — which
   * fills brand, model and year — so it wiped the "past op uw auto" answer it
   * had just produced.
   */

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
        <>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="AB-123-C" 
            value={kenteken}
            onChange={(e) => setKenteken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkKenteken()}
            style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '4px', textTransform: 'uppercase', flex: 1, maxWidth: '250px' }} 
          />
          <button 
            onClick={checkKenteken}
            disabled={!kenteken || kentekenLoading}
            style={{ 
              background: kenteken && !kentekenLoading ? '#0f172a' : '#cbd5e1', 
              color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', fontWeight: 700, 
              cursor: kenteken && !kentekenLoading ? 'pointer' : 'not-allowed' 
            }}>
            {kentekenLoading ? 'Zoeken...' : 'Controleer'}
          </button>
        </div>
        {kentekenError && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>{kentekenError}</div>}
        </>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          
          <select 
            value={selectedBrand} 
            onChange={(e) => chooseBrand(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', flex: '1 1 120px', fontSize: '0.85rem', color: selectedBrand ? '#0f172a' : '#64748b', background: '#fff' }}
          >
            <option value="">Merk</option>
            {allBrands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          <select 
            value={selectedModel}
            onChange={(e) => { setSelectedModel(e.target.value); setResult('idle'); }}
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
            onChange={(e) => { setSelectedYear(e.target.value); setResult('idle'); }}
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
            onClick={checkFitment}
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
            Controleer
          </button>
        </div>
      )}

      {result === 'success' && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '4px', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Pasvorm bevestigd! Dit onderdeel past op uw {selectedBrand} {selectedModel} ({selectedYear}).
        </div>
      )}
      {result === 'fail' && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: 600 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          Dit onderdeel past helaas niet op de geselecteerde auto.
        </div>
      )}

    </div>
  );
}
