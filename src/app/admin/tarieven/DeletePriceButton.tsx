'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deletePrice } from './actions';
import styles from './tarieven.module.css';

export default function DeletePriceButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm('Dit tarief verwijderen?')) return;
    setBusy(true);
    const result = await deletePrice(id);
    setBusy(false);
    if ('error' in result) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <button className={styles.ghostBtn} disabled={busy} onClick={remove}>
      Verwijderen
    </button>
  );
}
