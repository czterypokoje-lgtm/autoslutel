import { NextResponse } from 'next/server';
import { getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { parseWerkgebied } from '@/lib/crmJobs';

export const dynamic = 'force-dynamic';

/**
 * A monteur's own profile.
 *
 * Everything goes through crm_update_own_profile in the database, which can
 * only reach the caller's own row and only the columns they are allowed to
 * change. This route validates shapes; the function is what enforces whose row
 * it is.
 */

const HEX_COLOUR = /^#[0-9a-f]{6}$/i;

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function PATCH(request: Request) {
  const user = await getCrmUser();
  if (!user?.role) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const colour = text(body.color, 7);
  if (colour && !HEX_COLOUR.test(colour)) {
    return NextResponse.json({ error: 'Ongeldige kleur' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase.rpc('crm_update_own_profile', {
    p_name: text(body.name, 120),
    p_phone: text(body.phone, 40),
    // Undefined rather than an empty array when the field was not sent: an
    // empty array is a valid value meaning "I cover no region".
    p_werkgebied:
      'werkgebied' in body ? parseWerkgebied(body.werkgebied) : null,
    p_color: colour,
    p_photo_url: text(body.photo_url, 500),
    p_online: typeof body.online === 'boolean' ? body.online : null,
  });

  if (error) {
    if (error.code === 'P0002') {
      return NextResponse.json(
        { error: 'Je account is nog niet aan een monteur gekoppeld.' },
        { status: 400 }
      );
    }
    console.error('Profile update failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  return NextResponse.json({ profile: data }, { headers: { 'Cache-Control': 'no-store' } });
}
