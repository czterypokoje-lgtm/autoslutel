'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../klanten/klanten.module.css';
import jobStyles from '../../jobs/jobs.module.css';

export interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  email: string;
  name: string;
  carrier: string | null;
  tracking_code: string | null;
  internal_note: string | null;
  delivered_at: string | null;
  return_requested_at: string | null;
  return_reason: string | null;
}

const STATUSES = [
  'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
];

const CARRIERS = ['PostNL', 'DHL', 'DPD', 'GLS', 'Afhalen'];

/** Fourteen days from delivery — the statutory herroepingstermijn. */
function returnWindowOpen(deliveredAt: string | null): boolean | null {
  if (!deliveredAt) return null;
  const days = (Date.now() - new Date(deliveredAt).getTime()) / 86_400_000;
  return days <= 14;
}

export default function OrderPanel({ order }: { order: OrderDetail }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [carrier, setCarrier] = useState(order.carrier ?? 'PostNL');
  const [tracking, setTracking] = useState(order.tracking_code ?? '');
  const [note, setNote] = useState(order.internal_note ?? '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send(patch: Record<string, unknown>) {
    setBusy(true);
    setError('');
    setSaved(false);

    const response = await fetch(`/api/admin/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Opslaan mislukt.');
      setBusy(false);
      return;
    }

    setSaved(true);
    setBusy(false);
    router.refresh();
  }

  const windowOpen = returnWindowOpen(order.delivered_at);

  /*
   * The shipping mail as a prefilled mailto:, not an automatic send.
   *
   * There is no mail provider configured on this deployment, and a button that
   * silently sends nothing is worse than one that opens the mail client. Wire
   * up Postmark or Resend and this becomes a real send.
   */
  const mailto = `mailto:${order.email}?subject=${encodeURIComponent(
    `Je bestelling ${order.order_number} is verzonden`
  )}&body=${encodeURIComponent(
    `Beste ${order.name},\n\nJe bestelling ${order.order_number} is onderweg.\n` +
      (tracking ? `Track & trace (${carrier}): ${tracking}\n` : '') +
      `\nMet vriendelijke groet,\nAutosleutel24`
  )}`;

  return (
    <>
      <div className={styles.panel}>
        <h2>Verwerking</h2>

        <div className={jobStyles.field}>
          <label className={jobStyles.fieldLabel} htmlFor="st">Status</label>
          <select id="st" className={jobStyles.control} value={status}
            onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className={jobStyles.field} style={{ marginTop: 10 }}>
          <label className={jobStyles.fieldLabel} htmlFor="cr">Vervoerder</label>
          <select id="cr" className={jobStyles.control} value={carrier}
            onChange={(e) => setCarrier(e.target.value)}>
            {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className={jobStyles.field} style={{ marginTop: 10 }}>
          <label className={jobStyles.fieldLabel} htmlFor="tc">Track &amp; trace</label>
          <input id="tc" className={jobStyles.control} value={tracking}
            onChange={(e) => setTracking(e.target.value)} placeholder="3SABCD1234567" />
        </div>

        <div className={jobStyles.field} style={{ marginTop: 10 }}>
          <label className={jobStyles.fieldLabel} htmlFor="no">Interne notitie</label>
          <textarea id="no" className={jobStyles.control} rows={2} value={note}
            onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className={jobStyles.actions}>
          <button
            className={jobStyles.primary}
            disabled={busy}
            onClick={() => send({ status, carrier, tracking_code: tracking, internal_note: note })}
          >
            {busy ? 'Opslaan…' : 'Opslaan'}
          </button>
          <a className={jobStyles.secondary} href={mailto}>
            Mail de klant
          </a>
          {saved && <span className={styles.note}>Opgeslagen.</span>}
          {error && <div className={jobStyles.error}>{error}</div>}
        </div>

        <p className={styles.note}>
          De mailknop opent je eigen mailprogramma met een ingevulde tekst. Er is
          geen mailprovider ingesteld, dus het CRM verstuurt zelf niets — een
          knop die stil niets doet is erger dan een knop die je mail opent.
        </p>
      </div>

      <div className={styles.panel}>
        <h2>Retour</h2>
        {order.return_requested_at ? (
          <div className={styles.summary}>
            <span className={styles.summaryKey}>Aangevraagd</span>
            <span className={styles.summaryVal}>
              {order.return_requested_at.slice(0, 10)}
            </span>
            <span className={styles.summaryKey}>Reden</span>
            <span className={styles.summaryVal}>{order.return_reason ?? '—'}</span>
          </div>
        ) : (
          <>
            {windowOpen === false && (
              <p className={styles.note}>
                Bezorgd op {order.delivered_at?.slice(0, 10)} — de wettelijke
                herroepingstermijn van veertien dagen is verstreken. Retour kan
                nog steeds, maar dan uit coulance, niet uit plicht.
              </p>
            )}
            {windowOpen === true && (
              <p className={styles.note}>
                Binnen de veertien dagen herroepingsrecht.
              </p>
            )}
            {windowOpen === null && (
              <p className={styles.note}>
                Nog niet als bezorgd gemarkeerd — de veertien dagen gaan pas dan
                lopen.
              </p>
            )}
            <div className={jobStyles.field}>
              <label className={jobStyles.fieldLabel} htmlFor="rr">Reden</label>
              <input id="rr" className={jobStyles.control} value={reason}
                onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className={jobStyles.actions}>
              <button
                className={jobStyles.secondary}
                disabled={busy || !reason.trim()}
                onClick={() => send({ return_reason: reason })}
              >
                Retour vastleggen
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
