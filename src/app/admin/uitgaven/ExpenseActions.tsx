'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Pencil, Trash2 } from 'lucide-react';
import { ui } from '../_ui';
import { EXPENSE_CATEGORIES } from '@/lib/expenseCaption';

/**
 * Approve, correct or remove an expense.
 *
 * Approving used to be all there was, and only while the expense was still
 * pending — so a receipt read slightly wrong by the Telegram parser, or a
 * number typed in a hurry, was frozen the moment somebody approved it. The
 * office could see the mistake and had no way to touch it.
 */

export interface ExpenseRow {
  id: string;
  category: string;
  description: string;
  amount: number | string;
  date_incurred: string;
  supplier_name: string | null;
  is_reimbursable: boolean;
  status: string;
}

export default function ExpenseActions({ expense }: { expense: ExpenseRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState(expense.category);
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [date, setDate] = useState(expense.date_incurred);
  const [supplier, setSupplier] = useState(expense.supplier_name ?? '');
  const [reimbursable, setReimbursable] = useState(expense.is_reimbursable);

  async function send(method: 'PATCH' | 'DELETE', body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/expenses/${expense.id}`, {
        method,
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Actie mislukt');
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Actie mislukt');
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    /* A receipt goes with it, and neither comes back. Worth one question. */
    const ok = window.confirm(
      `Deze uitgave verwijderen?\n\n${EXPENSE_CATEGORIES[expense.category] ?? expense.category} — € ${expense.amount}\n${expense.description}\n\nDe bon wordt ook verwijderd. Dit kan niet ongedaan worden gemaakt.`
    );
    if (ok) void send('DELETE');
  }

  const small: React.CSSProperties = { padding: '0.25rem 0.5rem', fontSize: '0.8rem' };
  const input: React.CSSProperties = {
    width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem',
    border: '1px solid var(--color-border, #cbd5e1)', borderRadius: 6,
  };

  if (editing) {
    return (
      <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem', minWidth: 260, textAlign: 'left' }}>
        <select style={input} value={category} onChange={(e) => setCategory(e.target.value)}>
          {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <input style={input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Omschrijving" />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input style={input} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Bedrag" />
          <input style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <input style={input} value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Leverancier (optioneel)" />
        <label style={{ fontSize: '0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input type="checkbox" checked={reimbursable} onChange={(e) => setReimbursable(e.target.checked)} />
          Declaratie — de monteur heeft dit zelf betaald
        </label>
        {error && <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>{error}</span>}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className={ui.btn} style={small} onClick={() => { setEditing(false); setError(null); }} disabled={busy}>
            Annuleren
          </button>
          <button
            className={ui.btn}
            style={{ ...small, color: '#2563eb', borderColor: '#bfdbfe' }}
            disabled={busy}
            onClick={() => void send('PATCH', {
              category,
              description,
              amount,
              date_incurred: date,
              supplier_name: supplier,
              is_reimbursable: reimbursable,
            })}
          >
            {busy ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
      {error && <div style={{ fontSize: '0.8rem', color: '#dc2626', marginBottom: '0.35rem' }}>{error}</div>}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {expense.status === 'pending' && (
          <>
            <button className={ui.btn} style={{ ...small, color: '#059669', borderColor: '#a7f3d0' }} onClick={() => void send('PATCH', { status: 'approved' })} disabled={busy}>
              <Check size={14} /> Goedkeuren
            </button>
            <button className={ui.btn} style={{ ...small, color: '#dc2626', borderColor: '#fecaca' }} onClick={() => void send('PATCH', { status: 'rejected' })} disabled={busy}>
              <X size={14} /> Afwijzen
            </button>
          </>
        )}
        {expense.status !== 'pending' && (
          /* Approving is not the end of the story: a wrong figure stays wrong,
             and someone has to be able to put it back. */
          <button className={ui.btn} style={small} onClick={() => void send('PATCH', { status: 'pending' })} disabled={busy}>
            Terug naar open
          </button>
        )}
        <button className={ui.btn} style={small} onClick={() => setEditing(true)} disabled={busy}>
          <Pencil size={14} /> Bewerken
        </button>
        <button className={ui.btn} style={{ ...small, color: '#dc2626', borderColor: '#fecaca' }} onClick={remove} disabled={busy}>
          <Trash2 size={14} /> Verwijderen
        </button>
      </div>
    </div>
  );
}
