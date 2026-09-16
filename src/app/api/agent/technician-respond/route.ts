import { NextResponse } from 'next/server';
import { checkAgent, asText } from '@/lib/agentAuth';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Tool endpoint for the ElevenLabs "Technician Agent" (WhatsApp) to accept or
 * decline a job offer — the WhatsApp equivalent of the Telegram callback
 * handler (src/app/api/telegram/webhook/route.ts), calling the same-shaped
 * RPC (crm_respond_to_offer_whatsapp, 0035) instead of the Telegram one.
 *
 * `phone` should be wired in the ElevenLabs tool config to {{system__caller_id}}
 * — on a WhatsApp conversation this is the sender's WhatsApp user id, which
 * is the phone number itself, not a name the agent could get wrong.
 */

const OUTCOME: Record<string, string> = {
  geaccepteerd: 'Geaccepteerd. De klus staat nu bij deze monteur.',
  afgewezen: 'Genoteerd, de klus is afgewezen.',
  al_vergeven: 'Deze klus is helaas al door iemand anders aangenomen.',
  verlopen: 'Deze aanbieding is verlopen.',
  niet_gevonden: 'Kon deze aanbieding niet vinden.',
  geen_monteur: 'Kon geen monteur vinden bij dit nummer.',
};

export async function POST(request: Request) {
  const auth = checkAgent(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }

  const offerId = asText(body.offer_id, 36);
  const phone = asText(body.phone, 40);
  const accept = body.accept === true;

  if (!offerId || !phone) {
    return NextResponse.json({ error: 'offer_id en phone zijn verplicht' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('crm_respond_to_offer_whatsapp', {
    p_offer_id: offerId,
    p_phone: phone,
    p_accept: accept,
  });

  if (error) {
    console.error('WhatsApp offer response failed:', error.message);
    return NextResponse.json({ error: 'Bijwerken mislukt' }, { status: 500 });
  }

  const outcome = OUTCOME[String(data)] ?? String(data);
  return NextResponse.json({ outcome_code: data, message: outcome });
}
