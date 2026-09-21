import { redirect } from 'next/navigation';
import { getCrmUser } from '@/lib/crmSession';
import styles from '../admin.module.css';

export const metadata = {
  title: 'Master Products (PIM) | Autosleutel24',
};

export default async function PimPage() {
  const user = await getCrmUser();
  if (!user || !user.role || (user.role !== 'owner' && user.role !== 'kantoor')) {
    redirect('/admin/overzicht');
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.h1}>Master Products (PIM)</h1>
        <p className={styles.subtitle}>
          Beheer van alle sleutels, transponders en materialen met FCC ID's en OEM nummers.
        </p>
      </header>

      <div className={styles.panel}>
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', display: 'block' }}>
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#0f172a' }}>PIM Systeem in opbouw</h2>
          <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: 1.5 }}>
            De veritabanı (database) structuur is succesvol aangelegd in Supabase. Binnenkort kun je hier nieuwe producten toevoegen, FCC ID's beheren en kostprijzen invoeren.
          </p>
        </div>
      </div>
    </main>
  );
}
