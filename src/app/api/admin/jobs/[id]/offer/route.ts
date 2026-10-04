import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { sendTelegramBidOffer } from '@/lib/telegram';
import { SCENARIO_INFO, type Scenario } from '@/lib/scenarios';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** How long a technician has to bid before the offer reads as stale. */
const OPEN_FOR_HOURS = 24;

/**
 * Putting a job out to the monteurs.
 *
 * Deliberately not planDispatch. That exists for the voice agent, which has
 * to pick an order and stagger tiers because it is answering a phone call
 * with nobody watching. Here a person is already looking at the job and there
 * are two technicians on Telegram — ranking two people is theatre, and a
 * staggered send would only mean the second one hears about it late.
 *
 * So: everyone active and reachable gets it at once, and the office picks
 * from the bids. The address is not in the message. Postcode and town are
 * enough to judge the drive; the door number belongs to the customer and is
 * not handed to everyone so one of them can take the job.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Ongeldige klus' }, { status: 400 });

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('id, status, city, postcode, car_make, car_model, car_year, scenario, service_type, quoted_price, keyless')
    .eq('id', id)
    .maybeSingle();

  if (!job) return NextResponse.json({ error: 'Klus niet gevonden' }, { status: 404 });
  if (job.status === 'afgerond' || job.status === 'geannuleerd') {
    return NextResponse.json({ error: 'Deze klus is al afgerond of geannuleerd.' }, { status: 409 });
  }

  const { data: technicians, error: techError } = await supabase
    .from('technicians')
    .select('id, name, telegram_chat_id')
    .eq('active', true)
    .not('telegram_chat_id', 'is', null);

  if (techError) {
    console.error('Offer technicians lookup failed:', techError.message);
    return NextResponse.json({ error: 'Monteurs ophalen mislukt' }, { status: 500 });
  }
  if (!technicians?.length) {
    return NextResponse.json(
      { error: 'Geen enkele actieve monteur heeft Telegram gekoppeld. Dat doen ze bij Mijn profiel.' },
      { status: 409 }
    );
  }

  /* Already offered to someone and still open: send it to whoever is new,
     and leave the existing offers alone rather than resetting their clock. */
  const { data: existing } = await supabase
    .from('job_offers')
    .select('technician_id')
    .eq('job_id', id)
    .is('response', null);

  const already = new Set((existing ?? []).map((row) => row.technician_id as string));
  const fresh = technicians.filter((tech) => !already.has(tech.id));

  if (!fresh.length) {
    return NextResponse.json(
      { error: 'Deze klus staat al open bij alle monteurs.' },
      { status: 409 }
    );
  }

  const now = Date.now();
  const { data: inserted, error: insertError } = await supabase
    .from('job_offers')
    .insert(
      fresh.map((tech) => ({
        job_id: id,
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
    /*
     * "Aanbieden mislukt" on its own sent the office looking at Telegram, the
     * technicians and the job, when the cause was a missing grant on a table
     * — 0013 gave `authenticated` only select and update, because until there
     * was a button for this nothing but the service-role agent ever inserted.
     */
    const denied = /permission denied|row-level security|violates/i.test(insertError?.message ?? '');
    return NextResponse.json(
      {
        error: denied
          ? 'Geen recht om aan te bieden — voer supabase/migrations/0067_office_may_offer_a_job.sql uit.'
          : `Aanbieden mislukt: ${insertError?.message ?? 'onbekend'}`,
      },
      { status: 500 }
    );
  }

  const what = job.scenario
    ? (SCENARIO_INFO[job.scenario as Scenario]?.label ?? job.scenario)
    : (job.service_type ?? 'Klus');
  const car = [job.car_make, job.car_model, job.car_year].filter(Boolean).join(' ');
  const where = job.city ?? job.postcode ?? 'onbekend';

  const text = [
    `🔧 ${what}`,
    car || null,
    `📍 ${where}${job.postcode && job.city ? ` (${job.postcode})` : ''}`,
    job.keyless ? '🔑 Keyless' : null,
    /* The office's own figure, shown as a guide and nothing more — the
       monteur names his own price, which is the point of bidding. */
    job.quoted_price ? `Richtprijs: € ${Number(job.quoted_price).toFixed(2)}` : null,
    '',
    'Wanneer kunt u?',
  ]
    .filter((line) => line !== null)
    .join('\n');

  /* Sent one at a time, after the rows exist: a technician who taps a button
     on a message whose offer was never written would get "already answered"
     for a job nobody has seen. */
  let sent = 0;
  for (const offer of inserted) {
    const tech = fresh.find((t) => t.id === offer.technician_id);
    if (!tech?.telegram_chat_id) continue;
    await sendTelegramBidOffer(tech.telegram_chat_id, text, offer.id);
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent, technicians: fresh.map((t) => t.name) });
}
