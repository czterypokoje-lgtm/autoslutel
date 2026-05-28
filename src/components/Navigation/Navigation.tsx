'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './Navigation.module.css';
import { SITE_CONFIG } from '@/config/site.config';

const DienstenLinks = [
  { href: '/diensten/sleutel-bijmaken', label: 'Sleutel Bijmaken' },
  { href: '/diensten/transponder-sleutel-programmeren', label: 'Transponder Sleutel' },
  { href: '/diensten/smart-key-programmeren', label: 'Smart Key / Keyless' },
  { href: '/diensten/reservesleutel-maken', label: 'Reservesleutel Maken' },
  { href: '/diensten/contact-reparatie', label: 'Contact Reparatie' },
  { href: '/diensten/alarm-programmeren', label: 'Alarm Programmeren' },
];

const MerkenLinks = [
  { href: '/merken/bmw-sleutel-programmeren', label: 'BMW' },
  { href: '/merken/mercedes-sleutel-programmeren', label: 'Mercedes-Benz' },
  { href: '/merken/volkswagen-sleutel-programmeren', label: 'Volkswagen' },
  { href: '/merken/audi-sleutel-programmeren', label: 'Audi' },
  { href: '/merken/toyota-sleutel-programmeren', label: 'Toyota' },
  { href: '/merken/ford-sleutel-programmeren', label: 'Ford' },
  { href: '/merken/volvo-sleutel-programmeren', label: 'Volvo' },
  { href: '/merken/opel-sleutel-programmeren', label: 'Opel' },
];

const ProblemenLinks = [
  { href: '/autosleutel-kwijt', label: 'Autosleutel Kwijt' },
  { href: '/auto-op-slot', label: 'Auto Op Slot' },
  { href: '/spoedhulp-autosleutel', label: '24/7 Spoedhulp' },
  { href: '/auto-openen-zonder-sleutel', label: 'Auto Openen Zonder Sleutel' },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="Autosleutel Expert — naar homepage">
          <svg className={styles.logoIcon} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="40" height="40" rx="4" fill="#0d2137"/>
            <path d="M22 14a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" fill="#e8520a"/>
            <rect x="8" y="19" width="10" height="2" rx="1" fill="white"/>
            <rect x="10" y="23" width="3" height="2" rx="1" fill="white"/>
            <rect x="15" y="23" width="3" height="2" rx="1" fill="white"/>
          </svg>
          <div className={styles.logoText}>
            <span className={styles.logoMain}>Autosleutel Expert</span>
            <span className={styles.logoSub}>Eindhoven · 24/7</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.nav} role="navigation" aria-label="Hoofdnavigatie">
          {/* Diensten dropdown */}
          <div className={styles.dropdown}>
            <button className={styles.navBtn} aria-haspopup="true">
              Diensten
              <svg className={styles.chevron} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>
            </button>
            <div className={styles.dropMenu}>
              <div className={styles.dropHeader}>Onze Diensten</div>
              {DienstenLinks.map(l => (
                <Link key={l.href} href={l.href} className={styles.dropItem}>{l.label}</Link>
              ))}
              <div className={styles.dropDivider} />
              <Link href="/diensten" className={styles.dropAll}>Alle diensten bekijken →</Link>
            </div>
          </div>

          {/* Merken dropdown */}
          <div className={styles.dropdown}>
            <button className={styles.navBtn} aria-haspopup="true">
              Merken
              <svg className={styles.chevron} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>
            </button>
            <div className={styles.dropMenu}>
              <div className={styles.dropHeader}>Populaire Merken</div>
              <div className={styles.dropGrid}>
                {MerkenLinks.map(l => (
                  <Link key={l.href} href={l.href} className={styles.dropItem}>{l.label}</Link>
                ))}
              </div>
              <div className={styles.dropDivider} />
              <Link href="/merken" className={styles.dropAll}>Alle 38 merken →</Link>
            </div>
          </div>

          {/* Spoed dropdown */}
          <div className={styles.dropdown}>
            <button className={`${styles.navBtn} ${styles.navBtnUrgent}`} aria-haspopup="true">
              Spoedhulp
              <svg className={styles.chevron} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>
            </button>
            <div className={styles.dropMenu}>
              <div className={styles.dropHeader} style={{color:'#c0392b'}}>Spoed &amp; Problemen</div>
              {ProblemenLinks.map(l => (
                <Link key={l.href} href={l.href} className={`${styles.dropItem} ${styles.dropItemUrgent}`}>{l.label}</Link>
              ))}
            </div>
          </div>

          <Link href="/steden" className={styles.navLink}>Steden</Link>
          <Link href="/prijzen" className={styles.navLink}>Prijzen</Link>
          <Link href="/over-ons" className={styles.navLink}>Over Ons</Link>
        </nav>

        {/* CTA */}
        <div className={styles.actions}>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.phoneLink} id="nav-phone-cta">
            <svg className={styles.phoneIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
            </svg>
            <span>{SITE_CONFIG.phone}</span>
          </a>
          <Link href="/contact" className={styles.ctaBtn} id="nav-offerte-cta">
            Offerte Aanvragen
          </Link>
        </div>

        {/* Hamburger */}
        <button
          className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Menu sluiten' : 'Menu openen'}
          aria-expanded={mobileOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <div className={`${styles.mobileDrawer} ${mobileOpen ? styles.mobileDrawerOpen : ''}`} role="dialog" aria-modal="true" aria-label="Navigatiemenu">
        <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.mobilePhone} onClick={() => setMobileOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
          </svg>
          Bel Nu: {SITE_CONFIG.phone}
        </a>

        <div className={styles.mobileSection}>
          <div className={styles.mobileSectionTitle}>Spoedhulp</div>
          {ProblemenLinks.map(l => <Link key={l.href} href={l.href} className={`${styles.mobileLink} ${styles.mobileLinkUrgent}`} onClick={() => setMobileOpen(false)}>{l.label}</Link>)}
        </div>

        <div className={styles.mobileSection}>
          <div className={styles.mobileSectionTitle}>Diensten</div>
          {DienstenLinks.map(l => <Link key={l.href} href={l.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>{l.label}</Link>)}
        </div>

        <div className={styles.mobileSection}>
          <div className={styles.mobileSectionTitle}>Merken</div>
          {MerkenLinks.map(l => <Link key={l.href} href={l.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>{l.label}</Link>)}
          <Link href="/merken" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Alle 38 merken →</Link>
        </div>

        <div className={styles.mobileDivider} />
        <Link href="/steden" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Steden</Link>
        <Link href="/prijzen" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Prijzen</Link>
        <Link href="/over-ons" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Over Ons</Link>
        <Link href="/contact" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Contact</Link>
      </div>
    </header>
  );
}
