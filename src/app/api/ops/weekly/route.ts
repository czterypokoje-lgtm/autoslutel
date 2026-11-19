import { NextResponse } from 'next/server';
import { amsterdamDate, checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DAY = 86_400_000;

/** Middle value of a list, or null when it is empty. */
const median = (values: number[]): number | null => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * The Monday numbers: leads, time to first contact, jobs and revenue for the
 * last `days` days (default 7). Read only, counts and sums, no customer data.
 * `revenue` counts finished jobs with a final price; `unpriced` says how many
 * finished jobs have none.
 */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const asked = Number(new URL(request.url).searchParams.get('days'));
  const days = Number.isInteger(asked) && asked >= 1 && asked <= 31 ? asked : 7;
  const since = new Date(Date.now() - days * DAY);

  const supabase = createSupabaseAdminClient();
  const [leads, jobs, open] = await Promise.all([
    supabase
      .from('leads')
      .select('created_at, first_contact_at')
      .gte('created_at', since.toISOString())
      .is('retracted_at', null)
      .limit(5000),
    supabase
      .from('jobs')
      .select('status, final_price')
      .gte('scheduled_date', amsterdamDate(since))
      .lte('scheduled_date', amsterdamDate())
      .limit(5000),
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')
      .is('first_contact_at', null)
      .is('retracted_at', null),
  ]);

  const failed = leads.error ?? jobs.error ?? open.error;
  if (failed) {
    console.error('ops weekly read failed:', failed.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  const leadRows = leads.data ?? [];
  const minutes = leadRows
    .filter((l) => l.first_contact_at)
    .map((l) => (Date.parse(l.first_contact_at as string) - Date.parse(l.created_at)) / 60_000)
    .filter((m) => m >= 0);
  const done = (jobs.data ?? []).filter((j) => j.status === 'afgerond');
  const priced = done.filter((j) => j.final_price !== null);

  await logOps(supabase, 'weekly.read', { days });
  return NextResponse.json({
    days,
    from: amsterdamDate(since),
    to: amsterdamDate(),
    leads: {
      total: leadRows.length,
      contacted: leadRows.filter((l) => l.first_contact_at).length,
      medianMinutesToFirstContact: median(minutes) === null ? null : Math.round(median(minutes) as number),
      unansweredNow: open.count ?? 0,
    },
    jobs: {
      done: done.length,
      revenue: priced.reduce((total, j) => total + Number(j.final_price), 0),
      unpriced: done.length - priced.length,
    },
  });
}
