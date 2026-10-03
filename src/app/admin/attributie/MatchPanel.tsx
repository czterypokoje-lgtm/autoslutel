'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHead, Badge, Empty, Notice, ui } from '../_ui';
import styles from './attributie.module.css';

export interface ClickRow {
  id: string;
  at: string;
  network: string;
  campaignId: string | null;
  keyword: string | null;
  page: string | null;
  ref: string | null;
  claimed: boolean;
  hasClickId: boolean;
}

export interface JobRow {
  id: string;
  createdAt: string;
  scheduledDate: string | null;
  slotStart: string | null;
  status: string;
  customer: string | null;
  phone: string | null;
  city: string | null;
  car: string | null;
  value: number | null;
  attributed: boolean;
}

const MONEY = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

/** "2026-10-03T19:39:11+00:00" → "19:39", in Amsterdam. */
const clock = (iso: string) =>
  new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  }).format(new Date(iso));

/**
 * The matching table.
 *
 * Deliberately not drag-and-drop and not a clever auto-suggest: the office is
 * reading this next to their own phone log or WhatsApp, and the only honest
 * interaction is "I know this one — link it". Pick a click, pick the job,
 * done. Everything on screen exists to help a person recognise a call: the
 * minute it happened, which campaign paid for it, which page they were
 * reading, and the four-letter code they may have quoted in a message.
 */
export default function MatchPanel({
  date,
  today,
  clicks,
  jobs,
}: {
  date: string;
  today: string;
  clicks: ClickRow[];
  jobs: JobRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [choice, setChoice] = useState<Record<string, string>>({});

  const open = clicks.filter((c) => !c.claimed && c.hasClickId);
  const candidates = jobs.filter((j) => !j.attributed);

  async function link(clickId: string) {
    const jobId = choice[clickId];
    if (!jobId) return;
    setBusy(clickId);
    setError('');
    setDone('');

    const response = await fetch(`/api/admin/jobs/${jobId}/call-clicks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ click_id: clickId }),
    }).catch(() => null);

    const result = await response?.json().catch(() => null);
    if (!response?.ok) {
      setError(result?.error ?? 'Koppelen mislukt.');
      setBusy(null);
      return;
    }

    setDone('Gekoppeld. Deze klus telt nu mee als advertentieconversie.');
    setBusy(null);
    router.refresh();
  }

  function goToDate(value: string) {
    router.push(`/admin/attributie?datum=${value}`);
  }

  const shift = (days: number) => {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  return (
    <>
      <div className={styles.bar}>
        <button className={ui.btn} onClick={() => goToDate(shift(-1))}>
          ← Vorige dag
        </button>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => goToDate(e.target.value)}
          className={ui.input}
          style={{ maxWidth: 180 }}
        />
        <button className={ui.btn} onClick={() => goToDate(shift(1))} disabled={date >= today}>
          Volgende dag →
        </button>
        {date !== today && (
          <button className={ui.btn} onClick={() => goToDate(today)}>
            Vandaag
          </button>
        )}
      </div>

      {error && <Notice tone="bad">{error}</Notice>}
      {done && <Notice tone="ok">{done}</Notice>}

      {!candidates.length && open.length > 0 && (
        <Notice>
          {jobs.length
            ? 'Alle klussen van deze en de volgende dag hebben al een bron.'
            : 'Geen klussen op deze of de volgende dag.'}{' '}
          Een klik hoort soms bij een klus verderop in de week — zoek die klus op en koppel hem
          daar, met de code uit het WhatsApp-bericht.
        </Notice>
      )}

      <Card>
        <CardHead>
          Advertentieklikken — {open.length} vrij, {clicks.length} totaal
        </CardHead>

        {!clicks.length ? (
          <Empty>Geen advertentieklikken op deze dag.</Empty>
        ) : (
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tijd</th>
                  <th>Netwerk</th>
                  <th>Campagne</th>
                  <th>Zoekterm</th>
                  <th>Pagina</th>
                  <th>Code</th>
                  <th>Koppel aan klus</th>
                </tr>
              </thead>
              <tbody>
                {clicks.map((click) => (
                  <tr key={click.id} className={click.claimed ? styles.rowDone : undefined}>
                    <td className={styles.time}>{clock(click.at)}</td>
                    <td>
                      <Badge tone={click.network === 'Microsoft' ? undefined : 'ok'}>
                        {click.network}
                      </Badge>
                    </td>
                    <td className={styles.mono}>{click.campaignId ?? '—'}</td>
                    {/* What they actually typed into Google. Null until the
                        tracking template is set on the account. */}
                    <td className={styles.page} title={click.keyword ?? ''}>{click.keyword ?? '—'}</td>
                    <td className={styles.page} title={click.page ?? ''}>
                      {click.page ?? '—'}
                    </td>
                    {/* The code the customer may have quoted in WhatsApp —
                        the one signal here that is proof rather than a guess. */}
                    <td className={styles.ref}>{click.ref ?? '—'}</td>
                    <td>
                      {click.claimed ? (
                        <span className={styles.muted}>Al gekoppeld</span>
                      ) : !click.hasClickId ? (
                        <span className={styles.muted}>Geen klik-id — niets te melden</span>
                      ) : !candidates.length ? (
                        <span className={styles.muted}>Geen vrije klus</span>
                      ) : (
                        <div className={styles.pick}>
                          <select
                            className={ui.input}
                            value={choice[click.id] ?? ''}
                            onChange={(e) =>
                              setChoice((prev) => ({ ...prev, [click.id]: e.target.value }))
                            }
                          >
                            <option value="">— kies een klus —</option>
                            {candidates.map((job) => (
                              <option key={job.id} value={job.id}>
                                {job.scheduledDate && job.scheduledDate !== date ? 'morgen ' : ''}
                                {job.slotStart ? `${job.slotStart.slice(0, 5)} ` : ''}
                                {job.customer?.trim() || job.car || 'Klus'}
                                {job.city ? ` · ${job.city}` : ''}
                                {job.phone ? ` · ${job.phone}` : ''}
                              </option>
                            ))}
                          </select>
                          <button
                            className={`${ui.btn} ${ui.btnPrimary}`}
                            onClick={() => link(click.id)}
                            disabled={busy === click.id || !choice[click.id]}
                          >
                            {busy === click.id ? '…' : 'Koppel'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHead>
          Klussen deze en volgende dag — {candidates.length} zonder bron, {jobs.length} totaal
        </CardHead>

        {!jobs.length ? (
          <Empty>Geen klussen gepland op deze dag.</Empty>
        ) : (
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Afspraak</th>
                  <th>Ingevoerd</th>
                  <th>Klant</th>
                  <th>Telefoon</th>
                  <th>Auto</th>
                  <th>Plaats</th>
                  <th>Waarde</th>
                  <th>Bron</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className={styles.time}>{job.slotStart?.slice(0, 5) ?? '—'}</td>
                    <td className={styles.muted}>{clock(job.createdAt)}</td>
                    <td>
                      <Link href={`/admin/jobs/${job.id}`}>{job.customer?.trim() || 'Klus'}</Link>
                    </td>
                    {/* The column the office actually matches on, against
                        their own call log or WhatsApp. */}
                    <td className={styles.mono}>{job.phone ?? '—'}</td>
                    <td>{job.car ?? '—'}</td>
                    <td>{job.city ?? '—'}</td>
                    <td>{job.value ? MONEY.format(job.value) : '—'}</td>
                    <td>
                      {job.attributed ? (
                        <Badge tone="ok">Bekend</Badge>
                      ) : (
                        <Badge tone="warn">Onbekend</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Notice>
        <strong>Hoe u dit zeker weet.</strong> De code in de kolom Code is het enige harde bewijs:
        die staat in het WhatsApp-bericht van de klant. Verder gaat het om herkennen — de minuut
        van de klik, de campagne die ervoor betaalde en de pagina die ze lazen, naast uw eigen
        gesprek. Twijfelt u? Koppel niet. Een verkeerde klik naar Google leert Smart Bidding het
        verkeerde verkeer in te kopen, en dat kost meer dan een klus die als organisch geboekt
        blijft staan.
      </Notice>
    </>
  );
}
