'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHead, Empty, Table, ui } from '../_ui';
import { SCENARIO_INFO } from '@/lib/scenarios';
import { CHANNEL_LABEL, LOST_REASONS, LOST_REASON_LABEL, MONEY, WHEN, type LostReason, type OpenQuote } from './types';

function Row({ quote, onDone }: { quote: OpenQuote; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickingReason, setPickingReason] = useState(false);
  const [reason, setReason] = useState<LostReason | ''>('');

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'outcome', ...body }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Opslaan mislukt');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt');
    } finally {
      setBusy(false);
    }
  }

  function won() {
    const raw = window.prompt('Bedrag', String(quote.quoted_price));
    if (raw === null) return;
    const price = Number(raw.replace(',', '.'));
    if (!Number.isFinite(price) || price <= 0) {
      setError('Ongeldig bedrag');
      return;
    }
    void send({ outcome: 'won', won_price: price });
  }

  function lost() {
    if (!reason) {
      setError('Kies een reden');
      return;
    }
    void send({ outcome: 'lost', lost_reason: reason });
    setPickingReason(false);
  }

  return (
    <tr>
      <td>{WHEN.format(new Date(quote.quoted_at))}</td>
      <td>{[quote.make, quote.model, quote.year].filter(Boolean).join(' ') || '—'}</td>
      <td>{quote.scenario ? SCENARIO_INFO[quote.scenario].label : '—'}</td>
      <td>{MONEY.format(quote.quoted_price)}</td>
      <td>{CHANNEL_LABEL[quote.channel]}</td>
      <td>
        {pickingReason ? (
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <select className={ui.input} style={{ width: 150 }} value={reason} onChange={(e) => setReason(e.target.value as LostReason)}>
              <option value="">Reden…</option>
              {LOST_REASONS.map((r) => (
                <option key={r} value={r}>{LOST_REASON_LABEL[r]}</option>
              ))}
            </select>
            <button className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy} onClick={lost}>Bevestigen</button>
            <button className={ui.btn} disabled={busy} onClick={() => setPickingReason(false)}>Annuleren</button>
          </span>
        ) : (
          <span className={ui.rowActions}>
            <button className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy} onClick={won}>Gewonnen</button>
            <button className={ui.btn} disabled={busy} onClick={() => setPickingReason(true)}>Verloren</button>
            <button className={ui.btn} disabled={busy} onClick={() => void send({ outcome: 'no_reply' })}>Geen reactie</button>
          </span>
        )}
        {error && <div style={{ color: 'var(--stop, #b91c1c)' }}>{error}</div>}
      </td>
    </tr>
  );
}

export default function OpenList({ rows }: { rows: OpenQuote[] }) {
  const router = useRouter();
  return (
    <Card>
      <CardHead>Open offertes ({rows.length})</CardHead>
      {rows.length === 0 ? (
        <Empty>Geen open offertes.</Empty>
      ) : (
        <Table
          head={
            <>
              <th>Wanneer</th>
              <th>Auto</th>
              <th>Scenario</th>
              <th>Bedrag</th>
              <th>Kanaal</th>
              <th>Acties</th>
            </>
          }
        >
          {rows.map((q) => (
            <Row key={q.id} quote={q} onDone={() => router.refresh()} />
          ))}
        </Table>
      )}
    </Card>
  );
}
