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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Ongeldig id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if ('name' in body) {
    const name = text(body.name, 120);
    if (!name) return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 });
    patch.name = name;
  }
  if ('phone' in body) patch.phone = text(body.phone, 40);
  if ('user_id' in body) {
    const value = body.user_id;
    if (value !== null && (typeof value !== 'string' || !UUID.test(value))) {
      return NextResponse.json({ error: 'Ongeldige gebruiker' }, { status: 400 });
    }
    patch.user_id = value;
  }
  if ('active' in body) patch.active = body.active === true;
  if ('werkgebied' in body) patch.werkgebied = parseWerkgebied(body.werkgebied);
  if ('color' in body) {
    const colour = text(body.color, 7);
    if (colour && !HEX_COLOUR.test(colour)) {
      return NextResponse.json({ error: 'Ongeldige kleur' }, { status: 400 });
    }
    if (colour) patch.color = colour;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Niets om te wijzigen' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('technicians')
    .update(patch)
    .eq('id', id)
    .select('id, name, phone, active, werkgebied, color, user_id')
    .maybeSingle();

  if (error) {
    console.error('Technician update failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Monteur niet gevonden' }, { status: 404 });
  }

  return NextResponse.json({ technician: data });
}
