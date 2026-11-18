import Link from 'next/link';
import { Bot, Search } from 'lucide-react';
import styles from './admin.module.css';
import type { CrmRole } from '@/lib/crmSession';
import { IS_KEYFORCARS } from '@/config/install';

/**
 * The bar above every CRM page on desktop: search, the AI agent, and you.
 *
 * Search goes to Klanten (?q=), which already finds a customer by name,
 * phone or plate. A technician has no Klanten page, so no search box.
 * On a phone this bar is hidden and the sidebar's own top row takes over.
 */
export default function TopBar({
  role,
  email,
  initials,
  photoUrl,
}: {
  role: CrmRole | null;
  email: string | null;
  initials: string;
  photoUrl?: string | null;
}) {
  const office = role === 'owner' || role === 'kantoor';
  const avatar = photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt="" className={styles.avatarPhoto} />
  ) : (
    initials
  );

  // KeyForCars has no customers or AI agent screen: the bar searches products instead.
  if (IS_KEYFORCARS) {
    return (
      <header className={styles.topBar}>
        <form action="/admin/voorraad/p" method="get" className={styles.topSearch} role="search">
          <Search size={17} strokeWidth={2} aria-hidden="true" />
          <input
            type="search"
            name="q"
            placeholder="Zoek product: code, EAN, naam of auto en bouwjaar…"
            aria-label="Zoek product"
          />
        </form>
        <div className={styles.topRight}>
          <span className={styles.topAvatar} title={email ?? ''}>{avatar}</span>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.topBar}>
      {office ? (
        <form action="/admin/klanten" method="get" className={styles.topSearch} role="search">
          <Search size={17} strokeWidth={2} aria-hidden="true" />
          <input
            type="search"
            name="q"
            placeholder="Zoek klant op naam, telefoon of kenteken…"
            aria-label="Zoek klant"
          />
        </form>
      ) : (
        <span />
      )}

      <div className={styles.topRight}>
        {office && (
          <Link href="/admin/gesprekken" className={styles.topAgent} title="Gesprekken van de AI-agent">
            <span className={styles.topAgentDot} aria-hidden="true" />
            AI-agent
            <span className={styles.topAgentIcon} aria-hidden="true">
              <Bot size={18} strokeWidth={1.9} />
            </span>
          </Link>
        )}
        <Link href="/admin/mijn-profiel" className={styles.topAvatar} title={email ?? 'Profiel'}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className={styles.avatarPhoto} />
          ) : (
            initials
          )}
        </Link>
      </div>
    </header>
  );
}
