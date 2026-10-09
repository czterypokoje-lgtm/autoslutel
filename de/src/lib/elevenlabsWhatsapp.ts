import 'server-only';

/**
 * Outbound WhatsApp job offers to technicians, via ElevenLabs' Technician
 * Agent instead of the Telegram bot (src/lib/telegram.ts).
 *
 * Meta requires a pre-approved message template for the first message in
 * any business-initiated WhatsApp conversation — this is what actually
 * lands in the technician's chat. The agent itself stays silent until they
 * reply to it (ElevenLabs' own docs: "no conversation timers start until
 * the user responds"), at which point the real conversational tool-calling
 * agent takes over and can accept/decline via /api/agent/technician-respond.
 *
 * Best-effort, on purpose, same as sendTelegramOffer: never on the critical
 * path of whatever triggered it. Silently a no-op until every required env
 * var is set, so this is safe to deploy before the template is approved or
 * the agent is finished being configured.
 */

const API_KEY = process.env.ELEVENLABS_API_KEY;
const PHONE_NUMBER_ID = process.env.ELEVENLABS_WHATSAPP_PHONE_NUMBER_ID;
const TECHNICIAN_AGENT_ID = process.env.ELEVENLABS_TECHNICIAN_AGENT_ID;
const TEMPLATE_NAME = process.env.ELEVENLABS_JOB_OFFER_TEMPLATE_NAME;
const TEMPLATE_LANG = process.env.ELEVENLABS_JOB_OFFER_TEMPLATE_LANG || 'nl';

export interface JobOfferTemplateParams {
  carLabel: string;
  city: string;
  price: string;
}

/** "06 11 75 12 31" -> "31611751231" — WhatsApp wants digits only, country code, no plus. */
function toWhatsAppUserId(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('31')) return digits;
  if (digits.startsWith('0')) return `31${digits.slice(1)}`;
  return digits;
}

export async function sendWhatsAppOffer(
  technicianPhone: string | null | undefined,
  params: JobOfferTemplateParams
): Promise<void> {
  if (!API_KEY || !PHONE_NUMBER_ID || !TECHNICIAN_AGENT_ID || !TEMPLATE_NAME) return;

  const userId = toWhatsAppUserId(String(technicianPhone ?? ''));
  if (!userId) return;

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/convai/whatsapp/outbound-message', {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        whatsapp_phone_number_id: PHONE_NUMBER_ID,
        whatsapp_user_id: userId,
        agent_id: TECHNICIAN_AGENT_ID,
        template_name: TEMPLATE_NAME,
        template_language_code: TEMPLATE_LANG,
        template_params: [params.carLabel, params.city, params.price],
      }),
    });

    if (!res.ok) {
      console.error('WhatsApp offer send failed:', res.status, await res.text());
    }
  } catch (err) {
    console.error('WhatsApp offer send error:', err instanceof Error ? err.message : err);
  }
}
