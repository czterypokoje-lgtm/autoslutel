'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHead, ui } from '../_ui';

/**
 * Adding or correcting one stock line.
 *
 * The grown-up version of a form that used to live in a settings panel nobody
 * could reach any more — its only import had been removed, so the office was
 * left with no way to register stock at all.
 *
 * Kostprijs is the field that matters. It is what makes a part on a job cost
 * something, and it is the one number a scanned invoice cannot always supply:
 * anything bought over a counter arrives here or nowhere.
 */
export default function StockForm({
  technicians,
}: {
  technicians: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const [holder, setHolder] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minimum, setMinimum] = useState('');
  const [unitCost, setUnitCost] = useState('');

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setDone('');

    const response = await fetch('/api/admin/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        quantity,
        min_quantity: minimum,
        technician_id: holder || null,
        /*
         * Left out entirely when blank, so saving a count without touching the
         * price cannot wipe a price the invoice scan already established.
         */
        ...(unitCost.trim() ? { unit_cost: unitCost } : {}),
      }),
    }).catch(() => null);

    if (!response?.ok) {
      setError((await response?.json().catch(() => null))?.error ?? 'Opslaan mislukt.');
      setBusy(false);
      return;
    }

    setDone(`"${description}" opgeslagen.`);
    setDescription('');
    setQuantity('');
    setMinimum('');
    setUnitCost('');
    setBusy(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <button className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => setOpen(true)}>
          Artikel toevoegen of bijwerken
        </button>
        {done && <span style={{ marginLeft: '1rem', color: 'var(--crm-ok)', fontSize: 14 }}>{done}</span>}
      </div>
    );
  }

  return (
    <Card>
      <CardHead>Artikel toevoegen of bijwerken</CardHead>
      <form onSubmit={save} style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
        <label>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--crm-text)', marginBottom: 6 }}>
            Waar ligt het
          </div>
          <select value={holder} onChange={(e) => setHolder(e.target.value)} className={ui.input}>
            <option value="">Magazijn</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                Bus — {tech.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--crm-text)', marginBottom: 6 }}>
            Omschrijving
          </div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={ui.input}
            required
            placeholder="bijv. Smart key Mercedes W205"
          />
          <div style={{ fontSize: 12, color: 'var(--crm-muted)', marginTop: 4 }}>
            Exact dezelfde omschrijving werkt het bestaande artikel bij in plaats van een tweede
            regel te maken.
          </div>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--crm-text)', marginBottom: 6 }}>
              Aantal
            </div>
            <input
              type="number"
              step="1"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={ui.input}
              required
            />
          </label>
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--crm-text)', marginBottom: 6 }}>
              Waarschuwen onder
            </div>
            <input
              type="number"
              step="1"
              min="0"
              value={minimum}
              onChange={(e) => setMinimum(e.target.value)}
              className={ui.input}
              placeholder="0"
            />
          </label>
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--crm-text)', marginBottom: 6 }}>
              Kostprijs (€)
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className={ui.input}
              placeholder="leeg = laat staan"
            />
          </label>
        </div>

        {error && <div style={{ color: 'var(--crm-stop)', fontSize: 14 }}>{error}</div>}
        {done && <div style={{ color: 'var(--crm-ok)', fontSize: 14 }}>{done}</div>}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="button" className={ui.btn} onClick={() => setOpen(false)} disabled={busy}>
            Sluiten
          </button>
          <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy}>
            {busy ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </form>
    </Card>
  );
}
