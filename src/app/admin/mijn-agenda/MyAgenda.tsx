'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../vandaag/vandaag.module.css';
import { slotLabel } from '@/lib/crmJobs';

export interface AgendaDay {
  date: string;
  isToday: boolean;
  away: boolean;
  reason: string;
  jobs: {
    id: string;
    status: string;
    slot_start: string;
    slot_end: string;
    place: string;
    service: string;
    kenteken: string;
  }[];
}

const DAY = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'Europe/Amsterdam',
});

export default function MyAgenda({
  days,
  name,
  icalToken,
}: {
  days: AgendaDay[];
  name: string;
  icalToken: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [copied, setCopied] = useState(false);

  async function toggleAway(day: AgendaDay) {
    setBusy(day.date);
    await fetch('/api/admin/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: day.date, available: day.away }),
    }).catch(() => null);
    setBusy('');
    router.refresh();
  }

  // webcal:// makes phones offer to subscribe instead of downloading a file once.
  const feedPath = `/api/agenda/${icalToken}`;
  const feedUrl =
    typeof window === 'undefined'
      ? feedPath
      : `${window.location.origin}${feedPath}`;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h1 className={styles.title}>Mijn agenda</h1>
        <span className={styles.sub}>{name} · komende twee weken</span>
      </div>

      <div className={styles.card}>
        <div className={styles.body}>
          <span className={styles.label}>In je eigen telefoonagenda</span>
          <p className={styles.meta}>
            Abonneer je één keer; daarna verschijnen nieuwe klussen vanzelf.
            Deze link is je sleutel — deel hem niet.
          </p>
          <div className={styles.row}>
            <a
              className={`${styles.tap} ${styles.tapPrimary}`}
              href={feedUrl.replace(/^https?:/, 'webcal:')}
            >
              Toevoegen aan agenda
            </a>
            <button
              className={styles.tap}
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(feedUrl).then(
                  () => setCopied(true),
                  () => setCopied(false)
                );
              }}
            >
              {copied ? 'Gekopieerd' : 'Kopieer link'}
            </button>
          </div>
        </div>
      </div>

      {days.map((day) => (
        <div className={styles.card} key={day.date}>
          <div className={styles.cardHead}>
            <span className={styles.slot} style={{ fontSize: 16 }}>
              {DAY.format(new Date(`${day.date}T12:00:00Z`))}
            </span>
            {day.isToday && (
              <span className={`${styles.badge} ${styles.stOnderweg}`}>vandaag</span>
            )}
            {day.away && (
              <span className={`${styles.badge} ${styles.stGeannuleerd}`}>
                niet beschikbaar
              </span>
            )}
            <span className={styles.queued}>
              {day.jobs.length > 0 && `${day.jobs.length} klus`}
            </span>
          </div>

          <div className={styles.body}>
            {day.jobs.length === 0 ? (
              <div className={styles.meta}>Geen klussen.</div>
            ) : (
              day.jobs.map((job) => (
                <div key={job.id} className={styles.meta}>
                  <strong className={styles.address} style={{ fontSize: 15 }}>
                    {slotLabel(job.slot_start, job.slot_end)}
                  </strong>{' '}
                  {job.place} · {job.service || 'geen dienst'}
                  {job.kenteken && ` · ${job.kenteken}`}
                </div>
              ))
            )}

            <div className={styles.row}>
              <button
                className={styles.tap}
                onClick={() => toggleAway(day)}
                disabled={busy === day.date}
              >
                {busy === day.date
                  ? '…'
                  : day.away
                    ? 'Ik ben wél beschikbaar'
                    : 'Dag vrij nemen'}
              </button>
              {day.isToday && (
                <Link className={styles.tap} href="/admin/vandaag">
                  Naar vandaag
                </Link>
              )}
            </div>

            {day.away && day.jobs.length > 0 && (
              <p className={styles.note}>
                Let op: deze dag staat als vrij, maar er staan nog klussen
                ingepland. Kantoor moet die verzetten.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
