'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, KeyRound, Menu, Search, X } from 'lucide-react';
import styles from './admin.module.css';
import AdminNav from './AdminNav';
import SignOutButton from './SignOutButton';
import type { CrmRole } from '@/lib/crmSession';

/**
 * The sidebar, and the phone-width behaviour it needs and desktop never does.
 *
 * What stood here before tried to survive on a phone by turning each nav
 * group into its own horizontally-scrolling row — three separate strips
 * ("Leads Aanbod Age…", "Bestellingen Producten", "Klanten Kas Rappo…"),
 * each cut off mid-word with no hint that swiping revealed the rest. It read
 * as broken, not scrollable. Below the breakpoint the whole nav — every
 * group, every label, exactly as desktop sees it — now lives in one
 * slide-in drawer behind a hamburger, closing itself the moment a link
 * inside it is tapped.
 */
export default function Sidebar({
  role,
  email,
  initials,
  photoUrl,
}: {
  role: CrmRole | null;
  email: string | null;
  initials: string;
  /** technicians.photo_url; null for an office account, which has no row. */
  photoUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandRow}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={() => setOpen(true)}
          aria-label="Menu openen"
        >
          <Menu size={20} strokeWidth={2} />
        </button>

        <Link href="/admin" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <KeyRound size={13} strokeWidth={2.2} />
          </span>
          Autosleutel24
        </Link>

        {/*
          The search field lives on the page that has something to search,
          not up here — this is the way in to it, so the shortcut sits in
          the same place on every screen.
        */}
        <Link href="/admin/klanten" className={styles.iconGhost} title="Zoeken">
          <Search size={16} strokeWidth={1.9} aria-hidden="true" />
        </Link>

        <Link href="/admin/mijn-profiel" className={styles.avatar} title={email ?? 'Profiel'}>
          {photoUrl ? (
            /*
              Plain <img>, not next/image: the file sits in blob storage under
              a URL the office can change at any time, and routing it through
              the optimiser would need that host allow-listed in next.config
              for a 28px circle.
            */
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className={styles.avatarPhoto} />
          ) : (
            initials
          )}
        </Link>
      </div>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      {/* Closes on any click inside — a tapped nav link included — without
          AdminNav needing to know a drawer exists at all. */}
      <div
        className={`${styles.navDrawer} ${open ? styles.navDrawerOpen : ''}`}
        onClick={() => setOpen(false)}
      >
        <button
          type="button"
          className={styles.drawerClose}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
          aria-label="Menu sluiten"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className={styles.navWrapper}>
          <AdminNav role={role} />
        </div>

        <div className={styles.sidebarBottom}>
          <a
            className={styles.navLink}
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="De site openen zoals een bezoeker hem ziet"
          >
            <ExternalLink size={16} strokeWidth={1.9} aria-hidden="true" />
            Site bekijken
          </a>

          <SignOutButton />

          <div className={styles.who}>
            {role && <span className={styles.role}>{role}</span>}
            <span className={styles.whoEmail}>{email}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
