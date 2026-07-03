import Link from 'next/link';
import styles from './Footer.module.css';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { BRANDS } from '../../config/brands';

const diensten = [
  ['Sleutel Bijmaken', '/diensten/sleutel-bijmaken'],
  ['Transponder Sleutel', '/diensten/transponder-sleutel-programmeren'],
  ['Smart Key / Keyless', '/diensten/smart-key-programmeren'],
  ['Contact Reparatie', '/diensten/contact-reparatie'],
  ['Reservesleutel Maken', '/diensten/reservesleutel-maken'],
  ['Alarm Programmeren', '/diensten/alarm-programmeren'],
  ['Alle diensten →', '/diensten'],
];

const steden = [
  ['Utrecht', '/steden/utrecht'],
  ['Amsterdam', '/steden/amsterdam'],
  ['Rotterdam', '/steden/rotterdam'],
  ['Den Bosch', '/steden/den-bosch'],
  ['Amersfoort', '/steden/amersfoort'],
  ['Leusden', '/steden/leusden'],
  ['Soest', '/steden/soest'],
  ['Hilversum', '/steden/hilversum'],
  ['Culemborg', '/steden/culemborg'],
  ['Gouda', '/steden/gouda'],
  ['Alle steden →', '/steden'],
];

const spoed = [
  ['Autosleutel Kwijt', '/autosleutel-kwijt'],
  ['Auto Op Slot', '/auto-op-slot'],
  ['Auto Openen Zonder Sleutel', '/auto-openen-zonder-sleutel'],
  ['24/7 Spoedhulp', '/spoedhulp-autosleutel'],
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <>
      {/* Pre-footer CTA */}
      <section className={styles.ctaBand}>
        <div className={styles.ctaBandInner}>
          <div>
            <h3>Autosleutel Probleem? Wij Helpen Direct</h3>
            <p>24/7 mobiele service. Gemiddeld {SITE_CONFIG.responseTime} bij u ter plaatse.</p>
          </div>
          <div className={styles.ctaBtns}>
            <a href={`tel:${SITE_CONFIG.phoneTel}`} className={styles.ctaPhoneBtn} id="footer-phone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
              {SITE_CONFIG.phone}
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.ctaWaBtn} id="footer-wa">WhatsApp</a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          {/* Brand column */}
          <div>
            <div className={styles.footerBrand}>
              <svg viewBox="0 0 40 40" fill="none" className={styles.footerLogo} aria-hidden="true">
                <rect width="40" height="40" rx="4" fill="#e8520a"/>
                <path d="M22 14a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" fill="white"/>
                <rect x="8" y="19" width="10" height="2" rx="1" fill="white"/>
                <rect x="10" y="23" width="3" height="2" rx="1" fill="white"/>
                <rect x="15" y="23" width="3" height="2" rx="1" fill="white"/>
              </svg>
              <div>
                <div className={styles.footerBrandName}>Autosleutel24</div>
                <div className={styles.footerBrandSub}>Utrecht · 24/7</div>
              </div>
            </div>
            <p className={styles.footerDesc}>Professionele mobiele autosleutelprogrammering voor alle merken. Utrecht en heel Nederland.</p>
            <div className={styles.footerBadges}>
              <span>KVK: {SITE_CONFIG.kvk}</span>
              <span>BTW: {SITE_CONFIG.btw}</span>
              <span>4.9 ★ Google</span>
              <span>Verzekerd</span>
            </div>
            <div className={styles.footerContact}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`}>{SITE_CONFIG.phone}</a>
              <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a>
              <span className={styles.hours}>24/7 Bereikbaar</span>
            </div>
          </div>

          {/* Diensten */}
          <div>
            <h4 className={styles.colTitle}>Diensten</h4>
            <ul className={styles.linkList}>
              {diensten.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}
            </ul>
          </div>

          {/* Merken */}
          <div>
            <h4 className={styles.colTitle}>Merken</h4>
            <ul className={styles.linkList}>
              {BRANDS.filter(b => b.priority === 'P1').map(b => (
                <li key={b.slug}><Link href={`/merken/${b.nameSlug}-autosleutel-bijmaken`}>{b.name}</Link></li>
              ))}
              <li><Link href="/merken">Alle 38 merken →</Link></li>
            </ul>
            <h4 className={styles.colTitle} style={{ marginTop: '1.5rem' }}>Blog &amp; Advies</h4>
            <ul className={styles.linkList}>
              <li><Link href="/blog/autosleutel-batterij-vervangen-stappenplan">Batterij Vervangen</Link></li>
              <li><Link href="/blog/ghost-immobiliser-utrecht">Ghost Immobiliser</Link></li>
              <li><Link href="/blog/autosleutel-gestolen-wat-te-doen">Sleutel Gestolen?</Link></li>
            </ul>
          </div>

          {/* Steden + Spoed */}
          <div>
            <h4 className={styles.colTitle}>Steden</h4>
            <ul className={styles.linkList}>
              {steden.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}
            </ul>
            <h4 className={styles.colTitle} style={{marginTop:'1.5rem'}}>Spoedhulp</h4>
            <ul className={styles.linkList}>
              {spoed.map(([label, href]) => <li key={href}><Link href={href} style={{color:'#f87171'}}>{label}</Link></li>)}
            </ul>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.bottomInner}>
            <p>© {year} {SITE_CONFIG.fullName}. Alle rechten voorbehouden.</p>
            <div className={styles.bottomLinks}>
              <Link href="/privacybeleid">Privacybeleid</Link>
              <Link href="/veelgestelde-vragen">FAQ</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
