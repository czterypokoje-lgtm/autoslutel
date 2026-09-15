import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { parseWerkgebied } from '@/lib/crmJobs';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_COLOUR = /^#[0-9a-f]{6}$/i;

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function POST(request: Request) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const name = text(body.name, 120);
  if (!name) {
    return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 });
  }

  const userId = text(body.user_id, 40);
  if (userId && !UUID.test(userId)) {
    return NextResponse.json({ error: 'Ongeldige gebruiker' }, { status: 400 });
  }

  const colour = text(body.color, 7);

  const row = {
    name,
    phone: text(body.phone, 40),
    user_id: userId,
    werkgebied: parseWerkgebied(body.werkgebied),
    color: colour && HEX_COLOUR.test(colour) ? colour : '#2c4a63',
    active: body.active !== false,
  };

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('technicians')
    .insert(row)
    .select('id, name')
    .single();

  if (error) {
    console.error('Technician insert failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  return NextResponse.json({ technician: data }, { status: 201 });
}
