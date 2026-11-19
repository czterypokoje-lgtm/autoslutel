'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, CalendarX, ChevronLeft, ChevronRight, Copy, MapPin, Wrench } from 'lucide-react';
import styles from './Calendar.module.css';

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
    price?: number;
  }[];
}

const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const DOW = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const STATUS: Record<string, string> = { gepland: 'Gepland', onderweg: 'Onderweg', bezig: 'Bezig', afgerond: 'Afgerond', geannuleerd: 'Geannuleerd' };
const EUR = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

/** ISO week number of a yyyy-mm-dd date. */
function isoWeek(iso: string): number {
  const d = new Date(`${iso}T12:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

const longDate = (iso: string) =>
  new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

/**
 * The technician's month: jobs per day, days off, and a side panel for the
 * chosen day where a day can be blocked or freed again.
 */
export default function MyAgenda({
  days,
  name,
  icalToken,
  currentMonth,
}: {
  days: AgendaDay[];
  name: string;
  icalToken: string | null;
  currentMonth: string;
}) {
  const router = useRouter();
  const today = days.find((d) => d.isToday)?.date ?? days.find((d) => d.date.startsWith(currentMonth))?.date ?? days[0]?.date;
  const [selected, setSelected] = useState<string | undefined>(today);
  const [busy, setBusy] = useState('');
  const [copied, setCopied] = useState(false);
  const active = days.find((d) => d.date === selected);

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

  const [y, m] = currentMonth.split('-').map(Number);
  const shift = (delta: number) => {
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    router.push(`?month=${d.toISOString().slice(0, 7)}`);
  };

  const monthDays = days.filter((d) => d.date.startsWith(currentMonth));
  const monthJobs = monthDays.reduce((t, d) => t + d.jobs.filter((j) => j.status !== 'geannuleerd').length, 0);
  const monthValue = monthDays.reduce((t, d) => t + d.jobs.reduce((s, j) => s + (j.price || 0), 0), 0);
  const daysOff = monthDays.filter((d) => d.away).length;

  // The host is only known in the browser; until then the buttons wait.
  const host = useSyncExternalStore(
    () => () => {},
    () => window.location.host,
    () => ''
  );
  const feed = icalToken && host ? `${host}/api/agenda/${icalToken}` : null;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Mijn agenda</h1>
          <p className={styles.sub}>
            {name} · tik een dag om je klussen te zien of de dag vrij te nemen.
          </p>
        </div>
        {feed && (
          <div className={styles.feed}>
            <a className={styles.feedBtn} href={`webcal://${feed}`}>
              <CalendarCheck size={16} aria-hidden="true" />
              Zet in je telefoon-agenda
            </a>
            <button
              type="button"
              className={styles.feedCopy}
              onClick={() => {
                void navigator.clipboard?.writeText(`https://${feed}`);
                setCopied(true);
              }}
            >
              <Copy size={14} aria-hidden="true" />
              {copied ? 'Gekopieerd' : 'Kopieer link'}
            </button>
          </div>
        )}
      </header>

      <div className={styles.stats}>
        <div><span>Klussen in {MONTHS[m - 1]}</span><b>{monthJobs}</b></div>
        <div><span>Verwachte omzet</span><b>{EUR.format(monthValue)}</b></div>
        <div><span>Vrije dagen</span><b>{daysOff}</b></div>
      </div>

      <div className={styles.layout}>
        <section className={styles.cal} aria-label="Maand">
          <div className={styles.calHead}>
            <button type="button" className={styles.nav} onClick={() => shift(-1)} aria-label="Vorige maand">
              <ChevronLeft size={18} />
            </button>
            <span className={styles.month}>
              {MONTHS[m - 1]} {y}
            </span>
            <button type="button" className={styles.nav} onClick={() => shift(1)} aria-label="Volgende maand">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className={styles.grid}>
            <span className={styles.wk}>wk</span>
            {DOW.map((d) => (
              <span key={d} className={styles.dow}>
                {d}
              </span>
            ))}
            {Array.from({ length: Math.ceil(days.length / 7) }, (_, w) => (
              <div key={w} className={styles.week}>
                <span className={styles.wkNum}>{days[w * 7] ? isoWeek(days[w * 7].date) : ''}</span>
                {days.slice(w * 7, w * 7 + 7).map((d) => {
                  const live = d.jobs.filter((j) => j.status !== 'geannuleerd');
                  const cls = [
                    styles.day,
                    !d.date.startsWith(currentMonth) && styles.dayOut,
                    d.away && styles.dayAway,
                    d.isToday && styles.dayToday,
                    d.date === selected && styles.daySel,
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <button key={d.date} type="button" className={cls} onClick={() => setSelected(d.date)}>
                      <span className={styles.dayNum}>{Number(d.date.slice(8))}</span>
                      {d.away ? (
                        <span className={styles.awayTag}>vrij</span>
                      ) : live.length > 0 ? (
                        <span className={styles.jobs}>
                          {live.slice(0, 3).map((j) => (
                            <span key={j.id} className={`${styles.pip} ${styles[`pip_${j.status}`] ?? ''}`} />
                          ))}
                          <span className={styles.jobCount}>{live.length}</span>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className={styles.legend}>
            <span><i className={`${styles.pip} ${styles.pip_gepland}`} /> gepland</span>
            <span><i className={`${styles.pip} ${styles.pip_bezig}`} /> onderweg / bezig</span>
            <span><i className={`${styles.pip} ${styles.pip_afgerond}`} /> afgerond</span>
            <span><i className={styles.awaySwatch} /> vrij</span>
          </div>
        </section>

        <aside className={styles.side} aria-label="Gekozen dag">
          {!active ? (
            <p className={styles.muted}>Tik een dag in de kalender.</p>
          ) : (
            <>
              <h2 className={styles.sideTitle}>{longDate(active.date)}</h2>

              <button
                type="button"
                className={active.away ? styles.freeBtn : styles.blockBtn}
                onClick={() => toggleAway(active)}
                disabled={busy === active.date}
              >
                {active.away ? <CalendarCheck size={17} /> : <CalendarX size={17} />}
                {busy === active.date ? 'Bezig…' : active.away ? 'Toch beschikbaar' : 'Deze dag vrij nemen'}
              </button>
              {active.away && (
                <p className={styles.awayNote}>Je staat vrij{active.reason ? `: ${active.reason}` : ''}. Je krijgt deze dag geen aanbod.</p>
              )}

              {active.jobs.length === 0 ? (
                <p className={styles.muted}>Geen klussen op deze dag.</p>
              ) : (
                <ul className={styles.jobList}>
                  {active.jobs.map((job) => (
                    <li key={job.id} className={styles.job}>
                      <div className={styles.jobTop}>
                        <b>
                          {job.slot_start.slice(0, 5)}–{job.slot_end.slice(0, 5)}
                        </b>
                        <span className={`${styles.status} ${styles[`st_${job.status}`] ?? ''}`}>{STATUS[job.status] ?? job.status}</span>
                      </div>
                      <span className={styles.jobLine}>
                        <Wrench size={14} aria-hidden="true" />
                        {job.service || 'Geen dienst'}
                        {job.kenteken && <span className={styles.plate}>{job.kenteken}</span>}
                      </span>
                      {job.place && (
                        <span className={styles.jobLine}>
                          <MapPin size={14} aria-hidden="true" />
                          {job.place}
                        </span>
                      )}
                      {job.price ? <span className={styles.jobPrice}>{EUR.format(job.price)}</span> : null}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
