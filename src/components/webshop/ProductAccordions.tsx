'use client';
import React, { useState } from 'react';

export default function ProductAccordions({ product }: { product: any }) {
  const [openSection, setOpenSection] = useState<string>('highlights');

  const toggleSection = (id: string) => {
    setOpenSection(prev => prev === id ? '' : id);
  };

  const accordionHeaderStyle = {
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    background: '#fff',
    borderBottom: '1px solid #f1f5f9'
  };

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: 800,
    margin: 0,
    color: '#0f172a'
  };

  const containerStyle = {
    background: '#fff', 
    borderRadius: '12px', 
    border: '1px solid #e5e5e5', 
    overflow: 'hidden', 
    marginBottom: '1rem'
  };

  const iconStyle = (isOpen: boolean) => ({
    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s ease-in-out'
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      
      {/* Product highlights */}
      <div style={containerStyle}>
        <div style={accordionHeaderStyle} onClick={() => toggleSection('highlights')}>
          <h2 style={titleStyle}>Product highlights</h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(openSection === 'highlights')}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {openSection === 'highlights' && (
          <div style={{ padding: '2rem', borderTop: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Product info:</h3>
            <div 
              className="prose prose-sm max-w-none"
              style={{ color: '#1a1a1a', fontSize: '0.95rem', lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: product.description || 'Geen uitgebreide beschrijving beschikbaar voor dit product.' }}
            />
          </div>
        )}
      </div>

      {/* Specificaties (Specs) */}
      <div style={containerStyle}>
        <div style={accordionHeaderStyle} onClick={() => toggleSection('specs')}>
          <h2 style={titleStyle}>Specificaties</h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(openSection === 'specs')}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {openSection === 'specs' && (
          <div style={{ padding: '2rem', borderTop: '1px solid #f1f5f9' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 600, width: '30%', color: '#334155' }}>Merk</td>
                  <td style={{ padding: '1rem 0', color: '#0f172a' }}>{product.brand || 'Aftermarket'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 600, color: '#334155' }}>Conditie</td>
                  <td style={{ padding: '1rem 0', color: '#0f172a' }}>Nieuw</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 600, color: '#334155' }}>Geschikt voor</td>
                  <td style={{ padding: '1rem 0', color: '#0f172a' }}>{product.brand ? `Diverse ${product.brand} modellen` : 'Universeel / Diverse modellen'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 600, color: '#334155' }}>Keurmerk</td>
                  <td style={{ padding: '1rem 0', color: '#0f172a' }}>CE gecertificeerd</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Wat zit er in de doos */}
      <div style={containerStyle}>
        <div style={accordionHeaderStyle} onClick={() => toggleSection('box')}>
          <h2 style={titleStyle}>Wat zit er in de doos</h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(openSection === 'box')}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {openSection === 'box' && (
          <div style={{ padding: '2rem', borderTop: '1px solid #f1f5f9' }}>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', lineHeight: 1.8, fontSize: '0.95rem', color: '#334155' }}>
              <li>1x {product.title}</li>
              <li>Montage-instructies (indien van toepassing)</li>
              <li>Garantiebewijs (12 maanden)</li>
            </ul>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div style={containerStyle}>
        <div style={accordionHeaderStyle} onClick={() => toggleSection('reviews')}>
          <h2 style={titleStyle}>Reviews (177)</h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(openSection === 'reviews')}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {openSection === 'reviews' && (
          <div style={{ padding: '2rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Klantenbeoordelingen</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <span style={{ color: '#eab308', fontSize: '1.25rem' }}>★★★★★</span>
                  <span style={{ fontWeight: 600 }}>4.8 / 5</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                    <div style={{ color: '#eab308', fontSize: '1rem', marginBottom: '0.25rem' }}>★★★★★</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Door <strong>Mark R.</strong> op 12 Mei 2026</div>
                    <p style={{ fontSize: '0.95rem', color: '#334155' }}>Precies zoals beschreven. Snelle levering en makkelijk in te leren.</p>
                  </div>
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                    <div style={{ color: '#eab308', fontSize: '1rem', marginBottom: '0.25rem' }}>★★★★★</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Door <strong>Jeroen B.</strong> op 03 Mei 2026</div>
                    <p style={{ fontSize: '0.95rem', color: '#334155' }}>Goede kwaliteit sleutel, voelt solide aan. Zeker aan te raden.</p>
                  </div>
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', minWidth: '250px' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Schrijf een review</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Help anderen met jouw ervaring over dit product.</p>
                <button style={{ background: '#b93c20', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                  Beoordeel dit product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Q&A */}
      <div style={containerStyle}>
        <div style={accordionHeaderStyle} onClick={() => toggleSection('qa')}>
          <h2 style={titleStyle}>Veelgestelde Vragen (Q&A)</h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyle(openSection === 'qa')}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        {openSection === 'qa' && (
          <div style={{ padding: '2rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Q: Moet deze sleutel nog geprogrammeerd worden?</h4>
              <p style={{ fontSize: '0.95rem', color: '#334155' }}>A: Ja, tenzij u alleen de behuizing vervangt en uw oude elektronica overzet, moet de transponderchip in deze sleutel worden ingeleerd op uw auto door een specialist.</p>
            </div>
            <div>
              <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Q: Zit er een batterij bij inbegrepen?</h4>
              <p style={{ fontSize: '0.95rem', color: '#334155' }}>A: Bij de meeste complete sleutels is een standaard batterij inbegrepen. Wij raden echter aan om een extra kwaliteitsbatterij (Panasonic/Varta) mee te bestellen.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
