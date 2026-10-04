'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgeCheck,
  BarChart3,
  Boxes,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleUser,
  Euro,
  Handshake,
  History,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Package,
  PhoneCall,
  Settings,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import styles from './admin.module.css';
import type { CrmRole } from '@/lib/crmSession';

/**
 * The sidebar menu.
 *
 * Flat for the things opened every day, folded into a group for the things
 * that belong together (Planning, Geld, Rapporten). A group opens by itself
 * when you are on one of its pages, so the menu always shows where you are.
 *
 * The webshop pages (/admin/orders, /admin/producten) still exist but are no
 * longer in the menu: the webshop was removed.
 */

interface Leaf {
  href: string;
  label: string;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  /** Marks a screen whose content comes from the AI agent. */
  ai?: boolean;
  children?: Leaf[];
}

const OFFICE_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/overzicht' },
  { label: 'Leads', icon: Inbox, href: '/admin/leads' },
  { label: 'Gesprekken', icon: PhoneCall, href: '/admin/gesprekken', ai: true },
  {
    label: 'Planning',
    icon: CalendarDays,
    children: [
      { href: '/admin/jobs', label: 'Agenda' },
      { href: '/admin/jobs/nieuw', label: 'Klus inplannen' },
      { href: '/admin/aanbod', label: 'Aanbod' },
      { href: '/admin/biedingen', label: 'Biedingen' },
      { href: '/admin/vandaag', label: 'Vandaag (monteurscherm)' },
    ],
  },
  { label: 'Klanten', icon: Users, href: '/admin/klanten' },
  { label: 'Monteurs', icon: Wrench, href: '/admin/monteurs' },
  {
    label: 'Voorraad',
    icon: Boxes,
    children: [
      { href: '/admin/voorraad', label: 'Magazijn en bussen' },
      { href: '/admin/bestellen', label: 'Onderdelen bestellen' },
    ],
  },
  {
    label: 'Geld',
    icon: Euro,
    children: [
      { href: '/admin/facturen', label: 'Facturen' },
      { href: '/admin/uitgaven', label: 'Uitgaven' },
      { href: '/admin/kas', label: 'Kas & uitbetalingen' },
      { href: '/admin/tarieven', label: 'Tarieven' },
      { href: '/admin/monteurtarieven', label: 'Monteurtarieven' },
    ],
  },
  {
    label: 'Rapporten',
    icon: BarChart3,
    children: [
      { href: '/admin/rapport', label: 'Prestaties' },
      { href: '/admin/winst', label: 'Winst & verbruik' },
      { href: '/admin/rapportage', label: 'Rapportage' },
      { href: '/admin/attributie', label: 'Advertentieklikken' },
    ],
  },
  { label: 'Netwerk', icon: MessageSquare, href: '/admin/netwerk' },
  { label: 'Instellingen', icon: Settings, href: '/admin/instellingen' },
];

const MONTEUR_NAV: NavItem[] = [
  { label: 'Overzicht', icon: LayoutDashboard, href: '/admin/overzicht' },
  { label: 'Vandaag', icon: Truck, href: '/admin/vandaag' },
  { label: 'Aanbod', icon: Handshake, href: '/admin/aanbod' },
  { label: 'Mijn agenda', icon: CalendarDays, href: '/admin/mijn-agenda' },
  { label: 'Mijn klussen', icon: History, href: '/admin/mijn-klussen' },
  { label: 'Mijn bus', icon: Package, href: '/admin/mijn-bus' },
  {
    label: 'Geld',
    icon: Euro,
    children: [
      { href: '/admin/mijn-saldo', label: 'Saldo' },
      { href: '/admin/facturen', label: 'Facturen' },
      { href: '/admin/uitgaven', label: 'Mijn uitgaven' },
    ],
  },
  { label: 'Mijn vak', icon: BadgeCheck, href: '/admin/mijn-vak' },
  { label: 'Profiel', icon: CircleUser, href: '/admin/mijn-profiel' },
];

function allHrefs(nav: NavItem[]): string[] {
  return nav.flatMap((i) => (i.children ? i.children.map((c) => c.href) : i.href ? [i.href] : []));
}

export default function AdminNav({ role }: { role: CrmRole | null }) {
  const pathname = usePathname() ?? '';
  const nav = role === 'monteur' ? MONTEUR_NAV : OFFICE_NAV;

  /*
   * The most specific match wins, so /admin/jobs/nieuw lights up
   * "Klus inplannen" and not "Agenda", while /admin/jobs/123 still lights up
   * "Agenda".
   */
  const active =
    allHrefs(nav)
      .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
      .sort((a, b) => b.length - a.length)[0] ?? null;

  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  return (
    <nav className={styles.nav} aria-label="Hoofdmenu">
      {nav.map((item) => {
        const Icon = item.icon;

        if (!item.children) {
          const on = item.href === active;
          return (
            <Link
              key={item.label}
              href={item.href!}
              aria-current={on ? 'page' : undefined}
              className={on ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span className={styles.navLabel}>{item.label}</span>
              {item.ai && <span className={styles.navAi}>AI</span>}
            </Link>
          );
        }

        const childOn = item.children.some((c) => c.href === active);
        const open = toggled[item.label] ?? childOn;
        return (
          <div key={item.label}>
            <button
              type="button"
              className={childOn ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
              aria-expanded={open}
              onClick={(e) => {
                // The mobile drawer closes on any click inside it; opening a
                // group is not a navigation, so keep the drawer open.
                e.stopPropagation();
                setToggled((t) => ({ ...t, [item.label]: !open }));
              }}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span className={styles.navLabel}>{item.label}</span>
              {open ? (
                <ChevronDown size={16} className={styles.navChevron} aria-hidden="true" />
              ) : (
                <ChevronRight size={16} className={styles.navChevron} aria-hidden="true" />
              )}
            </button>
            {open && (
              <div className={styles.navSub}>
                {item.children.map((c) => {
                  const on = c.href === active;
                  return (
                    <Link
                      key={c.href}
                      href={c.href}
                      aria-current={on ? 'page' : undefined}
                      className={on ? `${styles.navSubLink} ${styles.navSubLinkActive}` : styles.navSubLink}
                    >
                      {c.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
