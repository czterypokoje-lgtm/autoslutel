import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * ElevenLabs' post-call webhook signature: `elevenlabs-signature:
 * t=<unix_seconds>,v0=<hex hmac-sha256>`, signing `${timestamp}.${rawBody}`
 * with the workspace's webhook secret. Verified here with plain Node
 * `crypto` rather than the ElevenLabs SDK — this app has no other dependency
 * on it, and the Twilio SDK earlier this session broke the client bundle the
 * moment something else in the same file was imported client-side; one
 * fetch-based library per external service is the pattern this app follows
 * everywhere else (whatsapp.ts/telegram.ts).
 *
 * Must be called with the RAW request body — `request.text()`, never
 * `request.json()` first — since the signed message is the exact bytes
 * ElevenLabs sent, not a re-serialized version of them.
 */
export function verifyElevenLabsSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const i = part.indexOf('=');
      return [part.slice(0, i), part.slice(i + 1)];
    })
  );
  const timestamp = parts.t;
  const signature = parts.v0;
  if (!timestamp || !signature) return false;

  // 30-minute tolerance, same window ElevenLabs' own SDK enforces — old enough to reject a replay.
  const ageMs = Date.now() - Number(timestamp) * 1000;
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 30 * 60 * 1000) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
