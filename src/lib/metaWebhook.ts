import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Meta's webhook signature, for Instagram DMs and Facebook Messenger.
 *
 * A third scheme in this codebase, and all three differ in the details that
 * matter:
 *
 *   ElevenLabs  `t=…,v0=…`, hex,    signs `${timestamp}.${body}`
 *   Resend      Svix `v1,…`, base64, key is base64-decoded from whsec_…
 *   Meta        `sha256=…`, hex,     signs the body alone, key is the app secret
 *
 * Meta has no timestamp in the signature, so there is no replay window to
 * enforce here — their delivery guarantees are the whole protection, which is
 * also why the route must stay idempotent on `provider_message_id`.
 *
 * Must be called with the RAW body. Meta signs the exact bytes it sent, and
 * those bytes carry non-ASCII escaped as `\uXXXX`. A Dutch customer writing
 * "héél dringend", or anyone sending an emoji — which in a DM is most people —
 * will not match if the body has been through JSON.parse and back. Do not
 * "fix" this by parsing first.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader || !appSecret) return false;

  const [algorithm, signature] = signatureHeader.split('=');
  if (algorithm !== 'sha256' || !signature) return false;

  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');

  /* Lowercase, because Meta documents lowercase hex and `timingSafeEqual`
     compares bytes — "AB" and "ab" are the same signature and different
     buffers. */
  const candidate = Buffer.from(signature.toLowerCase());
  const expectedBuf = Buffer.from(expected);

  return candidate.length === expectedBuf.length && timingSafeEqual(candidate, expectedBuf);
}

/**
 * The GET handshake Meta makes when the webhook is first saved in the App
 * Dashboard, and again whenever the URL changes.
 *
 * Returns the challenge to echo back, or null to refuse. Refusing is a 403 and
 * not a 200 with an empty body: the dashboard reports the former as "could not
 * validate" and silently accepts the latter as success, leaving a webhook that
 * looks configured and delivers nothing.
 */
export function readVerificationChallenge(
  url: URL,
  verifyToken: string,
): string | null {
  if (!verifyToken) return null;
  if (url.searchParams.get('hub.mode') !== 'subscribe') return null;
  if (url.searchParams.get('hub.verify_token') !== verifyToken) return null;

  return url.searchParams.get('hub.challenge');
}
