import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function number(value: unknown, fallback: number): number | 'invalid' {
  if (value === null || value === undefined || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 999_999) return 'invalid';
  return Math.round(n * 100) / 100;
}

/** Add a stock line, to a van or to the central store. */
export async function POST(request: Request) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const description =
    typeof body.description === 'string' ? body.description.trim().slice(0, 200) : '';
  if (!description) {
    return NextResponse.json({ error: 'Omschrijving is verplicht' }, { status: 400 });
  }

  const quantity = number(body.quantity, 0);
  const min = number(body.min_quantity, 0);
  if (quantity === 'invalid' || min === 'invalid') {
    return NextResponse.json({ error: 'Ongeldig aantal' }, { status: 400 });
  }

  const technicianId =
    typeof body.technician_id === 'string' && UUID.test(body.technician_id)
      ? body.technician_id
      : null;

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('stock_items')
    .upsert(
      {
        technician_id: technicianId,
        description,
        quantity,
        min_quantity: min,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'technician_id,description' }
    )
    .select('id, description, quantity')
    .single();

  if (error) {
    console.error('Stock upsert failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
