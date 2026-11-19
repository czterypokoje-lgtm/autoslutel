import { createHmac, timingSafeEqual } from 'crypto';

/*
 * A lead's id plus this token lets the browser that created the lead add the
 * answers to the follow-up questions, and nothing else. Keyed on a server-only
 * secret, so nobody can forge one for another lead.
 */
const secret = () => process.env.LEAD_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function leadToken(id: string): string | null {
  const key = secret();
  return key ? createHmac('sha256', key).update(`lead:${id}`).digest('base64url').slice(0, 32) : null;
}

export function validLeadToken(id: string, token: string): boolean {
  const expected = leadToken(id);
  if (!expected || typeof token !== 'string' || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
