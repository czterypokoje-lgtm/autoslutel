'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote } from 'lucide-react';
import { requestPayout } from './actions';
import { ui } from '../_ui';

/**
 * Asking for the balance to be paid out.
 *
 * The whole balance at once, deliberately: a technician drawing an odd amount
 * has a reason we would only guess at, and every partial figure would need its
 * own validation on both sides. Asking is all this does — approving is the
 * office's, enforced in the database by migration 0017.
 */
export default function PayoutForm({ available }: { available: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const nothingToDraw = available <= 0;

  async function submit() {
    if (nothingToDraw) return;
    setBusy(true);
    setMessage(null);

    const result = await requestPayout(available);
    setBusy(false);

    setMessage(
      'error' in result && result.error
        ? { text: result.error, ok: false }
        : { text: 'Aangevraagd. Het kantoor handelt het af.', ok: true }
    );
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
      {message && (
        <span
          style={{
            fontSize: 'var(--fs-label)',
            color: message.ok ? 'var(--crm-ok)' : 'var(--crm-stop)',
          }}
        >
          {message.text}
        </span>
      )}
      <button
        className={`${ui.btn} ${ui.btnPrimary}`}
        onClick={submit}
        disabled={busy || nothingToDraw || (message?.ok ?? false)}
        title={nothingToDraw ? 'U heeft op dit moment niets openstaan' : undefined}
      >
        <Banknote size={15} strokeWidth={2} />
        {busy
          ? 'Bezig…'
          : nothingToDraw
            ? 'Niets op te nemen'
            : `${available.toFixed(2).replace('.', ',')} opnemen`}
      </button>
    </div>
  );
}
