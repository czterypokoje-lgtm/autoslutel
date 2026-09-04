'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './leads.module.css';
import { waLink } from '@/lib/whatsapp';

export interface LeadRow {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  phone_e164: string | null;
  email: string | null;
  postcode: string | null;
  location: string | null;
  brand: string | null;
  model: string | null;
  year: string | null;
  kenteken: string | null;
  service: string | null;
  source: string | null;
  status: string;
  sale_price: number | string | null;
  consent_marketing: boolean | null;
  first_contact_at: string | null;
}

interface Repeat {
  count: number;
  last: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Nieuw',
  qualified: 'Gekwalificeerd',
  contacted: 'Gebeld',
  sold: 'Verkocht',
  rejected: 'Afgewezen',
  duplicate: 'Dubbel',
};

const STATUS_CLASS: Record<string, string> = {
  new: styles.stNew,
  qualified: styles.stQualified,
  contacted: styles.stContacted,
  sold: styles.stSold,
  rejected: styles.stRejected,
  duplicate: styles.stDuplicate,
};

/*
 * Timezone is pinned so the server render and the client render agree — a
 * hydration mismatch on a timestamp column is otherwise guaranteed for anyone
 * whose laptop is not on Amsterdam time.
 */
const TIME = new Intl.DateTimeFormat('nl-NL', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Amsterdam',
});

const DATE = new Intl.DateTimeFormat('nl-NL', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'Europe/Amsterdam',
});

const MONEY = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
});

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/** Dutch mobile numbers read as 06-1234 5678; anything else is left alone. */
function prettyPhone(raw: string | null, e164: string | null): string {
  const source = e164 ?? raw;
  if (!source) return '—';
  const local = source.startsWith('+31') ? `0${source.slice(3)}` : source;
  const digits = local.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('06')) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  return local;
}

export default function LeadsTable({
  rows,
  staleBefore,
  repeats,
}: {
  rows: LeadRow[];
  staleBefore: string;
  repeats: Record<string, Repeat>;
}) {
  // Server data is the starting point; saved edits are folded in here so the
  // row updates without a full page round trip.
  const [patched, setPatched] = useState<Record<string, Partial<LeadRow>>>({});
  const [focused, setFocused] = useState<number>(-1);
  const [editing, setEditing] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const view = rows.map((row) => ({ ...row, ...patched[row.id] }));

  const applyPatch = useCallback((id: string, change: Partial<LeadRow>) => {
    setPatched((prev) => ({ ...prev, [id]: { ...prev[id], ...change } }));
  }, []);

  /*
   * Keyboard first: the office does this all day and reaching for the mouse
   * between every lead is the slow path.
   */
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (event.key === 'Escape') {
        if (typing) (target as HTMLElement).blur();
        setEditing(null);
        return;
      }

      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === '/') {
        event.preventDefault();
        document.getElementById('q')?.focus();
        return;
      }

      if (event.key === 'j' || event.key === 'k') {
        event.preventDefault();
        setFocused((current) => {
          const next = event.key === 'j' ? current + 1 : current - 1;
          return Math.max(0, Math.min(rows.length - 1, next));
        });
        return;
      }

      if (event.key === 'e' && focused >= 0 && rows[focused]) {
        event.preventDefault();
        setEditing(rows[focused].id);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focused, rows]);

  useEffect(() => {
    if (focused < 0) return;
    containerRef.current
      ?.querySelectorAll('tbody tr[data-lead]')
      [focused]?.scrollIntoView({ block: 'nearest' });
  }, [focused]);

  if (rows.length === 0) {
    return (
      <div className={styles.wrap}>
        <p className={styles.empty}>Geen leads met deze filters.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap} ref={containerRef}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tijd</th>
            <th>Klant</th>
            <th>Plaats</th>
            <th>Voertuig</th>
            <th>Dienst</th>
            <th>Bron</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Waarde</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {view.map((lead, index) => {
            const isLate = lead.status === 'new' && lead.created_at < staleBefore;
            const repeat = lead.phone_e164 ? repeats[lead.phone_e164] : undefined;
            const price =
              lead.sale_price === null || lead.sale_price === ''
                ? null
                : Number(lead.sale_price);
            // Same normalisation everywhere: a "06…" number has to become
            // "316…" before wa.me will open the right chat.
            const whatsapp = waLink(lead.phone_e164 ?? lead.phone, '');

            return (
              <Fragment key={lead.id}>
                <tr
                  data-lead={lead.id}
                  className={[
                    styles.row,
                    isLate ? styles.rowStale : '',
                    index === focused ? styles.rowFocused : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setFocused(index)}
                >
                  <td className={styles.time}>
                    {TIME.format(new Date(lead.created_at))}
                    <span className={styles.dateSmall}>
                      {DATE.format(new Date(lead.created_at))}
                    </span>
                  </td>

                  <td>
                    <span className={styles.strong}>
                      {prettyPhone(lead.phone, lead.phone_e164)}
                    </span>
                    <span className={styles.sub}>
                      {lead.name ?? 'geen naam'}
                      {lead.consent_marketing === false && (
                        <span className={styles.consentNo}> · geen marketing</span>
                      )}
                    </span>
                  </td>

                  <td>
                    <span className={styles.strong}>{lead.postcode ?? '—'}</span>
                    <span className={styles.sub}>{lead.location ?? ''}</span>
                  </td>

                  <td>
                    <span className={styles.strong}>
                      {[lead.brand, lead.model].filter(Boolean).join(' ') || '—'}
                    </span>
                    <span className={styles.sub}>
                      {lead.kenteken && (
                        <span className={styles.plate}>{lead.kenteken}</span>
                      )}
                      {lead.year ? ` ${lead.year}` : ''}
                    </span>
                  </td>

                  <td>{lead.service ?? '—'}</td>
                  <td className={styles.time}>{lead.source ?? 'unknown'}</td>

                  <td>
                    <span
                      className={`${styles.badge} ${
                        STATUS_CLASS[lead.status] ?? styles.stNew
                      }`}
                    >
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                    {isLate && <span className={styles.flag}>te laat</span>}
                    {repeat && (
                      <span
                        className={styles.repeat}
                        title={`Dit nummer belde ${repeat.count} keer; vorige aanvraag ${daysAgo(
                          repeat.last
                        )} dagen geleden.`}
                      >
                        {repeat.count}×
                      </span>
                    )}
                  </td>

                  <td className={price === null ? styles.moneyEmpty : styles.money}>
                    {price === null ? '—' : MONEY.format(price)}
                  </td>

                  <td>
                    <div className={styles.actions}>
                      {lead.phone_e164 && (
                        <a className={styles.act} href={`tel:${lead.phone_e164}`}>
                          Bel
                        </a>
                      )}
                      {whatsapp && (
                        <a
                          className={styles.act}
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          App
                        </a>
                      )}
                      {/*
                        * Straight to the planner rather than a modal here: the
                        * planner needs the day's technician load to suggest
                        * anyone, and that is a server read.
                        */}
                      <Link
                        className={`${styles.act} ${styles.actPrimary}`}
                        href={`/admin/jobs/nieuw?lead=${lead.id}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        Plan in
                      </Link>
                      <button
                        className={styles.act}
                        onClick={(event) => {
                          event.stopPropagation();
                          setFocused(index);
                          setEditing(editing === lead.id ? null : lead.id);
                        }}
                      >
                        {editing === lead.id ? 'Sluit' : 'Bewerk'}
                      </button>
                    </div>
                  </td>
                </tr>

                {editing === lead.id && (
                  <LeadEditor
                    lead={lead}
                    onSaved={(change) => {
                      applyPatch(lead.id, change);
                      setEditing(null);
                    }}
                    onCancel={() => setEditing(null)}
                  />
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Status and value, in one row-level form.
 *
 * `sold` is the one status that demands a real amount: /api/export-conversions
 * sends `sale_price` to Google Ads as the conversion value, so a sold lead with
 * a blank or invented figure teaches the bidding algorithm the wrong lesson.
 * The API refuses it too — this is the message, not the guard.
 */
function LeadEditor({
  lead,
  onSaved,
  onCancel,
}: {
  lead: LeadRow;
  onSaved: (change: Partial<LeadRow>) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState(lead.status);
  const [price, setPrice] = useState(
    lead.sale_price === null ? '' : String(lead.sale_price)
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError('');

    const response = await fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        sale_price: price.trim() === '' ? null : price.trim(),
      }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Opslaan mislukt. Probeer opnieuw.');
      setSaving(false);
      return;
    }

    const body = await response.json();
    onSaved({
      status: body.lead.status,
      sale_price: body.lead.sale_price,
      first_contact_at: body.lead.first_contact_at,
    });
  }

  return (
    <tr className={styles.editRow}>
      <td colSpan={9}>
        <div className={styles.editGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor={`st-${lead.id}`}>
              Status
            </label>
            <select
              id={`st-${lead.id}`}
              className={styles.control}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              autoFocus
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor={`pr-${lead.id}`}>
              Werkelijk bedrag (€)
            </label>
            <input
              id={`pr-${lead.id}`}
              className={styles.control}
              inputMode="decimal"
              value={price}
              placeholder="249.00"
              onChange={(e) => setPrice(e.target.value)}
              size={10}
            />
          </div>

          <button className={styles.apply} onClick={save} disabled={saving}>
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
          <button className={styles.act} onClick={onCancel} disabled={saving}>
            Annuleren
          </button>

          {error && <div className={styles.editError}>{error}</div>}

          {status === 'sold' && (
            <p className={styles.editNote}>
              Dit bedrag gaat als conversiewaarde naar Google Ads. Vul het
              werkelijk gefactureerde bedrag in — een geschat getal stuurt de
              biedingen de verkeerde kant op.
            </p>
          )}
        </div>
      </td>
    </tr>
  );
}
