import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendTelegramBidOffer } from './telegram';
import { SCENARIO_INFO, scenarioFromLabel, type Scenario } from './scenarios';
import { priceFor, type PricedCoverageRow } from './capability';
import { b, esc, euro } from './telegramText';

/**
 * Putting a job out to the monteurs.
 *
 * One function, two callers: the button on the job screen and /nieuw in the
 * chat. They were two copies for about an hour, which is exactly long enough
 * for the message text to drift apart and for a technician to be quoted his
 * own rate from one path and asked for a price from the other.
 *
 * Deliberately not planDispatch. That exists for the voice agent, which must
 * pick an order and stagger tiers because nobody is watching. Here a person
 * is already on the job, and ranking two technicians is theatre.
 */

/** How long a technician has to bid before the offer reads as stale. */
const OPEN_FOR_HOURS = 24;

export interface OfferOutcome {
  ok: boolean;
  sent: number;
  technicians: string[];
  error?: string;
}

export async function offerJobToTechnicians(
  supabase: SupabaseClient,
  jobId: string
): Promise<OfferOutcome> {
  const { data: job } = await supabase
    .from('jobs')
    .select('id, status, city, postcode, car_make, car_model, car_year, scenario, service_type, quoted_price, keyless')
    .eq('id', jobId)
    .maybeSingle();

  if (!job) return { ok: false, sent: 0, technicians: [], error: 'Klus niet gevonden' };
  if (job.status === 'afgerond' || job.status === 'geannuleerd') {
    return { ok: false, sent: 0, technicians: [], error: 'Deze klus is al afgerond of geannuleerd.' };
  }

  const { data: technicians, error: techError } = await supabase
    .from('technicians')
    .select('id, name, telegram_chat_id')
    .eq('active', true)
    .not('telegram_chat_id', 'is', null);

  if (techError) {
    console.error('Offer technicians lookup failed:', techError.message);
    return { ok: false, sent: 0, technicians: [], error: 'Monteurs ophalen mislukt' };
  }
  if (!technicians?.length) {
    return {
      ok: false,
      sent: 0,
      technicians: [],
      error: 'Geen enkele actieve monteur heeft Telegram gekoppeld. Dat doen ze bij Mijn profiel.',
    };
  }

  /* Their own price lists. A technician who already wrote down what this car
     costs should not be asked again. */
  const { data: coverage } = await supabase
    .from('technician_coverage')
    .select('technician_id, make, model, scenario, from_year, to_year, excluded, keyless, price')
    .in('technician_id', technicians.map((t) => t.id));

  /* Derived, not stored: most open jobs carry the scenario only in their
     free-text service, and both ends must read it the same way. */
  const scenario = (job.scenario as Scenario | null) ?? scenarioFromLabel(job.service_type);

  const listPrice = (technicianId: string): number | null => {
    if (!scenario || !job.car_make) return null;
    return priceFor(
      ((coverage ?? []) as PricedCoverageRow[]).filter((r) => r.technician_id === technicianId),
      { make: job.car_make, model: job.car_model, year: job.car_year },
      scenario,
      job.keyless
    );
  };

  /* Already open with someone: add whoever is new, and leave the existing
     offers alone rather than restarting their clock. */
  const { data: existing } = await supabase
    .from('job_offers')
    .select('technician_id')
    .eq('job_id', jobId)
    .is('response', null);

  const already = new Set((existing ?? []).map((row) => row.technician_id as string));
  const fresh = technicians.filter((tech) => !already.has(tech.id));

  if (!fresh.length) {
    return { ok: false, sent: 0, technicians: [], error: 'Deze klus staat al open bij alle monteurs.' };
  }

  const now = Date.now();
  const { data: inserted, error: insertError } = await supabase
    .from('job_offers')
    .insert(
      fresh.map((tech) => ({
        job_id: jobId,
        technician_id: tech.id,
        rank: 1,
        reason: 'handmatig aangeboden door kantoor',
        offered_at: new Date(now).toISOString(),
        expires_at: new Date(now + OPEN_FOR_HOURS * 3600_000).toISOString(),
      }))
    )
    .select('id, technician_id');

  if (insertError || !inserted) {
    console.error('Offer insert failed:', insertError?.message);
    const denied = /permission denied|row-level security|violates/i.test(insertError?.message ?? '');
    return {
      ok: false,
      sent: 0,
      technicians: [],
      error: denied
        ? 'Geen recht om aan te bieden — voer supabase/migrations/0067_office_may_offer_a_job.sql uit.'
        : `Aanbieden mislukt: ${insertError?.message ?? 'onbekend'}`,
    };
  }

  const what = scenario ? (SCENARIO_INFO[scenario]?.label ?? scenario) : (job.service_type ?? 'Klus');
  const car = [job.car_make, job.car_model, job.car_year].filter(Boolean).join(' ');
  const where = job.city ?? job.postcode ?? 'onbekend';

  const describe = (mine: number | null) =>
    [
      `🔧 ${b(what)}`,
      car ? esc(car) : null,
      `📍 ${esc(where)}${job.postcode && job.city ? ` · ${esc(job.postcode)}` : ''}`,
      job.keyless ? '🔑 Keyless' : null,
      '',
      /*
       * Their number, never ours.
       *
       * The job's quoted_price is what the customer was told, and that is not
       * the technician's business: showing both side by side turns every
       * offer into a negotiation about the margin instead of a question about
       * whether they can be there.
       */
      mine !== null ? `Uw tarief: ${b(euro(mine))}` : null,
      mine !== null
        ? '\nKies een dag en een tijd — uw tarief gaat automatisch mee.'
        : '\nKies een dag en een tijd. Daarna vraag ik uw prijs.',
    ]
      .filter((line) => line !== null)
      .join('\n');

  /* Sent after the rows exist: a technician tapping a button on a message
     whose offer was never written would be told it was already answered. */
  let sent = 0;
  for (const offer of inserted) {
    const tech = fresh.find((t) => t.id === offer.technician_id);
    if (!tech?.telegram_chat_id) continue;
    await sendTelegramBidOffer(tech.telegram_chat_id, describe(listPrice(tech.id)), offer.id);
    sent += 1;
  }

  return { ok: true, sent, technicians: fresh.map((t) => t.name) };
}
