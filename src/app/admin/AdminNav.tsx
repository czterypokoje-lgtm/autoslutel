'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';
import type { CrmRole } from '@/lib/crmSession';

/**
 * Orders, facturen and klanten arrive in later phases; they are not stubbed
 * here, because a nav item that opens an empty page is worse than one that is
 * not there yet.
 *
 * A monteur gets no navigation at all. Their screen is one page by design, and
 * every office link would only lead to "geen toegang".
 */
const OFFICE_LINKS = [
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/jobs', label: 'Agenda' },
  { href: '/admin/vandaag', label: 'Vandaag' },
  { href: '/admin/orders', label: 'Bestellingen' },
  { href: '/admin/producten', label: 'Producten' },
  { href: '/admin/klanten', label: 'Klanten' },
  { href: '/admin/kas', label: 'Kas' },
  { href: '/admin/rapportage', label: 'Rapportage' },
  { href: '/admin/monteurs', label: 'Monteurs' },
  { href: '/admin/instellingen', label: 'Instellingen' },
  { href: '/admin/mijn-profiel', label: 'Profiel' },
];

/*
 * Two links, not none: the van screen is still the day's work, but a monteur
 * also has to be able to reach their own agenda to take a day off.
 */
const MONTEUR_LINKS = [
  { href: '/admin/vandaag', label: 'Vandaag' },
  { href: '/admin/mijn-agenda', label: 'Mijn agenda' },
  { href: '/admin/mijn-profiel', label: 'Profiel' },
];

export default function AdminNav({ role }: { role: CrmRole | null }) {
  const pathname = usePathname();

  if (role === 'monteur') {
    return (
      <nav className={styles.nav}>
        {MONTEUR_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={
              pathname?.startsWith(href)
                ? `${styles.navLink} ${styles.navLinkActive}`
                : styles.navLink
            }
          >
            {label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className={styles.nav}>
      {OFFICE_LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={
            pathname?.startsWith(href)
              ? `${styles.navLink} ${styles.navLinkActive}`
              : styles.navLink
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
