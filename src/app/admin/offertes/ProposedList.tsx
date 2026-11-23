'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Card, CardHead, Empty, Table, ui } from '../_ui';
import { SCENARIOS, SCENARIO_INFO, type Scenario } from '@/lib/scenarios';
import {
  CHANNEL_LABEL,
  LOST_REASONS,
  LOST_REASON_LABEL,
  MONEY,
  OUTCOMES,
  OUTCOME_LABEL,
  WHEN,
  type LostReason,
  type Outcome,
  type ProposedQuote,
} from './types';

const LINK_BADGE: Record<ProposedQuote['link_state'], { tone: 'ok' | 'warn' | 'stop'; label: string }> = {
  linked: { tone: 'ok', label: 'Gekoppeld' },
  unlinked: { tone: 'warn', label: 'Geen lead' },
  ambiguous: { tone: 'stop', label: 'Meerdere leads' },
};

function Row({ quote, onDone }: { quote: ProposedQuote; onDone: () => void }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [make, setMake] = useState(quote.make ?? '');
  const [model, setModel] = useState(quote.model ?? '');
  const [scenario, setScenario] = useState<Scenario | ''>(quote.scenario ?? '');
  const [price, setPrice] = useState(String(quote.quoted_price));
  const [outcome, setOutcome] = useState<Outcome>('open');
  const [lostReason, setLostReason] = useState<LostReason | ''>('');

  async function send(action: 'confirm' | 'reject', body?: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
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

  function submitConfirm() {
    if (outcome === 'lost' && !lostReason) {
      setError('Kies een reden');
      return;
    }
    void send('confirm', {
      make: make.trim() || null,
      model: model.trim() || null,
      scenario: scenario || null,
      quoted_price: Number(price.replace(',', '.')),
      outcome,
      lost_reason: outcome === 'lost' ? lostReason : null,
    });
  }

  const link = LINK_BADGE[quote.link_state];

  return (
    <tr>
      <td>{WHEN.format(new Date(quote.quoted_at))}</td>
      <td>{[quote.make, quote.model, quote.year].filter(Boolean).join(' ') || '—'}</td>
      <td>{quote.scenario ? SCENARIO_INFO[quote.scenario].label : '—'}</td>
      <td>{MONEY.format(quote.quoted_price)}</td>
      <td>{CHANNEL_LABEL[quote.channel]}</td>
      <td>{quote.evidence_quote ?? '—'}</td>
      <td><Badge tone={link.tone}>{link.label}</Badge></td>
      <td>
        {editing ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', minWidth: 280 }}>
            <input className={ui.input} style={{ width: 90 }} placeholder="Merk" value={make} onChange={(e) => setMake(e.target.value)} />
            <input className={ui.input} style={{ width: 90 }} placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
            <select className={ui.input} style={{ width: 140 }} value={scenario} onChange={(e) => setScenario(e.target.value as Scenario | '')}>
              <option value="">Scenario…</option>
              {SCENARIOS.map((s) => (
                <option key={s} value={s}>{SCENARIO_INFO[s].label}</option>
              ))}
            </select>
            <input className={ui.input} style={{ width: 80 }} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
            <select className={ui.input} style={{ width: 120 }} value={outcome} onChange={(e) => setOutcome(e.target.value as Outcome)}>
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>{OUTCOME_LABEL[o]}</option>
              ))}
            </select>
            {outcome === 'lost' && (
              <select className={ui.input} style={{ width: 140 }} value={lostReason} onChange={(e) => setLostReason(e.target.value as LostReason)}>
                <option value="">Reden…</option>
                {LOST_REASONS.map((r) => (
                  <option key={r} value={r}>{LOST_REASON_LABEL[r]}</option>
                ))}
              </select>
            )}
            <button className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy} onClick={submitConfirm}>Bevestigen</button>
            <button className={ui.btn} disabled={busy} onClick={() => setEditing(false)}>Annuleren</button>
            {error && <span style={{ color: 'var(--stop, #b91c1c)' }}>{error}</span>}
          </div>
        ) : (
          <span className={ui.rowActions}>
            <button className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy} onClick={() => setEditing(true)}>Bevestig</button>
            <button
              className={ui.btn}
              disabled={busy}
              onClick={() => { if (window.confirm('Offerte afwijzen?')) void send('reject'); }}
            >
              Afwijzen
            </button>
            {error && <span style={{ color: 'var(--stop, #b91c1c)' }}>{error}</span>}
          </span>
        )}
      </td>
    </tr>
  );
}

export default function ProposedList({ rows }: { rows: ProposedQuote[] }) {
  const router = useRouter();
  return (
    <Card>
      <CardHead>Te beoordelen ({rows.length})</CardHead>
      {rows.length === 0 ? (
        <Empty>Niets te beoordelen.</Empty>
      ) : (
        <Table
          head={
            <>
              <th>Wanneer</th>
              <th>Auto</th>
              <th>Scenario</th>
              <th>Bedrag</th>
              <th>Kanaal</th>
              <th>Zin</th>
              <th>Koppeling</th>
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
