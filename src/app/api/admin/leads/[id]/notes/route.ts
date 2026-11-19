import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MAX_BODY = 4000;

/**
 * Notes on one lead.
 *
 * Reads and writes go through the caller's own session client, never the
 * service-role key: the RLS policies in 0047 are the real guard and the
 * requireOfficeUserApi check is the fast one. Both have to pass.
 */

function badId(id: string) {
  return !/^[0-9a-f-]{10,40}$/i.test(id) && !/^\d+$/.test(id);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  const { id } = await params;
  if (badId(id)) return NextResponse.json({ error: 'Ongeldig lead-id' }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('lead_notes')
    .select('id, body, author_email, created_at')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Reading lead notes failed:', error.message);
    return NextResponse.json({ error: 'Laden mislukt' }, { status: 500 });
  }

  return NextResponse.json({ notes: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireOfficeUserApi();
  if (response) return response;

  const { id } = await params;
  if (badId(id)) return NextResponse.json({ error: 'Ongeldig lead-id' }, { status: 400 });

  let payload: { body?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  if (!body) return NextResponse.json({ error: 'Lege notitie' }, { status: 400 });
  /* Capped here as well as by the table's CHECK, so an over-long note comes
     back as a readable message rather than a Postgres constraint error. */
  if (body.length > MAX_BODY) {
    return NextResponse.json({ error: `Notitie is te lang (max ${MAX_BODY} tekens)` }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('lead_notes')
    .insert({ lead_id: id, body, created_by: user.id, author_email: user.email })
    .select('id, body, author_email, created_at')
    .maybeSingle();

  if (error) {
    console.error('Writing lead note failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }
  /* No row back means RLS refused or the lead does not exist — a 404 either
     way, rather than confirming which. */
  if (!data) return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 });

  return NextResponse.json({ note: data }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
