import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SCENARIO_INFO, type Scenario } from '@/lib/scenarios';

export const dynamic = 'force-dynamic';

/**
 * The real, office-maintained prices (dispatch_pricing, via Tarieven) as
 * ready-made invoice line templates — picking one on a factuur fills in the
 * description and price a technician would otherwise have to remember or
 * type out by hand, and keeps invoice wording consistent with what get_price
 * actually quoted the customer for the same car.
 */
export async function GET() {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('dispatch_pricing')
    .select('make, model, scenario, from_year, to_year, price')
    .order('make');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((row) => {
    const scenarioLabel = SCENARIO_INFO[row.scenario as Scenario]?.label ?? row.scenario;
    const years = row.from_year || row.to_year ? ` (${row.from_year ?? '…'}–${row.to_year ?? 'nu'})` : '';
    const model = row.model ? ` ${row.model}` : '';
    return {
      description: `${row.make}${model}${years} — ${scenarioLabel}`,
      price: row.price,
    };
  });

  return NextResponse.json({ items });
}
