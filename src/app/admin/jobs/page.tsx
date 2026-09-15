import Link from 'next/link';
import { requireOfficeUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TIME_SLOTS, addDays, isoDate, slotLabel, weekStart } from '@/lib/crmJobs';
import styles from './jobs.module.css';
import { technicianColour } from '@/lib/crmColours';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { PageHead, ui } from '../_ui';
import GridAutoScroll from './GridAutoScroll';

export const dynamic = 'force-dynamic';

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
  job_source: string | null;
  quoted_price: number | string | null;
  car_make: string | null;
  car_model: string | null;
  car_year: number | null;
}

interface TechRow {
  id: string;
  name: string;
  active: boolean;
  color: string | null;
  online: boolean;
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
        'id, status, technician_id, scheduled_date, slot_start, slot_end, street, postcode, city, kenteken, service_type, job_source, quoted_price, car_make, car_model, car_year'
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
      {/*
        The page header comes from the shared primitives now, so Agenda opens
        the same way every other screen does. The board below keeps its own
        stylesheet: a week grid of technicians is not a list of rows, and
        forcing it through the row idiom would cost more than it saved.
      */}
      <PageHead
        title="Agenda"
        sub={`${heading} · ${rows.length} ${rows.length === 1 ? 'klus' : 'klussen'}`}
        actions={
          <>
            <div className={styles.viewSwitch}>
              <Link
                href={`/admin/jobs?datum=${date}`}
                className={view === 'dag' ? `${styles.viewLink} ${styles.viewLinkActive}` : styles.viewLink}
              >
                Dag
              </Link>
              <Link
                href={`/admin/jobs?datum=${date}&weergave=week`}
                className={view === 'week' ? `${styles.viewLink} ${styles.viewLinkActive}` : styles.viewLink}
              >
                Week
              </Link>
            </div>

            <Link
              className={`${ui.btn} ${ui.btnIcon}`}
              href={`/admin/jobs?datum=${prev}${view === 'week' ? '&weergave=week' : ''}`}
              aria-label="Vorige"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </Link>
            <Link
              className={ui.btn}
              href={`/admin/jobs?datum=${today}${view === 'week' ? '&weergave=week' : ''}`}
            >
              Vandaag
            </Link>
            <Link
              className={`${ui.btn} ${ui.btnIcon}`}
              href={`/admin/jobs?datum=${next}${view === 'week' ? '&weergave=week' : ''}`}
              aria-label="Volgende"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </Link>

            <Link className={`${ui.btn} ${ui.btnPrimary}`} href="/admin/jobs/nieuw">
              <Plus size={15} strokeWidth={2.2} />
              Nieuwe klus
            </Link>
          </>
        }
      />

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
        <DayBoard jobs={rows} technicians={techs} date={date} today={today} />
      ) : (
        <WeekBoard jobs={rows} technicians={techs} from={from} today={today} />
      )}
    </>
  );
}

/** Pixels per hour of the grid. Every offset below is a multiple of this. */
const HOUR_H = 56;
const GRID_ID = 'day-grid-scroll';

/** "14:30" → 870. Missing or unparsable time sits at the top rather than vanishing. */
function minutesOf(time: string | null): number {
  const m = /^(\d{2}):(\d{2})/.exec(String(time ?? ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

/** "Toyota Aygo 2018", or null when nobody has said which car this is yet. */
function carLine(job: { car_make: string | null; car_model: string | null; car_year: number | null }): string | null {
  const line = [job.car_make, job.car_model, job.car_year].filter(Boolean).join(' ');
  return line || null;
}

/**
 * Side-by-side columns for jobs whose times overlap, instead of stacking them
 * unreadably on top of each other. A day view never needs this (one
 * technician, one job at a time, in the ordinary case), but the week board
 * shows every technician in one column per day, and two people legitimately
 * both working 10:00–12:00 on the same day is not an edge case there.
 *
 * Greedy: sort by start, give each job the first column whose last occupant
 * has already ended, and once a run of mutually-overlapping jobs closes,
 * stamp all of them with how many columns that run actually used.
 */
function packOverlaps<T extends { id: string; start: number; end: number }>(
  items: T[]
): Map<string, { col: number; cols: number }> {
  const sorted = [...items].sort((a, b) => a.start - b.start);
  const result = new Map<string, { col: number; cols: number }>();
  const columnsEnd: number[] = [];
  let clusterIds: string[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (!clusterIds.length) return;
    const cols = Math.max(...clusterIds.map((id) => result.get(id)!.col)) + 1;
    for (const id of clusterIds) result.get(id)!.cols = cols;
    clusterIds = [];
    columnsEnd.length = 0;
  };

  for (const item of sorted) {
    if (item.start >= clusterEnd) {
      flush();
      clusterEnd = -Infinity;
    }
    let col = columnsEnd.findIndex((end) => end <= item.start);
    if (col === -1) {
      col = columnsEnd.length;
      columnsEnd.push(item.end);
    } else {
      columnsEnd[col] = item.end;
    }
    result.set(item.id, { col, cols: 1 });
    clusterIds.push(item.id);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flush();

  return result;
}

/**
 * The empty space behind the jobs, made clickable — one band per booking
 * slot (the platform only ever books in the same 2-hour windows `get_slots`
 * offers a caller, so that is the grain a planner gets too). Rendered before
 * the job blocks in the DOM, so an event sitting on top of a band still wins
 * the click; nothing here needs a z-index for that.
 */
function SlotClicks({ hrefFor }: { hrefFor: (start: string) => string }) {
  return (
    <>
      {TIME_SLOTS.map((s) => (
        <Link
          key={s.start}
          href={hrefFor(s.start)}
          className={styles.slotClick}
          style={{ top: (minutesOf(s.start) / 60) * HOUR_H, height: 2 * HOUR_H - 1 }}
          title={`Nieuwe klus om ${s.start}`}
        />
      ))}
    </>
  );
}

/**
 * Day view: a column per technician, plus one for work nobody is on yet, laid
 * out as an actual calendar — hour lines down the side, jobs as blocks
 * positioned and sized by their real start and end time.
 *
 * A flat list answers "what has this technician got today"; this answers
 * "what is this technician doing at 15:00" without anyone having to read
 * every card to find out — the gap a stacked list leaves for a planner
 * watching the day live.
 */
function DayBoard({
  jobs,
  technicians,
  date,
  today,
}: {
  jobs: JobRow[];
  technicians: TechRow[];
  date: string;
  today: string;
}) {
  const unassigned = jobs.filter((j) => !j.technician_id);
  const columns = [
    ...technicians.map((t) => ({
      key: t.id,
      name: t.name,
      color: technicianColour(t.color),
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

  const isToday = date === today;
  const nowMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : null;
  /* Scroll to two hours before now on today, or to the start of a normal working day otherwise. */
  const scrollToHour = isToday ? Math.max(0, Math.floor((nowMinutes ?? 0) / 60) - 2) : 7;

  return (
    <div
      id={GRID_ID}
      className={styles.hourGrid}
      style={{ gridTemplateColumns: `44px repeat(${columns.length}, minmax(200px, 1fr))` }}
    >
      <div className={styles.gutter}>
        <div className={styles.gutterHead} />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className={styles.gutterHour} style={{ height: HOUR_H }}>
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      {columns.map((col) => (
        <div key={col.key} className={styles.track}>
          <div className={styles.trackHead} title={col.name}>
            <span
              className={styles.dot}
              style={{ background: col.online ? col.color : 'transparent', borderColor: col.color }}
            />
            <span className={styles.colName}>{col.name}</span>
            <span className={styles.colMeta}>{col.jobs.length}</span>
          </div>

          <div
            className={styles.trackBody}
            style={{ height: HOUR_H * 24, '--hour-h': `${HOUR_H}px` } as React.CSSProperties}
          >
            {col.key !== 'unassigned' && (
              <SlotClicks hrefFor={(start) => `/admin/jobs/nieuw?datum=${date}&slot=${start}&monteur=${col.key}`} />
            )}

            {(() => {
              const times = col.jobs.map((j) => {
                const start = minutesOf(j.slot_start);
                return { id: j.id, start, end: Math.max(minutesOf(j.slot_end) || start + 120, start + 30) };
              });
              const layout = packOverlaps(times);
              const byId = new Map(times.map((t) => [t.id, t]));

              return col.jobs.map((job) => {
              const { start, end } = byId.get(job.id)!;
              const { col: colIdx, cols } = layout.get(job.id)!;
              return (
                <Link
                  key={job.id}
                  href={`/admin/jobs/${job.id}`}
                  className={`${styles.event} ${col.key === 'unassigned' ? styles.eventUnassigned : ''}`}
                  style={{
                    top: (start / 60) * HOUR_H,
                    height: ((end - start) / 60) * HOUR_H - 2,
                    borderLeftColor: col.color,
                    ...(cols > 1
                      ? { left: `calc(${colIdx} * (100% / ${cols}) + 3px)`, width: `calc(100% / ${cols} - 6px)`, right: 'auto' }
                      : {}),
                  }}
                  title={`${slotLabel(job.slot_start, job.slot_end)} · ${job.service_type ?? 'geen dienst'}`}
                >
                  <span className={styles.eventTime}>{slotLabel(job.slot_start, job.slot_end)}</span>
                  {carLine(job) && <span className={styles.eventCar}>{carLine(job)}</span>}
                  <span className={styles.eventLine}>
                    {job.service_type ?? 'geen dienst'}
                    {job.kenteken && <> · {job.kenteken}</>}
                  </span>
                  {job.postcode && <span className={styles.eventLine}>{job.postcode} {job.city}</span>}
                </Link>
              );
              });
            })()}

            {isToday && nowMinutes !== null && (
              <div className={styles.nowLine} style={{ top: (nowMinutes / 60) * HOUR_H }} />
            )}
          </div>
        </div>
      ))}

      <GridAutoScroll key={date} gridId={GRID_ID} hour={scrollToHour} hourHeight={HOUR_H} />
    </div>
  );
}

/** Week view: seven day columns. For planning and time off, not for dispatch. */
/**
 * Week view: seven day columns, same hour-grid as the day board. Jobs are
 * coloured by technician here instead of a column belonging to one — a day
 * with three technicians all out is the normal case, not an edge case, and
 * two of them booked 10:00–12:00 on the same day is exactly what
 * `packOverlaps` above exists to lay out side by side instead of stacked.
 */
function WeekBoard({
  jobs,
  technicians,
  from,
  today,
}: {
  jobs: JobRow[];
  technicians: TechRow[];
  from: string;
  today: string;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  const colourOf = new Map(technicians.map((t) => [t.id, technicianColour(t.color)]));
  const nameOf = new Map(technicians.map((t) => [t.id, t.name]));
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    <div id={GRID_ID} className={styles.hourGrid} style={{ gridTemplateColumns: `44px repeat(7, minmax(150px, 1fr))` }}>
      <div className={styles.gutter}>
        <div className={styles.gutterHead} />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className={styles.gutterHour} style={{ height: HOUR_H }}>
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      {days.map((day, index) => {
        const dayJobs = jobs.filter((j) => j.scheduled_date === day);
        const isToday = day === today;
        const times = dayJobs.map((j) => {
          const start = minutesOf(j.slot_start);
          return { id: j.id, start, end: Math.max(minutesOf(j.slot_end) || start + 120, start + 30) };
        });
        const layout = packOverlaps(times);
        const byId = new Map(times.map((t) => [t.id, t]));

        return (
          <div key={day} className={styles.track}>
            <div className={`${styles.trackHead} ${isToday ? styles.dayHeadToday : ''}`}>
              <span className={styles.colName}>
                {DAY_NAMES[index]} <span className={styles.colMeta}>{day.slice(8)}/{day.slice(5, 7)}</span>
              </span>
              <span className={styles.colMeta}>{dayJobs.length}</span>
            </div>

            <div
              className={styles.trackBody}
              style={{ height: HOUR_H * 24, '--hour-h': `${HOUR_H}px` } as React.CSSProperties}
            >
              <SlotClicks hrefFor={(start) => `/admin/jobs/nieuw?datum=${day}&slot=${start}`} />

              {dayJobs.map((job) => {
                const { start, end } = byId.get(job.id)!;
                const { col: colIdx, cols } = layout.get(job.id)!;
                const colour = job.technician_id ? colourOf.get(job.technician_id) ?? '#6b7280' : '#9d201c';
                return (
                  <Link
                    key={job.id}
                    href={`/admin/jobs/${job.id}`}
                    className={`${styles.event} ${!job.technician_id ? styles.eventUnassigned : ''}`}
                    style={{
                      top: (start / 60) * HOUR_H,
                      height: ((end - start) / 60) * HOUR_H - 2,
                      borderLeftColor: colour,
                      ...(cols > 1
                        ? { left: `calc(${colIdx} * (100% / ${cols}) + 3px)`, width: `calc(100% / ${cols} - 6px)`, right: 'auto' }
                        : {}),
                    }}
                    title={`${slotLabel(job.slot_start, job.slot_end)} · ${job.service_type ?? 'geen dienst'}`}
                  >
                    <span className={styles.eventTime}>{slotLabel(job.slot_start, job.slot_end)}</span>
                    {carLine(job) && <span className={styles.eventCar}>{carLine(job)}</span>}
                    <span className={styles.eventLine}>
                      {job.technician_id ? nameOf.get(job.technician_id) ?? '—' : 'Niet toegewezen'}
                    </span>
                    <span className={styles.eventLine}>
                      {job.service_type ?? 'geen dienst'}
                      {job.kenteken && <> · {job.kenteken}</>}
                    </span>
                  </Link>
                );
              })}

              {isToday && <div className={styles.nowLine} style={{ top: (nowMinutes / 60) * HOUR_H }} />}
            </div>
          </div>
        );
      })}

      <GridAutoScroll key={from} gridId={GRID_ID} hour={7} hourHeight={HOUR_H} />
    </div>
  );
}
