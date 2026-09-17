'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteJob } from './actions';
import styles from '../jobs.module.css';

export default function DeleteJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm('Weet je zeker dat je deze klus wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;
    setBusy(true);
    const err = await deleteJob(jobId);
    if (err) {
      alert(`Fout bij verwijderen: ${err}`);
      setBusy(false);
    } else {
      router.push('/admin/jobs');
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className={styles.navBtn}
      style={{ color: 'var(--crm-stop)', borderColor: 'var(--crm-stop)' }}
    >
      {busy ? 'Verwijderen...' : 'Klus verwijderen'}
    </button>
  );
}
