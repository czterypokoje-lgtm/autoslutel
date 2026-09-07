import { NextResponse } from 'next/server';
import { checkAgent, asText, asYear, asBool, asPostcode } from '@/lib/agentAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isScenario, SCENARIO_INFO, type Scenario } from '@/lib/scenarios';
import { coversCar, type CoverageRow } from '@/lib/capability';
import { coversPostcode, TIME_SLOTS, slotLabel } from '@/lib/crmJobs';

export const dynamic = 'force-dynamic';

/**
 * The windows we can actually promise.
 *
 * Not "our opening hours" — the slots where somebody who can do *this* car and
 * drives to *this* postcode is free. A slot offered without that check is a
 * slot that becomes a phone call from an angry customer, and the agent has no
 * way to know it went wrong.
 *
 * The technician is not chosen here. That happens on /book, through the offer
 * flow, so the caller is never told a name that then declines.
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

  const make = asText(body.make, 40);
  const postcode = asPostcode(body.postcode);
  if (!make || !postcode) {
    return NextResponse.json({ error: 'Merk of postcode ontbreekt' }, { status: 400 });
  }

  const stated = asText(body.scenario, 30);
  const working = asBool(body.working_key);
  const scenario: Scenario =
    stated && isScenario(stated) ? stated : working === false ? 'alle_sleutels_kwijt' : 'bijmaken';

  const car = { make, model: asText(body.model, 40), year: asYear(body.year) };
  const supabase = createSupabaseAdminClient();

  const [{ data: technicians }, { data: coverage }] = await Promise.all([
    supabase.from('technicians').select('id, name, werkgebied, active').eq('active', true),
    supabase.from('technician_coverage').select('technician_id, make, model, scenario, from_year, to_year, excluded'),
  ]);

  const rows = (coverage ?? []) as CoverageRow[];

  /* Who could take this at all: the car and the area, before any calendar. */
  const able = (technicians ?? []).filter((t) => {
    const mine = rows.filter((r) => r.technician_id === t.id);
    if (!coversCar(mine, car, scenario)) return false;
    const area = (t.werkgebied ?? []) as string[];
    return !area.length || area.some((range) => coversPostcode(range, postcode));
  });

  if (!able.length) {
    /* Logged as demand we could not serve, with the car and the region. */
    try {
      await supabase.from('unmet_requests').insert({
        car_make: car.make,
        car_model: car.model,
        car_year: car.year,
        scenario,
        postcode,
        reason: 'geen_monteur',
        source: 'agent',
      });
    } catch {
      // Never at the cost of answering the caller.
    }
    return NextResponse.json({
      slots: [],
      say: 'Voor deze auto heb ik in uw regio op dit moment niemand beschikbaar. Ik laat een collega u terugbellen.',
    });
  }

  const ids = able.map((t) => t.id);
  const today = new Date();
  const days: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  const [{ data: away }, { data: booked }] = await Promise.all([
    supabase
      .from('technician_availability')
      .select('technician_id, date, available')
      .in('technician_id', ids)
      .in('date', days),
    supabase
      .from('jobs')
      .select('technician_id, scheduled_date, slot_start')
      .in('technician_id', ids)
      .in('scheduled_date', days)
      .neq('status', 'geannuleerd'),
  ]);

  const unavailable = new Set(
    (away ?? []).filter((a) => a.available === false).map((a) => `${a.technician_id}|${a.date}`)
  );
  const taken = new Set(
    (booked ?? []).map((j) => `${j.technician_id}|${j.scheduled_date}|${String(j.slot_start).slice(0, 5)}`)
  );

  /*
   * A slot is offered when at least one able technician is free in it. How many
   * are free is deliberately not returned: the caller does not need our staffing
   * levels, and the agent must not be able to say "we only have one person".
   */
  const now = new Date();
  const slots: { date: string; start: string; end: string; label: string }[] = [];

  for (const date of days) {
    for (const slot of TIME_SLOTS) {
      // Never offer a window that has already begun today.
      if (date === days[0]) {
        const [h, m] = slot.start.split(':').map(Number);
        const starts = new Date(now);
        starts.setHours(h, m, 0, 0);
        if (starts.getTime() - now.getTime() < 60 * 60 * 1000) continue;
      }

      const free = able.some(
        (t) => !unavailable.has(`${t.id}|${date}`) && !taken.has(`${t.id}|${date}|${slot.start}`)
      );
      if (free) {
        slots.push({ date, start: slot.start, end: slot.end, label: slotLabel(slot.start, slot.end) });
      }
      if (slots.length >= 12) break;
    }
    if (slots.length >= 12) break;
  }

  return NextResponse.json({
    slots,
    minutes: SCENARIO_INFO[scenario].minutes,
    say: slots.length
      ? null
      : 'Deze week zit alles vol. Ik laat een collega u bellen om iets in te plannen.',
  });
}
