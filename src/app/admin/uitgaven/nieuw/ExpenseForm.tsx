'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ui } from '../../_ui';

const CATEGORIES = [
  { id: 'fuel', label: 'Brandstof' },
  { id: 'parking', label: 'Parkeren' },
  { id: 'toll', label: 'Tol' },
  { id: 'meals', label: 'Eten & Drinken' },
  { id: 'vehicle_maintenance', label: 'Voertuig Onderhoud' },
  { id: 'tool_subscription', label: 'Gereedschap Abonnement' },
  { id: 'phone', label: 'Telefonie' },
  { id: 'advertising', label: 'Advertenties' },
  { id: 'supplier', label: 'Leverancier' },
  { id: 'office', label: 'Kantoor' },
  { id: 'insurance', label: 'Verzekeringen' },
  { id: 'rent', label: 'Huur' },
  { id: 'training', label: 'Training' },
  { id: 'other', label: 'Overig' }
];

export default function ExpenseForm({ technicians, isOffice, myTechId }: { technicians: any[], isOffice: boolean, myTechId: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [category, setCategory] = useState('fuel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dateIncurred, setDateIncurred] = useState(new Date().toISOString().split('T')[0]);
  const [technicianId, setTechnicianId] = useState(isOffice ? '' : myTechId || '');
  const [isReimbursable, setIsReimbursable] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Voer een geldig bedrag in.');
      setBusy(false);
      return;
    }

    const res = await fetch('/api/admin/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        description,
        amount: numAmount,
        date_incurred: dateIncurred,
        technician_id: technicianId || null,
        is_reimbursable: isReimbursable
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || 'Opslaan mislukt');
      setBusy(false);
      return;
    }

    router.push('/admin/uitgaven');
    router.refresh();
  }

  return (
    <form onSubmit={save} style={{ maxWidth: 600, background: '#fff', padding: '2rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        
        <label>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Categorie</div>
          <select value={category} onChange={e => setCategory(e.target.value)} className={ui.input} required>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>

        <label>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Bedrag (€)</div>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={ui.input} required placeholder="0.00" />
        </label>

        <label>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Datum</div>
          <input type="date" value={dateIncurred} onChange={e => setDateIncurred(e.target.value)} className={ui.input} required />
        </label>

        <label>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Omschrijving</div>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={ui.input} required placeholder="bijv. Tanken BP, Google Ads factuur..." />
        </label>

        {isOffice && (
          <label>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Gekoppelde Monteur (optioneel)</div>
            <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className={ui.input}>
              <option value="">-- Algemeen / Kantoor --</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={isReimbursable} onChange={e => setIsReimbursable(e.target.checked)} />
          <span style={{ fontSize: 14, color: '#334155' }}>
            Dit is een declaratie (ik heb dit privé voorgeschoten en wil het terug).
          </span>
        </label>

        {error && <div style={{ color: '#dc2626', fontSize: 14 }}>{error}</div>}

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button type="button" onClick={() => router.back()} className={ui.btn} disabled={busy}>Annuleren</button>
          <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy}>
            {busy ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>

      </div>
    </form>
  );
}