import { randomUUID, createHash } from 'crypto';
import { toE164NL } from '@/lib/phone';

const EVENTS_ENDPOINT = 'https://bzr.openai.com/v1/events';
const PIXEL_ID = '88ci7ALEwxU73NJc95KEpo';

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export interface OpenAiEventParams {
  eventName: 'lead_created' | 'order_created' | 'custom';
  /** Required when eventName is 'custom'. */
  customEventName?: string;
  /** Stable id: reuse it on retry so the platform deduplicates. Random when omitted. */
  id?: string;
  timestampMs?: number;
  actionSource?: 'web' | 'phone_call' | 'offline';
  sourceUrl?: string;
  /** ChatGPT ads' click reference, exactly as it arrived on the landing URL. */
  oppref?: string | null;
  email?: string | null;
  phone?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  /** Whole euros; sent as integer cents. */
  amount?: number;
  currency?: string;
}

/**
 * Sends one server-side conversion event to OpenAI Ads, shaped per
 * https://developers.openai.com/ads/conversions-api — `user` with
 * `*_sha256` lists, not `user_data`. One invalid field fails the whole batch,
 * which is what the earlier `user_data.email` shape silently did.
 * Requires OPENAI_ADS_API_KEY.
 */
export async function sendOpenAiEvent(params: OpenAiEventParams): Promise<boolean> {
  const apiKey = process.env.OPENAI_ADS_API_KEY;
  if (!apiKey) return false;

  const user: Record<string, unknown> = {};
  const email = params.email?.trim().toLowerCase();
  if (email) user.emails_sha256 = [hash(email)];
  // Digits with country code, no +: 0612345678 → 31612345678.
  const digits = toE164NL(params.phone)?.replace(/\D/g, '');
  if (digits) user.phone_numbers_sha256 = [hash(digits)];
  if (params.ip) user.ip_address = params.ip;
  if (params.userAgent) user.user_agent = params.userAgent;

  const actionSource = params.actionSource ?? 'web';
  const dataType =
    params.eventName === 'custom' ? 'custom' : params.eventName === 'order_created' ? 'contents' : 'customer_action';
  const data: Record<string, unknown> = { type: dataType };
  if (params.amount && params.amount > 0) {
    data.amount = Math.round(params.amount * 100);
    data.currency = params.currency ?? 'EUR';
  }

  const event: Record<string, unknown> = {
    id: params.id ?? randomUUID(),
    type: params.eventName,
    timestamp_ms: params.timestampMs ?? Date.now(),
    action_source: actionSource,
    data,
  };
  if (params.eventName === 'custom') event.custom_event_name = params.customEventName;
  if (params.oppref) event.oppref = params.oppref;
  if (params.sourceUrl) event.source_url = params.sourceUrl;
  if (Object.keys(user).length) event.user = user;

  try {
    const response = await fetch(`${EVENTS_ENDPOINT}?pid=${PIXEL_ID}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ validate_only: process.env.OPENAI_ADS_VALIDATE_ONLY === '1', events: [event] }),
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
