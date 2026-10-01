import { randomUUID, createHash } from 'crypto';

const EVENTS_ENDPOINT = 'https://bzr.openai.com/v1/events';
const PIXEL_ID = '88ci7ALEwxU73NJc95KEpo';

function hash(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export interface OpenAiEventParams {
  eventName: 'lead_created' | 'contact' | 'custom';
  sourceUrl?: string;
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  amount?: number;
  currency?: string;
}

/**
 * Sends a server-side conversion event to OpenAI Ads.
 * Requires OPENAI_ADS_API_KEY environment variable.
 */
export async function sendOpenAiEvent(params: OpenAiEventParams): Promise<boolean> {
  const apiKey = process.env.OPENAI_ADS_API_KEY;
  if (!apiKey) return false;

  const userData: Record<string, string> = {};
  
  if (params.email) userData.email = hash(params.email);
  if (params.phone) {
    const p = params.phone.replace(/[^\d+]/g, '');
    if (p) userData.phone = hash(p);
  }
  if (params.externalId) userData.external_id = params.externalId;
  else if (params.ip) userData.external_id = hash(params.ip); // Fallback to IP hash for external ID
  
  if (params.ip) userData.client_ip_address = params.ip;
  if (params.userAgent) userData.client_user_agent = params.userAgent;

  const payload: any = {
    validate_only: false,
    events: [
      {
        id: randomUUID(),
        type: params.eventName,
        timestamp_ms: Date.now(),
        source_url: params.sourceUrl || undefined,
        action_source: 'web',
        data: { type: 'customer_action' },
      },
    ],
  };

  // If there is user data, attach it. OpenAI Ads typically expects `user_data` at the event level.
  if (Object.keys(userData).length > 0) {
    payload.events[0].user_data = userData;
  }

  // Include value if provided
  if (params.amount && params.currency) {
    payload.events[0].data.amount = params.amount;
    payload.events[0].data.currency = params.currency;
  }

  try {
    const response = await fetch(`${EVENTS_ENDPOINT}?pid=${PIXEL_ID}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('[OpenAI Ads] Event send failed', response.status, text);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[OpenAI Ads] Event send error', err);
    return false;
  }
}
