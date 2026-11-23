'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, RotateCcw, Trash2 } from 'lucide-react';
import { ui } from '../_ui';

export default function TaskActions({ id, done }: { id: string; done: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function send(method: 'PATCH' | 'DELETE', body?: unknown) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/tasks/${id}`, {
        method,
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className={ui.rowActions}>
      {done ? (
        <button className={ui.btnIcon} title="Heropenen" disabled={busy} onClick={() => send('PATCH', { done: false })}><RotateCcw size={16} /></button>
      ) : (
        <button className={ui.btnIcon} title="Klaar" disabled={busy} onClick={() => send('PATCH', { done: true })}><Check size={16} /></button>
      )}
      <button
        className={ui.btnIcon}
        title="Verwijderen"
        disabled={busy}
        onClick={() => { if (confirm('Taak verwijderen?')) void send('DELETE'); }}
      >
        <Trash2 size={16} />
      </button>
    </span>
  );
}
