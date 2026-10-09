import Link from 'next/link';
import { SITE, isReady } from '@/config/site';
import { STAEDTE } from '@/config/staedte';
import { LEISTUNGEN } from '@/config/leistungen';

/**
 * Fußzeile.
 *
 * Impressum und Datenschutz stehen hier, weil sie nach § 5 DDG von jeder Seite
 * aus in zwei Klicks erreichbar sein müssen — eine Fußzeile auf jeder Seite ist
 * die einfachste Art, das nicht zu vergessen.
 */
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="grid">
          <div>
            <h3>Leistungen</h3>
            <ul>
              {LEISTUNGEN.map((l) => (
                <li key={l.slug}>
                  <Link href={`/leistungen/${l.slug}`}>{l.titel}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Städte</h3>
            <ul>
              {STAEDTE.map((s) => (
                <li key={s.slug}>
                  <Link href={`/staedte/${s.slug}`}>{s.stadt}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Unternehmen</h3>
            <ul>
              <li><Link href="/preise">Preise</Link></li>
              <li><Link href="/kontakt">Kontakt</Link></li>
              <li><Link href="/partner-werden">Partner werden</Link></li>
              <li><Link href="/impressum">Impressum</Link></li>
              <li><Link href="/datenschutz">Datenschutz</Link></li>
              <li><Link href="/widerrufsrecht">Widerrufsrecht</Link></li>
            </ul>
          </div>
          <div>
            <h3>Erreichbarkeit</h3>
            <ul>
              <li>{SITE.hours}</li>
              {isReady(SITE.phone) && (
                <li><a href={`tel:${SITE.phoneTel}`}>{SITE.phone}</a></li>
              )}
              {isReady(SITE.email) && (
                <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
              )}
            </ul>
          </div>
        </div>
        <p className="footer-legal">
          {SITE.name}
          {isReady(SITE.legal.company) ? ` · ${SITE.legal.company}` : ''}
          {isReady(SITE.legal.vatId) ? ` · USt-IdNr. ${SITE.legal.vatId}` : ''}
          {' · '}
          Alle Preise inkl. 19 % MwSt.
        </p>
      </div>
    </footer>
  );
}
