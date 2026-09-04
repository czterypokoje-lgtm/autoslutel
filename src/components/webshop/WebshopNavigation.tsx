'use client';
import Link from 'next/link';
import { readCart, CART_EVENT } from '@/lib/cart';
import { useEffect } from 'react';
import Image from 'next/image';
import { useState } from 'react';
import { SITE_CONFIG } from '@/config/site.config';

import BrandMegaMenu from '@/components/webshop/BrandMegaMenu';

const categoryLinks = [
  { href: '/webshop/merken', label: 'Merken' },
  { href: '/webshop/catalogus?category=afstandsbedieningen', label: 'Autosleutels' },
  { href: '/webshop/catalogus?category=behuizingen', label: 'Behuizingen' },
  { href: '/webshop/catalogus?category=batterijen', label: 'Batterijen' },
  { href: '/webshop/catalogus?category=printplaten', label: 'Printplaten' },
  { href: '/webshop/catalogus?subcategory=smart+key', label: 'Smart Keys' },
  { href: '/webshop/catalogus?category=overige-sleutels', label: 'Overige sleutels' },
  { href: '/webshop/catalogus?category=transponders', label: 'Transponders' },
  { href: '/webshop/catalogus?category=noodsleutels', label: 'Noodsleutels' },
  { href: '/webshop/catalogus?category=universal-remotes', label: 'Universal Keys' },
  { href: '/webshop/aanbiedingen', label: 'Aanbiedingen' },
];

export default function WebshopNavigation() {
  const [cartCount, setCartCount] = useState(0);
  /*
   * The category strip scrolled sideways on a phone, which hides most of it:
   * "Universal Keys" and "Aanbiedingen" were three swipes away and nobody
   * swipes a nav bar. Below 900px the strip is replaced by this drawer, which
   * is where a phone user looks for a menu.
   */
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const update = () => setCartCount(readCart().reduce((acc, i) => acc + i.quantity, 0));
    update();
    window.addEventListener(CART_EVENT, update);
    return () => window.removeEventListener(CART_EVENT, update);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBrandMenu, setShowBrandMenu] = useState(false);

  // The page behind a full-height drawer must not scroll with it.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header style={{ width: '100%', fontFamily: 'var(--font-sans)', zIndex: 50, position: 'relative' }} onMouseLeave={() => setShowBrandMenu(false)}>
      
      {/* Top Orange Bar */}
      <div className="shop-topbar">
        <div className="shop-topbar-text">
          {/* The real rule from the catalogue, not a flat promise: shipping is
              €5,00 and free from €25,00, and delivery is 2-3 working days. */}
          Gratis verzending vanaf €25 · levertijd 2 - 3 werkdagen
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Phone Pill (White bg, Red text) */}
          <a href={`tel:${SITE_CONFIG.phoneTel}`} style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            background: '#fff', color: '#b93c20', 
            padding: '0.2rem 0.75rem', borderRadius: '999px',
            textDecoration: 'none'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 800, lineHeight: 1.1, fontSize: '0.9rem' }}>{SITE_CONFIG.phone}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>24/7 Bereikbaar</span>
            </div>
          </a>

          {/* Chat Pill (Red bg, White border, White text) */}
          <div className="shop-topbar-chat" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
            border: '1.5px solid #fff', color: '#fff',
            padding: '0.2rem 0.75rem', borderRadius: '999px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="9" y1="10" x2="15" y2="10" stroke="#b93c20" strokeWidth="2"></line><line x1="9" y1="14" x2="15" y2="14" stroke="#b93c20" strokeWidth="2"></line></svg>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 800, lineHeight: 1.1, fontSize: '0.9rem' }}>Chat</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>met expert</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main White Bar */}
      <div className="shop-header-bar">
        
        {/* Mobile only — opens the menu drawer. */}
        <button
          type="button"
          className="shop-burger"
          onClick={() => setMenuOpen(true)}
          aria-label="Menu openen"
          aria-expanded={menuOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/webshop" style={{ flexShrink: 0 }}>
          <Image
            src="/images/logo/autosleutel24-logo-slotenmaker-utrecht.webp"
            alt="Autosleutel24 Webshop"
            width={160}
            height={48}
            style={{ height: 'clamp(34px, 9vw, 48px)', width: 'auto', display: 'block' }}
          />
        </Link>

        {/*
          * Search Bar — a form, so Enter submits and the browser can restore the
          * query. It used to hold state and nothing else: typing an article code
          * and pressing the button did nothing at all.
          */}
        <form action="/webshop/zoeken" method="get" className="shop-header-search">
          <input 
            type="text" 
            name="q"
            placeholder="Artikelcode, merk of omschrijving" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            /* 16px minimum: any smaller and iOS Safari zooms the page in when
               the field takes focus, and it never zooms back out. */
            style={{ width: '100%', minWidth: 0, padding: '0.7rem 0.9rem', border: '2px solid #94a3b8', borderRadius: '4px 0 0 4px', fontSize: '16px', outline: 'none' }}
          />
          <button type="submit" aria-label="Zoeken" style={{ background: '#b93c20', color: '#fff', border: 'none', padding: '0 1.5rem', borderRadius: '0 4px 4px 0', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </form>

        {/* Right Icons */}
        <div className="shop-header-actions">
          <Link href="/webshop/account" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', color: 'inherit' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Account</span>
          </Link>
          <Link href="/webshop/orders" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', color: 'inherit' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bestellingen</span>
          </Link>
          <Link href="/webshop/winkelmand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', color: '#b93c20' }}>
            <div style={{ position: 'relative' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#b93c20', color: '#fff', fontSize: '0.7rem', fontWeight: 800, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Winkelmand</span>
          </Link>
        </div>
      </div>

      {/* Category Bottom Nav */}
      <div className="shop-header-nav">
        {categoryLinks.map((link) => (
          <div 
            key={link.href}
            onMouseEnter={() => {
              if (link.label === 'Merken') setShowBrandMenu(true);
              else setShowBrandMenu(false);
            }}
          >
            <Link 
              href={link.href}
              style={{ display: 'block', padding: '0.6rem 1.5rem', color: '#334155', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', borderBottom: '3px solid transparent' }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#b93c20')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#334155')}
            >
              {link.label}
            </Link>
          </div>
        ))}
        {showBrandMenu && (
          <div className="shop-brand-megamenu" onMouseLeave={() => setShowBrandMenu(false)}>
            <BrandMegaMenu />
          </div>
        )}
      </div>

      {menuOpen && (
        <button
          type="button"
          className="shop-menu-scrim"
          aria-label="Menu sluiten"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <nav
        className={`shop-menu${menuOpen ? ' is-open' : ''}`}
        aria-label="Hoofdmenu"
        aria-hidden={!menuOpen}
      >
        <div className="shop-menu-head">
          <strong>Menu</strong>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Sluiten">✕</button>
        </div>

        <div className="shop-menu-body">
          <p className="shop-menu-label">Onderdelen</p>
          {categoryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shop-menu-link"
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
            >
              {link.label}
            </Link>
          ))}

          <p className="shop-menu-label">Mijn gegevens</p>
          <Link href="/webshop/winkelmand" className="shop-menu-link" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}>
            Winkelmand{cartCount > 0 ? ` (${cartCount})` : ''}
          </Link>
          <Link href="/webshop/orders" className="shop-menu-link" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}>
            Mijn bestellingen
          </Link>
          <Link href="/webshop/account" className="shop-menu-link" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}>
            Zakelijk account
          </Link>

          <p className="shop-menu-label">Hulp nodig?</p>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className="shop-menu-link" tabIndex={menuOpen ? 0 : -1}>
            Bel {SITE_CONFIG.phone}
          </a>
          <a
            href={`https://wa.me/${SITE_CONFIG.whatsapp}`}
            className="shop-menu-link"
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={menuOpen ? 0 : -1}
          >
            WhatsApp ons
          </a>
          <Link href="/verzending-en-retour" className="shop-menu-link" onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}>
            Verzending &amp; retour
          </Link>
        </div>
      </nav>
    </header>
  );
}
