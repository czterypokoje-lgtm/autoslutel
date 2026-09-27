import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Badge } from '../_ui';
import styles from './dashboard.module.css';

/**
 * Today, as a day column rather than a list.
 *
 * A list of six jobs tells you there are six. A day column tells you that
 * four of them are stacked between 10:00 and 13:00 and the afternoon is
 * empty, which is the thing an office actually needs to see before saying
 * yes to a seventh.
 *
 * The grid is built from the jobs themselves, not from a fixed 08:00–18:00
 * frame: an evening callout at 19:15 is normal in this business, and a frame
 * that cannot show it is worse than no frame.
 */

export interface AgendaJob {
  id: string;
  status: string;
  slot_start: string | null;
  slot_end: string | null;
  city: string | null;
  customer_name: string | null;
  car_make: string | null;
  car_model: string | null;
  technician_id: string | null;
}

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'stop' | undefined> = {
  afgerond: 'ok',
  onderweg: 'warn',
  bezig: 'warn',
  geannuleerd: 'stop',
};

/** "18:00:00" → minutes since midnight. */
function minutes(time: string | null): number | null {
  if (!time) return null;
  const [h, m] = time.split(':');
  const total = Number(h) * 60 + Number(m);
  return Number.isFinite(total) ? total : null;
}

const label = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

export default function DayAgenda({
  jobs,
  colours,
}: {
  jobs: AgendaJob[];
  /** technician id → their agenda colour, so a day reads by person. */
  colours: Map<string, string>;
}) {
  const timed = jobs
    .map((job) => ({ job, start: minutes(job.slot_start) }))
    .filter((row): row is { job: AgendaJob; start: number } => row.start !== null)
    .sort((a, b) => a.start - b.start);

  const untimed = jobs.filter((job) => minutes(job.slot_start) === null);

  if (!timed.length && !untimed.length) {
    return <div className={styles.agendaEmpty}>Niets gepland vandaag.</div>;
  }

  /*
   * Quarter-hour rows spanning only the part of the day that is used, with a
   * little air either side. Snapped to the hour so the labels line up.
   */
  const first = timed.length ? Math.floor((timed[0]!.start - 30) / 60) * 60 : 9 * 60;
  const last = timed.length
    ? Math.min(Math.ceil((timed[timed.length - 1]!.start + 90) / 60) * 60, 24 * 60)
    : 17 * 60;

  const rows: number[] = [];
  for (let t = Math.max(first, 0); t < last; t += 15) rows.push(t);

  const startingAt = new Map<number, AgendaJob[]>();
  for (const { job, start } of timed) {
    /* Snapped to its quarter, so 11:34 lands in the 11:30 row. */
    const slot = Math.floor(start / 15) * 15;
    startingAt.set(slot, [...(startingAt.get(slot) ?? []), job]);
  }

  return (
    <div className={styles.agenda}>
      {rows.map((mins) => {
        const here = startingAt.get(mins) ?? [];
        const onTheHour = mins % 60 === 0;
        return (
          <div key={mins} className={styles.slot}>
            <span className={`${styles.slotTime} ${onTheHour ? '' : styles.slotQuarter}`}>
              {label(mins)}
            </span>
            <div className={styles.slotBody}>
              {here.map((job) => {
                const end = minutes(job.slot_end);
                const colour = job.technician_id ? colours.get(job.technician_id) : undefined;
                return (
                  <Link
                    key={job.id}
                    href={`/admin/jobs/${job.id}`}
                    className={styles.event}
                    style={colour ? { borderLeftColor: colour } : undefined}
                  >
                    <div className={styles.eventTitle}>
                      {job.customer_name?.trim() ||
                        [job.car_make, job.car_model].filter(Boolean).join(' ') ||
                        'Klus'}
                    </div>
                    <div className={styles.eventMeta}>
                      {label(minutes(job.slot_start)!)}
                      {end !== null && ` – ${label(end)}`}
                      {job.city && (
                        <>
                          {' · '}
                          <MapPin size={11} style={{ verticalAlign: -1 }} /> {job.city}
                        </>
                      )}
                    </div>
                    {STATUS_TONE[job.status] && (
                      <div className={styles.eventFoot}>
                        <Badge tone={STATUS_TONE[job.status]}>{job.status}</Badge>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* A job with no slot is still today's work; it just has no place on the grid. */}
      {untimed.length > 0 && (
        <div className={styles.slot}>
          <span className={styles.slotTime}>—</span>
          <div className={styles.slotBody}>
            {untimed.map((job) => (
              <Link key={job.id} href={`/admin/jobs/${job.id}`} className={styles.event}>
                <div className={styles.eventTitle}>
                  {job.customer_name?.trim() || 'Klus'}
                </div>
                <div className={styles.eventMeta}>Geen tijd ingepland</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
