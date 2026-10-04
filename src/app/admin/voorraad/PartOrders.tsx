'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHead, Badge, Empty, ui } from '../_ui';

export interface PartOrderRow {
  id: string;
  technician: string;
  description: string;
  articleCode: string | null;
  quantity: number;
  unitCost: number | null;
  status: string;
  createdAt: string;
  note: string | null;
}

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/**
 * What the monteurs have asked for, and the three answers.
 *
 * "Geleverd" is the one that does work: it writes the part into that
 * technician's van at the price paid, so the next job that uses it carries a
 * real cost instead of a null.
 */
export default function PartOrders({ orders }: { orders: PartOrderRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function setStatus(id: string, status: string) {
    const note =
      status === 'afgewezen' ? (window.prompt('Waarom niet? (optioneel)') ?? '') : '';

    setBusy(id);
    setError('');
    const response = await fetch(`/api/admin/part-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, status_note: note || null }),
    }).catch(() => null);

    if (!response?.ok) {
      setError((await response?.json().catch(() => null))?.error ?? 'Bijwerken mislukt.');
      setBusy(null);
      return;
    }
    setBusy(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHead>
        Aangevraagde onderdelen — {orders.filter((o) => o.status !== 'geleverd' && o.status !== 'afgewezen').length} open
      </CardHead>

      {error && <p style={{ color: 'var(--crm-stop)', fontSize: 14, padding: '0 16px' }}>{error}</p>}

      {!orders.length ? (
        <Empty>Niemand heeft iets aangevraagd. Monteurs doen dat bij Onderdelen bestellen.</Empty>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              padding: '12px 16px',
              borderTop: '1px solid var(--crm-rule)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ minWidth: 0, flex: '1 1 240px' }}>
              <div style={{ fontWeight: 600, color: 'var(--crm-ink)' }}>
                {order.quantity}× {order.description}
              </div>
              <div style={{ fontSize: 12, color: 'var(--crm-muted)', marginTop: 2 }}>
                {order.technician}
                {order.articleCode ? ` · ${order.articleCode}` : ''}
                {order.unitCost != null ? ` · ${MONEY.format(order.unitCost)}` : ''}
                {` · ${order.createdAt.slice(0, 10)}`}
                {order.note ? ` · ${order.note}` : ''}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {order.status === 'geleverd' || order.status === 'afgewezen' ? (
                <Badge tone={order.status === 'geleverd' ? 'ok' : 'stop'}>{order.status}</Badge>
              ) : (
                <>
                  {order.status === 'aangevraagd' && (
                    <button
                      className={ui.btn}
                      onClick={() => setStatus(order.id, 'besteld')}
                      disabled={busy === order.id}
                    >
                      Besteld
                    </button>
                  )}
                  <button
                    className={`${ui.btn} ${ui.btnPrimary}`}
                    onClick={() => setStatus(order.id, 'geleverd')}
                    disabled={busy === order.id}
                    title="Boekt het onderdeel in de bus van deze monteur"
                  >
                    {busy === order.id ? '…' : 'Binnen'}
                  </button>
                  <button
                    className={ui.btn}
                    onClick={() => setStatus(order.id, 'afgewezen')}
                    disabled={busy === order.id}
                  >
                    Nee
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </Card>
  );
}
