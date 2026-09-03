import Link from 'next/link';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  JOB_STATUS_LABELS,
  addDays,
  isoDate,
  slotLabel,
  weekStart,
  type JobStatus,
} from '@/lib/crmJobs';
import styles from './jobs.module.css';

export const dynamic = 'force-dynamic';

const STATUS_CLASS: Record<string, string> = {
  gepland: styles.stGepland,
  onderweg: styles.stOnderweg,
  bezig: styles.stBezig,
  afgerond: styles.stAfgerond,
  geannuleerd: styles.stGeannuleerd,
};

const DAY_NAMES = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

interface JobRow {
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
}

interface TechRow {
  id: string;
  name: string;
  active: boolean;
  color: string | null;
  online: boolean;
}

function JobCard({ job }: { job: JobRow }) {
  return (
    <Link
      href={`/admin/jobs/${job.id}`}
      className={`${styles.job} ${job.technician_id ? '' : styles.unassigned}`}
    >
      <span className={styles.jobSlot}>
        {slotLabel(job.slot_start, job.slot_end)}
      </span>{' '}
      <span
        className={`${styles.badge} ${STATUS_CLASS[job.status] ?? styles.stGepland}`}
      >
        {JOB_STATUS_LABELS[job.status as JobStatus] ?? job.status}
      </span>
      <span className={styles.jobLine}>
        {[job.postcode, job.city].filter(Boolean).join(' ') || 'geen adres'}
      </span>
      <span className={styles.jobLine}>
        {job.service_type ?? 'geen dienst'}
        {job.kenteken && <> · <span className={styles.jobPlate}>{job.kenteken}</span></>}
      </span>
    </Link>
  );
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ datum?: string; weergave?: string }>;
}) {
  await requireOfficeUser('/admin/jobs');

  const sp = await searchParams;
  const today = isoDate(new Date());
  const date =
    sp.datum && /^\d{4}-\d{2}-\d{2}$/.test(sp.datum) ? sp.datum : today;
  const view = sp.weergave === 'week' ? 'week' : 'dag';

  const from = view === 'week' ? weekStart(date) : date;
  const to = view === 'week' ? addDays(from, 6) : date;

  const supabase = await createSupabaseServerClient();

  const [{ data: jobs, error }, { data: technicians }] = await Promise.all([
    supabase
      .from('jobs')
      .select(
        'id, status, technician_id, scheduled_date, slot_start, slot_end, street, postcode, city, kenteken, service_type'
      )
      .gte('scheduled_date', from)
      .lte('scheduled_date', to)
      .order('slot_start'),
    supabase.from('technicians').select('id, name, active, color, online').order('name'),
  ]);

  if (error) {
    const denied = /permission denied|does not exist|relation/i.test(error.message);
    return (
      <div className={styles.warning}>
        De agenda kon niet worden geladen: {error.message}
        {denied && (
          <>
            <br />
            Voer <code>supabase/migrations/0004_jobs_agenda.sql</code> uit in de
            Supabase SQL editor.
          </>
        )}
      </div>
    );
  }

  const rows = (jobs ?? []) as unknown as JobRow[];
  const techs = ((technicians ?? []) as unknown as TechRow[]).filter((t) => t.active);

  const prev = view === 'week' ? addDays(from, -7) : addDays(date, -1);
  const next = view === 'week' ? addDays(from, 7) : addDays(date, 1);

  const heading =
    view === 'week'
      ? `Week van ${from}`
      : new Intl.DateTimeFormat('nl-NL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          timeZone: 'Europe/Amsterdam',
        }).format(new Date(`${date}T12:00:00Z`));

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Agenda</h1>
        <span className={styles.count}>
          {heading} · {rows.length} {rows.length === 1 ? 'klus' : 'klussen'}
        </span>

        <div className={styles.toolbar}>
          <div className={styles.viewSwitch}>
            <Link
              href={`/admin/jobs?datum=${date}`}
              className={
                view === 'dag'
                  ? `${styles.viewLink} ${styles.viewLinkActive}`
                  : styles.viewLink
              }
            >
              Dag
            </Link>
            <Link
              href={`/admin/jobs?datum=${date}&weergave=week`}
              className={
                view === 'week'
                  ? `${styles.viewLink} ${styles.viewLinkActive}`
                  : styles.viewLink
              }
            >
              Week
            </Link>
          </div>

          <Link
            className={styles.navBtn}
            href={`/admin/jobs?datum=${prev}${view === 'week' ? '&weergave=week' : ''}`}
          >
            ‹
          </Link>
          <Link
            className={styles.navBtn}
            href={`/admin/jobs?datum=${today}${view === 'week' ? '&weergave=week' : ''}`}
          >
            Vandaag
          </Link>
          <Link
            className={styles.navBtn}
            href={`/admin/jobs?datum=${next}${view === 'week' ? '&weergave=week' : ''}`}
          >
            ›
          </Link>

          <Link className={styles.navBtn} href="/admin/jobs/nieuw">
            + Klus
          </Link>
        </div>
      </div>

      {techs.length === 0 && (
        <p className={styles.warning}>
          Er zijn nog geen actieve monteurs, dus de dagweergave heeft geen
          kolommen. Voeg ze toe bij{' '}
          <Link className={styles.link} href="/admin/monteurs">
            Monteurs
          </Link>
          .
        </p>
      )}

      {view === 'dag' ? (
        <DayBoard jobs={rows} technicians={techs} />
      ) : (
        <WeekBoard jobs={rows} from={from} today={today} />
      )}
    </>
  );
}

/**
 * Day view: a column per technician, plus one for work nobody is on yet.
 * That last column is the point of the screen — an unassigned job at 15:00 is
 * the thing a planner has to see without looking for it.
 */
function DayBoard({
  jobs,
  technicians,
}: {
  jobs: JobRow[];
  technicians: TechRow[];
}) {
  const unassigned = jobs.filter((j) => !j.technician_id);
  const columns = [
    ...technicians.map((t) => ({
      key: t.id,
      name: t.name,
      color: t.color ?? '#2c4a63',
      online: t.online,
      jobs: jobs.filter((j) => j.technician_id === t.id),
    })),
    ...(unassigned.length > 0 || technicians.length === 0
      ? [
          {
            key: 'unassigned',
            name: 'Niet toegewezen',
            color: '#9d201c',
            online: false,
            jobs: unassigned,
          },
        ]
      : []),
  ];

  if (columns.length === 0) {
    return <p className={styles.empty}>Geen monteurs en geen klussen.</p>;
  }

  return (
    <div
      className={styles.board}
      style={{
        gridTemplateColumns: `repeat(${columns.length}, minmax(200px, 1fr))`,
      }}
    >
      {columns.map((col) => (
        <div key={col.key} className={styles.col}>
          <div className={styles.colHead}>
            <span className={styles.dot} style={{ background: col.color }} />
            <span className={styles.colName}>{col.name}</span>
            {col.key !== 'unassigned' && (
              <span className={styles.colMeta} title={col.online ? 'Op dienst' : 'Uit dienst'}>
                {col.online ? '● op dienst' : '○ uit dienst'}
              </span>
            )}
            <span className={styles.colMeta}>
              {col.jobs.length} {col.jobs.length === 1 ? 'klus' : 'klussen'}
            </span>
          </div>
          <div className={styles.colBody}>
            {col.jobs.length === 0 ? (
              <span className={styles.jobLine}>vrij</span>
            ) : (
              col.jobs.map((job) => <JobCard key={job.id} job={job} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Week view: seven day columns. For planning and time off, not for dispatch. */
function WeekBoard({
  jobs,
  from,
  today,
}: {
  jobs: JobRow[];
  from: string;
  today: string;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));

  return (
    <div className={styles.week}>
      {days.map((day, index) => {
        const dayJobs = jobs.filter((j) => j.scheduled_date === day);
        return (
          <div key={day} className={styles.col}>
            <div
              className={`${styles.dayHead} ${day === today ? styles.dayHeadToday : ''}`}
            >
              {DAY_NAMES[index]}
              <span className={styles.dayMeta}>{day.slice(8)}/{day.slice(5, 7)}</span>
              <span className={styles.dayMeta}>{dayJobs.length}</span>
            </div>
            <div className={styles.colBody}>
              {dayJobs.length === 0 ? (
                <span className={styles.jobLine}>vrij</span>
              ) : (
                dayJobs.map((job) => <JobCard key={job.id} job={job} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
