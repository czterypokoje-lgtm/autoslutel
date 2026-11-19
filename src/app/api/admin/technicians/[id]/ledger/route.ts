import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Book a movement on a monteur's account: a handover, a payout, what they
 * earned, or an explicit correction.
 *
 * Office only. A monteur can see their balance but cannot settle it — that is
 * the point of a balance.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES = new Set(['afdracht', 'uitbetaling', 'verdienste', 'correctie']);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireOfficeUserApi();
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

  const entryType = typeof body.entry_type === 'string' ? body.entry_type : '';
  if (!TYPES.has(entryType)) {
    return NextResponse.json({ error: 'Onbekend soort mutatie' }, { status: 400 });
  }

  const raw = body.amount;
  const amount =
    typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 99_999_999) {
    return NextResponse.json({ error: 'Ongeldig bedrag' }, { status: 400 });
  }

  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';

  // A correction is the one entry that can go either way, so it has to say
  // which way and why. Unexplained corrections are how a ledger stops being
  // evidence of anything.
  let direction = 1;
  if (entryType === 'correctie') {
    if (body.direction !== 1 && body.direction !== -1) {
      return NextResponse.json({ error: 'Kies een richting' }, { status: 400 });
    }
    if (!note) {
      return NextResponse.json(
        { error: 'Een correctie heeft een reden nodig.' },
        { status: 400 }
      );
    }
    direction = body.direction as number;
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('technician_ledger')
    .insert({
      technician_id: id,
      entry_type: entryType,
      amount: Math.round(amount * 100) / 100,
      direction,
      note: note || null,
      created_by: user.id,
    })
    .select('id, entry_type, amount, direction, occurred_at, note')
    .single();

  if (error) {
    console.error('Ledger insert failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  return NextResponse.json({ entry: data }, { status: 201 });
}
