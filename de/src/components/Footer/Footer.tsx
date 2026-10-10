import Link from 'next/link';
import ConsentPreferencesButton from '@/components/ConsentBanner/ConsentPreferencesButton';
import Image from 'next/image';
import styles from './Footer.module.css';
import { SITE_CONFIG } from '@/config/site.config';

/*
 * Die Fußzeile steht auf jeder Seite, also stehen hier die Links, die eine
 * neue Domain am dringendsten braucht: jede Dienstseite und jede Stadt mit
 * einem Partner. Vier Städte, nicht vierundzwanzig — die niederländische
 * Fassung listet vierundzwanzig, weil es dort vierundzwanzig gibt.
 *
 * Markenlinks fehlen: die ~600 Markenseiten sind in dieser App nicht
 * enthalten, solange sie nicht übersetzt sind.
 */
const leistungen: [string, string][] = [
  ['Autoschlüssel nachmachen', '/leistungen/autoschluessel-nachmachen'],
  ['Transponder anlernen', '/leistungen/transponder-anlernen'],
  ['Keyless Go / Smart Key', '/leistungen/keyless-go-schluessel'],
  ['Funkschlüssel nachmachen', '/leistungen/funkschluessel-nachmachen'],
  ['Ersatzschlüssel anfertigen', '/leistungen/ersatzschluessel-anfertigen'],
  ['Autoschlüssel reparieren', '/leistungen/autoschluessel-reparieren'],
  ['Schlüsselgehäuse wechseln', '/leistungen/schluesselgehaeuse-wechseln'],
  ['Batterie wechseln', '/leistungen/autoschluessel-batterie-wechseln'],
  ['Autoschlüssel kopieren', '/autoschluessel-kopieren'],
  ['Mobiler Schlüsseldienst', '/mobiler-schluesseldienst'],
  ['Nachmachen in der Nähe', '/autoschluessel-nachmachen-in-der-naehe'],
  ['Nachmachen lassen', '/autoschluessel-nachmachen-lassen'],
  ['Motorradschlüssel nachmachen', '/motorradschluessel-nachmachen'],
  ['Alle Leistungen →', '/leistungen'],
];

const staedte: [string, string][] = [
  ['Berlin', '/staedte/berlin'],
  ['Hamburg', '/staedte/hamburg'],
  ['München', '/staedte/muenchen'],
  ['Frankfurt am Main', '/staedte/frankfurt'],
  ['Region Berlin', '/regionen/berlin'],
  ['Region Hamburg', '/regionen/hamburg'],
  ['Region Bayern', '/regionen/bayern'],
  ['Region Hessen', '/regionen/hessen'],
  ['Alle Städte →', '/staedte'],
];

const soforthilfe: [string, string][] = [
  ['Autoschlüssel verloren', '/autoschluessel-verloren'],
  /* Gestohlen steht neben verloren, weil es dieselbe Panik mit einem Dieb darin ist. */
  ['Autoschlüssel gestohlen', '/autoschluessel-gestohlen'],
  ['Auto öffnen ohne Schlüssel', '/leistungen/auto-oeffnen-notdienst'],
  ['Schlüssel im Auto eingeschlossen', '/leistungen/schluessel-im-auto-eingeschlossen'],
  ['Autoschlüssel abgebrochen', '/leistungen/autoschluessel-abgebrochen'],
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
              <Image
                src="/images/logo/autoschluessel24-logo-footer-weiss.webp"
                alt="Autoschlüssel24 Logo"
                width={160}
                height={42}
                style={{ height: '42px', width: 'auto', display: 'block' }}
              />
            </div>
            <p className={styles.footerDesc}>Mobiler Autoschlüssel-Service für alle Marken: Autoschlüssel verloren, defekt oder nachmachen, und Fahrzeuge schadenfrei öffnen. Rund um die Uhr, Festpreis vorab. Unser Partner kommt zu Ihrem Fahrzeug in <Link href="/staedte/berlin" className={styles.seoLink}>Berlin</Link>, <Link href="/staedte/hamburg" className={styles.seoLink}>Hamburg</Link>, <Link href="/staedte/muenchen" className={styles.seoLink}>München</Link> und <Link href="/staedte/frankfurt" className={styles.seoLink}>Frankfurt am Main</Link>.</p>
            <div className={styles.footerBadges}>
              <span>{SITE_CONFIG.hrb}</span>
              <span>USt-IdNr.: {SITE_CONFIG.ustId}</span>
              <span>{SITE_CONFIG.rating} ★ Google</span>
              <span>Versichert</span>
            </div>
            <div style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
              <div className={styles.googleBtnWrapper}>
                <div {...{ 'google-add-preferred-source-btn': 'true' }} data-theme="dark" data-lang="de" style={{ width: '100%' }}></div>
              </div>
            </div>
            <div className={styles.footerContact}>
              <a href={`tel:${SITE_CONFIG.phoneTel}`}>{SITE_CONFIG.phone}</a>
              <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a>
              <span className={styles.hours}>24/7 erreichbar</span>
            </div>
          </div>

          {/* Soforthilfe & Leistungen */}
          <div>
            <h3 className={styles.colTitle}>Soforthilfe</h3>
            <ul className={styles.linkList}>
              {soforthilfe.map(([label, href]) => <li key={href}><Link href={href} style={{ color: 'var(--orange-400)' }}>{label}</Link></li>)}
            </ul>
            <h3 className={styles.colTitle} style={{ marginTop: '1.5rem' }}>Leistungen</h3>
            <ul className={styles.linkList}>
              {leistungen.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}
            </ul>
          </div>

          {/* Unternehmen. Wo auf der niederländischen Seite die Markenliste
              und der Blog stehen, stehen hier die Seiten, die es gibt. */}
          <div>
            <h3 className={styles.colTitle}>Unternehmen</h3>
            <ul className={styles.linkList}>
              <li><Link href="/ueber-uns">Über uns</Link></li>
              <li><Link href="/geschaeftskunden">Geschäftskunden</Link></li>
              <li><Link href="/partner-werden">Partner werden</Link></li>
              <li><Link href="/preise">Preise</Link></li>
              <li><Link href="/haeufige-fragen">Häufige Fragen</Link></li>
              <li><Link href="/kontakt">Kontakt</Link></li>
            </ul>
            <h3 className={styles.colTitle} style={{ marginTop: '1.5rem' }}>Rechtliches</h3>
            <ul className={styles.linkList}>
              <li><Link href="/impressum">Impressum</Link></li>
              <li><Link href="/datenschutz">Datenschutz</Link></li>
              <li><Link href="/agb">AGB</Link></li>
            </ul>
          </div>

          {/* Städte */}
          <div>
            {/*
              The phrase belongs in the heading, once — not on every link.
              This list used to render "Amsterdam autosleutel bijmaken", "Den
              Haag autosleutel bijmaken" and so on for twenty cities, on every
              page of the site. That is roughly 900 repetitions of one phrase
              across the footer alone, which is keyword stuffing rather than
              navigation, and it made the links harder to scan for the
              visitors they are actually there for. The city name is what
              someone is looking for in a list of cities.
            */}
            <h3 className={styles.colTitle}>Autoschlüssel nachmachen je Stadt</h3>
            <ul className={styles.linkList}>
              {staedte.map(([label, href]) => (
                <li key={href}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Über uns & Erreichbarkeit */}
          <div>
            <h3 className={styles.colTitle}>Über uns</h3>
            <ul className={styles.linkList} style={{ marginBottom: '1.5rem' }}>
              <li><Link href="/bewertungen">Kundenbewertungen</Link></li>
              <li><Link href="/galerie">Unsere Galerie</Link></li>
              <li><Link href="/ueber-uns">Über uns</Link></li>
            </ul>

            <h3 className={styles.colTitle}>Erreichbarkeit</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)' }}>
              <tbody>
                {[
                  ['Montag', 'durchgehend geöffnet'],
                  ['Dienstag', 'durchgehend geöffnet'],
                  ['Mittwoch', 'durchgehend geöffnet'],
                  ['Donnerstag', 'durchgehend geöffnet'],
                  ['Freitag', 'durchgehend geöffnet'],
                  ['Samstag', 'durchgehend geöffnet'],
                  ['Sonntag', 'durchgehend geöffnet'],
                ].map(([tag, zeit]) => (
                  <tr key={tag} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '0.35rem 0', fontWeight: 500 }}>{tag}</td>
                    <td style={{ padding: '0.35rem 0', textAlign: 'right', color: 'var(--orange-400)', fontWeight: 600 }}>{zeit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.bottomInner}>
            <div className={styles.footerSeoText} style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                Autoschlüssel24 ist ein Netzwerk selbstständiger Fachbetriebe für
                Autoschlüssel. Mit Fahrzeugdiagnose und CNC-Fräsen öffnen unsere Partner
                Fahrzeuge schadenfrei, lernen Transponder und Keyless-Go-Schlüssel an der
                Wegfahrsperre an und lösen auch den Fall, in dem kein Schlüssel mehr
                existiert — vor Ort, ohne Abschleppen zum Vertragshändler. Erreichbar rund
                um die Uhr in <Link href="/staedte/berlin" className={styles.seoLink}>Berlin</Link>, <Link href="/staedte/hamburg" className={styles.seoLink}>Hamburg</Link>, <Link href="/staedte/muenchen" className={styles.seoLink}>München</Link> und <Link href="/staedte/frankfurt" className={styles.seoLink}>Frankfurt am Main</Link>, mit 12 Monaten Garantie auf
                Schlüssel und Anlernen. Alle Preise inklusive 19 % MwSt.
              </p>
            </div>
            <p>© {year} {SITE_CONFIG.fullName}. Alle Rechte vorbehalten.</p>
            <div className={styles.bottomLinks}>
              {/* Die Rechtsseiten liegen auf dieser Domain. Die früheren
                  iubenda-URLs liefen auf 404, beide Footer-Links waren tot. */}
              <Link href="/datenschutz">Datenschutz</Link>
              <Link href="/cookie-richtlinie">Cookie-Richtlinie</Link>
              <Link href="/agb">AGB</Link>
              <Link href="/impressum">Impressum</Link>
              {/* Einwilligung ändern oder widerrufen — DSGVO Art. 7 Abs. 3 */}
              <ConsentPreferencesButton />
              <Link href="/haeufige-fragen">FAQ</Link>
              <Link href="/kontakt">Kontakt</Link></div>
          </div>
        </div>
      </footer>
    </>
  );
}
