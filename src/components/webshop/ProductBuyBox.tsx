'use client';
import React, { useState } from 'react';
import { addToCart } from '@/lib/cart';
import { SITE_CONFIG } from '@/config/site.config';

export default function ProductBuyBox({ title, price, oldPrice, description, slug, needsProgramming, category }: { title: string, price: string, oldPrice: string, description?: string, slug?: string, needsProgramming?: boolean, category?: string }) {
  const [purchaseType, setPurchaseType] = useState<'ship' | 'service'>('ship');
  const [added, setAdded] = useState(false);

  // The button was inert. It now writes to the basket, mapping the two
  // purchase choices onto the service options the cart and checkout use.
  const handleAdd = () => {
    if (!slug) return;
    addToCart(slug, purchaseType === 'ship' ? 'product_only' : 'mobile_tech');
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };
  const servicePrice = "169.00";
  const savings = (parseFloat(oldPrice) - parseFloat(price)).toFixed(2);
  
  // Theme Colors
  const themeOrange = '#b93c20'; // Crutchfield rust orange
  const bmBlack = '#1a1a1a';
  const bmBlueLight = '#e5edff';
  const bmBlueBorder = '#cbd5e1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 2. TITLE & REVIEWS */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ background: '#334155', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>Bestseller</span>
          <a href="#" style={{ color: '#475569', textDecoration: 'underline', fontSize: '0.75rem' }}>Bekijk alle Autosleutel24</a>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: bmBlack, lineHeight: 1.2, marginBottom: '0.5rem' }}>
          {title}
        </h1>
        {/*
          Removed: a five-star row with "(142 reviews)" and a "Q&A (24)" link,
          identical on every product and backed by nothing. Restore only when
          the counts come from real verified-purchase data.
        */}
      </div>

      {/* 3. PRICING */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: bmBlack, lineHeight: 1 }}>
            €{purchaseType === 'ship' ? price : servicePrice}
          </span>
          <div style={{ paddingBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b', textDecoration: 'line-through', marginRight: '0.5rem' }}>
              €{purchaseType === 'ship' ? oldPrice : "350.00"} dealer
            </span>
            <span style={{ background: '#16a34a', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
              Bespaar €{purchaseType === 'ship' ? savings : "181.00"}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: '#334155', marginTop: '0.5rem' }}>
          <span style={{ fontWeight: 800, color: '#000', background: '#ffb3c7', padding: '0 4px', borderRadius: '2px' }}>Klarna.</span>
          <span>Betaal in 3 delen.</span>
          <a href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>Lees meer</a>
        </div>
      </div>

      {/* 4. TRUST & SHIPPING BADGES (Moved ABOVE the Tech/Ship selector as requested) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        <div style={{ background: bmBlueLight, padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', fontWeight: 600, color: bmBlack }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          Gratis verzending in 1 werkdag
        </div>
        
        <div style={{ background: bmBlueLight, padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600, color: bmBlack, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
            <div>
              <div>Gratis 30 dagen retourneren</div>
              <div style={{ fontWeight: 400, fontSize: '0.85rem' }}>1 jaar garantie</div>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>

        <div style={{ background: bmBlueLight, padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600, color: bmBlack, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Gegarandeerd door Autosleutel24 Belofte
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      </div>

      {/* 5. OPTION SELECTOR (Mobile Tech vs Ship) */}
      <div style={{ marginTop: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: bmBlack }}>Kies je service:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          
          {/* Option 1: Ship */}
          <label 
            style={{ 
              display: 'block', 
              padding: '1rem', 
              border: purchaseType === 'ship' ? `2px solid ${themeOrange}` : `1px solid ${bmBlueBorder}`, 
              borderRadius: '8px', 
              cursor: 'pointer',
              background: purchaseType === 'ship' ? '#fffaf8' : '#fff',
              position: 'relative',
              transition: 'all 0.2s'
            }}
            onClick={() => setPurchaseType('ship')}
          >
            <div style={{ position: 'absolute', top: 12, right: 12, width: 18, height: 18, borderRadius: '50%', border: purchaseType === 'ship' ? `6px solid ${themeOrange}` : '2px solid #cbd5e1' }} />
            <div style={{ fontWeight: 800, fontSize: '1rem', color: bmBlack, marginBottom: '0.25rem' }}>Stuur sleutel naar mij</div>
            <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>Inclusief programmeer gids.</div>
            <div style={{ fontWeight: 700 }}>+ €{price}</div>
          </label>

          {/* Option 2: Service */}
          <label 
            style={{ 
              display: 'block', 
              padding: '1rem', 
              border: purchaseType === 'service' ? `2px solid ${themeOrange}` : `1px solid ${bmBlueBorder}`, 
              borderRadius: '8px', 
              cursor: 'pointer',
              background: purchaseType === 'service' ? '#fffaf8' : '#fff',
              position: 'relative',
              transition: 'all 0.2s'
            }}
            onClick={() => setPurchaseType('service')}
          >
            <div style={{ position: 'absolute', top: 12, right: 12, width: 18, height: 18, borderRadius: '50%', border: purchaseType === 'service' ? `6px solid ${themeOrange}` : '2px solid #cbd5e1' }} />
            <div style={{ fontWeight: 800, fontSize: '1rem', color: bmBlack, marginBottom: '0.25rem' }}>Mobiele Tech komt</div>
            <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>Wij slijpen & programmeren.</div>
            <div style={{ fontWeight: 700 }}>+ €{servicePrice}</div>
          </label>
        </div>
      </div>

      {/* Programming warning — only shown when shipping (not service) and the
          product requires ECU programming after fitting. */}
      {purchaseType === 'ship' && needsProgramming && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #f59e0b',
          borderLeft: '4px solid #d97706',
          borderRadius: '8px',
          padding: '0.9rem 1.1rem',
          fontSize: '0.88rem',
          color: '#92400e',
          lineHeight: 1.55,
        }}>
          ⚠️ <strong>Let op:</strong> dit product vereist programmering na installatie.
          Onze monteur doet dit voor + €169 aan huis.
        </div>
      )}

      {/* 6. ADD TO CART BUTTON (Crutchfield Orange) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button style={{ 
          background: themeOrange, 
          color: '#fff', 
          border: 'none', 
          padding: '1rem 2rem', 
          fontSize: '1.1rem', 
          fontWeight: 700, 
          borderRadius: '6px',
          cursor: 'pointer',
          flex: 1,
          boxShadow: '0 4px 6px -1px rgba(185, 60, 32, 0.2)'
        }}
        onClick={handleAdd}
        type="button"
        >
          {added
            ? 'Toegevoegd ✓'
            : purchaseType === 'ship' ? 'In winkelmand' : 'Boek Monteur'}
        </button>
        
        <button style={{ 
          background: '#fff', 
          border: `1px solid ${bmBlueBorder}`, 
          borderRadius: '6px', 
          padding: '1rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: bmBlack, 
          cursor: 'pointer' 
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
      </div>

      {/* 7. DESCRIPTION & INCLUDES (Crutchfield Style) */}
      <div style={{ marginTop: '1rem', borderTop: `1px solid ${bmBlack}` }}>
        
        {/* Description Accordion */}
        <div style={{ borderBottom: `1px solid ${bmBlack}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', cursor: 'pointer' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: bmBlack, margin: 0 }}>Description & Models</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
          </div>
          <div style={{ paddingBottom: '1rem', color: '#334155', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {description ? (
              <div 
                className="product-desc-cleaned"
                dangerouslySetInnerHTML={{ __html: description }} 
              />
            ) : (
              <p>Geen beschrijving beschikbaar voor dit product.</p>
            )}

            <div style={{ fontWeight: 700, marginBottom: '0.25rem', marginTop: '1.5rem' }}>Belangrijke informatie:</div>
            <p style={{ margin: 0 }}>
              Dit is alleen een sleutelbehuizing en bevat geen interne elektronica, transponder of batterij. 
              Zet de elektronica uit uw huidige afstandsbediening eenvoudig over in deze nieuwe behuizing voor een snelle reparatie.
            </p>
            
            <a href="#" style={{ color: '#000', textDecoration: 'underline', fontWeight: 600, display: 'inline-block', marginTop: '1rem' }}>Meer info</a>
          </div>
        </div>

        {/* Every order includes Accordion */}
        <div style={{ borderBottom: `1px solid ${bmBlack}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', cursor: 'pointer' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: bmBlack, margin: 0 }}>Elke bestelling bevat</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          <div style={{ paddingBottom: '1rem', color: '#334155', fontSize: '0.9rem', display: 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> 30 dagen retourneren</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> 1 jaar garantie op elektronica</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Gratis technische ondersteuning via WhatsApp</div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. EXPERT HELP SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', background: '#fff', padding: '1rem', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/autosleutel-bijmaken-utrecht-amsterdam-mobiel.webp" alt="Berkan — expert autosleutels" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontFamily: 'cursive', fontSize: '1.2rem', fontWeight: 600 }}>Berkan</span>
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: bmBlack, margin: '0 0 0.25rem 0' }}>Snel en gratis antwoord op je vragen</h3>
          <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>
            <a href="#" style={{ color: '#000', textDecoration: 'underline', fontWeight: 600 }}>Expert help</a> | Jarenlange ervaring | Gevestigd in Nederland
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.9rem', fontWeight: 600, color: bmBlack }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              {SITE_CONFIG.phone}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              Live chat / WhatsApp
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
