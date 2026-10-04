'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ui } from '../_ui';

export interface BidRow {
  id: string;
  technician: string;
  price: number | null;
  date: string | null;
  start: string | null;
  end: string | null;
}

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/**
 * The bids on one job, and the one button that ends the question.
 *
 * No "cheapest" badge and no sorting by price. The lowest bid is not the best
 * one when the monteur who asked more can be there two hours sooner, and a
 * screen that quietly recommends the cheap one makes that decision for
 * somebody who knows more than it does.
 */
export default function AwardPanel({ bids }: { bids: BidRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function award(id: string) {
    setBusy(id);
    setError('');
    const response = await fetch(`/api/admin/offers/${id}/award`, { method: 'POST' }).catch(() => null);
    if (!response?.ok) {
      setError((await response?.json().catch(() => null))?.error ?? 'Gunnen mislukt.');
      setBusy(null);
      return;
    }
    setBusy(null);
    router.refresh();
  }

  return (
    <div style={{ padding: '0 0 4px' }}>
      {error && <p style={{ color: 'var(--crm-stop)', fontSize: 14, padding: '0 16px' }}>{error}</p>}

      {bids.map((bid) => (
        <div
          key={bid.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            padding: '12px 16px',
            borderTop: '1px solid var(--crm-rule)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--crm-ink)' }}>{bid.technician}</div>
            <div style={{ fontSize: 13, color: 'var(--crm-muted)' }}>
              {bid.date ?? '—'}
              {bid.start ? ` · ${String(bid.start).slice(0, 5)}–${String(bid.end ?? '').slice(0, 5)}` : ''}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--crm-ink)', fontVariantNumeric: 'tabular-nums' }}>
              {bid.price === null ? '—' : MONEY.format(Number(bid.price))}
            </span>
            <button
              className={`${ui.btn} ${ui.btnPrimary}`}
              onClick={() => award(bid.id)}
              disabled={busy !== null}
            >
              {busy === bid.id ? '…' : 'Gun deze'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
