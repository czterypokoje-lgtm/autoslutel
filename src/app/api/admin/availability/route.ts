import { NextResponse } from 'next/server';
import { getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Marking a day off.
 *
 * A monteur sets their own; the office can set anyone's. Which is enforced by
 * the RLS policies from 0004 and 0008, not by trusting the id in the body.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
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

  const date = typeof body.date === 'string' ? body.date : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Ongeldige datum' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  // A monteur may only ever write their own row, whatever the body claims.
  let technicianId: string | null = null;
  if (user.role === 'monteur') {
    const { data: me } = await supabase
      .from('technicians')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!me) {
      return NextResponse.json(
        { error: 'Je account is niet aan een monteur gekoppeld.' },
        { status: 400 }
      );
    }
    technicianId = me.id as string;
  } else {
    const given = body.technician_id;
    if (typeof given !== 'string' || !UUID.test(given)) {
      return NextResponse.json({ error: 'Kies een monteur' }, { status: 400 });
    }
    technicianId = given;
  }

  // `available: true` means "scrap the day off", so the row goes away entirely
  // rather than sitting there as a row that means nothing.
  if (body.available === true) {
    const { error } = await supabase
      .from('technician_availability')
      .delete()
      .eq('technician_id', technicianId)
      .eq('date', date);
    if (error) {
      console.error('Availability delete failed:', error.message);
      return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, available: true });
  }

  const { error } = await supabase.from('technician_availability').upsert(
    {
      technician_id: technicianId,
      date,
      available: false,
      reason: typeof body.reason === 'string' ? body.reason.slice(0, 200) : null,
    },
    { onConflict: 'technician_id,date' }
  );

  if (error) {
    console.error('Availability upsert failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, available: false });
}
