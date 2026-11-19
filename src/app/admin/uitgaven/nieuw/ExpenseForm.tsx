'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ui } from '../../_ui';
import x from '../uitgaven.module.css';

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
    <form onSubmit={save} className={x.form}>
      <div className={x.formGrid}>
        
        <label>
          <div className={x.formLabel}>Categorie</div>
          <select value={category} onChange={e => setCategory(e.target.value)} className={ui.input} required>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>

        <label>
          <div className={x.formLabel}>Bedrag (€)</div>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className={ui.input} required placeholder="0.00" />
        </label>

        <label>
          <div className={x.formLabel}>Datum</div>
          <input type="date" value={dateIncurred} onChange={e => setDateIncurred(e.target.value)} className={ui.input} required />
        </label>

        <label>
          <div className={x.formLabel}>Omschrijving</div>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={ui.input} required placeholder="bijv. Tanken BP, Google Ads factuur..." />
        </label>

        {isOffice && (
          <label>
            <div className={x.formLabel}>Monteur (optioneel)</div>
            <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className={ui.input}>
              <option value="">Algemeen / kantoor</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
        )}

        <label className={x.checkLabel}>
          <input type="checkbox" checked={isReimbursable} onChange={e => setIsReimbursable(e.target.checked)} />
          <span>
            Dit is een declaratie (ik heb dit privé voorgeschoten en wil het terug).
          </span>
        </label>

        {error && <div className={x.err}>{error}</div>}

        <div className={x.formActions}>
          <button type="button" onClick={() => router.back()} className={ui.btn} disabled={busy}>Annuleren</button>
          <button type="submit" className={`${ui.btn} ${ui.btnPrimary}`} disabled={busy}>
            {busy ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>

      </div>
    </form>
  );
}