'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Moves today's paid orders to 'processing' once they are ordered at A-Key. */
export default function MarkOrdered({ orderIds }: { orderIds: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!confirm(`${orderIds.length} bestelling(en) op "In behandeling" zetten? Doe dit pas als je bij A-Key besteld hebt.`)) return;
    setBusy(true);
    setError(null);
    const results = await Promise.all(orderIds.map((id) =>
      fetch(`/api/admin/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'processing' }) })
        .then((r) => r.ok).catch(() => false)));
    const failed = results.filter((ok) => !ok).length;
    if (failed) setError(`${failed} bestelling(en) konden niet worden bijgewerkt. Probeer opnieuw.`);
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <button type="button" onClick={run} disabled={busy || !orderIds.length} style={{ background: '#16a34a', color: '#fff', border: 0, borderRadius: 8, padding: '.75rem 1.25rem', fontWeight: 700, cursor: 'pointer' }}>
        {busy ? 'Bezig…' : 'Besteld bij A-Key → zet op In behandeling'}
      </button>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
    </div>
  );
}
