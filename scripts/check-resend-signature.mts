/**
 * The one check behind inbound e-mail:
 * `node --conditions=react-server scripts/check-resend-signature.mts`
 *
 * (The condition flag is what makes `server-only` resolve to its empty module
 * outside Next — the verifier is server-only on purpose and should stay that
 * way.)
 *
 * Two failures this guards, and they fail in opposite directions. Sign the
 * ASCII of the secret instead of its decoded bytes, or hex instead of base64,
 * and every real e-mail is rejected as a forgery — silently, because a 401 to
 * Resend looks like nothing at all from this side. Get the comparison wrong
 * the other way and the office's postvak is writable by anyone.
 */
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyResendSignature } from '../src/lib/resendWebhook.ts';

/* A secret in Resend's own shape: `whsec_` plus base64. */
const rawKey = Buffer.from('autosleutel24-test-signing-key!!');
const secret = `whsec_${rawKey.toString('base64')}`;

const body = JSON.stringify({ type: 'email.received', data: { email_id: 'abc' } });
const id = 'msg_2vXyz';
const now = () => String(Math.floor(Date.now() / 1000));

const sign = (msgId: string, ts: string, payload: string) =>
  createHmac('sha256', rawKey).update(`${msgId}.${ts}.${payload}`).digest('base64');

const headers = (over: Partial<{ id: string; timestamp: string; signature: string }> = {}) => {
  const ts = over.timestamp ?? now();
  return {
    id: over.id ?? id,
    timestamp: ts,
    signature: over.signature ?? `v1,${sign(over.id ?? id, ts, body)}`,
  };
};

// The whole point: a genuine Resend delivery is accepted.
assert.equal(verifyResendSignature(body, headers(), secret), true);

// A secret pasted without the whsec_ prefix still works — people do that.
assert.equal(
  verifyResendSignature(body, headers(), rawKey.toString('base64')),
  true,
);

// Rotation: Resend sends both signatures, space delimited, and either passes.
const both = `v1,${sign(id, '1700000000', body)} v1,${sign(id, now(), body)}`;
assert.equal(verifyResendSignature(body, { ...headers(), signature: both }, secret), true);

// A changed body is a different message. One character is enough.
assert.equal(verifyResendSignature(`${body} `, headers(), secret), false);

// A signature that is valid for a different id or timestamp does not transfer.
assert.equal(
  verifyResendSignature(body, { ...headers(), id: 'msg_other' }, secret),
  false,
);

// Replay: a delivery older than the tolerance is refused.
const old = String(Math.floor(Date.now() / 1000) - 60 * 60);
assert.equal(verifyResendSignature(body, headers({ timestamp: old }), secret), false);

// Nonsense, and absent headers, are refusals rather than crashes.
assert.equal(verifyResendSignature(body, headers({ signature: 'v1,bm9wZQ==' }), secret), false);
assert.equal(verifyResendSignature(body, headers({ signature: 'garbage' }), secret), false);
assert.equal(verifyResendSignature(body, headers({ timestamp: 'later' }), secret), false);
assert.equal(verifyResendSignature(body, { id: null, timestamp: null, signature: null }, secret), false);

// An unversioned or wrongly versioned signature is not accepted on its shape.
assert.equal(
  verifyResendSignature(body, { ...headers(), signature: sign(id, now(), body) }, secret),
  false,
);
assert.equal(
  verifyResendSignature(body, { ...headers(), signature: `v2,${sign(id, now(), body)}` }, secret),
  false,
);

// An empty secret never verifies anything.
assert.equal(verifyResendSignature(body, headers(), 'whsec_'), false);

console.log('check-resend-signature: alle controles geslaagd');
