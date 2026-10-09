import 'server-only';
import { toE164NL } from '@/lib/phone';

/**
 * "Bel mij." — an outbound ElevenLabs call that puts a human on the line for a
 * conversation the agent could not finish.
 *
 * Why this exists at all, given that ElevenLabs transfers calls by itself:
 * transfer_to_number (configured in the console, no code here — see
 * docs/elevenlabs-console-setup.md) only works while somebody picks up. Nobody
 * answering is exactly the case that matters: three in the morning, a child in
 * the car. Then the transfer fails, the agent comes back into the conversation,
 * and this is what is left — ring the office and read out what is going on.
 *
 * Best-effort and env-gated, the same contract as sendWhatsAppOffer: a silent
 * no-op until all three variables are set, so this is safe to deploy before the
 * briefing agent exists in the console. Returns whether a call was really
 * placed — the caller has promised someone a human and must not say so on a
 * request that quietly did nothing.
 */

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_BRIEFING_AGENT_ID;
const PHONE_NUMBER_ID = process.env.ELEVENLABS_OUTBOUND_PHONE_NUMBER_ID;
const OFFICE_PHONE = process.env.OFFICE_PHONE;

export interface Briefing {
  /** What the agent would say to the colleague, one or two sentences. */
  summary: string;
  /** The customer, so whoever picks up can call them straight back. */
  customerPhone: string | null;
  customerName: string | null;
  /** 'whatsapp' | 'phone' — the office asks this first, every time. */
  channel: string;
}

export async function callOffice(briefing: Briefing): Promise<boolean> {
  if (!API_KEY || !AGENT_ID || !PHONE_NUMBER_ID || !OFFICE_PHONE) return false;

  const to = toE164NL(OFFICE_PHONE);
  if (!to) return false;

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: AGENT_ID,
        agent_phone_number_id: PHONE_NUMBER_ID,
        to_number: to,
        /*
         * The briefing rides in dynamic variables, not in the prompt: the
         * briefing agent's prompt is fixed and reviewable, and every call it
         * makes says only what we put in these four fields.
         */
        conversation_initiation_client_data: {
          dynamic_variables: {
            samenvatting: briefing.summary,
            klant_naam: briefing.customerName ?? 'onbekend',
            klant_telefoon: briefing.customerPhone ?? 'onbekend',
            kanaal: briefing.channel,
          },
        },
      }),
    });

    if (!res.ok) {
      console.error('Briefing call failed:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Briefing call error:', err instanceof Error ? err.message : err);
    return false;
  }
}
