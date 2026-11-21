'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import {
  AudioLines, BarChart3, Boxes, CalendarDays, ChevronRight, Euro, Inbox, KeyRound, LayoutDashboard, LogOut, Package, PackageCheck, PhoneCall, Search,
  Settings, ShoppingCart, Users, type LucideIcon,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarProvider, SidebarRail, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { StaffChat } from './StaffChat';
import { LanguageToggle, usePreviewLanguage } from './PreviewLanguage';
import type { CrmRole } from '@/lib/crmSession';
import { BRAND, IS_KEYFORCARS, WAREHOUSE } from '@/config/install';
import { MONTEUR_NAV, OFFICE_NAV, type NavItem } from './AdminNav';
import MobileTabBar from './MobileTabBar';
import styles from './admin.module.css';

/*
 * The KeyForCars shell: shadcn sidebar + header, modelled on the Kiranism
 * dashboard starter. Office roles see everything; warehouse and picker see
 * the stock and purchasing group only, so a link they may not open is not
 * shown to them in the first place.
 */

type Item = { label: string; href?: string; icon: LucideIcon; children?: { label: string; href: string }[]; office?: boolean };
type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: 'Overzicht',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/overzicht', office: true },
      { label: 'Bestellingen', icon: ShoppingCart, href: '/admin/orders', office: true },
      { label: 'Klanten', icon: Users, href: '/admin/klanten', office: true },
      { label: 'Werkplaatsagenda', icon: CalendarDays, href: '/admin/agenda' },
    ],
  },
  {
    label: 'Magazijn',
    items: [
      {
        label: 'Voorraad', icon: Boxes, children: [
          { label: 'Artikelen', href: '/admin/voorraad' },
          { label: 'Productzoeker', href: '/admin/voorraad/p' },
          { label: 'Bestelvoorstel', href: '/admin/voorraad?view=reorder' },
          { label: 'Voorraadrapporten', href: '/admin/voorraad?view=reports' },
          { label: 'Voorraadlogboek', href: '/admin/voorraad?view=journal' },
        ],
      },
      { label: 'Picklijst', icon: PackageCheck, href: '/admin/bestellingen/picken' },
      { label: 'Inkoop', icon: Package, href: '/admin/inkoop' },
    ],
  },
  {
    label: 'Kantoor',
    items: [
      { label: 'Leads', icon: Inbox, href: '/admin/leads', office: true },
      { label: 'Agentcentrum', icon: AudioLines, office: true, children: [
        { label: 'Spraakgesprekken', href: '/admin/bot-conversations?channel=phone' },
        { label: 'WhatsApp-gesprekken', href: '/admin/bot-conversations?channel=whatsapp' },
        { label: 'Alle botgesprekken', href: '/admin/bot-conversations' },
      ] },
      { label: 'Gesprekken', icon: PhoneCall, href: '/admin/gesprekken', office: true },
      {
        label: 'Geld', icon: Euro, office: true, children: [
          { label: 'Financieel overzicht', href: '/admin/financien' },
          { label: 'Facturen', href: '/admin/facturen' },
          { label: 'Uitgaven', href: '/admin/uitgaven' },
          { label: 'Bank', href: '/admin/bank/transacties' },
        ],
      },
      {
        label: 'Rapporten', icon: BarChart3, office: true, children: [
          { label: 'Best verkocht', href: '/admin/best-verkocht' },
          { label: 'Winst & verbruik', href: '/admin/winst' },
          { label: 'Prestaties', href: '/admin/rapport' },
          { label: 'Advertentieklikken', href: '/admin/attributie' },
        ],
      },
      { label: 'Instellingen', icon: Settings, href: '/admin/instellingen', office: true },
    ],
  },
];

/** Autosleutel24 keeps its own menus (AdminNav) and only borrows the shell; monteurs get theirs. */
const fromNav = (label: string, nav: NavItem[]): Group[] => [{ label, items: nav.map((item) => ({ label: item.label, icon: item.icon, href: item.href, children: item.children })) }];
const AUTOSLEUTEL_OFFICE = fromNav('Kantoor', OFFICE_NAV);
const AUTOSLEUTEL_MONTEUR = fromNav('Monteur', MONTEUR_NAV);

/**
 * Autosleutel24 with CRM_WAREHOUSE=1: the same Magazijn block KeyForCars has
 * (stock ledger, pick list, purchasing; shipping is appended per role below),
 * the agent centre, and the finance, bank and webshop-margin entries folded
 * into the existing Geld and Rapporten menus. The old store-and-vans stock
 * keeps its place under Voorraad at its new address.
 */
const withWarehouse = (groups: Group[]): Group[] => {
  const [kantoor] = groups;
  const items = kantoor.items.map((item) => {
    if (item.label === 'Voorraad') return { ...item, children: [{ label: 'Magazijn en bussen', href: '/admin/voorraad/bussen' }, ...(item.children ?? []).filter((child) => child.href !== '/admin/voorraad')] };
    if (item.label === 'Geld') return { ...item, children: [{ label: 'Financieel overzicht', href: '/admin/financien' }, ...(item.children ?? []), { label: 'Bank', href: '/admin/bank/transacties' }] };
    if (item.label === 'Rapporten') return { ...item, children: [...(item.children ?? []), { label: 'Webshopmarge', href: '/admin/winst/webshop' }] };
    return item;
  });
  const agentCentre = GROUPS.flatMap((group) => group.items).find((item) => item.label === 'Agentcentrum');
  const magazijn = GROUPS.find((group) => group.label === 'Magazijn')!;
  return [{ label: 'Kantoor', items: agentCentre ? [...items, agentCentre] : items }, magazijn];
};
const AUTOSLEUTEL_OFFICE_WAREHOUSE = withWarehouse(AUTOSLEUTEL_OFFICE);

const TITLES: Record<string, string> = {
  overzicht: 'Dashboard', orders: 'Bestellingen', klanten: 'Klanten', voorraad: 'Voorraad', inkoop: 'Inkoop', leads: 'Leads',
  'bot-conversations': 'ElevenLabs-gesprekken', gesprekken: 'Gesprekken', financien: 'Financieel overzicht', facturen: 'Facturen', uitgaven: 'Uitgaven', bank: 'Bank', 'best-verkocht': 'Best verkocht', winst: 'Winst & verbruik',
  rapport: 'Prestaties', attributie: 'Advertentieklikken', instellingen: 'Instellingen', budget: 'AI-budget', 'agent-centrum': 'Agentcentrum', p: 'Productzoeker', nieuw: 'Nieuw', lijst: 'Alle leads', jobs: 'Planning',
  verzending: 'Verzending', agenda: 'Werkplaatsagenda', verzendinstellingen: 'Verzendinstellingen', bestellingen: 'Bestellingen', picken: 'Picklijst',
  bussen: 'Magazijn en bussen', webshop: 'Webshopmarge',
  // Autosleutel24 screens
  aanbod: 'Aanbod', biedingen: 'Biedingen', vandaag: 'Vandaag', monteurs: 'Monteurs', bestellen: 'Onderdelen bestellen', kas: 'Kas & uitbetalingen',
  tarieven: 'Tarieven', monteurtarieven: 'Monteurtarieven', rapportage: 'Rapportage', 'whatsapp-advertenties': 'WhatsApp en advertenties', 'whatsapp-analyse': 'WhatsApp-analyse', klikfraude: 'Klikfraude',
  live: 'Live', kantoor: 'Kantoor', netwerk: 'Netwerk', 'mijn-agenda': 'Mijn agenda', 'mijn-klussen': 'Mijn klussen', 'mijn-bus': 'Mijn bus', 'mijn-saldo': 'Saldo',
  'mijn-vak': 'Mijn vak', 'mijn-profiel': 'Profiel',
};

/** The stock screens use the camera, which needs a full page load for its Permissions-Policy. */
const fullLoad = (href: string) => /^\/admin\/voorraad(?:[/?]|$)/.test(href);

function matches(pathname: string, view: string | null, href: string, channel: string | null = null) {
  const [path, query] = href.split('?');
  if (path === '/admin/bot-conversations') return pathname === path && (query ? query === 'channel=' + channel : !channel);
  if (query) return pathname === path && query === `view=${view}`;
  if (path === '/admin/verzending') return pathname === path && !view;
  if (path === '/admin/voorraad') return pathname === path && !view;
  return pathname === path || pathname.startsWith(`${path}/`);
}

function CloseMobileSidebar({ location }: { location: string }) {
  const { setOpenMobile } = useSidebar();
  useEffect(() => { setOpenMobile(false); }, [location, setOpenMobile]);
  return null;
}

export default function KfcShell({ children, role, email, initials, photoUrl, fontClass = '', shippingTest = false }: {
  children: ReactNode; role: CrmRole | null; email: string | null; initials: string; photoUrl: string | null; fontClass?: string; shippingTest?: boolean;
}) {
  // Radix portals (mobile menu sheet, dialogs, dropdowns) render on <body>, outside the shell div:
  // the class on body makes the kfc.css resets and tokens reach them too.
  useEffect(() => { document.body.classList.add('kfc-shell'); return () => document.body.classList.remove('kfc-shell'); }, []);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  const pathname = usePathname() ?? '';
  const params = useSearchParams();
  const view = params?.get('view') ?? null;
  const channel = params?.get('channel') ?? null;
  const { t, english } = usePreviewLanguage();
  const office = role === 'owner' || role === 'kantoor';
  const crumbs = pathname === '/admin/verzending/nieuw' ? ['Verzending', 'Zending maken'] : pathname.replace(/^\/admin\/?/, '').split('/').filter((part) => TITLES[part]).map((part) => TITLES[part]);
  const shippingPages = [
    ...(office ? [{ label: 'Zending maken', href: '/admin/verzending/nieuw' }] : []),
    ...(shippingTest ? [{ label: 'Verzendwachtrij', href: '/admin/verzending' }] : []),
    ...(office ? [{ label: 'Verzendinstellingen', href: '/admin/verzendinstellingen' }] : []),
  ];
  const shipping: Group = {
    label: 'Verzending',
    items: shippingPages.length ? [{ label: 'Verzending', icon: PackageCheck, children: shippingPages }] : [],
  };
  const groups = IS_KEYFORCARS ? GROUPS : role === 'monteur' ? AUTOSLEUTEL_MONTEUR : WAREHOUSE ? AUTOSLEUTEL_OFFICE_WAREHOUSE : AUTOSLEUTEL_OFFICE;
  const visible = groups.flatMap((group) => {
    const items = group.items.filter((item) => office || !item.office);
    if (WAREHOUSE && group.label === 'Kantoor' && role === 'owner') {
      items.push({ label: 'AI-budget', href: '/admin/instellingen/budget', icon: Euro });
    }
    const current = { ...group, items };
    return WAREHOUSE && group.label === 'Magazijn' ? [current, shipping] : [current];
  }).filter((group) => group.items.length);

  const destinations = visible.flatMap((group) => group.items.flatMap((item) =>
    item.children ?? (item.href ? [{ href: item.href, label: item.label }] : []),
  )).filter(({ label }) => (label + ' ' + t(label)).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  const navLink = (href: string, label: string, Icon?: LucideIcon) => {
    const inner = <>{Icon && <Icon />}<span>{t(label)}</span></>;
    return fullLoad(href) ? <a href={href}>{inner}</a> : <Link href={href}>{inner}</Link>;
  };

  return (
    <SidebarProvider className={`kfc-shell min-h-svh ${fontClass}`}>
      <CloseMobileSidebar location={pathname + "?" + (view ?? "")} />
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/admin/overzicht">
                  <div className="kfc-brand-mark flex aspect-square size-8 items-center justify-center rounded-lg">
                    <KeyRound className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{BRAND.name}</span>
                    <span className="text-muted-foreground truncate text-xs">CRM</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {visible.map((group) => (
            <SidebarGroup key={group.label}>
              {group.label !== 'Verzending' && <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>}
              <SidebarMenu>
                {group.items.map((item) => {
                  if (!item.children) {
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton asChild isActive={matches(pathname, view, item.href!)} tooltip={t(item.label)}>
                          {navLink(item.href!, item.label, item.icon)}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }
                  const Icon = item.icon;
                  const childOn = item.children.some((child) => matches(pathname, view, child.href, channel));
                  return (
                    <Collapsible key={item.label} asChild defaultOpen={childOn} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={t(item.label)} isActive={childOn}>
                            <Icon /><span>{t(item.label)}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton asChild isActive={matches(pathname, view, child.href)}>
                                  {navLink(child.href, child.label)}
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                    <Avatar className="size-8 rounded-lg">
                      {photoUrl && <AvatarImage src={photoUrl} alt="" />}
                      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{email ?? ''}</span>
                      <span className="text-muted-foreground truncate text-xs">{role ?? ''}</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="min-w-56 rounded-lg">
                  <DropdownMenuLabel className="truncate text-xs font-normal">{email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/admin/instellingen"><Settings />{t('Instellingen')}</Link></DropdownMenuItem>
                  <DropdownMenuItem onSelect={async () => { await fetch('/admin/auth/signout', { method: 'POST' }); window.location.href = '/admin/login'; }}>
                    <LogOut />{english ? 'Sign out' : 'Uitloggen'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="kfc-workspace min-w-0">
        <header className="kfc-toolbar flex min-h-14 shrink-0 items-center gap-2 border-b px-3 md:px-5">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block"><Link href="/admin/overzicht">{BRAND.name}</Link></BreadcrumbItem>
              {crumbs.map((crumb, index) => (
                <span key={crumb} className="contents">
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>{index === crumbs.length - 1 ? <BreadcrumbPage>{t(crumb)}</BreadcrumbPage> : <span>{t(crumb)}</span>}</BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <Dialog open={searchOpen} onOpenChange={(open) => { setSearchOpen(open); if (!open) setSearch(''); }}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" aria-label={english ? 'Find a page' : 'Pagina zoeken'}>
                  <Search aria-hidden="true" /> <span className="hidden lg:inline">{english ? 'Find a page' : 'Pagina zoeken'}</span>
                  <kbd className="text-muted-foreground hidden rounded border px-1 text-[10px] md:inline">Ctrl K</kbd>
                </Button>
              </DialogTrigger>
              <DialogContent className="kfc-page-search">
                <DialogHeader>
                  <DialogTitle>{english ? 'Find a page' : 'Pagina zoeken'}</DialogTitle>
                  <DialogDescription>{english ? `Open a page in ${BRAND.name}.` : `Open een pagina in ${BRAND.name}.`}</DialogDescription>
                </DialogHeader>
                <Input type="search" autoFocus value={search} onChange={(event) => setSearch(event.target.value)} aria-label={english ? 'Page name' : 'Paginanaam'} />
                <div className="grid max-h-60 gap-1 overflow-y-auto">
                  {destinations.map(({ href, label }) => (
                    <Button key={href} asChild variant="ghost" className="justify-start" onClick={() => { setSearchOpen(false); setSearch(''); }}>
                      {navLink(href, label)}
                    </Button>
                  ))}
                  {destinations.length === 0 && <p role="status" className="text-muted-foreground px-2 py-3 text-sm">{t('Geen resultaten')}</p>}
                </div>
              </DialogContent>
            </Dialog>
            {IS_KEYFORCARS && <LanguageToggle inline />}
          </div>
        </header>
        {/* `crm crm-keyforcars` keeps theme.css variables alive for pages not yet rebuilt on shadcn. */}
        <main className={`crm crm-keyforcars kfc-content flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6 ${role === 'monteur' ? styles.mainWithTabBar : ''}`} data-appearance="studio">{children}</main>
      </SidebarInset>
      {/* Autosleutel24 monteurs keep their thumb bar (Vandaag · Mijn bus · Aanbod · Mijn agenda) on phones. */}
      {role === 'monteur' && <MobileTabBar />}
      {WAREHOUSE && role && ['owner', 'kantoor', 'magazijn', 'inpak'].includes(role) && <StaffChat office={office} />}
    </SidebarProvider>
  );
}
