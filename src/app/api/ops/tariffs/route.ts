import { NextResponse } from 'next/server';
import { priceFor, type PricedCoverageRow } from '@/lib/capability';
import { checkOps, logOps } from '@/lib/opsAuth';
import { customerPrice, customerPriceInclVat } from '@/lib/opsBids';
import { isScenario } from '@/lib/scenarios';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * What each technician's own price list says for one car, with the customer
 * price on top. Read only. Excluded cars and missing prices simply don't appear.
 */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const q = new URL(request.url).searchParams;
  const make = q.get('make')?.trim();
  const scenario = q.get('scenario');
  if (!make || !isScenario(scenario)) {
    return NextResponse.json({ error: 'Merk en scenario zijn verplicht' }, { status: 400 });
  }
  const year = Number(q.get('year')) || null;
  const keylessParam = q.get('keyless');
  const keyless = keylessParam === null ? null : keylessParam === 'true';

  const supabase = createSupabaseAdminClient();
  const { data: technicians, error } = await supabase.from('technicians').select('id, name').eq('active', true);
  const { data: coverage, error: coverageError } = await supabase
    .from('technician_coverage')
    .select('technician_id, make, model, scenario, from_year, to_year, excluded, keyless, price');

  if (error || coverageError) {
    console.error('ops tariffs read failed:', (error ?? coverageError)?.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  const rows = (coverage ?? []) as PricedCoverageRow[];
  const car = { make, model: q.get('model')?.trim() || null, year };
  const prices = (technicians ?? []).flatMap((tech) => {
    const price = priceFor(rows.filter((r) => r.technician_id === tech.id), car, scenario, keyless);
    return price === null
      ? []
      : [{ technician: tech.name, price, customerPrice: customerPrice(price), customerPriceInclVat: customerPriceInclVat(price) }];
  });
  prices.sort((a, b) => a.price - b.price);

  await logOps(supabase, 'tariffs.read', { make, scenario });
  return NextResponse.json({ car, scenario, technicians: (technicians ?? []).length, listRows: rows.length, prices });
}
