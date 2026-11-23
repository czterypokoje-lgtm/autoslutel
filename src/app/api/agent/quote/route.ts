import { NextResponse } from 'next/server';
import { checkAgent, asText, asYear, asBool, asPostcode } from '@/lib/agentAuth';
import { priceFor, type PriceRow } from '@/lib/dispatchPricing';
import { isScenario, SCENARIO_INFO, type Scenario } from '@/lib/scenarios';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { repairMake, repairModel, repairYear, repairPostcode, repairPhone } from '@/lib/agentInput';
import { recordAgentQuote } from '@/lib/leadQuotes';

export const dynamic = 'force-dynamic';

const say = (total: number, scenario: Scenario) =>
  `Voor ${SCENARIO_INFO[scenario].label.toLowerCase()} komt dat op € ${total
    .toFixed(2)
    .replace('.', ',')}, inclusief voorrijden en btw.`;

/**
 * The price the agent is allowed to say out loud.
 *
 * It never composes one. It gets a number or it gets a sentence explaining that
 * a colleague will call — and the sentence is a legitimate answer, not a
 * failure. A wrong price on the phone costs the job twice: once when the
 * technician arrives, and once when the customer tells someone.
 *
 * Pricing here is entirely office-maintained (dispatch_pricing, via Tarieven)
 * for the two scenarios that need a part (bijmaken/alle_sleutels_kwijt) — never
 * the webshop's retail parts catalogue, which prices a different business.
 * Repair/lock scenarios are labour on the customer's own hardware and always
 * were flat, catalogue-independent numbers.
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
  const info = SCENARIO_INFO[scenario];

  const logRefusal = async (reason: string, detail: string) => {
    try {
      const supabase = createSupabaseAdminClient();
      await supabase.from('unmet_requests').insert({
        car_make: car.make,
        car_model: car.model,
        car_year: car.year,
        keyless,
        scenario,
        postcode,
        reason,
        source: 'agent',
        detail,
      });
    } catch {
      // Losing the log must never cost the caller their answer.
    }
  };

  const supabase = createSupabaseAdminClient();

  // Lock work and repairs are labour on the customer's own hardware — flat,
  // and never depended on either catalogue.
  let total: number;
  let confidence: 'model' | 'merk' = 'model';

  if (!info.programming) {
    total = info.labour;
  } else {
    const { data: priceRows } = await supabase
      .from('dispatch_pricing')
      .select('make, model, scenario, from_year, to_year, keyless, price')
      .eq('scenario', scenario);
    const rows = (priceRows ?? []) as PriceRow[];

    const result = priceFor(rows, car, scenario, keyless);

    /*
     * Every refusal is written down with the car and the postcode. This is not
     * an error log — it is the recruitment list, and it answers "which car and
     * which region do we add a price for next" with evidence instead of a hunch.
     */
    if (!result) {
      await logRefusal('geen_prijs', 'geen_tarief');
      return NextResponse.json({
        quoted: false,
        reason: 'geen_prijs',
        say: 'Voor deze auto heb ik geen prijs paraat. Ik laat een collega u terugbellen met een prijs.',
      });
    }
    total = result.price;
    confidence = result.confidence;
  }

  const response = {
    quoted: true,
    scenario,
    scenario_label: info.label,
    total,
    minutes: info.minutes,
    confidence,
    say: say(total, scenario),
  };

  /*
   * Every price actually said out loud becomes a confirmed lead_quotes row —
   * docs/lead-quotes.md §3.2. A logging failure must never cost the caller
   * their answer, so it is swallowed here rather than left to bubble.
   */
  try {
    await recordAgentQuote(supabase, {
      make: car.make,
      model: car.model,
      year: car.year,
      scenario,
      price: total,
      evidenceRef: asText(body.conversation_id, 80),
      evidenceQuote: response.say,
    });
  } catch (err) {
    console.error('agent quote logging failed:', err);
  }

  return NextResponse.json(response);
}
