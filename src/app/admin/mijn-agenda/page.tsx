import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { addDays, isoDate, weekStart } from '@/lib/crmJobs';
import styles from '../vandaag/vandaag.module.css';
import MyAgenda, { type AgendaDay } from './MyAgenda';

export const dynamic = 'force-dynamic';

/**
 * The monteur's own two weeks: what is planned, and which days they are not
 * available. Same page for the office, showing their own linked record.
 */
export default async function MijnAgendaPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireCrmUser('/admin/mijn-agenda');
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  const { data: me } = await supabase
    .from('technicians')
    .select('id, name, ical_token')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!me) {
    return (
      <div className={styles.wrap}>
        <p className={styles.warning}>
          Je account is nog niet aan een monteur gekoppeld.
        </p>
      </div>
    );
  }

  const todayStr = isoDate(new Date());
  const displayMonthStr = params.month ? `${params.month}-01` : todayStr;
  
  // To build a 35-day grid (5 weeks), start from the Monday of the first day of the selected month.
  const firstDayOfMonth = displayMonthStr.substring(0, 8) + '01';
  const from = weekStart(firstDayOfMonth);
  const to = addDays(from, 34); // 35 days total

  const [{ data: jobs }, { data: away }] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, status, scheduled_date, slot_start, slot_end, postcode, city, service_type, kenteken, quoted_price')
      .eq('technician_id', me.id)
      .gte('scheduled_date', from)
      .lte('scheduled_date', to)
      .order('slot_start'),
    supabase
      .from('technician_availability')
      .select('date, reason')
      .eq('technician_id', me.id)
      .gte('date', from)
      .lte('date', to),
  ]);

  const awayByDate = new Map(
    (away ?? []).map((a) => [a.date as string, (a.reason as string) ?? ''])
  );

  const days: AgendaDay[] = Array.from({ length: 35 }, (_, i) => {
    const date = addDays(from, i);
    return {
      date,
      isToday: date === todayStr,
      away: awayByDate.has(date),
      reason: awayByDate.get(date) ?? '',
      jobs: (jobs ?? [])
        .filter((j) => j.scheduled_date === date)
        .map((j) => ({
          id: j.id as string,
          status: j.status as string,
          slot_start: j.slot_start as string,
          slot_end: j.slot_end as string,
          place: [j.postcode, j.city].filter(Boolean).join(' '),
          service: (j.service_type as string) ?? '',
          kenteken: (j.kenteken as string) ?? '',
          price: Number(j.quoted_price) || 0,
        })),
    };
  });

  return (
    <MyAgenda
      days={days}
      name={me.name as string}
      icalToken={me.ical_token as string}
      currentMonth={displayMonthStr.substring(0, 7)}
    />
  );
}
