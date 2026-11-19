'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setPayoutStatus } from './actions';
import styles from '../admin.module.css';

export default function PayoutActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function act(status: 'paid' | 'rejected') {
    setBusy(true);
    setError('');
    const result = await setPayoutStatus(id, status);
    setBusy(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className={styles.rowActions}>
        <button className={styles.ghostBtn} disabled={busy} onClick={() => act('rejected')}>
          Afwijzen
        </button>
        <button className={styles.primaryBtn} disabled={busy} onClick={() => act('paid')}>
          Markeer betaald
        </button>
      </div>
      {error && <p className={`${styles.note} ${styles.noteBad}`}>{error}</p>}
    </div>
  );
}
