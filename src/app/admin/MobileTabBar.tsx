'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Handshake, Package, Truck } from 'lucide-react';
import styles from './admin.module.css';

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
export default function MobileTabBar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <nav className={styles.tabBar} aria-label="Snelmenu">
      <Link
        href="/admin/vandaag"
        className={`${styles.tabItem} ${isActive('/admin/vandaag') ? styles.tabItemActive : ''}`}
      >
        <Truck size={22} strokeWidth={1.9} aria-hidden="true" />
        <span>Vandaag</span>
      </Link>

      <Link
        href="/admin/mijn-bus"
        className={`${styles.tabItem} ${isActive('/admin/mijn-bus') ? styles.tabItemActive : ''}`}
      >
        <Package size={22} strokeWidth={1.9} aria-hidden="true" />
        <span>Mijn bus</span>
      </Link>

      <Link href="/admin/aanbod" className={styles.tabCenter} aria-label="Aanbod">
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
        <span>Mijn agenda</span>
      </Link>
    </nav>
  );
}
