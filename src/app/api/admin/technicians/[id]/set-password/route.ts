import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Sets a technician's password directly, for a login already stuck on a
 * broken or expired invite link — the manual alternative to
 * /api/admin/invite-technician's own password option, for an account that
 * already exists instead of a brand new one.
 */
export async function POST(
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

  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 8) {
    return NextResponse.json({ error: 'Wachtwoord moet minimaal 8 tekens zijn' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data: technician, error: fetchError } = await supabase
    .from('technicians')
    .select('user_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !technician?.user_id) {
    return NextResponse.json({ error: 'Deze monteur heeft geen login' }, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'CRM configuratie mist' }, { status: 503 });
  }

  const adminAuth = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }).auth.admin;

  const { error } = await adminAuth.updateUserById(technician.user_id, {
    password,
    email_confirm: true,
  });

  if (error) {
    console.error('Password set failed:', error.message);
    return NextResponse.json({ error: 'Wachtwoord instellen mislukt' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
