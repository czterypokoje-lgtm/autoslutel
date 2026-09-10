import type { Metadata } from 'next';
import './theme.css';
import styles from './admin.module.css';
import { getCrmUser } from '@/lib/crmSession';
import Sidebar from './Sidebar';

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
  /*
   * Without this, "Voeg toe aan beginscherm" still works — every browser can
   * bookmark a page — but the icon reopens inside Safari's own chrome:
   * address bar, tab strip, share button, all of it. This is what turns that
   * into something that opens full-screen like an installed app instead.
   */
  appleWebApp: {
    capable: true,
    title: 'Autosleutel24 CRM',
    statusBarStyle: 'black-translucent',
  },
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
      {user && <Sidebar role={user.role} email={user.email} initials={initials} />}
      <main className={user ? styles.main : undefined}>{children}</main>
    </div>
  );
}
