'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Card, Badge } from '../_ui';
import styles from './klussen.module.css';

export interface ToolOption {
  id: string;
  label: string;
}

export interface HistoryRow {
  id: string;
  status: string;
  date: string;
  slot: string;
  place: string;
  car: string;
  scenario: string | null;
  serviceType: string | null;
  price: number | string | null;
  toolUsedId: string | null;
  keyUsed: string | null;
  adapterUsed: string | null;
  techNote: string | null;
}

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'stop' | 'info'> = {
  afgerond: 'ok',
  gepland: 'info',
  onderweg: 'info',
  bezig: 'warn',
  geannuleerd: 'stop',
};

function Row({ row, tools }: { row: HistoryRow; tools: ToolOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toolUsedId, setToolUsedId] = useState(row.toolUsedId ?? '');
  const [keyUsed, setKeyUsed] = useState(row.keyUsed ?? '');
  const [adapterUsed, setAdapterUsed] = useState(row.adapterUsed ?? '');
  const [techNote, setTechNote] = useState(row.techNote ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const hasReference = row.toolUsedId || row.keyUsed || row.adapterUsed || row.techNote;

  async function save() {
    setSaving(true);
    setError('');
    setSaved(false);

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        tool_used_id: toolUsedId || null,
        key_used: keyUsed.trim() || null,
        adapter_used: adapterUsed.trim() || null,
        tech_note: techNote.trim() || null,
      })
      .eq('id', row.id);

    if (updateError) {
      /*
       * RLS silently returns zero rows changed rather than an error when the
       * job is outside the 30-day edit window (0022) — worth saying plainly
       * rather than leaving the technician staring at a form that did nothing.
       */
      setError(updateError.message || 'Opslaan mislukt. Klussen ouder dan 30 dagen zijn niet meer te bewerken.');
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className={styles.item}>
      <button type="button" className={styles.itemHead} onClick={() => setOpen((v) => !v)}>
        <span className={styles.itemDate}>
          {row.date} <span className={styles.itemSlot}>{row.slot}</span>
        </span>
        <span className={styles.itemCar}>{row.car}</span>
        <span className={styles.itemMeta}>
          {row.serviceType ?? row.scenario ?? '—'}
          {row.place && <> · {row.place}</>}
        </span>
        <span className={styles.itemPrice}>
          {row.price != null ? MONEY.format(Number(row.price)) : '—'}
        </span>
        <Badge tone={STATUS_TONE[row.status] ?? 'info'}>{row.status}</Badge>
        {hasReference && <Badge tone="ok">referentie</Badge>}
      </button>

      {open && (
        <div className={styles.itemBody}>
          <label className={styles.field}>
            <span>Gebruikt gereedschap</span>
            <select value={toolUsedId} onChange={(e) => setToolUsedId(e.target.value)}>
              <option value="">— geen gekozen —</option>
              {tools.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Gebruikte sleutel / artikel</span>
            <input
              type="text"
              value={keyUsed}
              onChange={(e) => setKeyUsed(e.target.value)}
              placeholder="bijv. Toyota smart key 2 knoppen, 433MHz"
            />
          </label>

          <label className={styles.field}>
            <span>Gebruikte adapter</span>
            <input
              type="text"
              value={adapterUsed}
              onChange={(e) => setAdapterUsed(e.target.value)}
              placeholder="bijv. Xhorse OBD-adapter, of geen"
            />
          </label>

          <label className={styles.field}>
            <span>Notitie voor uzelf</span>
            <textarea
              value={techNote}
              onChange={(e) => setTechNote(e.target.value)}
              rows={3}
              placeholder="Wat viel op aan deze klus, waar moet u de volgende keer op letten?"
            />
          </label>

          <div className={styles.itemActions}>
            <button type="button" onClick={save} disabled={saving} className={styles.saveBtn}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
            {saved && <span className={styles.savedNote}>Opgeslagen.</span>}
            {error && <span className={styles.errorNote}>{error}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobHistoryList({ rows, tools }: { rows: HistoryRow[]; tools: ToolOption[] }) {
  return (
    <Card>
      {rows.map((row) => (
        <Row key={row.id} row={row} tools={tools} />
      ))}
    </Card>
  );
}
