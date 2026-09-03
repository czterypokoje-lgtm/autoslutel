import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TIME_SLOTS, trimTime } from '@/lib/crmJobs';

export const dynamic = 'force-dynamic';

/**
 * Create a job — normally from a lead ("Plan in"), sometimes by hand.
 *
 * The write goes through the caller's session client, so the office-only RLS
 * policy on `jobs` is the guard that actually holds.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function price(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 99_999_999) return 'invalid';
  return Math.round(n * 100) / 100;
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

  const scheduledDate = text(body.scheduled_date, 10);
  if (!scheduledDate || !/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    return NextResponse.json({ error: 'Kies een datum' }, { status: 400 });
  }

  const slotStart = trimTime(text(body.slot_start, 8) ?? '');
  const slotEnd = trimTime(text(body.slot_end, 8) ?? '');
  const knownSlot = TIME_SLOTS.some(
    (s) => s.start === slotStart && s.end === slotEnd
  );
  // A custom window is allowed, but it still has to be a window.
  if (!slotStart || !slotEnd || (!knownSlot && slotEnd <= slotStart)) {
    return NextResponse.json({ error: 'Kies een geldig tijdvak' }, { status: 400 });
  }

  const leadId = text(body.lead_id, 40);
  const orderId = text(body.order_id, 40);
  const technicianId = text(body.technician_id, 40);

  for (const [label, value] of [
    ['lead_id', leadId],
    ['order_id', orderId],
    ['technician_id', technicianId],
  ] as const) {
    if (value && !UUID.test(value)) {
      return NextResponse.json({ error: `Ongeldige ${label}` }, { status: 400 });
    }
  }

  const quoted = price(body.quoted_price);
  if (quoted === 'invalid') {
    return NextResponse.json({ error: 'Ongeldig bedrag' }, { status: 400 });
  }

  const row = {
    lead_id: leadId,
    order_id: orderId,
    technician_id: technicianId,
    scheduled_date: scheduledDate,
    slot_start: slotStart,
    slot_end: slotEnd,
    street: text(body.street, 200),
    postcode: text(body.postcode, 12)?.toUpperCase().replace(/\s+/g, '') ?? null,
    city: text(body.city, 120),
    kenteken: text(body.kenteken, 12)?.toUpperCase().replace(/\s+/g, '') ?? null,
    customer_name: text(body.customer_name, 120),
    customer_phone: text(body.customer_phone, 40),
    service_type: text(body.service_type, 120),
    quoted_price: quoted,
    notes: text(body.notes, 2000),
    status: 'gepland',
  };

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase.from('jobs').insert(row).select('id').single();

  if (error) {
    console.error('CRM job insert failed:', error.message);
    return NextResponse.json({ error: 'Inplannen mislukt' }, { status: 500 });
  }

  /*
   * A planned lead is no longer new. Moving it to `qualified` also stamps
   * `first_contact_at` through the trigger from 0003, which is what the
   * response-time report will later be built on.
   *
   * Deliberately not fatal: the job exists, and a lead stuck on `new` is a far
   * smaller problem than an error that makes the planner try again and create
   * a second job.
   */
  if (leadId) {
    const { error: leadError } = await supabase
      .from('leads')
      .update({ status: 'qualified' })
      .eq('id', leadId)
      .eq('status', 'new');
    if (leadError) {
      console.error('Lead status not updated after planning:', leadError.message);
    }
  }

  return NextResponse.json(
    { job: data },
    { status: 201, headers: { 'Cache-Control': 'no-store' } }
  );
}
