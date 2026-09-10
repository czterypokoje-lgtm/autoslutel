'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Settings2, X } from 'lucide-react';
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
export default function NetworkSidebar({
  servers,
  active,
  isOffice,
  groups,
  channels,
}: {
  servers: Server[];
  active: Server | null;
  isOffice: boolean;
  groups: Group[];
  channels: Channel[];
}) {
  const [open, setOpen] = useState(false);

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
              title={server.name}
              onClick={() => setOpen(false)}
            >
              {server.name.substring(0, 2).toUpperCase()}
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
            {groups.map((group) => {
              const inGroup = channels.filter((channel) => channel.type === group.type);
              if (!inGroup.length) return null;
              return (
                <div className={styles.channelGroup} key={group.type}>
                  <div className={styles.groupTitle}>{group.title}</div>
                  {inGroup.map((channel) => (
                    <Link
                      key={channel.id}
                      href={`/admin/netwerk/${channel.id}`}
                      className={styles.channelLink}
                      onClick={() => setOpen(false)}
                    >
                      <span className={styles.hash}>{group.prefix}</span> {channel.name}
                    </Link>
                  ))}
                </div>
              );
            })}

            {channels.length === 0 && (
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
