import { redirect } from 'next/navigation';
import { getCrmUser } from '@/lib/crmSession';
import styles from '../admin.module.css';

export const metadata = {
  title: 'Stok & Lokasyonlar | Autosleutel24',
};

export default async function VoorraadPage() {
  const user = await getCrmUser();
  if (!user || !user.role || (user.role !== 'owner' && user.role !== 'kantoor')) {
    redirect('/admin/overzicht');
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Stok & Lokasyonlar</h1>
        <p className={styles.subtitle}>
          Multi-location voorraadbeheer: Hoofdmagazijn, Bussen, Quarantaine en Uitval.
        </p>
      </header>

      <div className={styles.panel}>
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', display: 'block' }}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#0f172a' }}>Voorraad Systeem in opbouw</h2>
          <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: 1.5 }}>
            De veritabanı (database) tabellen voor de multi-locatie voorraad zijn actief. Hier komen de schermen voor voorraad-transfers en het traceren van verbruikte materialen per job.
          </p>
        </div>
      </div>
    </main>
  );
}
