import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DEFAULT_TECHNICIAN_COLOUR } from '@/lib/crmColours';

export const dynamic = 'force-dynamic';

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

  const email = text(body.email, 120);
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Geldig e-mailadres is verplicht' }, { status: 400 });
  }

  const colour = text(body.color, 7);
  const activeColour = colour && HEX_COLOUR.test(colour) ? colour : DEFAULT_TECHNICIAN_COLOUR;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'CRM configuratie mist' }, { status: 503 });
  }

  const adminAuth = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }).auth.admin;

  /*
   * An invite link, not a password.
   *
   * This route used to create every technician with the literal password
   * "password123" and email_confirm: true, because SMTP is not set up. That
   * made every account openable by anyone who knew the address — and the
   * password was in the repository. A monteur session reads jobs, customer
   * names, phone numbers and addresses.
   *
   * generateLink creates the user and hands us the one-time link without
   * needing mail delivery: the office sends it over WhatsApp, which this CRM
   * already does, and the technician sets their own password on arrival.
   */
  const { data: invite, error: createError } = await adminAuth.generateLink({
    type: 'invite',
    email,
  });

  if (createError || !invite?.user) {
    console.error('Invite failed:', createError?.message);
    return NextResponse.json(
      { error: 'Uitnodigen mislukt — bestaat dit e-mailadres al?' },
      { status: 500 }
    );
  }

  const userId = invite.user.id;

  /* The role decides what they can see; without it they land on geen-toegang. */
  const { error: roleError } = await adminAuth.updateUserById(userId, {
    app_metadata: { role: 'monteur' },
  });

  if (roleError) {
    await adminAuth.deleteUser(userId);
    console.error('Role assignment failed:', roleError.message);
    return NextResponse.json({ error: 'Rol toekennen mislukt' }, { status: 500 });
  }

  // 3. Create the technician record
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('technicians')
    .insert({
      user_id: userId,
      name,
      color: activeColour,
      active: true,
      werkgebied: [], // Will be filled in wizard
    })
    .select('id, name')
    .single();

  if (error) {
    /*
     * Take the login back out. A half-made technician — a login with no record
     * behind it — signs in successfully and then sees nothing, which is the
     * hardest kind of fault to diagnose from a phone call.
     */
    await adminAuth.deleteUser(userId);
    console.error('Technician insert failed:', error.message);
    return NextResponse.json({ error: `Monteur opslaan mislukt: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json(
    {
      technician: data,
      /*
       * Handed back once, and never stored. The office sends it on; if it is
       * lost, invite again rather than looking it up — there is nowhere to look.
       */
      inviteLink: invite.properties?.action_link ?? null,
    },
    { status: 201 }
  );
}
