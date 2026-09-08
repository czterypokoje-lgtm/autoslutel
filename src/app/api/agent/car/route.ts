import { NextResponse } from 'next/server';
import { checkAgent, asText, asYear } from '@/lib/agentAuth';
import { knowCar, looksKeyless } from '@/lib/quote';
import { repairMake, repairModel, repairYear, repairPostcode, repairPhone } from '@/lib/agentInput';

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
  const known = knowCar(car);

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
     * null means "we cannot tell from the catalogue" — both a smart key and a
     * bladed key exist for this car, so the trim decides and the caller has to
     * be asked. When they answer, their answer wins: they are the one looking
     * at the car.
     */
    keyless: looksKeyless(car),
    /*
     * When we corrected something, the agent gets the sentence to say rather
     * than composing one — a confirmation is only useful if it names what we
     * actually stored.
     */
    say: !known
      ? 'Deze auto staat niet in ons systeem. Ik laat een collega u terugbellen.'
      : makeIn.corrected || modelIn.corrected || yearIn.corrected
        ? `Een ${[make, modelIn.value, yearIn.value].filter(Boolean).join(' ')}, klopt dat?`
        : null,
  });
}
