'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { VEHICLE_DATA, FALLBACK_MODELS, getYears } from '@/lib/vehicleData';

export default function MerkenHero() {
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  const allBrands = Object.keys(VEHICLE_DATA).sort();
  const availableModels = selectedBrand ? (VEHICLE_DATA[selectedBrand] || FALLBACK_MODELS) : [];
  const years = getYears();
  
  const isComplete = selectedYear && selectedBrand && selectedModel;
  
  return (
    <div style={{ position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. Hero Image Background */}
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '450px', // Large hero area
        /* A flat colour instead of a placehold.co "Garage Workspace" tile:
           an external image host is a dependency this page does not need. */
        background: 'linear-gradient(120deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
      }}>
        {/* Dark Gradient Overlay for text readability (matches the reference's left shadow) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)'
        }}></div>

        <div className="container" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: 800, 
            color: '#fff', 
            marginBottom: '1rem',
            letterSpacing: '-1px'
          }}>
            Alle Automerken
          </h1>
          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            alignItems: 'flex-start',
            maxWidth: '500px'
          }}>
            <span style={{ 
              color: '#eab308', // Yellow quote mark
              fontSize: '4rem', 
              fontFamily: 'Georgia, serif', 
              lineHeight: 1,
              marginTop: '-0.5rem'
            }}>
              “
            </span>
            <div>
              <p style={{ 
                color: '#fff', 
                fontSize: '1.1rem', 
                lineHeight: 1.5, 
                marginBottom: '0.5rem',
                fontStyle: 'italic'
              }}>
                Vind de perfecte sleutel of accessoire speciaal voor jouw auto. Selecteer je merk om te beginnen en ontdek ons ruime aanbod.
              </p>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                <span style={{ color: '#eab308', fontFamily: 'Caveat, cursive', fontSize: '1.5rem', marginRight: '0.5rem' }}>Autosleutel24</span> team
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Overlapping Vehicle Banner */}
      <div style={{
        position: 'relative',
        marginTop: '-3rem', // Pulls banner up to overlap hero
        zIndex: 10
      }}>
        <div className="container">
          <div style={{
            background: '#f6f4eb', // Same as page bg, but acts as banner
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            padding: '2rem 2rem 0 2rem',
            boxShadow: '0 -10px 20px rgba(0,0,0,0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Faint Car Icons Background Line */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: 0,
              width: '100%',
              height: '30px',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'30\' viewBox=\'0 0 100 30\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M10 20 L20 10 L40 10 L50 20 Z\' fill=\'none\' stroke=\'%23d1d5db\' stroke-width=\'2\'/%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'3\' fill=\'none\' stroke=\'%23d1d5db\' stroke-width=\'2\'/%3E%3Ccircle cx=\'40\' cy=\'20\' r=\'3\' fill=\'none\' stroke=\'%23d1d5db\' stroke-width=\'2\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat-x',
              opacity: 0.5,
              zIndex: 1
            }}></div>

            <div style={{ position: 'relative', zIndex: 2, paddingBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              {!isComplete ? (
                <div style={{ width: '100%', maxWidth: '450px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1.5rem 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    Vind wat 
                    <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 500 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="16 10 12 14 8 10"></polyline></svg>
                      Past
                    </span> 
                    op uw auto
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Step 1: Year */}
                    {selectedYear ? (
                      <div 
                        onClick={() => { setSelectedYear(''); setSelectedModel(''); }}
                        style={{ border: '1px solid #4ade80', borderRadius: '6px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', cursor: 'pointer', marginBottom: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                      >
                        <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 500 }}>{selectedYear}</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    ) : (
                      <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          style={{ width: '100%', appearance: 'none', border: '1px solid #94a3b8', borderRadius: '6px', padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#0f172a', background: '#fff', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                        >
                          <option value="" disabled>Selecteer Bouwjaar</option>
                          {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Brand */}
                    {selectedYear && (
                      selectedBrand ? (
                        <div 
                          onClick={() => { setSelectedBrand(''); setSelectedModel(''); }}
                          style={{ border: '1px solid #4ade80', borderRadius: '6px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', cursor: 'pointer', marginBottom: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                        >
                          <span style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 500 }}>{selectedBrand}</span>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      ) : (
                        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                          <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            style={{ width: '100%', appearance: 'none', border: '1px solid #94a3b8', borderRadius: '6px', padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#0f172a', background: '#fff', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                          >
                            <option value="" disabled>Selecteer Merk</option>
                            {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                          <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </div>
                        </div>
                      )
                    )}

                    {/* Step 3: Model */}
                    {selectedYear && selectedBrand && (
                      <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          style={{ width: '100%', appearance: 'none', border: '1px solid #94a3b8', borderRadius: '6px', padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#0f172a', background: '#fff', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                        >
                          <option value="" disabled>Selecteer Model</option>
                          {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Begin met winkelen voor uw
                  </h2>
                  <div style={{ display: 'inline-block', borderBottom: '2px solid #c2410c', paddingBottom: '0.2rem', marginBottom: '1rem' }}>
                    <Link href={`/webshop/catalogus?make=${selectedBrand.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                      <span style={{ fontSize: '1.2rem', color: '#c2410c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {selectedYear} {selectedBrand} {selectedModel}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </span>
                    </Link>
                  </div>
                  <div>
                    <button 
                      onClick={() => { setSelectedYear(''); setSelectedBrand(''); setSelectedModel(''); }}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0 auto' }}
                    >
                      <span>✕</span> Verwijder huidig voertuig
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/*
              Sub-navigation with destinations that exist.

              These four links were `#alle-merken`, `#meest-gezocht`, `#nieuw`
              — anchors this page does not contain, so they scrolled nowhere —
              and `/installatie-gids`, which is a 404. The row also did not
              wrap, so the last item ran off a phone screen.
            */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '0.75rem 2.5rem',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '1.5rem',
              paddingBottom: '1.5rem',
              position: 'relative',
              zIndex: 2
            }}>
              {[
                { href: '/webshop/catalogus', label: 'Alle producten', accent: true },
                { href: '/webshop/catalogus?category=afstandsbedieningen', label: 'Autosleutels' },
                { href: '/webshop/aanbiedingen', label: 'Aanbiedingen' },
                { href: '/blog/autosleutel-batterij-vervangen-stappenplan', label: 'Uitleg & tips' },
              ].map(({ href, label, accent }) => (
                <Link
                  key={href}
                  href={href}
                  style={{ fontSize: '0.75rem', fontWeight: 700, color: accent ? '#c2410c' : '#475569', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  {label}
                </Link>
              ))}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
