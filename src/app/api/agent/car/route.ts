import { NextResponse } from 'next/server';
import { checkAgent, asText, asYear } from '@/lib/agentAuth';
import { anyCoverage, keylessSignal, type CoverageRow } from '@/lib/capability';
import { repairMake, repairModel, repairYear, repairPostcode, repairPhone } from '@/lib/agentInput';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * "Wat voor auto is het?" — the agent's first gate.
 *
 * Answers three things the agent needs before it can go further: do we know
 * this car at all, is it keyless (so the next question is a confirmation and
 * not an interrogation), and what to say if we do not.
 *
 * No licence plate. A caller knows their car and asking for a plate on the
 * phone loses people; the plate route stays available for the ones who have it
 * to hand.
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
  if (!make) {
    return NextResponse.json({ known: false, say: 'Welk merk is de auto?' });
  }

  const modelIn = repairModel(body.model, make);
  const yearIn = repairYear(body.year);
  const car = { make, model: modelIn.value, year: yearIn.value };

  /*
   * "Do we know this car" is a dispatch question, not a webshop one — answered
   * by what technicians have declared they can do (technician_coverage), never
   * by the retail parts catalogue. A technician's coverage is scenario- and
   * keyless-blind here on purpose: neither is known yet at this point in the call.
   */
  const supabase = createSupabaseAdminClient();
  const { data: coverageRows } = await supabase
    .from('technician_coverage')
    .select('technician_id, make, model, scenario, from_year, to_year, excluded, keyless');
  const rows = (coverageRows ?? []) as CoverageRow[];

  const known = anyCoverage(rows, car);

  return NextResponse.json({
    known,
    car,
    /*
     * What we understood, and whether we had to change it. The agent is told
     * to use these values from here on and to say them back — so "Pesjot"
     * becomes "Peugeot" in the conversation as well as in the database, and
     * the caller hears that they were understood.
     */
    understood: {
      make,
      model: modelIn.value,
      year: yearIn.value,
      corrected: makeIn.corrected || modelIn.corrected || yearIn.corrected,
      heard: { make: makeIn.heard, model: modelIn.heard, year: yearIn.heard },
    },
    /*
     * null means coverage is silent or mixed — both a smart key and a bladed
     * key are declared for this car, so the trim decides and the caller has to
     * be asked. When they answer, their answer wins: they are the one looking
     * at the car.
     */
    keyless: keylessSignal(rows, car),
    /*
     * When we corrected something, the agent gets the sentence to say rather
     * than composing one — a confirmation is only useful if it names what we
     * actually stored.
     */
    /*
     * The confirmation comes first, even when the car is unknown.
     *
     * If we repaired "Pesjot" into "Peugeot" and then refuse the job, a wrong
     * repair produces a wrong refusal — and the caller never hears what we
     * thought they said, so they cannot correct it. Confirm, then refuse on the
     * next turn if it still is not a car we can do.
     */
    say:
      makeIn.corrected || modelIn.corrected || yearIn.corrected
        ? `Een ${[make, modelIn.value, yearIn.value].filter(Boolean).join(' ')}, klopt dat?`
        : known
          ? null
          : 'Deze auto staat niet in ons systeem. Ik laat een collega u terugbellen.',
  });
}
