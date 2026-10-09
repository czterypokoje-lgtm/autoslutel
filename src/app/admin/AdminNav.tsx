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
import { DEFAULT_CRM_LOCALE, type CrmLocale } from '@/lib/crmLocale';
import { t, type Phrase } from './_i18n';
import { NAV } from './_i18n/shell';

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
  label: string | Phrase;
}

interface NavItem {
  label: string | Phrase;
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

/*
 * The monteur's nav carries phrases rather than strings, because this is the
 * one nav a German partner reads. The office nav above stays Dutch on purpose
 * — see the note in _i18n/shell.ts.
 */
const MONTEUR_NAV: NavItem[] = [
  { label: NAV.overzicht, icon: LayoutDashboard, href: '/admin/overzicht' },
  { label: NAV.vandaag, icon: Truck, href: '/admin/vandaag' },
  { label: NAV.aanbod, icon: Handshake, href: '/admin/aanbod' },
  { label: NAV.mijnAgenda, icon: CalendarDays, href: '/admin/mijn-agenda' },
  { label: NAV.mijnKlussen, icon: History, href: '/admin/mijn-klussen' },
  {
    label: NAV.mijnBus,
    icon: Package,
    children: [
      { href: '/admin/mijn-bus', label: NAV.watErinLigt },
      { href: '/admin/bestellen', label: NAV.onderdelenBestellen },
    ],
  },
  {
    label: NAV.geld,
    icon: Euro,
    children: [
      { href: '/admin/mijn-saldo', label: NAV.saldo },
      { href: '/admin/facturen', label: NAV.facturen },
      { href: '/admin/uitgaven', label: NAV.mijnUitgaven },
    ],
  },
  { label: NAV.mijnVak, icon: BadgeCheck, href: '/admin/mijn-vak' },
  { label: NAV.profiel, icon: CircleUser, href: '/admin/mijn-profiel' },
];

function allHrefs(nav: NavItem[]): string[] {
  return nav.flatMap((i) => (i.children ? i.children.map((c) => c.href) : i.href ? [i.href] : []));
}

export default function AdminNav({
  role,
  locale = DEFAULT_CRM_LOCALE,
}: {
  role: CrmRole | null;
  /** The reader's own language. Office screens pass nothing and get Dutch. */
  locale?: CrmLocale;
}) {
  const pathname = usePathname() ?? '';
  const nav = role === 'monteur' ? MONTEUR_NAV : OFFICE_NAV;
  /** A nav label is either a plain Dutch string (office) or a phrase. */
  const label = (value: string | Phrase) =>
    typeof value === 'string' ? value : t(value, locale);
  /*
   * React keys and the open-group state key off this, not off the label.
   * A translated label is not a stable identity: keying the open/closed state
   * by it would collapse every group the moment somebody switches language.
   */
  const navKey = (item: NavItem) =>
    item.href ?? item.children?.[0]?.href ?? label(item.label);

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
              key={navKey(item)}
              href={item.href!}
              aria-current={on ? 'page' : undefined}
              className={on ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span className={styles.navLabel}>{label(item.label)}</span>
              {item.ai && <span className={styles.navAi}>AI</span>}
            </Link>
          );
        }

        const childOn = item.children.some((c) => c.href === active);
        const open = toggled[navKey(item)] ?? childOn;
        return (
          <div key={navKey(item)}>
            <button
              type="button"
              className={childOn ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
              aria-expanded={open}
              onClick={(e) => {
                // The mobile drawer closes on any click inside it; opening a
                // group is not a navigation, so keep the drawer open.
                e.stopPropagation();
                setToggled((prev) => ({ ...prev, [navKey(item)]: !open }));
              }}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span className={styles.navLabel}>{label(item.label)}</span>
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
                      {label(c.label)}
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
