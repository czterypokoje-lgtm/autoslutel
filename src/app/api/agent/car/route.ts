import { NextResponse } from 'next/server';
import { checkAgent, asText, asYear } from '@/lib/agentAuth';
import { knowCar, looksKeyless } from '@/lib/quote';

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

  const make = asText(body.make, 40);
  if (!make) {
    return NextResponse.json({ known: false, say: 'Welk merk is de auto?' });
  }

  const car = { make, model: asText(body.model, 40), year: asYear(body.year) };
  const known = knowCar(car);

  return NextResponse.json({
    known,
    car,
    /*
     * null means "we cannot tell from the catalogue" — both a smart key and a
     * bladed key exist for this car, so the trim decides and the caller has to
     * be asked. When they answer, their answer wins: they are the one looking
     * at the car.
     */
    keyless: looksKeyless(car),
    say: known
      ? null
      : 'Deze auto staat niet in ons systeem. Ik laat een collega u terugbellen.',
  });
}
