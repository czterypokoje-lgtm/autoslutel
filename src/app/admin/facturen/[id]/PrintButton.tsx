'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './invoice.module.css';

type Status = 'concept' | 'verzonden' | 'betaald';

const STATUS_LABEL: Record<Status, string> = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  betaald: 'Betaald',
};

/**
 * The on-screen controls above the sheet: back, status, print.
 *
 * Never rendered on paper — hidden in invoice.module.css's print rule, same
 * as the back link and the print button itself. A status select on the PDF a
 * customer gets would be an interactive element nobody could click.
 */
export default function PrintButton({ invoiceId, status }: { invoiceId: string; status: Status }) {
  const router = useRouter();
  const [current, setCurrent] = useState<Status>(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function changeStatus(next: Status) {
    if (next === current) return;
    setSaving(true);
    setError('');

    const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Opslaan mislukt.');
      setSaving(false);
      return;
    }

    setCurrent(next);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className={styles.bar}>
      <Link href="/admin/facturen" className={styles.back}>
        ← Facturen
      </Link>

      <div className={styles.barRight}>
        {error && <span className={styles.statusError}>{error}</span>}
        <select
          className={`${styles.statusSelect} ${styles[`status_${current}`]}`}
          value={current}
          disabled={saving}
          onChange={(e) => changeStatus(e.target.value as Status)}
        >
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <Link href={`/admin/facturen/${invoiceId}/bewerken`} className={styles.editBtn}>
          Bewerken
        </Link>
        <button type="button" className={styles.printBtn} onClick={() => window.print()}>
          Afdrukken / Opslaan als PDF
        </button>
      </div>
    </div>
  );
}
