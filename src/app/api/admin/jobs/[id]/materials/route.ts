import { NextResponse, after } from 'next/server';
import { getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { readStockStatusById, notifyIfStockWorsenedById } from '@/lib/stockNotify';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function number(value: unknown, fallback: number | null): number | null | 'invalid' {
  if (value === null || value === undefined || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 99_999_999) return 'invalid';
  return Math.round(n * 100) / 100;
}

/** Record a part used on the job. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user?.role) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  }

  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Ongeldig job-id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const description =
    typeof body.description === 'string' ? body.description.trim().slice(0, 300) : '';
  if (!description) {
    return NextResponse.json({ error: 'Omschrijving is verplicht' }, { status: 400 });
  }

  const quantity = number(body.quantity, 1);
  const unitCost = number(body.unit_cost, null);
  if (quantity === 'invalid' || unitCost === 'invalid') {
    return NextResponse.json({ error: 'Ongeldig getal' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const stockItemId =
    typeof body.stock_item_id === 'string' && UUID.test(body.stock_item_id) ? body.stock_item_id : null;

  /*
   * The actual deduction happens in Postgres (job_material_stock_trg,
   * 0008_calendar_stock_templates.sql) once the insert below lands — read the
   * status here, before that trigger runs, so `after()` has a "before" to
   * compare against.
   */
  const before = stockItemId ? await readStockStatusById(supabase, stockItemId) : null;

  /*
   * What the part cost, read from the stock row rather than taken from the
   * caller.
   *
   * crm_confirm_invoice (0019) writes stock_items.unit_cost from a real
   * supplier invoice, and that is the only number in this system that reflects
   * what was actually paid. Looking it up here means every caller of this
   * route gets a cost without having to know where costs live — which is the
   * whole reason jobs.cost_materials sat empty while the van screen was
   * sending its own guess.
   *
   * An explicit unit_cost in the body still wins: the office correcting a
   * line knows something the stock row does not.
   */
  let cost = unitCost;
  if (cost === null && stockItemId) {
    const { data: stockRow } = await supabase
      .from('stock_items')
      .select('unit_cost')
      .eq('id', stockItemId)
      .maybeSingle();
    cost = stockRow?.unit_cost ?? null;
  }

  const { data, error } = await supabase
    .from('job_materials')
    .insert({
      job_id: id,
      description,
      quantity: quantity ?? 1,
      unit_cost: cost,
      product_slug:
        typeof body.product_slug === 'string' ? body.product_slug.slice(0, 200) : null,
      stock_item_id: stockItemId,
      created_by: user.id,
    })
    .select('id, description, quantity, unit_cost, stock_item_id')
    .single();

  if (error) {
    console.error('Job material insert failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  if (stockItemId && before) {
    after(() => notifyIfStockWorsenedById(supabase, stockItemId, before));
  }

  return NextResponse.json({ material: data }, { status: 201 });
}
