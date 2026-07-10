import Link from 'next/link';
import styles from './Footer.module.css';
import { SITE_CONFIG, WHATSAPP_URL } from '@/config/site.config';
import { BRANDS } from '../../config/brands';

const diensten = [
  ['Autosleutel Bijmaken', '/diensten/autosleutel-bijmaken'],
  ['Transponder Sleutel', '/diensten/transponder-sleutel-programmeren'],
  ['Smart Key / Keyless', '/diensten/smart-key-programmeren'],
  ['Contact Reparatie', '/diensten/contact-reparatie'],
  ['Reservesleutel Maken', '/diensten/reservesleutel-maken'],
  ['Alarm Programmeren', '/diensten/alarm-programmeren'],
  ['Alle diensten →', '/diensten'],
];

const steden = [
  ['Utrecht (Hoofdlocatie)', '/steden/utrecht'],
  ['Amsterdam', '/steden/amsterdam'],
  ['Amsterdam-Zuid', '/steden/amsterdam-zuid'],
  ['Almere', '/steden/almere'],
  ['Amersfoort', '/steden/amersfoort'],
  ['Hilversum', '/steden/hilversum'],
  ['Bussum', '/steden/bussum'],
  ['Naarden', '/steden/naarden'],
  ['Amstelveen', '/steden/amstelveen'],
  ['Zeist', '/steden/zeist'],
  ['Alle steden & regio\'s →', '/steden'],
];

const spoed = [
  ['Autosleutel Kwijt', '/autosleutel-kwijt'],
  ['Auto Openen Zonder Sleutel', '/diensten/auto-openen-zonder-sleutel'],
  ['24/7 Spoedhulp', '/spoedhulp-autosleutel'],
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          {/* Brand column */}
          <div>
            <div className={styles.footerBrand}>
              <img
                src="/images/logo/autosleutel24-logo-slotenmaker-utrecht.webp"
                alt="Autosleutel24.nl Logo — 24/7 Mobiele Autosleutel Slotenmaker Utrecht [GPS: 52.0907° N, 5.1214° E]"
                style={{ height: '38px', width: 'auto', display: 'block' }}
              />
            </div>
            <p className={styles.footerDesc}>Professionele mobiele autosleutelprogrammering voor alle merken. Hoofdlocatie Utrecht, direct actief in Amsterdam-Zuid, Amersfoort, Almere, &apos;t Gooi (Hilversum, Bussum, Naarden) en heel Nederland.</p>
            <div className={styles.footerBadges}>
              <span>KVK: {SITE_CONFIG.kvk}</span>
              <span>BTW: {SITE_CONFIG.btw}</span>
              <span>4.9 ★ Google</span>
              <span>Verzekerd</span>
            </div>
            <div style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
              <a
                href={SITE_CONFIG.social.marktplaats}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', textDecoration: 'none' }}
              >
                <img
                  src="/images/seo/marktplaats-autosleutel24-verifieerd.webp"
                  alt="Autosleutel24 op Marktplaats - Geverifieerde verkoper"
                  style={{ height: '60px', width: 'auto', display: 'block', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </a>
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

          {/* Openingstijden */}
          <div>
            <h4 className={styles.colTitle}>Openingstijden</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)' }}>
              <tbody>
                {[
                  ['Maandag', '24 uur geopend'],
                  ['Dinsdag', '24 uur geopend'],
                  ['Woensdag', '24 uur geopend'],
                  ['Donderdag', '24 uur geopend'],
                  ['Vrijdag', '24 uur geopend'],
                  ['Zaterdag', '24 uur geopend'],
                  ['Zondag', '24 uur geopend'],
                ].map(([dag, tijd]) => (
                  <tr key={dag} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '0.35rem 0', fontWeight: 500 }}>{dag}</td>
                    <td style={{ padding: '0.35rem 0', textAlign: 'right', color: 'var(--orange-400)', fontWeight: 600 }}>{tijd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.bottomInner}>
            <p>© {year} {SITE_CONFIG.fullName}. Alle rechten voorbehouden.</p>
            <div className={styles.bottomLinks}>
              {/* iubenda Privacy Policy embedded link */}
              <a
                href="https://www.iubenda.com/privacy-policy/c53c352b-ed07-4c5b-b461-8b542ddd3aaf"
                className="iubenda-white iubenda-noiframe iubenda-embed"
                title="Privacy Policy"
                rel="noopener noreferrer"
              >
                Privacybeleid
              </a>
              {/* iubenda Cookie Policy embedded link */}
              <a
                href="https://www.iubenda.com/privacy-policy/c53c352b-ed07-4c5b-b461-8b542ddd3aaf/cookie-policy"
                className="iubenda-white iubenda-noiframe iubenda-embed"
                title="Cookie Policy"
                rel="noopener noreferrer"
              >
                Cookiebeleid
              </a>
              {/* Cookie preferences — lets users manage/withdraw consent (GDPR art. 7) */}
              <button
                type="button"
                className="iubenda-cs-preferences-link"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.3)',
                  fontFamily: 'inherit',
                }}
              >
                Cookie-instellingen
              </button>
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
