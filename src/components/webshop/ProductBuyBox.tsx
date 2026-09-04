'use client';
import { formatPrice, FREE_SHIPPING_FROM } from '@/lib/catalog';
import React, { useState } from 'react';
import {
  addToCart,
  servicesFor,
  SERVICE_SURCHARGE,
  SERVICE_LABEL,
  SERVICE_DESCRIPTION,
  SERVICE_NEEDS,
  type ServiceOption,
} from '@/lib/cart';
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

export default function ProductBuyBox({ title, subtitle, brand, price, oldPrice, description, slug, needsProgramming, category, inStock = true }: { title: string, subtitle?: string, brand?: string, price: number, oldPrice: number, description?: string, slug?: string, needsProgramming?: boolean, category?: string, inStock?: boolean }) {
  const services = servicesFor(category);
  const [purchaseType, setPurchaseType] = useState<ServiceOption>('product_only');
  const [added, setAdded] = useState(false);
  /*
   * The two blocks below the button looked like accordions and were not: the
   * chevrons did nothing, the description was always open and "Elke bestelling
   * bevat" was `display: none`, so its contents never appeared at all.
   */
  const [openPanel, setOpenPanel] = useState<'description' | 'includes' | null>('description');
  const toggle = (panel: 'description' | 'includes') =>
    setOpenPanel((current) => (current === panel ? null : panel));

  // The button was inert. It now writes to the basket, mapping the two
  // purchase choices onto the service options the cart and checkout use.
  const handleAdd = () => {
    if (!slug || !inStock) return;
    addToCart(slug, purchaseType);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };
  // One place for the call-out fee: the basket and the checkout charge
  // SERVICE_SURCHARGE, and a different number printed here would be a price
  // the customer never gets.
  // What this basket line will actually cost with the chosen service on it.
  const serviceFee = SERVICE_SURCHARGE[purchaseType];
  const servicePriceTotal = price + serviceFee;
  const note = category ? CATEGORY_NOTE[category] : undefined;

  /*
   * A crossed-out price only when there genuinely is one to point at.
   *
   * The service option carried a hard-coded "€350 dealer / save €181" that had
   * nothing to do with this product and no source behind it.
   */
  const hasReference = purchaseType === 'product_only' && oldPrice > price;
  const savings = oldPrice - price;
  
  // Theme Colors
  const themeOrange = '#b93c20'; // Crutchfield rust orange
  const bmBlack = '#1a1a1a';
  const bmBlueLight = '#e5edff';
  const bmBlueBorder = '#cbd5e1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 0. Title & Subtitle (Crutchfield Style) */}
      <div style={{ marginBottom: '1.2rem' }}>
        {brand && (
          <div style={{ marginBottom: '0.8rem' }}>
            <a href={`/webshop/merk/${brand.toLowerCase()}`} style={{ color: '#1a1a1a', textDecoration: 'underline', fontSize: '0.9rem' }}>
              Shop all {brand}
            </a>
          </div>
        )}
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1a1a1a', lineHeight: 1.1, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '1.25rem', color: '#1a1a1a', margin: '0 0 1rem 0', lineHeight: 1.3 }}>
            {subtitle}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', color: '#1a1a1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#ca8a04', gap: '0.1rem' }}>
            {/* 5 Stars */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <a href="#reviews" style={{ color: '#1a1a1a', textDecoration: 'underline', fontWeight: 600 }}>(1)</a>
          <a href="#qa" style={{ color: '#1a1a1a', textDecoration: 'underline', fontWeight: 600 }}>Q&A (0)</a>
        </div>
      </div>

      {/* 1. Low stock / In stock */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          {inStock ? (
            <polyline points="20 6 9 17 4 12"></polyline>
          ) : (
            <>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </>
          )}
        </svg>
        {inStock ? 'Op voorraad' : 'Beperkte voorraad (Low stock)'}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '0.25rem 0' }} />

      {/* 2. Ships free today (Or shipping cost) */}
      <div style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: '0.1rem', flexShrink: 0 }}>
          <rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {price >= FREE_SHIPPING_FROM ? 'Gratis verzending' : 'Verzending €5,00'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
          <div style={{ fontSize: '0.95rem', color: '#1a1a1a', marginTop: '0.25rem' }}>
            Bestel voor <span style={{ fontWeight: 800 }}>16:00</span>, en het wordt vandaag verzonden.
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '0.5rem 0 1.5rem 0' }} />

      {/* 3. Pricing */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 900, color: bmBlack, lineHeight: 1 }}>
            {formatPrice(servicePriceTotal)}
          </span>
          {hasReference && (
            <div style={{ paddingBottom: '0.25rem' }}>
              <span style={{ fontSize: '1rem', color: '#64748b', textDecoration: 'line-through', marginRight: '0.5rem' }}>
                {formatPrice(oldPrice)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. PayPal Block */}
      <div style={{ fontSize: '1.05rem', color: '#1a1a1a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <img src="/images/payment/paypal.svg" alt="PayPal" style={{ height: '22px', transform: 'translateY(2px)' }} />
        <span>
          Betaal in 3 rentevrije delen van {formatPrice(servicePriceTotal / 3)}. <a href="#" style={{ color: '#0284c7', textDecoration: 'underline' }}>Lees meer</a>
        </span>
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <a href="#" style={{ color: '#1a1a1a', textDecoration: 'underline', fontSize: '1rem' }}>Bekijk andere betaalmogelijkheden (See other financing options)</a>
      </div>

      {/* Wat moeten wij ermee doen? */}
      {services.length > 1 && (
        <div style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', color: bmBlack }}>
            Wat moeten wij ermee doen?
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {services.map((option) => {
              const chosen = purchaseType === option;
              const fee = SERVICE_SURCHARGE[option];
              return (
                <label
                  key={option}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '20px 1fr auto',
                    gap: '0.75rem',
                    alignItems: 'start',
                    padding: '0.85rem 1rem',
                    border: chosen ? `2px solid ${themeOrange}` : `1px solid ${bmBlueBorder}`,
                    borderRadius: 8,
                    background: chosen ? '#fffaf8' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="service"
                    value={option}
                    checked={chosen}
                    onChange={() => setPurchaseType(option)}
                    style={{ marginTop: 3, accentColor: themeOrange, width: 16, height: 16 }}
                  />
                  <span>
                    <span style={{ display: 'block', fontWeight: 700, color: bmBlack }}>
                      {SERVICE_LABEL[option]}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>
                      {SERVICE_DESCRIPTION[option]}
                    </span>
                  </span>
                  <span style={{ fontWeight: 700, color: bmBlack, whiteSpace: 'nowrap' }}>
                    {fee === 0 ? '—' : `+ ${formatPrice(fee)}`}
                  </span>
                </label>
              );
            })}
          </div>

          {(SERVICE_NEEDS[purchaseType].kenteken || SERVICE_NEEDS[purchaseType].oldKey) && (
            <p style={{ marginTop: '0.75rem', marginBottom: 0, fontSize: '0.85rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '0.6rem 0.8rem', lineHeight: 1.5 }}>
              {SERVICE_NEEDS[purchaseType].oldKey
                ? 'Wij vragen bij het afrekenen uw kenteken. Na uw bestelling ontvangt u het adres waar u uw oude sleutel naartoe stuurt — wij sturen hem binnen twee werkdagen na ontvangst terug.'
                : 'Wij vragen bij het afrekenen uw kenteken. Zonder eigendomsbewijs frezen of programmeren wij niet.'}
            </p>
          )}
        </div>
      )}

      {/* 6. ADD TO CART BUTTON (Crutchfield Orange) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <button
          id="buy-cta"
          disabled={!inStock}
          style={{ 
            background: inStock ? themeOrange : '#cbd5e1', 
            color: '#fff', 
            border: 'none', 
            padding: '1.2rem 2.5rem', 
            fontSize: '1.4rem', 
            fontWeight: 700, 
            borderRadius: '6px',
            cursor: 'pointer',
            flex: 1,
            minWidth: '200px',
            boxShadow: '0 4px 6px -1px rgba(185, 60, 32, 0.2)'
          }}
          onClick={handleAdd}
          type="button"
        >
          {!inStock
            ? 'Uitverkocht'
            : added
              ? 'Toegevoegd ✓'
              : 'Add to cart'}
        </button>
        
        <button style={{ 
          background: 'none', 
          border: 'none', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          color: bmBlack, 
          fontSize: '1.1rem',
          fontWeight: 500,
          cursor: 'pointer' 
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          Add to wishlist
        </button>
      </div>

      {/* 7. DESCRIPTION & INCLUDES (Crutchfield Style) */}
      <div style={{ marginTop: '1rem', borderTop: `1px solid ${bmBlack}` }}>
        
        {/* Description Accordion */}
        <div style={{ borderBottom: `1px solid ${bmBlack}` }}>
          <button
            type="button"
            onClick={() => toggle('description')}
            aria-expanded={openPanel === 'description'}
            style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left' }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: bmBlack, margin: 0 }}>Beschrijving</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: openPanel === 'description' ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div hidden={openPanel !== 'description'} style={{ paddingBottom: '1rem', color: '#334155', fontSize: '0.9rem', lineHeight: 1.6 }}>
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

        {/*
          Always visible, not behind a chevron. These four lines are the reason
          someone buys from a small shop instead of a marketplace, and a panel
          nobody opens says nothing.
        */}
        <div style={{ borderBottom: `1px solid ${bmBlack}`, padding: '1rem 0' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: bmBlack, margin: '0 0 .75rem' }}>
            Bij elke bestelling
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '.6rem', fontSize: '0.9rem', color: '#334155' }}>
            {[
              ['30 dagen retourneren', 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'],
              ['12 maanden garantie op elektronica', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
              ['Gratis hulp via WhatsApp bij het inleren', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
              ['Verzending 2 - 3 werkdagen vanuit Nederland', 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8z'],
            ].map(([label, path]) => (
              <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.6" style={{ flexShrink: 0 }}>
                  <path d={path} />
                </svg>
                {label}
              </li>
            ))}
          </ul>
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
