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
  { href: '/webshop/catalogus?category=transponders', label: 'Transponders' },
  { href: '/webshop/catalogus?category=noodsleutels', label: 'Noodsleutels' },
  { href: '/webshop/catalogus?category=universal-remotes', label: 'Universal Keys' },
  { href: '/webshop/aanbiedingen', label: 'Aanbiedingen' },
];

export default function WebshopNavigation() {
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    const update = () => setCartCount(readCart().reduce((acc, i) => acc + i.quantity, 0));
    update();
    window.addEventListener(CART_EVENT, update);
    return () => window.removeEventListener(CART_EVENT, update);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBrandMenu, setShowBrandMenu] = useState(false);

  return (
    <header style={{ width: '100%', fontFamily: 'var(--font-sans)', zIndex: 50, position: 'relative' }} onMouseLeave={() => setShowBrandMenu(false)}>
      
      {/* Top Orange Bar */}
      <div style={{ background: '#b93c20', color: '#fff', padding: '0.4rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Gratis verzending in 2 dagen of minder
          <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.9 }}>Zie details</span>
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
          <div style={{ 
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
      <div style={{ background: '#fff', padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', borderBottom: '1px solid #e2e8f0' }}>
        
        {/* Logo */}
        <Link href="/webshop" style={{ flexShrink: 0 }}>
          <Image
            src="/images/logo/autosleutel24-logo-slotenmaker-utrecht.webp"
            alt="Autosleutel24 Webshop"
            width={160}
            height={48}
            style={{ height: '48px', width: 'auto', display: 'block' }}
          />
        </Link>

        {/*
          * Search Bar — a form, so Enter submits and the browser can restore the
          * query. It used to hold state and nothing else: typing an article code
          * and pressing the button did nothing at all.
          */}
        <form
          action="/webshop/zoeken"
          method="get"
          style={{ flex: 1, maxWidth: '800px', display: 'flex' }}
        >
          <input 
            type="text" 
            name="q"
            placeholder="Artikelcode, merk of omschrijving" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #94a3b8', borderRadius: '4px 0 0 4px', fontSize: '1rem', outline: 'none' }}
          />
          <button type="submit" aria-label="Zoeken" style={{ background: '#b93c20', color: '#fff', border: 'none', padding: '0 1.5rem', borderRadius: '0 4px 4px 0', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </form>

        {/* Right Icons */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', color: '#334155' }}>
          <Link href="/webshop/account" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', color: 'inherit' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Account</span>
          </Link>
          <Link href="/webshop/orders" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', color: 'inherit' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Orders</span>
          </Link>
          <Link href="/webshop/winkelmand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', color: '#b93c20' }}>
            <div style={{ position: 'relative' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#b93c20', color: '#fff', fontSize: '0.7rem', fontWeight: 800, borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cart</span>
          </Link>
        </div>
      </div>

      {/* Category Bottom Nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', padding: '0 1.5rem', position: 'relative' }}>
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
          <div onMouseLeave={() => setShowBrandMenu(false)}>
            <BrandMegaMenu />
          </div>
        )}
      </div>

    </header>
  );
}
