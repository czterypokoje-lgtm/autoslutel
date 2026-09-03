import { NextResponse } from 'next/server';
import { getCrmUser } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isJobStatus, trimTime } from '@/lib/crmJobs';

export const dynamic = 'force-dynamic';

/**
 * Update one job.
 *
 * Unlike the lead routes this is not office-only: a monteur moves their own
 * job through onderweg → bezig → afgerond from the van. Which rows they may
 * touch is decided by the RLS policy in 0004, not here — this route only
 * decides which *fields* each role may write.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fields a monteur may change. Planning stays with the office. */
const MONTEUR_FIELDS = new Set(['status', 'notes', 'final_price', 'signature_url']);

function price(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 99_999_999) return 'invalid';
  return Math.round(n * 100) / 100;
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCrmUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  if (!user.role) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

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

  const patch: Record<string, unknown> = {};

  if ('status' in body) {
    if (!isJobStatus(body.status)) {
      return NextResponse.json({ error: 'Onbekende status' }, { status: 400 });
    }
    patch.status = body.status;
  }

  if ('technician_id' in body) {
    const value = body.technician_id;
    if (value !== null && (typeof value !== 'string' || !UUID.test(value))) {
      return NextResponse.json({ error: 'Ongeldige monteur' }, { status: 400 });
    }
    patch.technician_id = value;
  }

  if ('scheduled_date' in body) {
    const date = text(body.scheduled_date, 10);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Ongeldige datum' }, { status: 400 });
    }
    patch.scheduled_date = date;
  }

  if ('slot_start' in body || 'slot_end' in body) {
    const start = trimTime(text(body.slot_start, 8) ?? '');
    const end = trimTime(text(body.slot_end, 8) ?? '');
    if (!start || !end || end <= start) {
      return NextResponse.json({ error: 'Ongeldig tijdvak' }, { status: 400 });
    }
    patch.slot_start = start;
    patch.slot_end = end;
  }

  for (const field of ['notes', 'street', 'city'] as const) {
    if (field in body) patch[field] = text(body[field], 2000);
  }

  if ('final_price' in body) {
    const value = price(body.final_price);
    if (value === 'invalid') {
      return NextResponse.json({ error: 'Ongeldig bedrag' }, { status: 400 });
    }
    patch.final_price = value;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Niets om te wijzigen' }, { status: 400 });
  }

  // A monteur may report on the work, not reschedule it or hand it to someone
  // else. RLS already limits them to their own rows; this limits the columns.
  if (user.role === 'monteur') {
    const forbidden = Object.keys(patch).filter((k) => !MONTEUR_FIELDS.has(k));
    if (forbidden.length > 0) {
      return NextResponse.json(
        { error: 'Alleen kantoor kan de planning wijzigen.' },
        { status: 403 }
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
    .from('jobs')
    .update(patch)
    .eq('id', id)
    .select(
      'id, status, technician_id, scheduled_date, slot_start, slot_end, final_price, notes, started_at, completed_at'
    )
    .maybeSingle();

  if (error) {
    console.error('CRM job update failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  // Nothing came back: the policy refused, or the id does not exist. Same
  // answer either way — do not confirm which.
  if (!data) {
    return NextResponse.json({ error: 'Klus niet gevonden' }, { status: 404 });
  }

  return NextResponse.json(
    { job: data },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
