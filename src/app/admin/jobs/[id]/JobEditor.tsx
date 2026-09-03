'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../jobs.module.css';
import { JOB_STATUSES, JOB_STATUS_LABELS, TIME_SLOTS, trimTime } from '@/lib/crmJobs';

export interface JobDetail {
  id: string;
  status: string;
  technician_id: string | null;
  scheduled_date: string;
  slot_start: string | null;
  slot_end: string | null;
  street: string | null;
  postcode: string | null;
  city: string | null;
  kenteken: string | null;
  service_type: string | null;
  quoted_price: number | string | null;
  final_price: number | string | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
}

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

export default function JobEditor({
  job,
  technicians,
}: {
  job: JobDetail;
  technicians: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(job.status);
  const [technicianId, setTechnicianId] = useState(job.technician_id ?? '');
  const [date, setDate] = useState(job.scheduled_date);
  const [slot, setSlot] = useState(trimTime(job.slot_start));
  const [finalPrice, setFinalPrice] = useState(
    job.final_price === null ? '' : String(job.final_price)
  );
  const [notes, setNotes] = useState(job.notes ?? '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError('');
    setSaved(false);

    const window = TIME_SLOTS.find((s) => s.start === slot);

    const response = await fetch(`/api/admin/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        technician_id: technicianId || null,
        scheduled_date: date,
        slot_start: window?.start ?? slot,
        slot_end: window?.end ?? trimTime(job.slot_end),
        final_price: finalPrice.trim() === '' ? null : finalPrice.trim(),
        notes,
      }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.error ?? 'Opslaan mislukt.');
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className={styles.planWrap}>
      <div className={styles.panel}>
        <h2>Planning</h2>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="st">Status</label>
            <select
              id="st"
              className={styles.control}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {JOB_STATUSES.map((s) => (
                <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="mt">Monteur</label>
            <select
              id="mt"
              className={styles.control}
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
            >
              <option value="">Niet toegewezen</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="dt">Datum</label>
            <input
              id="dt"
              className={styles.control}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="sl">Tijdvak</label>
            <select
              id="sl"
              className={styles.control}
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
            >
              {TIME_SLOTS.map((s) => (
                <option key={s.start} value={s.start}>{s.start}–{s.end}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="fp">
              Werkelijke prijs (€)
            </label>
            <input
              id="fp"
              className={styles.control}
              inputMode="decimal"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field} style={{ marginTop: 12 }}>
          <label className={styles.fieldLabel} htmlFor="nt">Notitie</label>
          <textarea
            id="nt"
            className={styles.control}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.primary} onClick={save} disabled={saving}>
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
          {saved && <span className={styles.note}>Opgeslagen.</span>}
          {error && <div className={styles.error}>{error}</div>}
        </div>

        <p className={styles.note}>
          De werkelijke prijs is niet hetzelfde als de afspraak. In fase 4
          schrijft die het factuurbedrag, en dat bedrag gaat als conversiewaarde
          terug naar de lead.
        </p>
      </div>

      <div className={styles.panel}>
        <h2>Gegevens</h2>
        <div className={styles.summary}>
          <span className={styles.summaryKey}>Adres</span>
          <span className={styles.summaryVal}>
            {[job.street, job.postcode, job.city].filter(Boolean).join(', ') || '—'}
          </span>
          <span className={styles.summaryKey}>Kenteken</span>
          <span className={styles.summaryVal}>{job.kenteken ?? '—'}</span>
          <span className={styles.summaryKey}>Dienst</span>
          <span className={styles.summaryVal}>{job.service_type ?? '—'}</span>
          <span className={styles.summaryKey}>Afgesproken</span>
          <span className={styles.summaryVal}>
            {job.quoted_price === null ? '—' : MONEY.format(Number(job.quoted_price))}
          </span>
          <span className={styles.summaryKey}>Gestart</span>
          <span className={styles.summaryVal}>
            {job.started_at ? job.started_at.slice(0, 16).replace('T', ' ') : '—'}
          </span>
          <span className={styles.summaryKey}>Afgerond</span>
          <span className={styles.summaryVal}>
            {job.completed_at ? job.completed_at.slice(0, 16).replace('T', ' ') : '—'}
          </span>
        </div>

        {job.postcode && (
          <a
            className={styles.secondary}
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              [job.street, job.postcode, job.city].filter(Boolean).join(' ')
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Navigeer
          </a>
        )}

        <p className={styles.note}>
          Foto&apos;s, handtekening en materiaal komen in fase 3, op het
          monteurscherm — dat is waar ze ontstaan.
        </p>
      </div>
    </div>
  );
}
