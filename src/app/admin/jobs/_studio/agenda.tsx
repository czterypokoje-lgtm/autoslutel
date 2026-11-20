import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

import { PreviewText } from '@/app/admin/PreviewLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBrandLogo } from '@/lib/brandLogos';
import { technicianColour } from '@/lib/crmColours';
import { TIME_SLOTS, addDays, slotLabel } from '@/lib/crmJobs';

import GridAutoScroll from '../GridAutoScroll';
import {
  DAY_NAMES,
  GRID_ID,
  HOUR_H,
  STATUS_LABEL,
  UNASSIGNED_COLOUR,
  carLine,
  minutesOf,
  packOverlaps,
  spanOf,
  type JobRow,
  type TechRow,
} from '../grid';
import MiniMonth from './mini-month';

/**
 * The Studio (shadcn) agenda.
 *
 * Presentation only: page.tsx still does the role check, the Supabase read and
 * the date arithmetic, and hands the result here. Every link, URL parameter,
 * technician colour and status colour is the one the old board used — what
 * changed is Cards and a Tailwind grid instead of jobs.module.css.
 */

/** The four status colours of the old stylesheet, kept to the pixel. */
const STATUS_COLOUR: Record<string, string> = {
  gepland: '#2563eb',
  onderweg: '#d97706',
  bezig: '#d97706',
  afgerond: '#16a34a',
  geannuleerd: '#94a3b8',
};

const statusColour = (status: string) => STATUS_COLOUR[status] ?? '#94a3b8';

/** Hour lines drawn as one background instead of 24 divider elements per column. */
const HOUR_LINES = {
  backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0, var(--border) 1px, transparent 1px, transparent ${HOUR_H}px)`,
};

export default function StudioAgenda({
  jobs,
  technicians,
  date,
  view,
  from,
  to,
  today,
  prev,
  next,
  heading,
  sub,
  unassignedCount,
}: {
  jobs: JobRow[];
  technicians: TechRow[];
  date: string;
  view: string;
  from: string;
  to: string;
  today: string;
  prev: string;
  next: string;
  heading: string;
  sub: string;
  unassignedCount: number;
}) {
  const weekQuery = view === 'week' ? '&weergave=week' : '';

  return (
    <div className="kfc-neutral flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none font-medium tracking-tight">
            <PreviewText>Agenda</PreviewText>
          </h1>
          <p className="text-muted-foreground text-sm">{sub}</p>
        </div>
        <Button asChild>
          <Link href={`/admin/jobs/nieuw?datum=${date}`}>
            <Plus data-icon="inline-start" />
            <PreviewText>{'Klus inplannen'}</PreviewText>
          </Link>
        </Button>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] md:gap-6">
        <aside className="flex flex-col gap-4 md:gap-6">
          <Card className="py-0">
            <CardContent className="px-0">
              <MiniMonth date={date} from={from} to={to} view={view} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                <PreviewText>{'Monteurs'}</PreviewText>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {technicians.map((t) => {
                const count = jobs.filter((j) => j.technician_id === t.id && j.status !== 'geannuleerd').length;
                return (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: technicianColour(t.color) }} />
                    <span className="min-w-0 flex-1 truncate">{t.name}</span>
                    <span className="text-muted-foreground tabular-nums">{count}</span>
                  </div>
                );
              })}
              {unassignedCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: UNASSIGNED_COLOUR }} />
                  <span className="min-w-0 flex-1 truncate">
                    <PreviewText>{'Zonder monteur'}</PreviewText>
                  </span>
                  <span className="text-destructive font-medium tabular-nums">{unassignedCount}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {(['gepland', 'onderweg', 'afgerond', 'geannuleerd'] as const).map((st) => (
                <div key={st} className="flex items-center gap-2 text-sm">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: statusColour(st) }} />
                  <span>
                    {STATUS_LABEL[st]}
                    {st === 'onderweg' ? ' / bezig' : ''}
                  </span>
                </div>
              ))}
              <p className="text-muted-foreground text-xs">
                Klik een leeg vak in de agenda om daar een klus in te plannen.
              </p>
            </CardContent>
          </Card>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <Card className="py-3">
            <CardContent className="flex flex-wrap items-center gap-2 px-3">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/jobs?datum=${today}${weekQuery}`}>
                  <PreviewText>{'Vandaag'}</PreviewText>
                </Link>
              </Button>
              <Button variant="outline" size="icon-sm" asChild>
                <Link href={`/admin/jobs?datum=${prev}${weekQuery}`} aria-label="Vorige">
                  <ChevronLeft />
                </Link>
              </Button>
              <Button variant="outline" size="icon-sm" asChild>
                <Link href={`/admin/jobs?datum=${next}${weekQuery}`} aria-label="Volgende">
                  <ChevronRight />
                </Link>
              </Button>
              <span className="text-sm font-medium first-letter:uppercase">{heading}</span>
              <span className="flex-1" />
              <div className="bg-muted flex items-center gap-0.5 rounded-md p-0.5">
                <Button variant={view === 'dag' ? 'outline' : 'ghost'} size="sm" asChild>
                  <Link href={`/admin/jobs?datum=${date}`}>Dag</Link>
                </Button>
                <Button variant={view === 'week' ? 'outline' : 'ghost'} size="sm" asChild>
                  <Link href={`/admin/jobs?datum=${date}&weergave=week`}>Week</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {technicians.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Er zijn nog geen actieve monteurs, dus de dagweergave heeft geen kolommen. Voeg ze toe bij{' '}
              <Link className="underline" href="/admin/monteurs">
                <PreviewText>{'Monteurs'}</PreviewText>
              </Link>
              .
            </p>
          )}

          {/*
            Two renderings of the same rows, one shown at a time. The hour grid
            is ~1100px wide at its narrowest and no breakpoint changes that — a
            time grid squeezed into 375px is not a smaller time grid, it is an
            unreadable one. A phone gets the schedule below instead.
          */}
          <div className="hidden min-w-0 lg:block">
            {view === 'dag' ? (
              <DayBoard jobs={jobs} technicians={technicians} date={date} today={today} />
            ) : (
              <WeekBoard jobs={jobs} technicians={technicians} from={from} today={today} />
            )}
          </div>

          <div className="lg:hidden">
            <AgendaList jobs={jobs} technicians={technicians} today={today} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** The car maker's logo, tiny, at the right of the time line. */
function BrandMark({ make }: { make: string | null }) {
  const src = getBrandLogo(make);
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="ml-auto h-3.5 w-auto opacity-80" />;
}

/** The shell both boards sit in: one scroll container, hour gutter pinned left. */
function Board({ columns, children }: { columns: number; children: React.ReactNode }) {
  return (
    <div
      id={GRID_ID}
      className="bg-border grid max-h-[calc(100vh-190px)] gap-px overflow-auto rounded-lg border [overscroll-behavior:contain]"
      style={{ gridTemplateColumns: `44px repeat(${columns}, minmax(200px, 1fr))` }}
    >
      <div className="bg-card sticky left-0 z-20 min-w-[52px]">
        <div className="bg-muted sticky top-0 z-10 h-11 border-b" />
        {Array.from({ length: 24 }, (_, h) => (
          <div
            key={h}
            className="text-muted-foreground box-border pt-0.5 pr-2 text-right text-[11px] tabular-nums"
            style={{ height: HOUR_H }}
          >
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

/** One technician's or one day's column: sticky head, then the positioned body. */
function Track({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card relative">
      <div className="bg-muted sticky top-0 z-10 flex h-11 items-center gap-2 border-b px-2.5">{head}</div>
      <div className="relative" style={{ height: HOUR_H * 24, ...HOUR_LINES }}>
        {children}
      </div>
    </div>
  );
}

/**
 * The empty space behind the jobs, made clickable — one band per booking slot,
 * the same grain `get_slots` offers a caller. Rendered before the job blocks,
 * so an event sitting on top still wins the click.
 */
function SlotClicks({ hrefFor }: { hrefFor: (start: string) => string }) {
  return (
    <>
      {TIME_SLOTS.map((s) => (
        <Link
          key={s.start}
          href={hrefFor(s.start)}
          className="hover:bg-muted/60 absolute inset-x-0 block"
          style={{ top: (minutesOf(s.start) / 60) * HOUR_H, height: 2 * HOUR_H - 1 }}
          title={`Nieuwe klus om ${s.start}`}
        />
      ))}
    </>
  );
}

/** A job as a block on the time axis, positioned and sized by its real times. */
function Event({
  job,
  colour,
  unassigned,
  start,
  end,
  col,
  cols,
  children,
}: {
  job: JobRow;
  colour: string;
  unassigned: boolean;
  start: number;
  end: number;
  col: number;
  cols: number;
  children?: React.ReactNode;
}) {
  const cancelled = job.status === 'geannuleerd';
  return (
    <Link
      href={`/admin/jobs/${job.id}`}
      className={`absolute inset-x-[3px] flex flex-col gap-0.5 overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-[11px] leading-tight hover:z-10 hover:ring-1 ${
        unassigned ? '[border-left-style:dashed]' : ''
      } ${cancelled ? 'line-through opacity-55' : ''}`.trim()}
      style={{
        top: (start / 60) * HOUR_H,
        height: ((end - start) / 60) * HOUR_H - 2,
        borderLeftColor: colour,
        background: `color-mix(in srgb, ${colour} 13%, var(--card))`,
        ...(cols > 1
          ? { left: `calc(${col} * (100% / ${cols}) + 3px)`, width: `calc(100% / ${cols} - 6px)`, right: 'auto' }
          : {}),
      }}
      title={`${slotLabel(job.slot_start, job.slot_end)} · ${job.service_type ?? 'geen dienst'}`}
    >
      <span className="flex items-center gap-1.5 font-semibold tabular-nums">
        <span className="size-2 shrink-0 rounded-full" style={{ background: statusColour(job.status) }} aria-hidden="true" />
        {slotLabel(job.slot_start, job.slot_end)}
        <BrandMark make={job.car_make} />
      </span>
      {children}
    </Link>
  );
}

/** The red line across today at the current time. */
function NowLine({ minutes }: { minutes: number }) {
  return (
    <div
      className="bg-destructive absolute inset-x-0 z-10 h-0.5"
      style={{ top: (minutes / 60) * HOUR_H }}
    >
      <span className="bg-destructive absolute -top-[3px] -left-1 size-2 rounded-full" />
    </div>
  );
}

/**
 * Day view: a column per technician, plus one for work nobody is on yet, laid
 * out as an actual calendar. A flat list answers "what has this technician got
 * today"; this answers "what is this technician doing at 15:00".
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
      ? [{ key: 'unassigned', name: 'Niet toegewezen', color: UNASSIGNED_COLOUR, online: false, jobs: unassigned }]
      : []),
  ];

  if (columns.length === 0) {
    return <p className="text-muted-foreground text-sm">Geen monteurs en geen klussen.</p>;
  }

  const isToday = date === today;
  const nowMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : null;
  /* Scroll to two hours before now on today, or to the start of a normal working day otherwise. */
  const scrollToHour = isToday ? Math.max(0, Math.floor((nowMinutes ?? 0) / 60) - 2) : 7;

  return (
    <Board columns={columns.length}>
      {columns.map((col) => {
        const times = col.jobs.map(spanOf);
        const layout = packOverlaps(times);
        const byId = new Map(times.map((t) => [t.id, t]));

        return (
          <Track
            key={col.key}
            head={
              <>
                <span
                  className="size-2 shrink-0 rounded-full border-[1.5px]"
                  style={{ background: col.online ? col.color : 'transparent', borderColor: col.color }}
                />
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold" title={col.name}>
                  {col.name}
                </span>
                <span className="text-muted-foreground text-[11px] tabular-nums">{col.jobs.length}</span>
              </>
            }
          >
            {col.key !== 'unassigned' && (
              <SlotClicks hrefFor={(start) => `/admin/jobs/nieuw?datum=${date}&slot=${start}&monteur=${col.key}`} />
            )}

            {col.jobs.map((job) => {
              const { start, end } = byId.get(job.id)!;
              const { col: colIdx, cols } = layout.get(job.id)!;
              return (
                <Event
                  key={job.id}
                  job={job}
                  colour={col.color}
                  unassigned={col.key === 'unassigned'}
                  start={start}
                  end={end}
                  col={colIdx}
                  cols={cols}
                >
                  {carLine(job) && <span className="truncate font-medium">{carLine(job)}</span>}
                  <span className="text-muted-foreground truncate">
                    {job.service_type ?? 'geen dienst'}
                    {job.kenteken && <> · {job.kenteken}</>}
                  </span>
                  {job.postcode && (
                    <span className="text-muted-foreground truncate">
                      {job.postcode} {job.city}
                    </span>
                  )}
                </Event>
              );
            })}

            {isToday && nowMinutes !== null && <NowLine minutes={nowMinutes} />}
          </Track>
        );
      })}

      <GridAutoScroll key={date} gridId={GRID_ID} hour={scrollToHour} hourHeight={HOUR_H} />
    </Board>
  );
}

/**
 * Week view: seven day columns, same hour grid. Jobs are coloured by
 * technician here instead of a column belonging to one — a day with three
 * technicians all out is the normal case.
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
    <Board columns={7}>
      {days.map((day, index) => {
        const dayJobs = jobs.filter((j) => j.scheduled_date === day);
        const isToday = day === today;
        const times = dayJobs.map(spanOf);
        const layout = packOverlaps(times);
        const byId = new Map(times.map((t) => [t.id, t]));

        return (
          <Track
            key={day}
            head={
              <>
                <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${isToday ? 'text-primary' : ''}`}>
                  {DAY_NAMES[index]}{' '}
                  <span className="text-muted-foreground text-[11px] tabular-nums">
                    {day.slice(8)}/{day.slice(5, 7)}
                  </span>
                </span>
                <span className="text-muted-foreground text-[11px] tabular-nums">{dayJobs.length}</span>
              </>
            }
          >
            <SlotClicks hrefFor={(start) => `/admin/jobs/nieuw?datum=${day}&slot=${start}`} />

            {dayJobs.map((job) => {
              const { start, end } = byId.get(job.id)!;
              const { col: colIdx, cols } = layout.get(job.id)!;
              const colour = job.technician_id ? colourOf.get(job.technician_id) ?? '#6b7280' : UNASSIGNED_COLOUR;
              return (
                <Event
                  key={job.id}
                  job={job}
                  colour={colour}
                  unassigned={!job.technician_id}
                  start={start}
                  end={end}
                  col={colIdx}
                  cols={cols}
                >
                  {carLine(job) && <span className="truncate font-medium">{carLine(job)}</span>}
                  <span className="text-muted-foreground truncate">
                    {job.technician_id ? nameOf.get(job.technician_id) ?? '—' : 'Niet toegewezen'}
                  </span>
                  <span className="text-muted-foreground truncate">
                    {job.service_type ?? 'geen dienst'}
                    {job.kenteken && <> · {job.kenteken}</>}
                  </span>
                </Event>
              );
            })}

            {isToday && <NowLine minutes={nowMinutes} />}
          </Track>
        );
      })}

      <GridAutoScroll key={from} gridId={GRID_ID} hour={7} hourHeight={HOUR_H} />
    </Board>
  );
}

/**
 * The phone rendering: days in order, jobs in order, under a day header. Empty
 * days are left out rather than drawn as blank space — a schedule answers
 * "what is next", and a day with nothing in it is not an answer.
 */
function AgendaList({ jobs, technicians, today }: { jobs: JobRow[]; technicians: TechRow[]; today: string }) {
  const colourOf = new Map(technicians.map((t) => [t.id, technicianColour(t.color)]));
  const nameOf = new Map(technicians.map((t) => [t.id, t.name]));

  const byDay = new Map<string, JobRow[]>();
  for (const job of jobs) {
    const day = job.scheduled_date;
    if (!day) continue;
    const list = byDay.get(day);
    if (list) list.push(job);
    else byDay.set(day, [job]);
  }

  const days = [...byDay.keys()].sort();
  for (const day of days) {
    byDay.get(day)!.sort((a, b) => minutesOf(a.slot_start) - minutesOf(b.slot_start));
  }

  if (days.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground text-sm">
          <PreviewText>{'Geen klussen in deze periode.'}</PreviewText>
        </CardContent>
      </Card>
    );
  }

  const dayLabel = new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Amsterdam',
  });

  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => {
        const dayJobs = byDay.get(day)!;
        const isToday = day === today;
        return (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium first-letter:uppercase">
                {dayLabel.format(new Date(`${day}T12:00:00Z`))}
                {isToday && (
                  <Badge variant="secondary">
                    <PreviewText>{'vandaag'}</PreviewText>
                  </Badge>
                )}
              </CardTitle>
              <CardAction className="text-muted-foreground text-xs tabular-nums">
                {dayJobs.length} <PreviewText>{dayJobs.length === 1 ? 'klus' : 'klussen'}</PreviewText>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {dayJobs.map((job) => {
                const colour = job.technician_id ? colourOf.get(job.technician_id) ?? '#6b7280' : UNASSIGNED_COLOUR;
                const car = carLine(job);
                return (
                  <Link
                    key={job.id}
                    href={`/admin/jobs/${job.id}`}
                    className="hover:bg-muted/60 flex gap-3 rounded-md border border-l-4 p-2 text-sm"
                    style={{ borderLeftColor: colour }}
                  >
                    <span className="flex w-14 shrink-0 flex-col tabular-nums">
                      <span className="font-semibold">{(job.slot_start ?? '').slice(0, 5) || '--:--'}</span>
                      <span className="text-muted-foreground text-xs">{(job.slot_end ?? '').slice(0, 5) || ''}</span>
                    </span>
                    <span className="flex min-w-0 flex-col">
                      {/* The car identifies the job at a glance; the service and plate qualify it. */}
                      <span className="truncate font-medium">{car ?? job.service_type ?? 'Klus'}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {job.service_type ?? 'geen dienst'}
                        {job.kenteken ? ` · ${job.kenteken}` : ''}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {job.technician_id ? nameOf.get(job.technician_id) ?? '—' : 'Niet toegewezen'}
                        {job.city ? ` · ${job.city}` : ''}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
