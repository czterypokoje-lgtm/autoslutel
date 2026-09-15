'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { markSold, deleteListing } from './actions';
import styles from './marktplaats.module.css';

export default function ListingActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(fn: (id: string) => Promise<{ ok: true } | { error: string }>) {
    setBusy(true);
    const result = await fn(id);
    setBusy(false);
    if ('error' in result) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className={styles.cardActions}>
      <button className={styles.act} disabled={busy} onClick={() => act(markSold)}>
        Markeer verkocht
      </button>
      <button
        className={styles.act}
        disabled={busy}
        onClick={() => {
          if (confirm('Deze advertentie verwijderen?')) act(deleteListing);
        }}
      >
        Verwijderen
      </button>
    </div>
  );
}
