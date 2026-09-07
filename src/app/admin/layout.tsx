import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, KeyRound, Search } from 'lucide-react';
import './theme.css';
import styles from './admin.module.css';
import { getCrmUser } from '@/lib/crmSession';
import AdminNav from './AdminNav';
import SignOutButton from './SignOutButton';

/**
 * The CRM shell.
 *
 * noindex twice over: this metadata, and the X-Robots-Tag that proxy.ts stamps
 * on every /admin response. A header cannot be forgotten by a route that
 * neglects to inherit metadata — the webshop taught that lesson already.
 */
/*
 * Every CRM page reads the session, so none of them may be prerendered. Making
 * that explicit rather than inferred: on a build without Supabase credentials
 * the cookie read never happens, and Next would otherwise cache a signed-out
 * shell and serve it to everyone.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CRM · Autosleutel24',
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCrmUser();

  /** Two letters off the address, so the account has a face in the corner. */
  const initials = (user?.email ?? '')
    .split('@')[0]
    .split(/[.\-_]/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

  return (
    <div className={`crm ${styles.shell}`}>
      {user && (
        <aside className={styles.sidebar}>
          <div className={styles.brandRow}>
            <Link href="/admin" className={styles.brand}>
              <span className={styles.brandMark} aria-hidden="true">
                <KeyRound size={13} strokeWidth={2.2} />
              </span>
              Autosleutel24
            </Link>

            {/*
              The search field lives on the page that has something to search,
              not up here — this is the way in to it, so the shortcut sits in
              the same place on every screen.
            */}
            <Link href="/admin/klanten" className={styles.iconGhost} title="Zoeken">
              <Search size={16} strokeWidth={1.9} aria-hidden="true" />
            </Link>

            <Link href="/admin/mijn-profiel" className={styles.avatar} title={user.email ?? 'Profiel'}>
              {initials}
            </Link>
          </div>

          <div className={styles.navWrapper}>
            <AdminNav role={user.role} />
          </div>

          <div className={styles.sidebarBottom}>
            <a
              className={styles.navLink}
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="De webshop openen zoals een klant hem ziet"
            >
              <ExternalLink size={16} strokeWidth={1.9} aria-hidden="true" />
              Webshop bekijken
            </a>

            <SignOutButton />

            <div className={styles.who}>
              {user.role && <span className={styles.role}>{user.role}</span>}
              <span className={styles.whoEmail}>{user.email}</span>
            </div>
          </div>
        </aside>
      )}
      <main className={user ? styles.main : undefined}>{children}</main>
    </div>
  );
}
