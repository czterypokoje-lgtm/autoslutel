import Link from 'next/link';
import { SITE, isReady } from '@/config/site';

/**
 * Kopfzeile. Die Links sind deutsche Slugs, keine übersetzten
 * niederländischen: /staedte, /leistungen, /preise, /kontakt.
 */
export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand">
          Autoschlüssel<span>24</span>
        </Link>
        <nav className="nav" aria-label="Hauptnavigation">
          <Link href="/leistungen">Leistungen</Link>
          <Link href="/staedte">Städte</Link>
          <Link href="/preise">Preise</Link>
          <Link href="/partner-werden">Partner werden</Link>
          <Link href="/kontakt">Kontakt</Link>
        </nav>
        {isReady(SITE.phone) && (
          <a className="btn btn-primary" href={`tel:${SITE.phoneTel}`}>
            {SITE.phone}
          </a>
        )}
      </div>
    </header>
  );
}
