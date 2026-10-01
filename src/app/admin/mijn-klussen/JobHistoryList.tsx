'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, MapPin, NotebookPen } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
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
  year: string | null;
  make: string | null;
  /** Brand logo URL, worked out on the server. */
  logo: string | null;
  /** Readable service name ("Alle sleutels kwijt", not "alle_sleutels_kwijt"). */
  service: string;
  price: number | string | null;
  toolUsedId: string | null;
  keyUsed: string | null;
  adapterUsed: string | null;
  techNote: string | null;
}

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const MONTH_SHORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MONTH_LONG = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

const STATUS: Record<string, { label: string; cls: string }> = {
  afgerond: { label: 'Afgerond', cls: styles.stDone },
  gepland: { label: 'Gepland', cls: styles.stPlanned },
  onderweg: { label: 'Onderweg', cls: styles.stBusy },
  bezig: { label: 'Bezig', cls: styles.stBusy },
  geannuleerd: { label: 'Geannuleerd', cls: styles.stCancel },
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

  const hasReference = Boolean(row.toolUsedId || row.keyUsed || row.adapterUsed || row.techNote);
  const status = STATUS[row.status] ?? { label: row.status, cls: styles.stPlanned };
  const [y, m, d] = row.date.split('-');

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
    <li className={open ? `${styles.item} ${styles.itemOpen}` : styles.item}>
      <button type="button" className={styles.itemHead} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className={styles.date}>
          <b>{Number(d)}</b>
          <span>{MONTH_SHORT[Number(m) - 1]}</span>
        </span>

        <span className={styles.logo} aria-hidden="true">
          {row.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.logo} alt="" />
          ) : (
            <span>{(row.make ?? '?').slice(0, 3).toUpperCase()}</span>
          )}
        </span>

        <span className={styles.main}>
          <span className={styles.car}>
            {row.car}
            {row.year && <span className={styles.year}>{row.year}</span>}
          </span>
          <span className={styles.meta}>
            <span>{row.service}</span>
            <span className={styles.metaDot} aria-hidden="true">·</span>
            <span>{row.slot}</span>
            {row.place && (
              <>
                <span className={styles.metaDot} aria-hidden="true">·</span>
                <span className={styles.place}>
                  <MapPin size={13} aria-hidden="true" />
                  {row.place}
                </span>
              </>
            )}
          </span>
        </span>

        <span className={styles.right}>
          {hasReference && (
            <span className={styles.ref} title="Er staat een notitie bij deze klus">
              <NotebookPen size={14} aria-hidden="true" />
              Notitie
            </span>
          )}
          <span className={`${styles.status} ${status.cls}`}>{status.label}</span>
          <span className={styles.price}>{row.price != null ? MONEY.format(Number(row.price)) : '—'}</span>
          {open ? <ChevronDown size={18} className={styles.chev} /> : <ChevronRight size={18} className={styles.chev} />}
        </span>
      </button>

      {open && (
        <div className={styles.itemBody}>
          <p className={styles.bodyIntro}>
            Wat werkte bij deze {row.car}? Je ziet dit terug als je dit model opnieuw tegenkomt. ({y})
          </p>
          <div className={styles.grid}>
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

            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span>Notitie voor jezelf</span>
              <textarea
                value={techNote}
                onChange={(e) => setTechNote(e.target.value)}
                rows={3}
                placeholder="Wat viel op aan deze klus, waar moet je de volgende keer op letten?"
              />
            </label>
          </div>

          <div className={styles.itemActions}>
            <button type="button" onClick={save} disabled={saving} className={styles.saveBtn}>
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
            {saved && <span className={styles.savedNote}>Opgeslagen.</span>}
            {error && <span className={styles.errorNote}>{error}</span>}
          </div>
        </div>
      )}
    </li>
  );
}

/** Jobs grouped under a month heading, newest first, as they come from the server. */
export default function JobHistoryList({ rows, tools }: { rows: HistoryRow[]; tools: ToolOption[] }) {
  const groups: { key: string; label: string; rows: HistoryRow[] }[] = [];
  for (const row of rows) {
    const key = row.date.slice(0, 7);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: `${MONTH_LONG[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }

  return (
    <div className={styles.groups}>
      {groups.map((g) => (
        <section key={g.key} className={styles.group}>
          <h2 className={styles.groupHead}>
            <span>{g.label}</span>
            <span className={styles.groupCount}>
              {g.rows.length} {g.rows.length === 1 ? 'klus' : 'klussen'}
            </span>
          </h2>
          <ul className={styles.list}>
            {g.rows.map((row) => (
              <Row key={row.id} row={row} tools={tools} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
