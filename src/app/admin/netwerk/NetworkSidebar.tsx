'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Lock, Menu, Settings2, ShoppingBag, X } from 'lucide-react';
import styles from './netwerk.module.css';

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

/**
 * The two sidebars, plus the phone-width behaviour they need and desktop
 * never does.
 *
 * At 72px and 240px, the two fixed sidebars alone are 312px — on a 375px
 * phone that leaves 63px for the chat itself, before a single message is
 * drawn. Below the breakpoint both collapse into one slide-in drawer behind
 * a hamburger, the way Discord's and Slack's own phone apps work: pick a
 * channel, the drawer closes, the conversation gets the whole screen.
 *
 * A client component only because the drawer's open/closed state has to live
 * somewhere — the data underneath is still fetched server-side in
 * layout.tsx and handed down as props, so a channel link works before this
 * hydrates, same as the rest of this shell.
 */
const SHUT_KEY = 'as24_netwerk_shut';

export default function NetworkSidebar({
  servers,
  isOffice,
  presence = {},
  canEnter = true,
  groups,
  channels,
}: {
  servers: Server[];
  isOffice: boolean;
  /** Real online/member counts per server id, from chat_server_presence. */
  presence?: Record<string, { online: number; members: number }>;
  /** False for a starter monteur: channels are listed but not openable. */
  canEnter?: boolean;
  groups: Group[];
  channels: Channel[];
}) {
  /*
   * The open server comes from ?server=, falling back to the first one.
   *
   * It has to be read here rather than in the layout: a layout in the App
   * Router is never given searchParams, so the bubbles linked to
   * ?server=<id> and the channel list never changed. A monteur only ever has
   * one server anyway; this is what makes the office's switcher work.
   */
  const searchParams = useSearchParams();
  const requested = searchParams.get('server');
  const active = useMemo(
    () => servers.find((s) => s.id === requested) ?? servers[0] ?? null,
    [servers, requested]
  );
  const visible = useMemo(
    () => (active ? channels.filter((c) => c.server_id === active.id) : []),
    [channels, active]
  );

  const [open, setOpen] = useState(false);
  /*
   * Which groups are collapsed, remembered in this browser.
   *
   * Twenty make channels is a long sidebar, and a monteur who only ever
   * reads Problemen should not have to scroll past every marque each time.
   * Read lazily inside useState so the server render and the first client
   * render agree — reading localStorage during render directly would
   * mismatch and blank the list on hydration.
   */
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

  return (
    <>
      <button
        type="button"
        className={styles.mobileMenuBtn}
        onClick={() => setOpen(true)}
        aria-label="Servers en kanalen"
      >
        <Menu size={20} strokeWidth={2} />
        <span className={styles.mobileMenuLabel}>{active?.name ?? 'Netwerk'}</span>
      </button>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      <div className={`${styles.sidebars} ${open ? styles.sidebarsOpen : ''}`}>
        <button type="button" className={styles.drawerClose} onClick={() => setOpen(false)} aria-label="Sluiten">
          <X size={18} strokeWidth={2} />
        </button>

        <div className={styles.serversSidebar}>
          {servers.map((server) => (
            <Link
              key={server.id}
              href={`/admin/netwerk?server=${server.id}`}
              className={`${styles.serverBubble} ${active?.id === server.id ? styles.serverBubbleActive : ''}`}
              title={`${server.name} — ${presence[server.id]?.online ?? 0} online van ${
                presence[server.id]?.members ?? 0
              }`}
              onClick={() => setOpen(false)}
            >
              {server.name.substring(0, 2).toUpperCase()}
              {/*
                Only when somebody actually is online. A permanent "0 online"
                badge advertises an empty room; absence of a badge says the
                same thing without drawing the eye to it.
              */}
              {(presence[server.id]?.online ?? 0) > 0 && (
                <span className={styles.onlineDot}>{presence[server.id]?.online}</span>
              )}
            </Link>
          ))}

          {isOffice && (
            <Link
              href="/admin/netwerk/beheer"
              className={styles.serverBubble}
              title="Servers en kanalen beheren"
              onClick={() => setOpen(false)}
            >
              +
            </Link>
          )}
        </div>

        <div className={styles.channelsSidebar}>
          <div className={styles.serverHeader}>
            {active?.name ?? 'Netwerk'}
            {isOffice && (
              <Link href="/admin/netwerk/beheer" title="Beheren" className={styles.headerAction} onClick={() => setOpen(false)}>
                <Settings2 size={15} strokeWidth={1.9} />
              </Link>
            )}
          </div>

          <div className={styles.channelList}>
            {active && (
              <div className={styles.presenceBar}>
                <span className={styles.presenceName}>{active.name}</span>
                <span className={styles.presenceCount}>
                  <span className={styles.presenceLive} aria-hidden="true" />
                  {presence[active.id]?.online ?? 0} online
                  {presence[active.id]?.members
                    ? ` · ${presence[active.id]?.members} leden`
                    : ''}
                </span>
              </div>
            )}

            {!canEnter && (
              /*
                Shown once, above the list, rather than on every locked row:
                twenty repetitions of the same notice reads as a broken page,
                not an offer.
              */
              <div className={styles.proNotice}>
                <Lock size={13} strokeWidth={2.2} aria-hidden="true" />
                <div>
                  <strong>Alleen voor Pro en geverifieerde monteurs</strong>
                  <p>
                    U ziet welke kanalen er zijn en wie er online is. Meelezen en meepraten
                    hoort bij een Pro-account — vraag het kantoor om toegang.
                  </p>
                </div>
              </div>
            )}

            <div className={styles.channelGroup}>
              <div className={styles.groupTitle}>Marktplaats</div>
              <Link href="/admin/netwerk/marktplaats" className={styles.channelLink} onClick={() => setOpen(false)}>
                <ShoppingBag size={14} strokeWidth={2} style={{ marginRight: 6 }} /> Tools &amp; onderdelen
              </Link>
            </div>

            {groups.map((group) => {
              const inGroup = visible.filter((channel) => channel.type === group.type);
              if (!inGroup.length) return null;
              const collapsed = shut.has(group.type);
              return (
                <div className={styles.channelGroup} key={group.type}>
                  <button
                    type="button"
                    className={styles.groupToggle}
                    onClick={() => toggleGroup(group.type)}
                    aria-expanded={!collapsed}
                  >
                    <ChevronDown
                      size={12}
                      strokeWidth={2.5}
                      className={collapsed ? styles.caretShut : styles.caret}
                      aria-hidden="true"
                    />
                    {group.title}
                    <span className={styles.groupCount}>{inGroup.length}</span>
                  </button>
                  {!collapsed &&
                    inGroup.map((channel) =>
                      canEnter ? (
                        <Link
                          key={channel.id}
                          href={`/admin/netwerk/${channel.id}`}
                          className={styles.channelLink}
                          onClick={() => setOpen(false)}
                        >
                          <span className={styles.hash}>{group.prefix}</span> {channel.name}
                        </Link>
                      ) : (
                        /* Visible, and deliberately not a link. */
                        <span
                          key={channel.id}
                          className={styles.channelLocked}
                          title="Alleen voor Pro en geverifieerde monteurs"
                        >
                          <span className={styles.hash}>{group.prefix}</span> {channel.name}
                          <Lock size={11} strokeWidth={2.2} aria-hidden="true" />
                        </span>
                      )
                    )}
                </div>
              );
            })}

            {visible.length === 0 && (
              <p className={styles.groupTitle} style={{ padding: 'var(--sp-4)' }}>
                Nog geen kanalen op deze server.
                {isOffice && ' Maak er een via het tandwiel hierboven.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
