import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { loadConversionData } from '@/lib/conversionData';
import { exclBtw, round2, type SaleSource } from '@/lib/conversionMatcher';

export const dynamic = 'force-dynamic';

const SOURCES: readonly SaleSource[] = ['job', 'whatsapp_quote', 'whatsapp_review'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A person's verdict on one proposed sale-click pair. The click must be one the
 * matcher itself proposes for that sale right now: the browser can confirm or
 * reject a proposal, never hand in a click id of its own.
 *
 * Body: { source, sourceId, clickId, decision: 'bevestigd' | 'afgewezen', valueIncl? }
 * valueIncl is the amount incl. BTW the customer paid; excl. BTW is computed here.
 */
export async function POST(request: Request) {
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const source = body?.source as SaleSource;
  const sourceId = typeof body?.sourceId === 'string' ? body.sourceId : '';
  const clickId = typeof body?.clickId === 'string' ? body.clickId : '';
  const decision = body?.decision;
  if (!SOURCES.includes(source) || !UUID.test(sourceId) || !clickId || (decision !== 'bevestigd' && decision !== 'afgewezen')) {
    return NextResponse.json({ error: 'Onvolledig verzoek' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const data = await loadConversionData(supabase);
  const review = data.reviews.find((r) => r.sale.source === source && r.sale.id === sourceId);
  if (!review) return NextResponse.json({ error: 'Verkoop niet gevonden' }, { status: 404 });
  if (review.status === 'bevestigd') return NextResponse.json({ error: 'Deze verkoop is al bevestigd' }, { status: 409 });
  const candidate = review.candidates.find((c) => c.id === clickId);
  if (!candidate) return NextResponse.json({ error: 'Deze klik hoort niet bij de voorstellen' }, { status: 409 });

  const row: Record<string, unknown> = {
    source,
    source_id: sourceId,
    click_kind: candidate.kind,
    click_id: candidate.id,
    clicked_at: candidate.clickedAt,
    rule: candidate.best,
    decision,
    decided_by: auth.user.id,
    decided_at: new Date().toISOString(),
    conversion_at: null,
    value_incl_btw: null,
    value_excl_btw: null,
    vat_assumed: false,
  };

  if (decision === 'bevestigd') {
    if (candidate.taken) return NextResponse.json({ error: 'Deze klik is al aan een andere verkoop gekoppeld' }, { status: 409 });
    const raw = body?.valueIncl;
    const typed = raw === undefined || raw === null || raw === '' ? null : Number(String(raw).replace(',', '.'));
    if (typed !== null && (!Number.isFinite(typed) || typed <= 0 || typed > 50000)) {
      return NextResponse.json({ error: 'Bedrag incl. btw klopt niet' }, { status: 400 });
    }
    const incl = typed !== null ? round2(typed) : review.sale.valueIncl;
    if (!incl) return NextResponse.json({ error: 'Vul het bedrag incl. btw in' }, { status: 400 });
    row.conversion_at = review.sale.at;
    row.value_incl_btw = incl;
    row.value_excl_btw = exclBtw(incl);
    /* A typed amount was entered as incl. BTW on purpose; only an untouched chat price keeps the "assumed" flag. */
    row.vat_assumed = typed === null && review.sale.vatAssumed;
  }

  const { error } = await supabase.from('ad_conversion_matches').upsert(row, { onConflict: 'source,source_id,click_id' });
  if (error) {
    console.error('conversion decision failed:', error.message);
    const clash = /one_per_(sale|click)/.test(error.message);
    return NextResponse.json({ error: clash ? 'Al gekoppeld (verkoop of klik)' : 'Opslaan mislukt' }, { status: clash ? 409 : 500 });
  }
  return NextResponse.json({ ok: true });
}

/** Undo a decision. A row Google already fetched stays: retract it in Google Ads instead. */
export async function DELETE(request: Request) {
  const auth = await requireOfficeUserApi();
  if (auth.response) return auth.response;

  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!UUID.test(id)) return NextResponse.json({ error: 'Onvolledig verzoek' }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('ad_conversion_matches')
    .delete()
    .eq('id', id)
    .is('uploaded_at', null)
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('conversion undo failed:', error.message);
    return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Al door Google opgehaald of niet gevonden' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
