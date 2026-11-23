import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isScenario } from '@/lib/scenarios';
import { LOST_REASONS, OUTCOMES, type LostReason, type Outcome } from '@/app/admin/offertes/types';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };
type Db = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * "Won" defaults to the quoted price (docs/lead-quotes.md §3.2) when the
 * caller does not give one. `fallback` covers the price already in the
 * update payload; only a fresh read hits the database.
 */
async function resolveWonPrice(db: Db, id: string, given: unknown, fallback?: number): Promise<number | null> {
  const n = given !== undefined ? Number(given) : NaN;
  if (Number.isFinite(n) && n > 0) return n;
  if (fallback !== undefined && Number.isFinite(fallback) && fallback > 0) return fallback;
  const { data } = await db.from('lead_quotes').select('quoted_price').eq('id', id).maybeSingle();
  return data ? Number(data.quoted_price) : null;
}

/** One reviewer decision on a lead quote (docs/lead-quotes.md §3.2). */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Ongeldig id' }, { status: 400 });

  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.action !== 'string') {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const db = await createSupabaseServerClient();

  if (body.action === 'confirm') {
    const update: Record<string, unknown> = {
      status: 'confirmed',
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
    };
    if (body.make !== undefined) update.make = body.make === null ? null : String(body.make);
    if (body.model !== undefined) update.model = body.model === null ? null : String(body.model);
    if (body.year !== undefined && body.year !== null) {
      const year = Number(body.year);
      if (!Number.isInteger(year)) return NextResponse.json({ error: 'Ongeldig jaar' }, { status: 400 });
      update.year = year;
    }
    if (body.scenario !== undefined && body.scenario !== null) {
      if (!isScenario(body.scenario)) return NextResponse.json({ error: 'Ongeldig scenario' }, { status: 400 });
      update.scenario = body.scenario;
    }
    if (body.quoted_price !== undefined) {
      const price = Number(body.quoted_price);
      if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ error: 'Ongeldig bedrag' }, { status: 400 });
      update.quoted_price = price;
    }
    if (body.outcome !== undefined) {
      if (!OUTCOMES.includes(body.outcome as Outcome)) return NextResponse.json({ error: 'Ongeldige uitkomst' }, { status: 400 });
      const outcome = body.outcome as Outcome;
      update.outcome = outcome;
      update.outcome_at = outcome === 'open' ? null : new Date().toISOString();

      if (outcome === 'lost') {
        if (!LOST_REASONS.includes(body.lost_reason as LostReason)) {
          return NextResponse.json({ error: 'Kies een reden' }, { status: 400 });
        }
        update.lost_reason = body.lost_reason;
      } else {
        update.lost_reason = null;
      }

      if (outcome === 'won') {
        const wonPrice = await resolveWonPrice(db, id, body.won_price, update.quoted_price as number | undefined);
        if (wonPrice === null) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
        update.won_price = wonPrice;
      }
    }

    const { data, error } = await db
      .from('lead_quotes')
      .update(update)
      .eq('id', id)
      .eq('status', 'proposed')
      .select('id')
      .maybeSingle();
    if (error) {
      console.error('quote confirm failed:', error.message);
      return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'reject') {
    const { data, error } = await db
      .from('lead_quotes')
      .update({ status: 'rejected', reviewed_by: auth.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'proposed')
      .select('id')
      .maybeSingle();
    if (error) {
      console.error('quote reject failed:', error.message);
      return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'outcome') {
    if (!OUTCOMES.includes(body.outcome as Outcome)) return NextResponse.json({ error: 'Ongeldige uitkomst' }, { status: 400 });
    const outcome = body.outcome as Outcome;
    const update: Record<string, unknown> = { outcome, outcome_at: new Date().toISOString() };

    if (outcome === 'lost') {
      if (!LOST_REASONS.includes(body.lost_reason as LostReason)) {
        return NextResponse.json({ error: 'Kies een reden' }, { status: 400 });
      }
      update.lost_reason = body.lost_reason;
    } else {
      update.lost_reason = null;
    }

    if (outcome === 'won') {
      const wonPrice = await resolveWonPrice(db, id, body.won_price);
      if (wonPrice === null) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
      update.won_price = wonPrice;
    }

    const { data, error } = await db
      .from('lead_quotes')
      .update(update)
      .eq('id', id)
      .eq('status', 'confirmed')
      .select('id')
      .maybeSingle();
    if (error) {
      console.error('quote outcome failed:', error.message);
      return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Onbekende actie' }, { status: 400 });
}
