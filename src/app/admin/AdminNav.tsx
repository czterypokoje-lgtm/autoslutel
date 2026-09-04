'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';
import type { CrmRole } from '@/lib/crmSession';

const OFFICE_LINKS = [
  {
    group: 'Sales & Planning',
    items: [
      { href: '/admin/leads', label: 'Leads' },
      { href: '/admin/jobs', label: 'Agenda' },
      { href: '/admin/vandaag', label: 'Vandaag' },
    ],
  },
  {
    group: 'Webshop',
    items: [
      { href: '/admin/orders', label: 'Bestellingen' },
      { href: '/admin/producten', label: 'Producten' },
    ],
  },
  {
    group: 'Beheer',
    items: [
      { href: '/admin/klanten', label: 'Klanten' },
      { href: '/admin/kas', label: 'Kas' },
      { href: '/admin/rapportage', label: 'Rapportage' },
      { href: '/admin/monteurs', label: 'Monteurs' },
      { href: '/admin/instellingen', label: 'Instellingen' },
      { href: '/admin/mijn-profiel', label: 'Profiel' },
    ],
  },
];

const MONTEUR_LINKS = [
  {
    group: 'Werk',
    items: [
      { href: '/admin/vandaag', label: 'Vandaag' },
      { href: '/admin/mijn-agenda', label: 'Mijn agenda' },
      { href: '/admin/mijn-profiel', label: 'Profiel' },
    ],
  },
];

const GenericIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginRight: 10, verticalAlign: 'text-bottom' }}
  >
    <path d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

export default function AdminNav({ role }: { role: CrmRole | null }) {
  const pathname = usePathname();
  const links = role === 'monteur' ? MONTEUR_LINKS : OFFICE_LINKS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {links.map((group) => (
        <div key={group.group}>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 700,
              color: 'var(--crm-muted)',
              marginBottom: '8px',
              paddingLeft: '12px',
            }}
          >
            {group.group}
          </div>
          <nav className={styles.nav}>
            {group.items.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={
                  pathname?.startsWith(href)
                    ? `${styles.navLink} ${styles.navLinkActive}`
                    : styles.navLink
                }
              >
                <GenericIcon />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      ))}
    </div>
  );
}
