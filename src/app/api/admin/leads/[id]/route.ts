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

  /*
   * First contact.
   *
   * The column has existed since 0001 and the response has always selected
   * it, but nothing ever wrote it — so "how long did this lead wait before a
   * human answered it" was unanswerable, which is the one number that says
   * whether the pipeline is working.
   *
   * Set the first time a lead leaves `new`, and never again: this is the
   * moment somebody first picked it up, not the moment it last moved. A
   * status going back to `new` does not clear it either — the contact
   * happened.
   *
   * `duplicate` is excluded on purpose. The intake route assigns it
   * automatically, with no human involved, so counting it as contact would
   * quietly flatter the response time it exists to measure.
   */
  const isFirstContact =
    typeof patch.status === 'string' && patch.status !== 'new' && patch.status !== 'duplicate';

  patch.updated_by = user.email;

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

  const COLUMNS = 'id, status, sale_price, sold_at, assigned_to, updated_at, first_contact_at';

  const { data, error } = await supabase
    .from('leads')
    .update(patch)
    .eq('id', id)
    .select(COLUMNS)
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

  /*
   * The stamp is its own statement with `.is('first_contact_at', null)` in the
   * filter, rather than a field in the patch above, so the condition is
   * evaluated by Postgres and not by this process. Folding it into the patch
   * would re-stamp on every later status change — turning "when did a human
   * first answer this" into "when was this last touched", which is a number
   * that always looks good and means nothing.
   *
   * Failure here is logged, not returned: the status change the user asked
   * for has already succeeded, and reporting it as failed would have them
   * click it again.
   */
  let lead = data;
  if (isFirstContact && data.first_contact_at === null) {
    const { data: stamped, error: stampError } = await supabase
      .from('leads')
      .update({ first_contact_at: new Date().toISOString() })
      .eq('id', id)
      .is('first_contact_at', null)
      .select(COLUMNS)
      .maybeSingle();

    if (stampError) {
      console.error('CRM first_contact_at stamp failed:', stampError.message);
    } else if (stamped) {
      lead = stamped;
    }
  }

  return NextResponse.json(
    { lead },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
