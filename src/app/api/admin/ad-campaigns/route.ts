import { NextResponse } from 'next/server';
import { requireOfficeUserApi } from '@/lib/crmSession';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Naming a campaign.
 *
 * Google sends a number; a person types what it is. One row per campaign id,
 * upserted, so renaming is the same call as naming — the office will get a
 * name wrong once and fix it, and a separate edit route for that would be
 * two routes doing one thing.
 */

/** Long enough for a real Ads campaign name, short enough to render in a cell. */
const MAX_NAME = 120;

export async function POST(request: Request) {
  const { response } = await requireOfficeUserApi();
  if (response) return response;

  let body: { campaign_id?: unknown; name?: unknown; network?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  /* Digits only: this is Google's id, and anything else means the caller is
     making one up rather than reading one off a click. */
  const campaignId = typeof body.campaign_id === 'string' ? body.campaign_id.trim() : '';
  if (!/^\d{1,25}$/.test(campaignId)) {
    return NextResponse.json({ error: 'Ongeldig campagnenummer' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME) : '';
  const network = body.network === 'microsoft' ? 'microsoft' : 'google';

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: 'CRM is niet geconfigureerd' }, { status: 503 });
  }

  /* An emptied field removes the name rather than storing a blank one, so the
     screen falls back to the number instead of showing nothing at all. */
  if (!name) {
    const { error } = await supabase.from('ad_campaigns').delete().eq('campaign_id', campaignId);
    if (error) {
      console.error('Campaign name delete failed:', error.message);
      return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, name: null });
  }

  const { data, error } = await supabase
    .from('ad_campaigns')
    .upsert({ campaign_id: campaignId, name, network }, { onConflict: 'campaign_id' })
    .select('campaign_id, name')
    .single();

  if (error) {
    console.error('Campaign name upsert failed:', error.message);
    return NextResponse.json(
      {
        error: /does not exist|relation/i.test(error.message)
          ? 'Voer supabase/migrations/0065_ad_campaign_names.sql uit.'
          : 'Opslaan mislukt',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, campaign: data });
}
