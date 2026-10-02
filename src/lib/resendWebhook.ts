import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Resend's webhook signature, for the inbound-mail route.
 *
 * Resend signs with Svix, which is a different scheme from the one
 * ElevenLabs uses and is worth spelling out because the two look similar
 * enough to copy wrongly:
 *
 *   headers        svix-id, svix-timestamp, svix-signature
 *   signed bytes   `${svix-id}.${svix-timestamp}.${rawBody}`
 *   secret         `whsec_<base64>` — the prefix comes off and the rest is
 *                  base64-decoded to raw key bytes. Signing with the ASCII of
 *                  the secret, which is what the ElevenLabs verifier does with
 *                  its own secret, fails every time here.
 *   digest         HMAC-SHA256, base64 (not hex)
 *   header value   space-delimited `v1,<sig>` pairs — plural, because a secret
 *                  being rotated is signed with both the old and the new key.
 *
 * Verified with plain Node `crypto` rather than the Svix or Resend SDK: this
 * app has no other use for either, and one fetch-based library per external
 * service is the pattern everywhere else here (telegram.ts, whatsapp.ts,
 * elevenlabsWebhook.ts).
 *
 * Must be called with the RAW body — `request.text()`, never `request.json()`
 * first — since the signed message is the exact bytes Resend sent and not a
 * re-serialisation of them.
 */
export interface SvixHeaders {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
}

/** Svix's own libraries allow five minutes either way. Old enough to reject a replay. */
const TOLERANCE_MS = 5 * 60 * 1000;

export function verifyResendSignature(
  rawBody: string,
  headers: SvixHeaders,
  secret: string,
): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;

  /*
   * Skew is allowed in both directions, unlike the ElevenLabs verifier which
   * rejects anything dated in the future. Svix stamps the timestamp on its own
   * senders' clocks, and a webhook arriving a few seconds "early" is a clock
   * difference, not an attack.
   */
  const ageMs = Date.now() - Number(timestamp) * 1000;
  if (!Number.isFinite(ageMs) || Math.abs(ageMs) > TOLERANCE_MS) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  if (!key.length) return false;

  const expected = createHmac('sha256', key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest('base64');
  const expectedBuf = Buffer.from(expected);

  /* Any one of the offered signatures matching is a pass. */
  for (const part of signature.split(' ')) {
    const comma = part.indexOf(',');
    if (comma < 0) continue;
    if (part.slice(0, comma) !== 'v1') continue;

    const candidate = Buffer.from(part.slice(comma + 1));
    if (candidate.length === expectedBuf.length && timingSafeEqual(candidate, expectedBuf)) {
      return true;
    }
  }

  return false;
}
