import type { Metadata } from 'next';
import './theme.css';
import styles from './admin.module.css';
import { getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Sidebar from './Sidebar';
import MobileTabBar from './MobileTabBar';
import TopBar from './TopBar';
import { CRM_READONLY, READONLY_MESSAGE } from '@/lib/readonly';
import { DEFAULT_CRM_LOCALE, isCrmLocale, type CrmLocale } from '@/lib/crmLocale';

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

  /*
   * The profile photo, for the avatar in the corner.
   *
   * It has lived on technicians.photo_url all along and was only ever shown
   * on the profile page itself — so a monteur who uploaded one still saw
   * their initials everywhere else, including the button that opens that
   * very page. Office and owner accounts have no technicians row, so they
   * keep the initials; that is the fallback, not a failure.
   */
  let photoUrl: string | null = null;
  /*
   * The shell's language, from the person reading it.
   *
   * Read here, in the same row as the photo, rather than per screen: the CRM
   * is one deployment for three countries, so this cannot come from SITE_ID
   * the way the public site's language does. An office account has no
   * technicians row and falls back to Dutch, which is what it should see.
   */
  let locale: CrmLocale = DEFAULT_CRM_LOCALE;
  if (user) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from('technicians')
        .select('photo_url, locale')
        .eq('user_id', user.id)
        .maybeSingle();
      photoUrl = (data?.photo_url as string) ?? null;
      if (isCrmLocale(data?.locale)) locale = data.locale;
    } catch {
      // Unconfigured deployment, or no row: initials and Dutch still work.
    }
  }

  const isMonteur = user?.role === 'monteur';

  return (
    <div className={`crm ${styles.shell}`}>
      {user && (
        <Sidebar role={user.role} email={user.email} initials={initials} photoUrl={photoUrl} locale={locale} />
      )}
      <div className={styles.column}>
        {user && (
          <TopBar role={user.role} email={user.email} initials={initials} photoUrl={photoUrl} />
        )}
        <main className={user ? `${styles.main} ${isMonteur ? styles.mainWithTabBar : ''}` : undefined}>
          {children}
        </main>
      </div>
      {isMonteur && <MobileTabBar locale={locale} />}
      {CRM_READONLY && (
        <div role="status" className={styles.readonlyBanner}>
          {READONLY_MESSAGE}
        </div>
      )}
    </div>
  );
}
