'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import styles from './Navigation.module.css';
import { SITE_CONFIG } from '@/config/site.config';

const DienstenStructure = [
  {
    title: 'Auto Slotenmaker',
    href: '/diensten/auto-slotenmaker',
    subs: [
      { href: '/diensten/auto-openen-zonder-sleutel', label: 'Auto Openen Zonder Sleutel' },
      { href: '/diensten/sleutel-in-auto', label: 'Sleutel in Auto' },
      { href: '/diensten/deur-dichtgevallen', label: 'Deur Dichtgevallen' },
      { href: '/diensten/kofferbak-openen', label: 'Kofferbak Openen' },
      { href: '/diensten/sleutel-afgebroken-in-slot', label: 'Sleutel Afgebroken in Slot' },
    ]
  },
  {
    title: 'Autosleutel Bijmaken',
    href: '/diensten/autosleutel-bijmaken',
    subs: [
      { href: '/diensten/transponder-programmeren', label: 'Transponder Programmeren' },
      { href: '/diensten/afstandsbediening-bijmaken', label: 'Afstandsbediening Bijmaken' },
      { href: '/diensten/smart-key-programmeren', label: 'Smart Key / Keyless' },
      { href: '/diensten/reservesleutel-maken', label: 'Reservesleutel Maken' },
    ]
  },
  {
    title: 'Autosleutel Kwijt',
    href: '/diensten/autosleutel-kwijt',
    subs: [
      { href: '/diensten/noodopening-auto', label: 'Noodopening' },
      { href: '/diensten/alle-sleutels-kwijt-auto', label: 'Alle Sleutels Kwijt (AKL)' },
    ]
  },
  {
    title: 'Batterij Vervangen',
    href: '/diensten/batterij-vervangen',
    price: '€15 - €20',
    subs: []
  },
  {
    title: 'Autosleutels Repareren',
    href: '/diensten/autosleutels-repareren',
    subs: [
      { href: '/diensten/behuizing-vervangen', label: 'Behuizing Vervangen' },
      { href: '/diensten/knoppen-repareren', label: 'Knoppen Repareren' },
      { href: '/diensten/contactslot-reparatie', label: 'Contactslot Reparatie' },
    ]
  },
];

const MerkenLinks = [
  { href: '/merken/bmw-autosleutel-bijmaken', label: 'BMW' },
  { href: '/merken/mercedes-autosleutel-bijmaken', label: 'Mercedes-Benz' },
  { href: '/merken/volkswagen-autosleutel-bijmaken', label: 'Volkswagen' },
  { href: '/merken/audi-autosleutel-bijmaken', label: 'Audi' },
  { href: '/merken/toyota-autosleutel-bijmaken', label: 'Toyota' },
  { href: '/merken/ford-autosleutel-bijmaken', label: 'Ford' },
  { href: '/merken/volvo-autosleutel-bijmaken', label: 'Volvo' },
  { href: '/merken/opel-autosleutel-bijmaken', label: 'Opel' },
];

const ProblemenLinks = [
  { href: '/autosleutel-kwijt', label: 'Autosleutel Kwijt' },
  { href: '/diensten/auto-openen-zonder-sleutel', label: 'Auto Openen Zonder Sleutel' },
  { href: '/spoedhulp-autosleutel', label: '24/7 Spoedhulp' },
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
        <Link href="/" className={styles.logo} aria-label="Autosleutel24.nl — 24/7 Autosleutelspecialist Utrecht homepage">
          <Image
            src="/images/logo/autosleutel24-logo-slotenmaker-utrecht.webp"
            alt="Autosleutel24 Logo"
            width={128}
            height={38}
            style={{ height: '38px', width: 'auto', display: 'block' }}
          />
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.nav} role="navigation" aria-label="Hoofdnavigatie">
          {/* Diensten dropdown */}
          <div className={styles.dropdown}>
            <button className={styles.navBtn} aria-haspopup="true">
              Diensten
              <svg className={styles.chevron} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>
            </button>
            <div className={styles.dropMenuLarge}>
              <div className={styles.dropHeader}>Onze Diensten</div>
              <div className={styles.dropGridLarge}>
                {DienstenStructure.map(pillar => (
                  <div key={pillar.title} className={styles.dropColumn}>
                    <Link href={pillar.href} className={styles.pillarTitle}>
                      {pillar.title} {pillar.price ? ` (${pillar.price})` : ''}
                    </Link>
                    {pillar.subs.length > 0 && (
                      <div className={styles.subList}>
                        {pillar.subs.map(sub => (
                          <Link key={sub.href} href={sub.href} className={styles.subLinkItem}>{sub.label}</Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
          <Link href="/blog" className={styles.navLink}>Blog &amp; Advies</Link>
          <Link href="/kennisbank" className={styles.navLink}>Kennisbank</Link>
          <Link href="/over-ons" className={styles.navLink}>Over Ons</Link>
        </nav>

        {/* CTA */}
        <div className={styles.actions}>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.phoneLink} id="nav-phone-cta" aria-label={`Bel direct: ${SITE_CONFIG.phone}`}>
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
        <>
          <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className={`${styles.mobileDrawer} ${styles.mobileDrawerOpen}`} role="dialog" aria-modal="true" aria-label="Navigatiemenu">
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
              <div className={styles.mobileDienstenGroup}>
                {DienstenStructure.map(pillar => (
                  <div key={pillar.title} className={styles.mobilePillarBlock}>
                    <Link href={pillar.href} className={styles.mobilePillarLink} onClick={() => setMobileOpen(false)}>
                      {pillar.title} {pillar.price ? ` (${pillar.price})` : ''}
                    </Link>
                    {pillar.subs.map(sub => (
                      <Link key={sub.href} href={sub.href} className={styles.mobileSubLink} onClick={() => setMobileOpen(false)}>
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.mobileSection}>
              <div className={styles.mobileSectionTitle}>Merken</div>
              {MerkenLinks.map(l => <Link key={l.href} href={l.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>{l.label}</Link>)}
              <Link href="/merken" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Alle 38 merken →</Link>
            </div>

            <div className={styles.mobileDivider} />
            <Link href="/steden" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Steden</Link>
            <Link href="/prijzen" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Prijzen</Link>
            <Link href="/blog" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Blog &amp; Advies</Link>
            <Link href="/over-ons" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Over Ons</Link>
            <Link href="/contact" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Contact</Link>
          </div>
        </>
      )}
    </header>
  );
}
