import { NextResponse } from 'next/server';
import { getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Record what the customer paid for a job.
 *
 * When the money was taken at the door by a monteur, the database trigger from
 * 0007 books the matching debt on their ledger. That is deliberately not done
 * here: two writes from application code is one write that eventually goes
 * missing.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const METHODS = new Set(['contant', 'pin', 'tikkie', 'ideal', 'bank', 'factuur']);

/** Money the monteur physically holds afterwards. */
const IN_HAND = new Set(['contant', 'pin']);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user?.role) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  }

  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'Ongeldig job-id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const raw = body.amount;
  const amount =
    typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 99_999_999) {
    return NextResponse.json({ error: 'Ongeldig bedrag' }, { status: 400 });
  }

  const method = typeof body.method === 'string' ? body.method : '';
  if (!METHODS.has(method)) {
    return NextResponse.json({ error: 'Onbekende betaalmethode' }, { status: 400 });
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  /*
   * Who is holding the money. A monteur can only book it to themselves — the
   * alternative is one person putting cash on another person's balance, which
   * is exactly the argument this table exists to prevent.
   */
  let receivedBy: string | null = null;
  if (IN_HAND.has(method)) {
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
      receivedBy = me.id as string;
    } else {
      const given = body.received_by;
      if (typeof given === 'string' && UUID.test(given)) receivedBy = given;
    }
  }

  const { data, error } = await supabase
    .from('job_payments')
    .insert({
      job_id: id,
      amount: Math.round(amount * 100) / 100,
      method,
      received_by: receivedBy,
      note: typeof body.note === 'string' ? body.note.slice(0, 300) : null,
      created_by: user.id,
    })
    .select('id, amount, method, received_by, paid_at')
    .single();

  if (error) {
    console.error('Payment insert failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  return NextResponse.json({ payment: data }, { status: 201 });
}
