'use client';
import { formatPrice, FREE_SHIPPING_FROM } from '@/lib/catalog';
import React, { useState } from 'react';
import { addToCart, SERVICE_SURCHARGE } from '@/lib/cart';
import { SITE_CONFIG } from '@/config/site.config';

/**
 * The note under the description depends on what the product is.
 *
 * A single hard-coded paragraph used to tell every visitor that "dit is alleen
 * een sleutelbehuizing en bevat geen interne elektronica, transponder of
 * batterij" — printed underneath complete remote keys, transponders and
 * circuit boards alike. On a complete key it is simply false, and it is the
 * one line that decides whether someone buys the part or not.
 */
const CATEGORY_NOTE: Record<string, string> = {
  behuizingen:
    'Dit is alleen een sleutelbehuizing en bevat geen interne elektronica, transponder of ' +
    'batterij. Zet de elektronica uit uw huidige afstandsbediening over in deze nieuwe ' +
    'behuizing voor een snelle reparatie.',
  printplaten:
    'Dit is alleen de printplaat (PCB). Behuizing en sleutelbaard zitten er niet bij; de ' +
    'plaat moet na montage op uw auto worden ingeleerd.',
  sleutelbaarden:
    'Dit is een ongefreesde sleutelbaard. Hij moet op uw slot worden gefreesd voordat ' +
    'hij past.',
  transponders:
    'Dit is een losse transponderchip zonder behuizing of afstandsbediening. De chip moet ' +
    'op uw auto worden ingeleerd.',
  noodsleutels:
    'Dit is een noodsleutel zonder elektronica: hij opent het portier, maar start de auto ' +
    'niet.',
  afstandsbedieningen:
    'Complete sleutel inclusief behuizing, elektronica en transponder. De sleutelbaard ' +
    'wordt op uw slot gefreesd en de sleutel wordt op uw auto ingeleerd.',
  'smart-keys':
    'Complete smart key inclusief elektronica en transponder. Moet op uw auto worden ' +
    'ingeleerd voordat hij werkt.',
  'universal-remotes':
    'Universele sleutel: hij wordt met een programmeertool (KeyDIY, Xhorse, Autel of IEA) ' +
    'op het gewenste voertuig gezet.',
};

export default function ProductBuyBox({ title, price, oldPrice, description, slug, needsProgramming, category, specs }: { title: string, price: number, oldPrice: number, description?: string, slug?: string, needsProgramming?: boolean, category?: string, specs?: [string, string][] }) {
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
  // One place for the call-out fee: the basket and the checkout charge
  // SERVICE_SURCHARGE, and a different number printed here would be a price
  // the customer never gets.
  const serviceFee = SERVICE_SURCHARGE.mobile_tech;
  const servicePriceTotal = price + serviceFee;
  const note = category ? CATEGORY_NOTE[category] : undefined;

  /*
   * The three answers that decide whether this key can be made to work, right
   * next to the price. Frequency and transponder are what a customer reads off
   * their old key; the full table is further down the page.
   */
  const KEY_SPECS = ['Frequentie', 'Transponder', 'Sleutelbaard', 'Aantal knoppen', 'Artikelcode'];
  const headline = (specs ?? []).filter(([label]) => KEY_SPECS.includes(label));
  /*
   * A crossed-out price only when there genuinely is one to point at.
   *
   * The service option carried a hard-coded "€350 dealer / save €181" that had
   * nothing to do with this product and no source behind it.
   */
  const hasReference = purchaseType === 'ship' && oldPrice > price;
  const savings = oldPrice - price;
  
  // Theme Colors
  const themeOrange = '#b93c20'; // Crutchfield rust orange
  const bmBlack = '#1a1a1a';
  const bmBlueLight = '#e5edff';
  const bmBlueBorder = '#cbd5e1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 2. TITLE & REVIEWS */}
      <div>
        {/*
          Removed: a "Bestseller" badge and a "Bekijk alle Autosleutel24" link
          to "#". The badge sat on all 944 products, which is a sales claim
          nothing supports, and the link went nowhere.
        */}
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: bmBlack, lineHeight: 1.2, marginBottom: '0.5rem' }}>
          {title}
        </h1>
        {/*
          Removed: a five-star row with "(142 reviews)" and a "Q&A (24)" link,
          identical on every product and backed by nothing. Restore only when
          the counts come from real verified-purchase data.
        */}

        {headline.length > 0 && (
          <dl
            style={{
              display: 'flex', flexWrap: 'wrap', gap: '0.4rem 0.5rem',
              margin: '0.75rem 0 0', padding: 0,
            }}
          >
            {headline.map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: 'flex', gap: '0.35rem', alignItems: 'baseline',
                  background: '#f1f5f9', borderRadius: 999,
                  padding: '0.25rem 0.7rem', fontSize: '0.8rem',
                }}
              >
                <dt style={{ color: '#64748b' }}>{label}</dt>
                <dd style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* 3. PRICING */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: bmBlack, lineHeight: 1 }}>
            {formatPrice(purchaseType === 'ship' ? price : servicePriceTotal)}
          </span>
          {hasReference && (
            <div style={{ paddingBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b', textDecoration: 'line-through', marginRight: '0.5rem' }}>
                {formatPrice(oldPrice)}
              </span>
              <span style={{ background: '#16a34a', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                Bespaar {formatPrice(savings)}
              </span>
            </div>
          )}
        </div>
        {/*
          Removed: a Klarna "betaal in 3 delen" line with a "Lees meer" link to
          "#". Klarna is not enabled on our Mollie account, so it advertised a
          payment method the checkout does not offer. Put it back when it is
          switched on and the link points at the terms.
        */}
      </div>

      {/* 4. TRUST & SHIPPING BADGES (Moved ABOVE the Tech/Ship selector as requested) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
        <div style={{ background: bmBlueLight, padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', fontWeight: 600, color: bmBlack }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          {price >= FREE_SHIPPING_FROM
            ? 'Gratis verzending — voor 16:00 besteld, morgen in huis'
            : `Verzending €5,00 — gratis vanaf ${formatPrice(FREE_SHIPPING_FROM)}`}
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
            <div style={{ fontWeight: 700 }}>+ {formatPrice(price)}</div>
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
            <div style={{ fontWeight: 700 }}>+ {formatPrice(serviceFee)}</div>
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
          Onze monteur doet dit voor + {formatPrice(serviceFee)} aan huis.
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

            {note && (
              <>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem', marginTop: '1.5rem' }}>Belangrijke informatie:</div>
                <p style={{ margin: 0 }}>{note}</p>
              </>
            )}
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
            {/* Was a link to "#". Contact is the phone number and WhatsApp
                below it, which both work. */}
            Expert hulp | Gevestigd in Nederland
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
