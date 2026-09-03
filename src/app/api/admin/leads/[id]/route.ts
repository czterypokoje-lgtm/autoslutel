import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Update one lead's pipeline state.
 *
 * Writes go through the caller's own session client, never the service-role
 * key: the RLS policy in 0003_crm_roles.sql is the real guard, and the
 * requireOfficeUserApi check above it is the fast, readable one. Both have to
 * pass.
 */

const STATUSES = [
  'new',
  'qualified',
  'contacted',
  'sold',
  'rejected',
  'duplicate',
] as const;

type Status = (typeof STATUSES)[number];

function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

/**
 * Money is `numeric(10,2)` in Postgres and must stay exact. Parse from a
 * string, round to cents, and refuse anything that is not a finite amount.
 */
function parsePrice(value: unknown): number | null | 'invalid' {
  if (value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0 || n > 99_999_999) return 'invalid';
  return Math.round(n * 100) / 100;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireOfficeUserApi();
  if (response) return response;

  const { id } = await params;
  if (!/^[0-9a-f-]{10,40}$/i.test(id) && !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Ongeldig lead-id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if ('status' in body) {
    if (!isStatus(body.status)) {
      return NextResponse.json({ error: 'Onbekende status' }, { status: 400 });
    }
    patch.status = body.status;
  }

  if ('sale_price' in body) {
    const price = parsePrice(body.sale_price);
    if (price === 'invalid') {
      return NextResponse.json({ error: 'Ongeldig bedrag' }, { status: 400 });
    }
    patch.sale_price = price;
  }

  if ('assigned_to' in body) {
    const assignee = body.assigned_to;
    if (assignee !== null && typeof assignee !== 'string') {
      return NextResponse.json({ error: 'Ongeldige toewijzing' }, { status: 400 });
    }
    // "Aan mij" is the only assignment this phase supports; a picker arrives
    // with the technicians table in fase 2.
    patch.assigned_to = assignee === 'me' ? user.id : assignee;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Niets om te wijzigen' }, { status: 400 });
  }

  // `sold` without a real amount is the failure this whole screen exists to
  // prevent: /api/export-conversions would ship a conversion worth nothing to
  // Google Ads, and the bidding would optimise on it.
  if (patch.status === 'sold') {
    const price = patch.sale_price;
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { error: 'Een verkochte lead heeft een echt bedrag nodig.' },
        { status: 400 }
      );
    }
    patch.sold_at = new Date().toISOString();
    patch.sold_to = user.email;
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('leads')
    .update(patch)
    .eq('id', id)
    .select(
      'id, status, sale_price, sold_at, assigned_to, updated_at, first_contact_at'
    )
    .maybeSingle();

  if (error) {
    console.error('CRM lead update failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }

  // No row came back: RLS refused, or the id does not exist. Both are a 404
  // from the caller's point of view — do not confirm that an id exists.
  if (!data) {
    return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 });
  }

  return NextResponse.json(
    { lead: data },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
