'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Handshake, Package, Truck } from 'lucide-react';
import styles from './admin.module.css';
import { DEFAULT_CRM_LOCALE, type CrmLocale } from '@/lib/crmLocale';
import { t } from './_i18n';
import { NAV, SHELL } from './_i18n/shell';

/**
 * The four things a monteur actually opens every day, reachable with a
 * thumb without hunting through a menu — the mobile equivalent of the
 * office's full sidebar, cut down to just what a phone-in-a-van workflow
 * needs. Office roles never see this; it renders only for 'monteur', and
 * only below the phone-width breakpoint (admin.module.css).
 *
 * Aanbod sits raised and orange in the middle on purpose: an offer expires
 * on a clock (dispatch.ts), so it is the one tab that has to be found
 * without looking for it, the way a real dispatch app treats "new job."
 */
export default function MobileTabBar({
  locale = DEFAULT_CRM_LOCALE,
}: {
  /** The reader's own CRM language, from technicians.locale. */
  locale?: CrmLocale;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <nav className={styles.tabBar} aria-label={t(SHELL.snelmenu, locale)}>
      <Link
        href="/admin/vandaag"
        className={`${styles.tabItem} ${isActive('/admin/vandaag') ? styles.tabItemActive : ''}`}
      >
        <Truck size={22} strokeWidth={1.9} aria-hidden="true" />
        <span>{t(NAV.vandaag, locale)}</span>
      </Link>

      <Link
        href="/admin/mijn-bus"
        className={`${styles.tabItem} ${isActive('/admin/mijn-bus') ? styles.tabItemActive : ''}`}
      >
        <Package size={22} strokeWidth={1.9} aria-hidden="true" />
        <span>{t(NAV.mijnBus, locale)}</span>
      </Link>

      <Link href="/admin/aanbod" className={styles.tabCenter} aria-label={t(NAV.aanbod, locale)}>
        <span className={styles.tabCenterBtn}>
          <Handshake size={24} strokeWidth={2.1} aria-hidden="true" />
        </span>
      </Link>

      {/* Was Netwerk, which is office-only now — a tab that only ever led to
          /admin/geen-toegang is worse than no tab. Mijn agenda is the thing a
          monteur opens next most often after Vandaag. */}
      <Link
        href="/admin/mijn-agenda"
        className={`${styles.tabItem} ${isActive('/admin/mijn-agenda') ? styles.tabItemActive : ''}`}
      >
        <CalendarDays size={22} strokeWidth={1.9} aria-hidden="true" />
        <span>{t(NAV.mijnAgenda, locale)}</span>
      </Link>
    </nav>
  );
}
