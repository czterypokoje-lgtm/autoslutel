'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Pencil, Trash2 } from 'lucide-react';
import { ui } from '../_ui';
import x from './uitgaven.module.css';
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


  if (editing) {
    return (
      <div className={x.editBox}>
        <select className={x.input} value={category} onChange={(e) => setCategory(e.target.value)}>
          {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <input className={x.input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Omschrijving" />
        <div className={x.pair}>
          <input className={x.input} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Bedrag" />
          <input className={x.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <input className={x.input} value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Leverancier (optioneel)" />
        <label className={x.checkLabel}>
          <input type="checkbox" checked={reimbursable} onChange={(e) => setReimbursable(e.target.checked)} />
          Declaratie — de monteur heeft dit zelf betaald
        </label>
        {error && <span className={x.err}>{error}</span>}
        <div className={x.btnRow}>
          <button className={`${ui.btn} ${x.small}`} onClick={() => { setEditing(false); setError(null); }} disabled={busy}>
            Annuleren
          </button>
          <button
            className={`${ui.btn} ${x.small} ${x.save}`}
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
    <div className={x.actions}>
      {error && <div className={x.err}>{error}</div>}
      <div className={x.btnRow}>
        {expense.status === 'pending' && (
          <>
            <button className={`${ui.btn} ${x.small} ${x.ok}`} onClick={() => void send('PATCH', { status: 'approved' })} disabled={busy}>
              <Check size={14} /> Goedkeuren
            </button>
            <button className={`${ui.btn} ${x.small} ${x.bad}`} onClick={() => void send('PATCH', { status: 'rejected' })} disabled={busy}>
              <X size={14} /> Afwijzen
            </button>
          </>
        )}
        {expense.status !== 'pending' && (
          /* Approving is not the end of the story: a wrong figure stays wrong,
             and someone has to be able to put it back. */
          <button className={`${ui.btn} ${x.small}`} onClick={() => void send('PATCH', { status: 'pending' })} disabled={busy}>
            Terug naar open
          </button>
        )}
        <button className={`${ui.btn} ${x.small}`} onClick={() => setEditing(true)} disabled={busy}>
          <Pencil size={14} /> Bewerken
        </button>
        <button className={`${ui.btn} ${x.small} ${x.bad}`} onClick={remove} disabled={busy}>
          <Trash2 size={14} /> Verwijderen
        </button>
      </div>
    </div>
  );
}
