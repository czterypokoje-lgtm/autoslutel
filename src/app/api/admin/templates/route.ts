import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function money(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 99_999_999) return 'invalid';
  return Math.round(n * 100) / 100;
}

/** Create a service template: the job types that get typed out over and over. */
export async function POST(request: Request) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
  if (!name) {
    return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 });
  }

  const price = money(body.price_incl);
  const fee = money(body.monteur_fee);
  if (price === 'invalid' || fee === 'invalid') {
    return NextResponse.json({ error: 'Ongeldig bedrag' }, { status: 400 });
  }

  const slots = Number(body.duration_slots ?? 1);

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('service_templates')
    .insert({
      name,
      service_type:
        typeof body.service_type === 'string' && body.service_type.trim()
          ? body.service_type.trim().slice(0, 120)
          : name,
      price_incl: price,
      monteur_fee: fee,
      duration_slots: Number.isFinite(slots) && slots >= 1 && slots <= 6 ? slots : 1,
    })
    .select('id, name')
    .single();

  if (error) {
    console.error('Template insert failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  return NextResponse.json({ template: data }, { status: 201 });
}
