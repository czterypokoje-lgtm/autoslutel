'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { ui } from '../../_ui';

/**
 * Putting this job out to the monteurs, from the job itself.
 *
 * One press, no options. Who it goes to is "everyone active with Telegram",
 * and when is "now" — a form asking the office to choose either of those for
 * a two-person team would be a form they learn to click through.
 */
export default function OfferButton({ jobId, alreadyOpen }: { jobId: string; alreadyOpen: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [bad, setBad] = useState(false);

  async function send() {
    setBusy(true);
    setNote('');
    setBad(false);

    const response = await fetch(`/api/admin/jobs/${jobId}/offer`, { method: 'POST' }).catch(() => null);
    const result = await response?.json().catch(() => null);

    if (!response?.ok) {
      setBad(true);
      setNote(result?.error ?? 'Aanbieden mislukt.');
      setBusy(false);
      return;
    }

    setNote(
      `Verstuurd naar ${result.sent} monteur${result.sent === 1 ? '' : 's'}: ${(result.technicians ?? []).join(', ')}. Biedingen komen binnen bij Biedingen.`
    );
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button className={`${ui.btn} ${ui.btnPrimary}`} onClick={send} disabled={busy}>
        <Send size={16} /> {busy ? 'Versturen…' : 'Stuur naar monteurs'}
      </button>
      {alreadyOpen > 0 && (
        <span style={{ fontSize: 13, color: 'var(--crm-muted)' }}>
          staat al open bij {alreadyOpen} monteur{alreadyOpen === 1 ? '' : 's'}
        </span>
      )}
      {note && (
        <span style={{ fontSize: 13, color: bad ? 'var(--crm-stop)' : 'var(--crm-ok)' }}>{note}</span>
      )}
    </div>
  );
}
