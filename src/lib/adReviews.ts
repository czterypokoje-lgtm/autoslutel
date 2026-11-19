/** The conversion name must match Google Ads exactly, see /offline-conversions. */
const CONVERSION_NAME = 'Job Completed';

export interface ConfirmedReview {
  work_date: string | null;
  value: number | string | null;
  gclid: string | null;
}

export type Decision = { decision: 'gedaan' | 'geen_job'; value: number | null; workDate: string | null };

/** A verdict from the screen. "Done" needs a date, because Google needs one. */
export function readDecision(body: Record<string, unknown>): Decision | { error: string } {
  if (body.decision === 'geen_job') return { decision: 'geen_job', value: null, workDate: null };
  if (body.decision !== 'gedaan') return { error: 'Kies gedaan of geen job' };

  const workDate = typeof body.workDate === 'string' ? body.workDate : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) return { error: 'Vul de datum van de klus in' };

  const raw = body.value;
  if (raw === null || raw === undefined || raw === '') return { decision: 'gedaan', value: null, workDate };
  const value = Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0 || value >= 100_000) return { error: 'Ongeldig bedrag' };
  return { decision: 'gedaan', value: Math.round(value * 100) / 100, workDate };
}

/**
 * The upload file. A row without a click id or a date is left out, and an
 * unknown value stays blank: to Google a 0 means the work was worth nothing.
 */
export function reviewsCsv(rows: ConfirmedReview[]) {
  const lines = rows
    .filter((r) => r.gclid && r.work_date)
    .map((r) => {
      const value = Number(r.value) > 0 ? String(Number(r.value)) : '';
      return `${r.gclid},${CONVERSION_NAME},${r.work_date} 12:00:00,${value},EUR`;
    });
  return [
    'Parameters:TimeZone=Europe/Amsterdam',
    'Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency',
    ...lines,
    '',
  ].join('\n');
}
