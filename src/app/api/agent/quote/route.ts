import { NextResponse } from 'next/server';
import { checkAgent, asText, asYear, asBool, asPostcode } from '@/lib/agentAuth';
import { quoteFor } from '@/lib/quote';
import { isScenario, SCENARIO_INFO, type Scenario } from '@/lib/scenarios';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { repairMake, repairModel, repairYear, repairPostcode, repairPhone } from '@/lib/agentInput';

export const dynamic = 'force-dynamic';

/**
 * The price the agent is allowed to say out loud.
 *
 * It never composes one. It gets a number or it gets a sentence explaining that
 * a colleague will call — and the sentence is a legitimate answer, not a
 * failure. A wrong price on the phone costs the job twice: once when the
 * technician arrives, and once when the customer tells someone.
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
  if (!make) return NextResponse.json({ error: 'Merk ontbreekt' }, { status: 400 });

  /*
   * The scenario can come as itself or as the answer to "heeft u nog een
   * sleutel die het doet?", which is the question a caller can actually answer.
   */
  const stated = asText(body.scenario, 30);
  const working = asBool(body.working_key);
  const scenario: Scenario =
    stated && isScenario(stated)
      ? stated
      : working === false
        ? 'alle_sleutels_kwijt'
        : 'bijmaken';

  const modelIn = repairModel(body.model, make);
  const yearIn = repairYear(body.year);
  const car = { make, model: modelIn.value, year: yearIn.value };
  const keyless = asBool(body.keyless);
  const postcode = repairPostcode(body.postcode).value;
  const result = quoteFor(car, scenario, keyless);

  /*
   * Every refusal is written down with the car and the postcode. This is not an
   * error log — it is the recruitment list, and it answers "which tool and
   * which region do we add next" with evidence instead of a hunch.
   */
  if (!result.ok) {
    try {
      const supabase = createSupabaseAdminClient();
      await supabase.from('unmet_requests').insert({
        car_make: car.make,
        car_model: car.model,
        car_year: car.year,
        keyless,
        scenario,
        postcode,
        reason: result.reason === 'auto_onbekend' ? 'geen_dekking' : 'geen_prijs',
        source: 'agent',
        detail: result.reason,
      });
    } catch {
      // Losing the log must never cost the caller their answer.
    }
    return NextResponse.json({ quoted: false, reason: result.reason, say: result.say });
  }

  return NextResponse.json({
    quoted: true,
    scenario,
    scenario_label: SCENARIO_INFO[scenario].label,
    total: result.total,
    minutes: result.minutes,
    confidence: result.confidence,
    article: result.article,
    say: `Voor ${SCENARIO_INFO[scenario].label.toLowerCase()} komt dat op € ${result.total
      .toFixed(2)
      .replace('.', ',')}, inclusief voorrijden en btw.`,
  });
}
