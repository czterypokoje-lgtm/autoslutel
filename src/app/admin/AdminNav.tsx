'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  Landmark,
  LayoutDashboard,
  MessageSquare,
  Package,
  PhoneCall,
  Plug,
  Settings,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import styles from './admin.module.css';
import { usePreviewLanguage } from './PreviewLanguage';
import { IS_KEYFORCARS, WAREHOUSE, installServes } from '@/config/install';
import type { CrmRole } from '@/lib/crmSession';
import { inventoryHref, inventoryView } from './voorraad/inventoryViews';

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

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  /** Marks a screen whose content comes from the AI agent. */
  ai?: boolean;
  children?: Leaf[];
}

export const reportLinks = [
  { label: 'Prestaties', href: '/admin/rapport' },
  { label: 'Winst & verbruik', href: '/admin/winst' },
  { label: 'Rapportage', href: '/admin/rapportage' },
  { label: 'Advertentieklikken', href: '/admin/attributie' },
  { label: 'WhatsApp en advertenties', href: '/admin/whatsapp-advertenties' },
  { label: 'WhatsApp-analyse', href: '/admin/whatsapp-analyse' },
  { label: 'Klikfraude', href: '/admin/klikfraude' },
  { label: 'Live', href: '/admin/live' },
  { label: 'Kantoor', href: '/admin/kantoor' },
  { label: 'Verkoop & diensten', href: '/admin/rapport/verkoop' },
  { label: 'Voorraadstand', href: '/admin/rapport/voorraad', warehouse: true },
  { label: 'Voorraadbewegingen', href: '/admin/rapport/voorraadbewegingen', warehouse: true },
  { label: 'Webshopmarge', href: '/admin/winst/webshop', warehouse: true },
  { label: 'Alle rapporten', href: '/admin/rapporten' },
].filter(link => (!link.warehouse || WAREHOUSE) && installServes(link.href));

export const OFFICE_NAV: NavItem[] = [
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
  // One merged reports page with tabs; the detail pages are linked from inside it.
  { label: 'Rapporten', icon: BarChart3, children: reportLinks },
  { label: 'Netwerk', icon: MessageSquare, href: '/admin/netwerk' },
  { label: 'Instellingen', icon: Settings, href: '/admin/instellingen' },
];

export const MONTEUR_NAV: NavItem[] = [
  { label: 'Overzicht', icon: LayoutDashboard, href: '/admin/overzicht' },
  { label: 'Vandaag', icon: Truck, href: '/admin/vandaag' },
  { label: 'Aanbod', icon: Handshake, href: '/admin/aanbod' },
  { label: 'Mijn agenda', icon: CalendarDays, href: '/admin/mijn-agenda' },
  { label: 'Mijn klussen', icon: History, href: '/admin/mijn-klussen' },
  {
    label: 'Mijn bus',
    icon: Package,
    children: [
      { href: '/admin/mijn-bus', label: 'Wat erin ligt' },
      { href: '/admin/bestellen', label: 'Onderdelen bestellen' },
    ],
  },
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

/**
 * KeyForCars's install: three web shops and one warehouse, no technicians.
 * Every other screen answers 404 there (src/config/install.ts).
 */
const KEYFORCARS_NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/overzicht' },
  { label: 'Leads', icon: Inbox, href: '/admin/leads' },
  { label: 'Gesprekken', icon: PhoneCall, href: '/admin/gesprekken', ai: true },
  {
    label: 'Planning',
    icon: CalendarDays,
    children: [
      { href: '/admin/jobs', label: 'Agenda' },
      { href: '/admin/jobs/nieuw', label: 'Klus inplannen' },
    ],
  },
  { label: 'Klanten', icon: Users, href: '/admin/klanten' },
  { label: 'Bestellingen', icon: Package, href: '/admin/orders' },
  { label: 'Verzending', icon: Truck, href: '/admin/verzending' },
  { label: 'Best verkocht', icon: BarChart3, href: '/admin/best-verkocht' },
  {
    label: 'Bank',
    icon: Landmark,
    children: [
      { href: '/admin/bank/rekeningen', label: 'Financiële rekeningen' },
      { href: '/admin/bank/transacties', label: 'Banktransacties' },
      { href: '/admin/bank/betalingen', label: 'Betalingen' },
      { href: '/admin/bank/verwacht', label: 'Verwachte betalingen' },
    ],
  },
  {
    label: 'Voorraad',
    icon: Boxes,
    children: [
      { href: '/admin/voorraad', label: 'Artikelen' },
      { href: '/admin/voorraad/p', label: 'Productzoeker' },
      { href: inventoryHref('reorder'), label: 'Bestelvoorstel' },
      { href: '/admin/inkoop', label: 'Inkoop' },
      { href: inventoryHref('reports'), label: 'Voorraadrapporten' },
      { href: inventoryHref('journal'), label: 'Voorraadlogboek' },
    ],
  },
  {
    label: 'Geld',
    icon: Euro,
    children: [
      { href: '/admin/facturen', label: 'Facturen' },
      { href: '/admin/uitgaven', label: 'Uitgaven' },
    ],
  },
  {
    label: 'Rapporten',
    icon: BarChart3,
    children: reportLinks,
  },
  { label: 'Integraties', icon: Plug, href: '/admin/integraties' },
  { label: 'Boekhoudtest', icon: BadgeCheck, href: '/admin/boekhoudtest' },
  { label: 'Instellingen', icon: Settings, href: '/admin/instellingen' },
];

/*
 * The stock screens use the camera, which needs the destination document's
 * own Permissions-Policy header — so they are opened as a full page load,
 * not a client-side navigation that would keep the previous page's policy.
 */
const fullLoad = (href: string) => /^\/admin\/voorraad(?:[/?]|$)/.test(href);

export default function AdminNav({ role }: { role: CrmRole | null }) {
  const { t } = usePreviewLanguage();
  const pathname = usePathname() ?? '';
  const query = useSearchParams();
  const demo = query?.get('demo') === '1';
  const nav = IS_KEYFORCARS ? KEYFORCARS_NAV : role === 'monteur' ? MONTEUR_NAV : OFFICE_NAV;

  /*
   * The most specific match wins, so /admin/jobs/nieuw lights up
   * "Klus inplannen" and not "Agenda", while /admin/jobs/123 still lights up
   * "Agenda".
   */
  const active = IS_KEYFORCARS && pathname === '/admin/voorraad' ? inventoryHref(inventoryView(query?.get('view'))) :
    allHrefs(nav)
      .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
      .sort((a, b) => b.length - a.length)[0] ?? null;

  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  return (
    <nav className={styles.nav} aria-label={t('Hoofdmenu')}>
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
              <span className={styles.navLabel}>{t(item.label)}</span>
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
              <span className={styles.navLabel}>{t(item.label)}</span>
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
                  const NavLink = fullLoad(c.href) ? 'a' : Link;
                  return (
                    <NavLink
                      key={c.href}
                      href={demo && fullLoad(c.href) ? `${c.href}${c.href.includes('?') ? '&' : '?'}demo=1` : c.href}
                      aria-current={on ? 'page' : undefined}
                      className={on ? `${styles.navSubLink} ${styles.navSubLinkActive}` : styles.navSubLink}
                    >
                      {t(c.label)}
                    </NavLink>
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
