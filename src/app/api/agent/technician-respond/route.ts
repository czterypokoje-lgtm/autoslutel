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
 *
 * `offer_id` is optional, and on WhatsApp always absent: the Meta template
 * carries auto, plaats en bedrag, never the id, so there is nothing in the
 * thread for the agent to read it from. Without it the RPC resolves the
 * technician's single open offer from `phone`, and refuses ('meerdere_open')
 * when there is more than one — see migration 0055.
 */

const OUTCOME: Record<string, string> = {
  geaccepteerd: 'Geaccepteerd. De klus staat nu bij deze monteur.',
  afgewezen: 'Genoteerd, de klus is afgewezen.',
  al_vergeven: 'Deze klus is helaas al door iemand anders aangenomen.',
  verlopen: 'Deze aanbieding is verlopen.',
  niet_gevonden: 'Kon geen openstaande aanbieding voor deze monteur vinden.',
  meerdere_open:
    'Er staan meerdere aanbiedingen open bij deze monteur, dus het is niet duidelijk welke klus hij bedoelt. Laat hem reageren via Aanbod in het monteursportaal of via de Telegram-bot.',
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

  if (!phone) {
    return NextResponse.json({ error: 'phone is verplicht' }, { status: 400 });
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
