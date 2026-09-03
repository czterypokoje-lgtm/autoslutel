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
export default async function MijnAgendaPage() {
  const user = await requireCrmUser('/admin/mijn-agenda');
  const supabase = await createSupabaseServerClient();

  const { data: me } = await supabase
    .from('technicians')
    .select('id, name, ical_token')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!me) {
    return (
      <div className={styles.wrap}>
        <p className={styles.warning}>
          Je account is nog niet aan een monteur gekoppeld. Kantoor doet dat bij
          <strong> Monteurs</strong> — zonder koppeling is er geen agenda om te
          tonen.
        </p>
      </div>
    );
  }

  const today = isoDate(new Date());
  const from = weekStart(today);
  const to = addDays(from, 13);

  const [{ data: jobs }, { data: away }] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, status, scheduled_date, slot_start, slot_end, postcode, city, service_type, kenteken')
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

  const days: AgendaDay[] = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(from, i);
    return {
      date,
      isToday: date === today,
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
        })),
    };
  });

  return (
    <MyAgenda
      days={days}
      name={me.name as string}
      icalToken={me.ical_token as string}
    />
  );
}
