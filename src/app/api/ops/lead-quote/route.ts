import { NextResponse } from 'next/server';
import { priceFor, type PricedCoverageRow } from '@/lib/capability';
import { checkOps, logOps } from '@/lib/opsAuth';
import { customerPrice, customerPriceInclVat } from '@/lib/opsBids';
import { scenarioFromLabel } from '@/lib/scenarios';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A price suggestion for one lead from the technicians' own lists. Read only.
 * An unclear service gives no price: a wrong row would quote a wrong amount.
 */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!UUID.test(id)) return NextResponse.json({ error: 'Ongeldige lead' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data: lead, error } = await supabase.from('leads').select('brand, model, service, year, quoted_price').eq('id', id).maybeSingle();
  if (error) {
    console.error('ops lead quote read failed:', error.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }
  if (!lead) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });

  const scenario = scenarioFromLabel(lead.service);
  /* Plate forms store "SK913S — CLIO": only the part after the dash is the model. */
  const model = lead.model?.split('—').pop()?.trim() || null;
  /* The lead stores the year as free text ("2021"); only a plausible 4-digit year counts. */
  const yearMatch = String(lead.year ?? '').match(/\b(19[5-9]\d|20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  /* Leads have no keyless column; the only signal is the service label ("Smart key / keyless bijmaken"). */
  const keyless = /smart|keyless/i.test(lead.service ?? '') ? true : null;
  const car = { make: lead.brand, model, year };
  const customerSaw = lead.quoted_price == null ? null : Number(lead.quoted_price);
  if (!scenario || !lead.brand) return NextResponse.json({ car, scenario, keyless, customerSaw, prices: [] });

  const [technicians, coverage] = await Promise.all([
    supabase.from('technicians').select('id, name').eq('active', true),
    supabase
      .from('technician_coverage')
      .select('technician_id, make, model, scenario, from_year, to_year, excluded, keyless, price'),
  ]);
  const failed = technicians.error ?? coverage.error;
  if (failed) {
    console.error('ops lead quote lists failed:', failed.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }

  const rows = (coverage.data ?? []) as PricedCoverageRow[];
  const needs = new Set<'year' | 'keyless'>();
  const prices = (technicians.data ?? [])
    .flatMap((tech) => {
      const list = rows.filter((r) => r.technician_id === tech.id);
      /*
       * An unknown year or key type matches every row, so the cheapest one
       * wins: a 2021 smart key could get the 2012 bladed-key price. Where the
       * possible answers disagree, quote nothing and say what is missing.
       */
      const keylessOptions: (boolean | null)[] = keyless === null ? [true, false] : [keyless];
      const keylessPrices = keylessOptions.map((k) => priceFor(list, car, scenario, k));
      if (keyless === null && new Set(keylessPrices.filter((p) => p !== null)).size > 1) {
        needs.add('keyless');
        return [];
      }
      if (year === null) {
        const spans = list
          .filter((r) => r.scenario === scenario && r.make.toLowerCase() === lead.brand.toLowerCase())
          .flatMap((r) => [r.from_year, r.to_year])
          .filter((y): y is number => y !== null);
        const seen = new Set(
          [...new Set(spans)].flatMap((y) => keylessOptions.map((k) => priceFor(list, { ...car, year: y }, scenario, k))),
        );
        seen.delete(null);
        if (seen.size > 1) {
          needs.add('year');
          return [];
        }
      }
      const price = keylessPrices.find((p) => p !== null) ?? null;
      return price === null
        ? []
        : [{ technician: tech.name, price, customerPrice: customerPrice(price), customerPriceInclVat: customerPriceInclVat(price) }];
    })
    .sort((a, b) => a.price - b.price);

  const computed = prices[0]?.customerPriceInclVat ?? null;
  const differs =
    customerSaw !== null && computed !== null && Math.abs(computed - customerSaw) / customerSaw >= 0.1;

  await logOps(supabase, 'lead_quote.read', { id });
  return NextResponse.json({ car, scenario, keyless, needs: [...needs], customerSaw, differsFromCustomerPrice: differs, prices });
}
