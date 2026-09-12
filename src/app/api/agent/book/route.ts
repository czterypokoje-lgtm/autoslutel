import { NextResponse, after } from 'next/server';
import { checkAgent, asText, asYear, asBool, asPostcode } from '@/lib/agentAuth';
import { jobBriefing } from '@/lib/whatsapp';
import { sendTelegram } from '@/lib/telegram';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isScenario, SCENARIO_INFO, type Scenario } from '@/lib/scenarios';
import { quoteFor } from '@/lib/quote';
import { planDispatch, type Candidate } from '@/lib/dispatch';
import type { CoverageRow } from '@/lib/capability';
import type { Tier } from '@/lib/subscription';
import { repairMake, repairModel, repairYear, repairPostcode, repairPhone } from '@/lib/agentInput';

export const dynamic = 'force-dynamic';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Books the job and starts the offers going out.
 *
 * The price is re-computed here rather than trusted from the request. Whatever
 * the agent believes it said, what the customer owes is what our own pricing
 * says — a caller who can talk an agent into a number must not be able to make
 * that number binding.
 *
 * No technician is named to the caller. The job is created unassigned and
 * offered in tier order; a name promised on the phone that then declines is
 * worse than "een collega belt u met de naam en de tijd".
 */
export async function POST(request: Request) {
  const auth = checkAgent(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const makeIn = repairMake(body.make);
  const make = makeIn.value;
  const postcode = repairPostcode(body.postcode).value;
  const name = asText(body.customer_name, 80);
  const phoneIn = repairPhone(body.customer_phone);
  const phone = phoneIn.value;
  const date = asText(body.date, 10);
  const start = asText(body.slot_start, 5);

  if (!make || !postcode || !date || !start) {
    return NextResponse.json({ error: 'Onvolledige boeking' }, { status: 400 });
  }

  /*
   * The one field where a mistake cannot be recovered. A wrong car is corrected
   * on the doorstep; a wrong number means nobody can reach this customer at all,
   * and the job sits in the agenda until somebody notices. Refused with a
   * sentence the agent can say, so it asks again instead of booking blind.
   */
  if (!phone) {
    return NextResponse.json({
      booked: false,
      reason: 'telefoonnummer_onduidelijk',
      say: 'Ik heb uw telefoonnummer niet goed verstaan. Kunt u het cijfer voor cijfer herhalen?',
    });
  }
  if (!DATE.test(date) || !TIME.test(start)) {
    return NextResponse.json({ error: 'Ongeldige datum of tijd' }, { status: 400 });
  }

  const stated = asText(body.scenario, 30);
  const working = asBool(body.working_key);
  const scenario: Scenario =
    stated && isScenario(stated) ? stated : working === false ? 'alle_sleutels_kwijt' : 'bijmaken';

  const modelIn = repairModel(body.model, make);
  const yearIn = repairYear(body.year);
  const car = { make, model: modelIn.value, year: yearIn.value };
  const keyless = asBool(body.keyless);

  const quote = quoteFor(car, scenario, keyless);
  if (!quote.ok) {
    return NextResponse.json({ booked: false, reason: quote.reason, say: quote.say });
  }

  /* The window closes where the slot list said it would. */
  const [h, m] = start.split(':').map(Number);
  const end = `${String((h + 2) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const supabase = createSupabaseAdminClient();

  /*
   * The postcode, not the spoken city name, decides what gets stored — a
   * caller reading a postcode off their own door is far more reliable than
   * a city name a voice agent had to transcribe. Falls back to whatever the
   * agent captured only if the lookup itself is unavailable or fails; it
   * must never be the reason a booking doesn't go through.
   */
  const spokenCity = asText(body.city, 60);
  let city = spokenCity;
  let lat = null;
  let lng = null;
  if (postcode) {
    const { resolvePostcode } = await import('@/lib/googleMaps');
    const resolved = await resolvePostcode(postcode);
    if (resolved.city) city = resolved.city;
    if (resolved.coords) {
      lat = resolved.coords.lat;
      lng = resolved.coords.lng;
    }
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      status: 'gepland',
      job_source: 'agent',
      scheduled_date: date,
      slot_start: start,
      slot_end: end,
      postcode,
      street: asText(body.street, 120),
      city,
      lat,
      lng,
      customer_name: name,
      customer_phone: phone,
      car_make: car.make,
      car_model: car.model,
      car_year: car.year,
      keyless,
      scenario,
      service_type: SCENARIO_INFO[scenario].label,
      quoted_price: quote.total,
      notes: asText(body.notes, 500),
    })
    .select('id')
    .single();

  if (error || !job) {
    return NextResponse.json(
      { booked: false, say: 'Het is me niet gelukt de afspraak vast te leggen. Een collega belt u terug.' },
      { status: 500 }
    );
  }

  /* ── who gets offered it, and when ── */
  const [{ data: technicians }, { data: coverage }, { data: subs }, { data: stock }, { data: busy }] =
    await Promise.all([
      supabase
        .from('technicians')
        .select('id, name, telegram_chat_id, werkgebied, online, active, base_lat, base_lng')
        .eq('active', true),
      supabase
        .from('technician_coverage')
        .select('technician_id, make, model, scenario, from_year, to_year, excluded, keyless'),
      supabase.from('technician_subscription').select('technician_id, tier'),
      supabase.from('stock_items').select('technician_id, product_slug').gt('quantity', 0),
      supabase
        .from('jobs')
        .select('technician_id')
        .eq('scheduled_date', date)
        .eq('slot_start', start)
        .neq('status', 'geannuleerd'),
    ]);

  const rows = (coverage ?? []) as CoverageRow[];
  const tierOf = new Map((subs ?? []).map((s) => [s.technician_id, s.tier as Tier]));
  const busyCount = new Map<string, number>();
  for (const j of busy ?? []) {
    if (!j.technician_id) continue;
    busyCount.set(j.technician_id, (busyCount.get(j.technician_id) ?? 0) + 1);
  }

  const candidates: Candidate[] = (technicians ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    werkgebied: (t.werkgebied ?? []) as string[],
    base_lat: t.base_lat as number | null,
    base_lng: t.base_lng as number | null,
    online: Boolean(t.online),
    tier: tierOf.get(t.id) ?? 'starter',
    coverage: rows.filter((r) => r.technician_id === t.id),
    vanStock: (stock ?? []).filter((s) => s.technician_id === t.id).map((s) => s.product_slug ?? ''),
    busyInSlot: busyCount.get(t.id) ?? 0,
    acceptRate: null,
  }));

  const plan = await planDispatch(candidates, {
    car,
    scenario,
    postcode,
    lat,
    lng,
    articleCode: quote.article?.code ?? null,
    keyless,
  });

  if (!plan.empty) {
    const now = Date.now();
    await supabase.from('job_offers').insert(
      plan.offers.map((offer) => ({
        job_id: job.id,
        technician_id: offer.technicianId,
        rank: offer.rank,
        tier_at_offer: offer.tier,
        score: offer.score,
        reason: offer.reason,
        offered_at: new Date(now + offer.opensAfter * 1000).toISOString(),
        expires_at: new Date(now + offer.expiresAfter * 1000).toISOString(),
      }))
    );

    /*
     * Only the offers that open immediately (rank 1, opensAfter === 0) are
     * anything to tell someone about right now — Aanbod itself hides an offer
     * until its own offered_at (aanbod/page.tsx), and there is no delayed-send
     * queue here to make a staggered lower-tier offer land on time. A later
     * tier's technician still sees it the moment it opens if they check Aanbod
     * or Vandaag; they just don't get a Telegram message for it yet.
     */
    const chatIdOf = new Map((technicians ?? []).map((t) => [t.id, t.telegram_chat_id]));
    const briefing = jobBriefing({
      scheduled_date: date,
      slot_start: start,
      slot_end: end,
      street: asText(body.street, 120),
      postcode,
      city,
      service_type: SCENARIO_INFO[scenario].label,
      quoted_price: quote.total,
      notes: asText(body.notes, 500),
      customer_name: name,
      customer_phone: phone,
    });
    for (const offer of plan.offers) {
      if (offer.opensAfter > 0) continue;
      const chatId = chatIdOf.get(offer.technicianId);
      after(() =>
        sendTelegram(
          chatId,
          `Nieuwe klus aangeboden!\n\n${briefing}\n\nBekijk en accepteer: https://autosleutel24.nl/admin/aanbod`
        )
      );
    }
  }

  return NextResponse.json({
    booked: true,
    reference: job.id,
    date,
    slot: `${start}–${end}`,
    total: quote.total,
    /*
     * The job exists either way. If nobody was offered it, the office picks it
     * up from the board rather than the customer being told no after saying yes.
     */
    offered: plan.offers.length,
    say: `Genoteerd. ${date} tussen ${start} en ${end}, € ${quote.total
      .toFixed(2)
      .replace('.', ',')}. U krijgt een bevestiging per WhatsApp.`,
  });
}
