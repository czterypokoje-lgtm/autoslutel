'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { type ReactNode } from 'react';
import {
  BarChart3, Boxes, ChevronRight, Euro, Inbox, KeyRound, LayoutDashboard, LogOut, Package, PackageCheck, PhoneCall,
  Settings, ShoppingCart, Users, type LucideIcon,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
  SidebarProvider, SidebarRail, SidebarTrigger,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { usePreviewLanguage } from './PreviewLanguage';
import type { CrmRole } from '@/lib/crmSession';

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
      { label: 'Gesprekken', icon: PhoneCall, href: '/admin/gesprekken', office: true },
      {
        label: 'Geld', icon: Euro, office: true, children: [
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

const TITLES: Record<string, string> = {
  overzicht: 'Dashboard', orders: 'Bestellingen', klanten: 'Klanten', voorraad: 'Voorraad', inkoop: 'Inkoop', leads: 'Leads',
  gesprekken: 'Gesprekken', facturen: 'Facturen', uitgaven: 'Uitgaven', bank: 'Bank', 'best-verkocht': 'Best verkocht', winst: 'Winst & verbruik',
  rapport: 'Prestaties', attributie: 'Advertentieklikken', instellingen: 'Instellingen', p: 'Productzoeker', nieuw: 'Nieuw', jobs: 'Planning',
  bestellingen: 'Bestellingen', picken: 'Picklijst',
};

/** The stock screens use the camera, which needs a full page load for its Permissions-Policy. */
const fullLoad = (href: string) => /^\/admin\/voorraad(?:[/?]|$)/.test(href);

function matches(pathname: string, view: string | null, href: string) {
  const [path, query] = href.split('?');
  if (query) return pathname === path && query === `view=${view}`;
  if (path === '/admin/voorraad') return pathname === path && !view;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function KfcShell({ children, role, email, initials, photoUrl, fontClass = '' }: {
  children: ReactNode; role: CrmRole | null; email: string | null; initials: string; photoUrl: string | null; fontClass?: string;
}) {
  const pathname = usePathname() ?? '';
  const view = useSearchParams()?.get('view') ?? null;
  const { t, english } = usePreviewLanguage();
  const office = role === 'owner' || role === 'kantoor';
  const crumbs = pathname.replace(/^\/admin\/?/, '').split('/').filter((part) => TITLES[part]).map((part) => TITLES[part]);
  const visible = GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => office || !item.office) })).filter((group) => group.items.length);

  const navLink = (href: string, label: string, Icon?: LucideIcon) => {
    const inner = <>{Icon && <Icon />}<span>{t(label)}</span></>;
    return fullLoad(href) ? <a href={href}>{inner}</a> : <Link href={href}>{inner}</Link>;
  };

  return (
    <SidebarProvider className={`kfc-shell min-h-svh ${fontClass}`}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/admin/overzicht">
                  <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <KeyRound className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">KeyForCars</span>
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
              <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>
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
                  const childOn = item.children.some((child) => matches(pathname, view, child.href));
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
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block"><Link href="/admin/overzicht">KeyForCars</Link></BreadcrumbItem>
              {crumbs.map((crumb, index) => (
                <span key={crumb} className="contents">
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>{index === crumbs.length - 1 ? <BreadcrumbPage>{t(crumb)}</BreadcrumbPage> : <span>{t(crumb)}</span>}</BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        {/* `crm crm-keyforcars` keeps theme.css variables alive for pages not yet rebuilt on shadcn. */}
        <main className="crm crm-keyforcars flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6" data-appearance="studio">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
