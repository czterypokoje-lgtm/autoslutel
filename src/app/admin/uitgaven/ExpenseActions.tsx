'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { ui } from '../_ui';

export default function ExpenseActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function update(status: 'approved' | 'rejected') {
    setBusy(true);
    await fetch(`/api/admin/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
      <button 
        className={ui.btn} 
        style={{ padding: '0.25rem 0.5rem', color: '#059669', borderColor: '#a7f3d0' }}
        onClick={() => update('approved')}
        disabled={busy}
      >
        <Check size={14} /> Goedkeuren
      </button>
      <button 
        className={ui.btn} 
        style={{ padding: '0.25rem 0.5rem', color: '#dc2626', borderColor: '#fecaca' }}
        onClick={() => update('rejected')}
        disabled={busy}
      >
        <X size={14} /> Afwijzen
      </button>
    </div>
  );
}