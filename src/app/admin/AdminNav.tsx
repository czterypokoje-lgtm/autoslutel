'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgeCheck,
  BarChart3,
  CalendarDays,
  Handshake,
  CircleUser,
  Inbox,
  Package,
  Settings,
  Tag,
  Truck,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import styles from './admin.module.css';
import type { CrmRole } from '@/lib/crmSession';

/**
 * The sidebar.
 *
 * Every item had the same three-line hamburger glyph before this, which is the
 * same as having no icons at all: the eye cannot use them to find anything, so
 * eleven identical marks just made the list longer. Each item now carries the
 * icon for the thing it is — a van for the day's route, a wallet for the cash
 * book, a wrench for the technicians — and the shape becomes the fastest way
 * to hit the right screen without reading.
 */

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const OFFICE_LINKS: { group: string; items: NavItem[] }[] = [
  {
    group: 'Werk',
    items: [
      { href: '/admin/leads', label: 'Leads', icon: Inbox },
      { href: '/admin/aanbod', label: 'Aanbod', icon: Handshake },
      { href: '/admin/jobs', label: 'Agenda', icon: CalendarDays },
      { href: '/admin/vandaag', label: 'Vandaag', icon: Truck },
    ],
  },
  {
    group: 'Webshop',
    items: [
      { href: '/admin/orders', label: 'Bestellingen', icon: Package },
      { href: '/admin/producten', label: 'Producten', icon: Tag },
    ],
  },
  {
    group: 'Beheer',
    items: [
      { href: '/admin/klanten', label: 'Klanten', icon: Users },
      { href: '/admin/kas', label: 'Kas', icon: Wallet },
      { href: '/admin/rapportage', label: 'Rapportage', icon: BarChart3 },
      { href: '/admin/monteurs', label: 'Monteurs', icon: Wrench },
      { href: '/admin/instellingen', label: 'Instellingen', icon: Settings },
      { href: '/admin/mijn-profiel', label: 'Profiel', icon: CircleUser },
    ],
  },
];

const MONTEUR_LINKS: { group: string; items: NavItem[] }[] = [
  {
    group: 'Werk',
    items: [
      { href: '/admin/aanbod', label: 'Aanbod', icon: Handshake },
      { href: '/admin/vandaag', label: 'Vandaag', icon: Truck },
      { href: '/admin/mijn-agenda', label: 'Mijn agenda', icon: CalendarDays },
    ],
  },
  {
    group: 'Mijzelf',
    items: [
      { href: '/admin/mijn-vak', label: 'Mijn vak', icon: BadgeCheck },
      { href: '/admin/mijn-profiel', label: 'Profiel', icon: CircleUser },
    ],
  },
];

export default function AdminNav({ role }: { role: CrmRole | null }) {
  const pathname = usePathname();
  const groups = role === 'monteur' ? MONTEUR_LINKS : OFFICE_LINKS;

  /*
   * "Starts with" would light up both /admin/jobs and /admin/jobs/nieuw, which
   * is right, but it would also light up nothing at all on /admin itself. An
   * exact match plus a trailing slash keeps a detail page attached to its
   * section without one section claiming another's prefix.
   */
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <>
      {groups.map((group) => (
        <div key={group.group}>
          <div className={styles.groupLabel}>{group.group}</div>
          <nav className={styles.nav}>
            {group.items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={isActive(href) ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
              >
                <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      ))}
    </>
  );
}
