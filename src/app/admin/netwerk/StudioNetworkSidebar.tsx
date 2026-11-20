'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Menu, Settings2, ShoppingBag } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PreviewText } from '../PreviewLanguage';

interface Server {
  id: string;
  name: string;
}

interface Channel {
  id: string;
  server_id: string;
  name: string;
  slug: string;
  type: string;
}

interface Group {
  title: string;
  type: string;
  prefix: string;
}

const SHUT_KEY = 'as24_netwerk_shut';

/**
 * Studio restyle of NetworkSidebar: same ?server= read, same localStorage
 * collapse state and the same mobile-drawer-vs-desktop-columns behaviour —
 * only the markup changes, onto shadcn Sheet/Button.
 */
export default function StudioNetworkSidebar({
  servers,
  isOffice,
  presence = {},
  groups,
  channels,
}: {
  servers: Server[];
  isOffice: boolean;
  presence?: Record<string, { online: number; members: number }>;
  groups: Group[];
  channels: Channel[];
}) {
  const searchParams = useSearchParams();
  const requested = searchParams.get('server');
  const active = useMemo(() => servers.find((s) => s.id === requested) ?? servers[0] ?? null, [servers, requested]);
  const visible = useMemo(() => (active ? channels.filter((c) => c.server_id === active.id) : []), [channels, active]);

  const [open, setOpen] = useState(false);
  const [shut, setShut] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = window.localStorage.getItem(SHUT_KEY);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  });

  function toggleGroup(type: string) {
    setShut((previous) => {
      const next = new Set(previous);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      try {
        window.localStorage.setItem(SHUT_KEY, JSON.stringify([...next]));
      } catch {
        // Private mode, storage blocked — the choice still holds for this visit.
      }
      return next;
    });
  }

  const content = (
    <div className="flex h-full">
      <div className="flex w-18 shrink-0 flex-col items-center gap-2 overflow-y-auto border-r bg-muted/30 py-3">
        {servers.map((server) => (
          <Link
            key={server.id}
            href={`/admin/netwerk?server=${server.id}`}
            title={`${server.name} — ${presence[server.id]?.online ?? 0} online van ${presence[server.id]?.members ?? 0}`}
            onClick={() => setOpen(false)}
            className={`relative flex size-11 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              active?.id === server.id ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
            }`}
          >
            {server.name.substring(0, 2).toUpperCase()}
            {(presence[server.id]?.online ?? 0) > 0 && (
              <span className="bg-emerald-500 text-white absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                {presence[server.id]?.online}
              </span>
            )}
          </Link>
        ))}

        {isOffice && (
          <Link
            href="/admin/netwerk/beheer"
            title="Servers en kanalen beheren"
            onClick={() => setOpen(false)}
            className="flex size-11 items-center justify-center rounded-full bg-background text-lg hover:bg-muted"
          >
            +
          </Link>
        )}
      </div>

      <div className="flex w-60 shrink-0 flex-col overflow-y-auto">
        <div className="flex items-center justify-between border-b px-4 py-3 font-medium">
          {active?.name ?? 'Netwerk'}
          {isOffice && (
            <Link href="/admin/netwerk/beheer" title="Beheren" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <Settings2 className="size-4" />
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-1 p-2">
          {active && (
            <div className="flex items-center justify-between px-2 py-1.5 text-xs">
              <span className="font-medium">{active.name}</span>
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                {`${presence[active.id]?.online ?? 0} online`}
                {presence[active.id]?.members ? ` · ${presence[active.id]?.members} leden` : ''}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            <div className="text-muted-foreground px-2 py-1 text-xs font-semibold tracking-wide uppercase"><PreviewText>Marktplaats</PreviewText></div>
            <Link
              href="/admin/netwerk/marktplaats"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
            >
              <ShoppingBag className="size-3.5" /> <PreviewText>Tools &amp; onderdelen</PreviewText>
            </Link>
          </div>

          {groups.map((group) => {
            const inGroup = visible.filter((channel) => channel.type === group.type);
            if (!inGroup.length) return null;
            const collapsed = shut.has(group.type);
            return (
              <div className="flex flex-col gap-0.5" key={group.type}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.type)}
                  aria-expanded={!collapsed}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold tracking-wide uppercase"
                >
                  <ChevronDown className={`size-3 transition-transform ${collapsed ? '-rotate-90' : ''}`} aria-hidden="true" />
                  {group.title}
                  <span className="text-muted-foreground ml-auto font-normal normal-case">{inGroup.length}</span>
                </button>
                {!collapsed &&
                  inGroup.map((channel) => (
                    <Link
                      key={channel.id}
                      href={`/admin/netwerk/${channel.id}`}
                      onClick={() => setOpen(false)}
                      className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm"
                    >
                      <span className="text-muted-foreground">{group.prefix}</span> {channel.name}
                    </Link>
                  ))}
              </div>
            );
          })}

          {visible.length === 0 && (
            <p className="text-muted-foreground p-4 text-xs">
              <PreviewText>Nog geen kanalen op deze server.</PreviewText>
              {isOffice && <PreviewText> Maak er een via het tandwiel hierboven.</PreviewText>}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="fixed top-3 left-3 z-40 md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Servers en kanalen"
      >
        <Menu className="size-4" />
        {active?.name ?? 'Netwerk'}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-auto max-w-none p-0 sm:max-w-none">
          <SheetTitle className="sr-only">Servers en kanalen</SheetTitle>
          {content}
        </SheetContent>
      </Sheet>

      <div className="hidden h-full border-r md:flex">{content}</div>
    </>
  );
}
