import { NextResponse } from 'next/server';
import { checkOps, logOps } from '@/lib/opsAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { toE164NL } from '@/lib/phone';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** E.164, and a Dutch number must have exactly 9 digits after +31. */
function e164(raw: string): string | null {
  const n = toE164NL(raw);
  if (!n || !/^\+[1-9]\d{7,14}$/.test(n)) return null;
  if (n.startsWith('+31') && n.length !== 12) return null;
  return n;
}

/**
 * The number behind one job or lead, for the server tool that sends a message
 * the owner approved. One record per call, and every call is logged. The
 * number is always E.164; a stored number that can't be made valid gives 422.
 */
export async function GET(request: Request) {
  const auth = checkOps(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const q = new URL(request.url).searchParams;
  const kind = q.get('kind');
  const id = q.get('id') ?? '';
  if ((kind !== 'job' && kind !== 'lead') || !UUID.test(id)) {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } =
    kind === 'job'
      ? await supabase.from('jobs').select('customer_name, customer_phone').eq('id', id).maybeSingle()
      : await supabase.from('leads').select('name, phone, phone_e164').eq('id', id).maybeSingle();

  if (error) {
    console.error('ops contact read failed:', error.message);
    return NextResponse.json({ error: 'Lezen mislukt' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });

  const row = data as Record<string, string | null>;
  const stored = kind === 'job' ? row.customer_phone : row.phone_e164 ?? row.phone;
  if (!stored) return NextResponse.json({ error: 'Geen telefoonnummer bekend' }, { status: 404 });
  /* Only E.164 leaves this route, so the server tool never guesses a country. */
  const phone = e164(stored);
  if (!phone) return NextResponse.json({ error: 'Telefoonnummer is ongeldig' }, { status: 422 });

  await logOps(supabase, 'contact.read', { kind, id });
  return NextResponse.json({ name: kind === 'job' ? row.customer_name : row.name, phone });
}
