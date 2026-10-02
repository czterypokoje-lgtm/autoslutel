import { requireCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHead, Notice, HelpSteps } from '../_ui';
import { getBrandLogo } from '@/lib/brandLogos';
import { SCENARIO_INFO, isScenario } from '@/lib/scenarios';
import { slotLabel } from '@/lib/crmJobs';
import OfferList, { type OfferRow } from './OfferList';

export const dynamic = 'force-dynamic';

/**
 * Work being offered to this technician right now.
 *
 * Offered, never assigned. Declining costs nothing and is recorded without
 * comment — that is a legal position as much as a courtesy: we set the price,
 * take the payment and route the work, and a contractor who cannot say no to
 * any of it starts to look like an employee to the Belastingdienst.
 *
 * The address is deliberately incomplete until the job is accepted. The
 * postcode and the town are enough to judge the drive; the door number is the
 * customer's, and it is not handed to five people so one of them can take it.
 */
export default async function AanbodPage() {
  const user = await requireCrmUser('/admin/aanbod');
  const supabase = await createSupabaseServerClient();

  const { data: me } = await supabase
    .from('technicians')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!me) {
    return (
      <>
        <PageHead title="Aanbod" />
        <Notice tone="bad">Je login is nog niet aan een monteur gekoppeld.</Notice>
      </>
    );
  }

  const { data, error } = await supabase
    .from('job_offers')
    .select(
      'id, rank, score, reason, offered_at, expires_at, jobs (id, scheduled_date, slot_start, slot_end, postcode, city, car_make, car_model, car_year, scenario, quoted_price, keyless, technician_id)'
    )
    .eq('technician_id', me.id)
    .is('response', null)
    .order('expires_at');

  if (error) {
    return (
      <>
        <PageHead title="Aanbod" />
        <Notice tone="bad">
          {/does not exist|relation/i.test(error.message)
            ? 'Voer supabase/migrations/0013_technician_platform.sql uit.'
            : error.message}
        </Notice>
      </>
    );
  }

  const now = Date.now();

  const offers: OfferRow[] = (data ?? [])
    .flatMap((row) => {
      const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
      if (!job) return [];
      // Already taken by someone faster, or the window has not opened yet.
      if (job.technician_id) return [];
      if (new Date(row.offered_at).getTime() > now) return [];
      if (new Date(row.expires_at).getTime() < now) return [];

      const scenario = isScenario(job.scenario) ? job.scenario : null;

      return [
        {
          id: row.id,
          reason: row.reason ?? '',
          expiresAt: row.expires_at,
          offeredAt: row.offered_at,
          logo: getBrandLogo(job.car_make),
          make: job.car_make ?? null,
          car: [job.car_make, job.car_model, job.car_year].filter(Boolean).join(' ') || 'Onbekende auto',
          work: scenario ? SCENARIO_INFO[scenario].label : 'Werk aan de sleutel',
          minutes: scenario ? SCENARIO_INFO[scenario].minutes : null,
          keyless: job.keyless,
          when: `${new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }).format(new Date(`${job.scheduled_date}T12:00:00Z`))} · ${slotLabel(job.slot_start, job.slot_end)}`,
          where: [job.postcode, job.city].filter(Boolean).join(' ') || 'Onbekend',
          price: job.quoted_price == null ? null : Number(job.quoted_price),
        },
      ];
    });

  return (
    <>
      <PageHead
        title="Aanbod"
        sub="Klussen die bij jouw vak en gebied passen. Wie het eerst accepteert, krijgt de klus. Nee zeggen kost niets."
      />
      <HelpSteps
        steps={[
          'Kijk naar de auto, de plaats en de tijd.',
          'Accepteren: de klus staat meteen in Vandaag, met het volledige adres.',
          'Geen tijd of niet jouw vak? Tik Nee, de volgende monteur krijgt hem.',
        ]}
      />
      <OfferList offers={offers} />
    </>
  );
}
