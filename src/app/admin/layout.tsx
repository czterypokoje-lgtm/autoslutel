import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './theme.css';
import './kfc.css';
import styles from './admin.module.css';
import { getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Sidebar from './Sidebar';
import MobileTabBar from './MobileTabBar';
import TopBar from './TopBar';
import { CRM_READONLY, READONLY_MESSAGE } from '@/lib/readonly';
import { CRM_PREVIEW } from '@/lib/supabase/env';
import { BRAND, STUDIO_UI } from '@/config/install';
import PreviewLanguage, { PreviewText } from './PreviewLanguage';
import KfcShell from './KfcShell';

// Studio shell (KfcShell): Geist, the Studio Admin template font.
const geist = localFont({ src: '../fonts/geist-latin-wght-normal.woff2', weight: '100 900', display: 'swap', variable: '--font-geist', preload: false });
const geistMono = localFont({ src: '../fonts/geist-mono-latin-wght-normal.woff2', weight: '100 900', display: 'swap', variable: '--font-geist-mono', preload: false });

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
    title: BRAND.crm,
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
  if (user && !CRM_PREVIEW) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from('technicians')
        .select('photo_url')
        .eq('user_id', user.id)
        .maybeSingle();
      photoUrl = (data?.photo_url as string) ?? null;
    } catch {
      // Unconfigured deployment, or no row: initials still work.
    }
  }

  const isMonteur = user?.role === 'monteur';
  const readonlyStatus = CRM_READONLY && (
    <div role="status" className={styles.readonlyBanner}>
      <PreviewText>{READONLY_MESSAGE}</PreviewText>
    </div>
  );

  const panel = (
    <div className={`crm ${styles.shell}`}>
      {user && (
        <Sidebar role={user.role} email={user.email} initials={initials} photoUrl={photoUrl} />
      )}
      <div className={styles.column}>
        {user && (
          <TopBar role={user.role} email={user.email} initials={initials} photoUrl={photoUrl} />
        )}
        <main className={user ? `${styles.main} ${isMonteur ? styles.mainWithTabBar : ''}` : undefined}>
          {children}
        </main>
      </div>
      {isMonteur && <MobileTabBar />}
      {readonlyStatus}
    </div>
  );

  // The shadcn shell (KfcShell) once signed in, behind CRM_UI=studio. The login page keeps the plain panel.
  if (STUDIO_UI && user) {
    return (
      <PreviewLanguage floating={false}>
        <KfcShell role={user.role} email={user.email} initials={initials} photoUrl={photoUrl} fontClass={`${geist.variable} ${geistMono.variable}`}>
          {readonlyStatus}
          {children}
        </KfcShell>
      </PreviewLanguage>
    );
  }
  return CRM_PREVIEW ? <PreviewLanguage>{panel}</PreviewLanguage> : panel;
}
