import { NextResponse } from 'next/server';
import { amsterdamDate, checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Today in one read: the planning and the day's figures.
 *
 * `revenue` counts finished jobs with a final price only. `unpriced` says how
 * many finished jobs have none, so a low number is not mistaken for a quiet day.
 */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createSupabaseAdminClient();
  const today = amsterdamDate();

  const [jobs, leads] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, slot_start, status, city, customer_name, car_make, car_model, quoted_price, final_price, technicians (name)')
      .eq('scheduled_date', today)
      .order('slot_start'),
    /* Two days back, then cut to today below: the Amsterdam offset changes with the season. */
    supabase
      .from('leads')
      .select('id, status, created_at')
      .gte('created_at', new Date(Date.now() - 2 * 86_400_000).toISOString()),
  ]);

  const failed = jobs.error ?? leads.error;
  if (failed) {
    console.error('ops today read failed:', failed.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  const rows = jobs.data ?? [];
  const done = rows.filter((j) => j.status === 'afgerond');
  const priced = done.filter((j) => j.final_price !== null);
  const leadsToday = (leads.data ?? []).filter((l) => amsterdamDate(new Date(l.created_at)) === today);

  await logOps(supabase, 'today.read', { date: today });
  return NextResponse.json({
    date: today,
    jobs: rows.map((j) => ({
      id: j.id,
      time: String(j.slot_start ?? '').slice(0, 5),
      status: j.status,
      city: j.city,
      customer: j.customer_name,
      car: [j.car_make, j.car_model].filter(Boolean).join(' ') || null,
      price: j.final_price ?? j.quoted_price,
      technician: (j.technicians as unknown as { name: string } | null)?.name ?? null,
    })),
    figures: {
      jobsPlanned: rows.length,
      jobsDone: done.length,
      revenue: priced.reduce((total, j) => total + Number(j.final_price), 0),
      unpriced: done.length - priced.length,
      leadsToday: leadsToday.length,
      leadsOpen: leadsToday.filter((l) => l.status === 'new').length,
    },
  });
}
