import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Move a webshop order along: status, track & trace, a return request, a note.
 *
 * The timestamps that go with a status (shipped_at, delivered_at, refunded_at)
 * are set by the trigger in 0009, not here — the person clicking is holding a
 * parcel, and a date field they have to fill in is a date field that goes
 * wrong.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUSES = new Set([
  'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
]);

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
    return NextResponse.json({ error: 'Ongeldig order-id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if ('status' in body) {
    if (typeof body.status !== 'string' || !STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'Onbekende status' }, { status: 400 });
    }
    patch.status = body.status;
  }

  if ('carrier' in body) patch.carrier = text(body.carrier, 60);
  if ('tracking_code' in body) patch.tracking_code = text(body.tracking_code, 120);
  if ('internal_note' in body) patch.internal_note = text(body.internal_note, 2000);

  if ('return_reason' in body) {
    const reason = text(body.return_reason, 500);
    patch.return_reason = reason;
    // Asking for a return is an event with a date attached; the reason alone
    // does not tell you whether the fourteen days were met.
    if (reason) patch.return_requested_at = new Date().toISOString();
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Niets om te wijzigen' }, { status: 400 });
  }

  // Shipping without a tracking code is the state customers phone about.
  if (patch.status === 'shipped') {
    const code = 'tracking_code' in patch ? patch.tracking_code : undefined;
    if (code === null) {
      return NextResponse.json(
        { error: 'Vul een track & trace-code in voordat je verzendt.' },
        { status: 400 }
      );
    }
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', id)
    .select('id, status, carrier, tracking_code, shipped_at, delivered_at, return_requested_at, internal_note')
    .maybeSingle();

  if (error) {
    console.error('Order update failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Bestelling niet gevonden' }, { status: 404 });
  }

  return NextResponse.json({ order: data }, { headers: { 'Cache-Control': 'no-store' } });
}
