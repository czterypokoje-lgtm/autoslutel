/**
 * The arithmetic behind the agenda boards, shared by both looks.
 *
 * Moved out of page.tsx unchanged when the Studio (shadcn) agenda arrived:
 * two renderings of the same hour grid have to agree on where 14:30 sits and
 * which jobs overlap, and the cheapest way to guarantee that is for them to
 * run the same functions rather than two copies of them.
 */

export interface JobRow {
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

export interface TechRow {
  id: string;
  name: string;
  active: boolean;
  color: string | null;
  online: boolean;
}

export const DAY_NAMES = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

export const MONTHS_NL = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

export const STATUS_LABEL: Record<string, string> = {
  gepland: 'Gepland',
  onderweg: 'Onderweg',
  bezig: 'Bezig',
  afgerond: 'Afgerond',
  geannuleerd: 'Geannuleerd',
};

/** Pixels per hour of the grid. Every offset is a multiple of this. */
export const HOUR_H = 56;
export const GRID_ID = 'day-grid-scroll';

/** The colour of a job with no monteur on it, in both looks. */
export const UNASSIGNED_COLOUR = '#9d201c';

/** "14:30" → 870. Missing or unparsable time sits at the top rather than vanishing. */
export function minutesOf(time: string | null): number {
  const m = /^(\d{2}):(\d{2})/.exec(String(time ?? ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
}

/** "Toyota Aygo 2018", or null when nobody has said which car this is yet. */
export function carLine(job: { car_make: string | null; car_model: string | null; car_year: number | null }): string | null {
  const line = [job.car_make, job.car_model, job.car_year].filter(Boolean).join(' ');
  return line || null;
}

/** Start and end minute of a job block: a missing end means two hours, never zero. */
export function spanOf(job: JobRow): { id: string; start: number; end: number } {
  const start = minutesOf(job.slot_start);
  return { id: job.id, start, end: Math.max(minutesOf(job.slot_end) || start + 120, start + 30) };
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
export function packOverlaps<T extends { id: string; start: number; end: number }>(
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
