'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../klanten.module.css';

/**
 * The erasure request, as a button rather than as hand-written SQL.
 *
 * Two steps on purpose: a right-to-be-forgotten request is irreversible, and
 * a single misplaced click on the wrong customer is not something a backup
 * conversation can fix quickly.
 */
export default function EraseButton({ phone }: { phone: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  async function erase() {
    setBusy(true);
    setError('');

    const response = await fetch(
      `/api/admin/klanten/${encodeURIComponent(phone)}`,
      { method: 'DELETE' }
    ).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Verwijderen mislukt.');
      setBusy(false);
      return;
    }

    const body = await response.json();
    setResult(
      `${body.result?.leads_verwijderd ?? 0} aanvragen verwijderd, ` +
        `${body.result?.klussen_geanonimiseerd ?? 0} klussen geanonimiseerd.`
    );
    setBusy(false);
    router.refresh();
  }

  if (result) {
    return <p className={styles.note}>{result}</p>;
  }

  return (
    <>
      {armed ? (
        <button className={styles.dangerBtn} onClick={erase} disabled={busy}>
          {busy ? 'Bezig…' : 'Ja, definitief verwijderen'}
        </button>
      ) : (
        <button className={styles.dangerBtn} onClick={() => setArmed(true)}>
          Verwijder klantgegevens
        </button>
      )}
      {error && <p className={styles.note}>{error}</p>}
    </>
  );
}
