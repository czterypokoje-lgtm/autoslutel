'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import styles from './Navigation.module.css';
import { SITE_CONFIG } from '@/config/site.config';

/*
 * Das Menü, mit deutschen Adressen und deutschen Worten.
 *
 * Die Gruppierung folgt der niederländischen Seite, weil sie sich dort bewährt
 * hat: Öffnen, Nachmachen, Verloren, Reparieren. Die Begriffe kommen aus
 * ./keywords.ts und sind nicht übersetzt, sondern die, mit denen in
 * Deutschland gesucht wird — "nachmachen" statt "bijmaken", "anlernen" statt
 * "programmeren", "Schlüssel im Auto eingeschlossen" statt "sleutel in auto".
 *
 * Zwei Einträge der niederländischen Seite fehlen hier mit Absicht: "Bestellen
 * op kenteken" (es gibt kein öffentliches deutsches Fahrzeugregister, auf das
 * man einen Schlüssel bestellen könnte) und "Renault Sleutelkaart" (eine
 * niederländische Besonderheit). "Contactslot vervangen" fehlt, weil es diese
 * Dienstseite hier noch nicht gibt.
 */
const LeistungenStructure = [
  {
    title: 'Auto öffnen',
    href: '/leistungen/auto-oeffnen-notdienst',
    subs: [
      { href: '/leistungen/auto-oeffnen-notdienst', label: 'Auto öffnen ohne Schlüssel' },
      { href: '/leistungen/schluessel-im-auto-eingeschlossen', label: 'Schlüssel im Auto eingeschlossen' },
      { href: '/leistungen/autotuer-zugefallen', label: 'Autotür zugefallen' },
      { href: '/leistungen/kofferraum-oeffnen', label: 'Kofferraum öffnen' },
      { href: '/leistungen/autoschluessel-abgebrochen', label: 'Autoschlüssel abgebrochen' },
      { href: '/mobiler-schluesseldienst', label: 'Mobiler Schlüsseldienst' },
    ],
  },
  {
    title: 'Autoschlüssel nachmachen',
    href: '/leistungen/autoschluessel-nachmachen',
    subs: [
      { href: '/leistungen/transponder-anlernen', label: 'Transponder anlernen' },
      { href: '/leistungen/funkschluessel-nachmachen', label: 'Funkschlüssel nachmachen' },
      { href: '/leistungen/keyless-go-schluessel', label: 'Keyless Go / Smart Key' },
      { href: '/leistungen/ersatzschluessel-anfertigen', label: 'Ersatzschlüssel anfertigen' },
      { href: '/autoschluessel-kopieren', label: 'Autoschlüssel kopieren' },
      { href: '/autoschluessel-nachmachen-in-der-naehe', label: 'Nachmachen in der Nähe' },
      { href: '/autoschluessel-nachmachen-lassen', label: 'Nachmachen lassen' },
      { href: '/motorradschluessel-nachmachen', label: 'Motorradschlüssel nachmachen' },
    ],
  },
  {
    title: 'Autoschlüssel verloren',
    href: '/autoschluessel-verloren',
    subs: [
      { href: '/leistungen/alle-autoschluessel-verloren', label: 'Alle Schlüssel verloren' },
      { href: '/autoschluessel-gestohlen', label: 'Autoschlüssel gestohlen' },
    ],
  },
  {
    title: 'Autoschlüssel reparieren',
    href: '/leistungen/autoschluessel-reparieren',
    subs: [
      { href: '/leistungen/schluesselgehaeuse-wechseln', label: 'Schlüsselgehäuse wechseln' },
      { href: '/leistungen/autoschluessel-tasten-reparieren', label: 'Tasten reparieren' },
      { href: '/leistungen/autoschluessel-batterie-wechseln', label: 'Batterie wechseln' },
    ],
  },
];

/*
 * Keine Markenseiten, also auch keine Markenlinks.
 *
 * Auf der niederländischen Seite stehen hier acht Marken. Die ~600
 * Markenseiten sind in dieser App nicht enthalten (siehe Commit, der de/
 * angelegt hat): sie müssten erst übersetzt sein, bevor sie auf einer neuen
 * Domain online dürfen. Ein Menüeintrag, der ins Nichts führt, ist schlimmer
 * als keiner.
 */
const MarkenLinks: { href: string; label: string }[] = [];

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
        <Link href="/" className={styles.logo} aria-label="Autoschluessel24.de — 24/7 Autoschlüssel-Notdienst, Startseite">
          <Image
            src="/images/logo/autoschluessel24-logo-schluesseldienst.webp"
            alt="Autoschluessel24 Logo"
            width={128}
            height={38}
            style={{ height: '38px', width: 'auto', display: 'block' }}
          />
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.nav} role="navigation" aria-label="Hauptnavigation">
          {/* Leistungen-Dropdown */}
          <div className={styles.dropdown}>
            <button className={styles.navBtn} aria-haspopup="true">
              Leistungen
              <svg className={styles.chevron} width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>
            </button>
            <div className={styles.dropMenuLarge}>
              <div className={styles.dropHeader}>Unsere Leistungen</div>
              <div className={styles.dropGridLarge}>
                {LeistungenStructure.map(pillar => (
                  <div key={pillar.title} className={styles.dropColumn}>
                    <Link href={pillar.href} className={styles.pillarTitle}>
                      {pillar.title}
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
              <Link href="/leistungen" className={styles.dropAll}>Alle Leistungen ansehen →</Link>
            </div>
          </div>

          {/* Marken-Dropdown: ausgeblendet, solange es keine Markenseiten gibt */}
          {MarkenLinks.length > 0 && (
          <div className={styles.dropdown}>
            <button className={styles.navBtn} aria-haspopup="true">
              Marken
              <svg className={styles.chevron} width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>
            </button>
            <div className={styles.dropMenu}>
              <div className={styles.dropHeader}>Beliebte Marken</div>
              <div className={styles.dropGrid}>
                {MarkenLinks.map(l => (
                  <Link key={l.href} href={l.href} className={styles.dropItem}>{l.label}</Link>
                ))}
              </div>
            </div>
          </div>
          )}


          <Link href="/staedte" className={styles.navLink}>Städte</Link>
          <Link href="/preise" className={styles.navLink}>Preise</Link>
          {/*
            * Blog und Kennisbank gibt es auf der niederländischen Seite; ihre
            * Artikel sind noch nicht übersetzt, deshalb stehen die Links hier
            * nicht — ein Menüpunkt, der auf eine 404 zeigt, ist schlimmer als
            * ein fehlender.
            */}
          <Link href="/ueber-uns" className={styles.navLink}>Über uns</Link>
        </nav>

        {/* CTA */}
        <div className={styles.actions}>
          <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.phoneLink} id="nav-phone-cta" aria-label={`Jetzt anrufen: ${SITE_CONFIG.phone}`}>
            <svg className={styles.phoneIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
            </svg>
            <span>{SITE_CONFIG.phone}</span>
          </a>
          <Link href="/kontakt" className={styles.ctaBtn} id="nav-angebot-cta">
            Angebot anfordern
          </Link>
        </div>

        {/* Hamburger */}
        <button
          className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
          aria-expanded={mobileOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className={`${styles.mobileDrawer} ${styles.mobileDrawerOpen}`} role="dialog" aria-modal="true" aria-label="Navigationsmenü">
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.mobilePhone} onClick={() => setMobileOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
              </svg>
              Jetzt anrufen: {SITE_CONFIG.phone}
            </a>



            <div className={styles.mobileSection}>
              <div className={styles.mobileSectionTitle}>Leistungen</div>
              <div className={styles.mobileLeistungenGroup}>
                {LeistungenStructure.map(pillar => (
                  <div key={pillar.title} className={styles.mobilePillarBlock}>
                    <Link href={pillar.href} className={styles.mobilePillarLink} onClick={() => setMobileOpen(false)}>
                      {pillar.title}
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
              {MarkenLinks.length > 0 && <div className={styles.mobileSectionTitle}>Marken</div>}
              {MarkenLinks.map(l => <Link key={l.href} href={l.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>{l.label}</Link>)}
            </div>

            <div className={styles.mobileDivider} />
            <Link href="/staedte" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Städte</Link>
            <Link href="/preise" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Preise</Link>
            <Link href="/partner-werden" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Partner werden</Link>
            <Link href="/ueber-uns" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Über uns</Link>
            <Link href="/kontakt" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Kontakt</Link>
          </div>
        </>
      )}
    </header>
  );
}
