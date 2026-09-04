'use client';
import Link from 'next/link';
import { readCart, CART_EVENT } from '@/lib/cart';
import { useEffect } from 'react';
import Image from 'next/image';
import { useState } from 'react';
import { SITE_CONFIG } from '@/config/site.config';

import { MENU, TOP_BRANDS } from '@/components/webshop/shopMenu';


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
    <header style={{ width: '100%', fontFamily: 'var(--font-sans)', zIndex: 50, position: 'relative' }}>
      {/*
        The menu drawer is opened by a checkbox, not by React state.

        A <button onClick> does nothing until the page has hydrated, and on a
        phone on a slow connection — or when hydration fails outright — that
        leaves the only navigation on the screen dead while every link around
        it still works. A label and a checkbox work the moment the HTML lands.
        The state below only mirrors it, for Escape and the scroll lock.
      */}
      <input
        type="checkbox"
        id="shop-menu-toggle"
        className="shop-menu-toggle"
        checked={menuOpen}
        onChange={(e) => setMenuOpen(e.target.checked)}
        aria-label="Menu openen"
      />
      
      {/* Main White Bar */}
      <div className="shop-header-bar">
        
        {/* Mobile only — opens the menu drawer, with or without JavaScript. */}
        <label className="shop-burger" htmlFor="shop-menu-toggle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </label>

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

      {/*
        Two bars under the search, in the order a customer needs them: who to
        ask, then what it costs to get it here.

        The phone number used to sit in a pill in an orange bar above the logo,
        where it read as decoration. Here it is a person with a name, which is
        what it actually is: Berkan picks up.

        The panel expands from a checkbox, so it opens with or without
        JavaScript — the same reason the menu does.
      */}
      <input type="checkbox" id="shop-expert-toggle" className="shop-expert-toggle" aria-label="Contactgegevens tonen" />

      <div className="shop-expert">
        <label className="shop-expert-head" htmlFor="shop-expert-toggle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/team/berkan-acarol-autosleutelspecialist-utrecht.webp"
            alt=""
            className="shop-expert-photo"
          />
          <span className="shop-expert-text">
            <strong>Bel of app ons</strong>
            <span>met een expert zoals Berkan</span>
          </span>
          <svg className="shop-expert-caret" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </label>

        <div className="shop-expert-panel">
          {/*
            One wrapper, deliberately: the collapse animates grid-template-rows
            from 0fr, and with two children the second one lands in an implicit
            auto row and stays visible — which is exactly what it did.
          */}
          <div className="shop-expert-panel-inner">
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className="shop-expert-action">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            <span><strong>{SITE_CONFIG.phone}</strong> · 24/7 bereikbaar</span>
          </a>
          <a
            href={`https://wa.me/${SITE_CONFIG.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shop-expert-action"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            <span>WhatsApp — stuur uw kenteken, wij zoeken het uit</span>
          </a>
          </div>
        </div>
      </div>

      {/* The real rule from the catalogue: €5,00 shipping, free from €25,00,
          and 2-3 working days because the parts come from Germany. */}
      <div className="shop-shipping-bar">
        Gratis verzending vanaf €25 · levertijd 2 - 3 werkdagen
      </div>

      {/*
        The category bar.

        It was fifteen flat links that ran off the edge of a 1440px screen, so
        the last four ranges we added could not be reached at all. Six
        headings now, each opening one panel, grouped the way a locksmith
        thinks about a job rather than the way our categories are named.

        The panels open on hover and on keyboard focus — :focus-within, so
        tabbing through the bar works — and every heading is itself a link to
        a real page, so a click always goes somewhere.
      */}
      <nav className="shop-nav" aria-label="Productcategorieën">
        <ul className="shop-nav-list">
          {MENU.map((group) => (
            <li key={group.label} className="shop-nav-item">
              <Link href={group.href} className="shop-nav-link">
                {group.label}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Link>

              <div className="shop-nav-panel">
                <div className="shop-nav-panel-inner">
                  {group.variant === 'brands' ? (
                    <>
                      <div className="shop-nav-brands">
                        {TOP_BRANDS.map(({ make, count }) => (
                          <Link
                            key={make}
                            href={`/webshop/catalogus?make=${encodeURIComponent(make)}`}
                            className="shop-nav-brand"
                          >
                            {make}
                            <span>{count}</span>
                          </Link>
                        ))}
                      </div>
                      <Link href="/webshop/merken" className="shop-nav-all">
                        Alle merken bekijken →
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="shop-nav-columns">
                        {group.columns.map((column) => (
                          <div key={column.title ?? 'links'}>
                            {column.title && <p className="shop-nav-column-title">{column.title}</p>}
                            <ul>
                              {column.links.map((link) => (
                                <li key={link.href}>
                                  <Link href={link.href} className="shop-nav-entry">
                                    <span className="shop-nav-entry-label">
                                      {link.label}
                                      <span className="shop-nav-count">{link.count}</span>
                                    </span>
                                    {link.note && <span className="shop-nav-note">{link.note}</span>}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <Link href={group.href} className="shop-nav-all">
                        Alles in {group.label.toLowerCase()} →
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}

          <li className="shop-nav-item">
            <Link href="/webshop/aanbiedingen" className="shop-nav-link shop-nav-link-accent">
              Aanbiedingen
            </Link>
          </li>
        </ul>
      </nav>

      <label className="shop-menu-scrim" htmlFor="shop-menu-toggle" aria-hidden="true" />

      <nav className="shop-menu" aria-label="Hoofdmenu">
        <div className="shop-menu-head">
          <strong>Menu</strong>
          <label className="shop-menu-close" htmlFor="shop-menu-toggle" aria-label="Menu sluiten">✕</label>
        </div>

        <div className="shop-menu-body">
          {/*
            The same six groups as the bar, collapsed. <details> opens without
            JavaScript, which is the rule the drawer itself follows.
          */}
          {MENU.map((group) => (
            <details key={group.label} className="shop-menu-group">
              <summary>{group.label}</summary>
              {group.variant === 'brands' ? (
                <Link href="/webshop/merken" className="shop-menu-link" onClick={() => setMenuOpen(false)}>
                  Alle merken
                </Link>
              ) : (
                group.columns.flatMap((column) => column.links).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="shop-menu-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                    <span className="shop-menu-count">{link.count}</span>
                  </Link>
                ))
              )}
            </details>
          ))}

          <Link href="/webshop/aanbiedingen" className="shop-menu-link" onClick={() => setMenuOpen(false)}>
            Aanbiedingen
          </Link>

          <p className="shop-menu-label">Mijn gegevens</p>
          <Link href="/webshop/winkelmand" className="shop-menu-link" onClick={() => setMenuOpen(false)}>
            Winkelmand{cartCount > 0 ? ` (${cartCount})` : ''}
          </Link>
          <Link href="/webshop/orders" className="shop-menu-link" onClick={() => setMenuOpen(false)}>
            Mijn bestellingen
          </Link>
          <Link href="/webshop/account" className="shop-menu-link" onClick={() => setMenuOpen(false)}>
            Zakelijk account
          </Link>

          <p className="shop-menu-label">Hulp nodig?</p>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className="shop-menu-link">
            Bel {SITE_CONFIG.phone}
          </a>
          <a
            href={`https://wa.me/${SITE_CONFIG.whatsapp}`}
            className="shop-menu-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp ons
          </a>
          <Link href="/verzending-en-retour" className="shop-menu-link" onClick={() => setMenuOpen(false)}>
            Verzending &amp; retour
          </Link>
        </div>
      </nav>
    </header>
  );
}
