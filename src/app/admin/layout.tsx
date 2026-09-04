import type { Metadata } from 'next';
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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCrmUser();

  return (
    <div className={`crm ${styles.shell}`}>
      {user && (
        <aside className={styles.sidebar}>
          <div className={styles.brand}>Autosleutel24</div>
          <div className={styles.navWrapper}>
            <AdminNav role={user.role} />
          </div>
          <div className={styles.sidebarBottom}>
            <div className={styles.who}>
              {user.role && <span className={styles.role}>{user.role}</span>}
              <span className={styles.whoEmail}>{user.email}</span>
            </div>
            <SignOutButton />
          </div>
        </aside>
      )}
      <main className={user ? styles.main : undefined}>{children}</main>
    </div>
  );
}
