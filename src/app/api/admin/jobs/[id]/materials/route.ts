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

  const { data, error } = await supabase
    .from('job_materials')
    .insert({
      job_id: id,
      description,
      quantity: quantity ?? 1,
      unit_cost: unitCost,
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
