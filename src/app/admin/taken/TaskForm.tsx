'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ui } from '../_ui';

export default function TaskForm() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, due: due || 'morgen' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Opslaan mislukt');
      setDescription('');
      setDue('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        className={ui.input}
        style={{ flex: '1 1 280px' }}
        placeholder="Wat moet er gebeuren?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        maxLength={500}
      />
      <input className={ui.input} type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} title="Leeg = morgen 09:00" />
      <button className={`${ui.btn} ${ui.btnPrimary}`} type="submit" disabled={busy || !description.trim()}>
        {busy ? 'Bezig…' : 'Toevoegen'}
      </button>
      {error && <span style={{ color: 'var(--stop, #b91c1c)' }}>{error}</span>}
    </form>
  );
}
