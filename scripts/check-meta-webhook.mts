/**
 * The one check behind Instagram and Messenger:
 * `node --conditions=react-server scripts/check-meta-webhook.mts`
 *
 * Meta's scheme is the third signature format in this codebase and the one
 * most easily copied wrongly — hex not base64, the body alone and not a
 * timestamp-prefixed string, the app secret used as-is and not decoded. Each
 * of those mistakes rejects every real DM in silence.
 *
 * The unicode case at the bottom is the one that bites in production rather
 * than in testing: a Dutch customer writing "héél dringend", or anybody at all
 * sending an emoji, arrives with the body already escaped as \uXXXX. Verify
 * over a re-serialised body and those messages — and only those — fail.
 */
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyMetaSignature, readVerificationChallenge } from '../src/lib/metaWebhook.ts';
import { readMetaMessage } from '../src/lib/berichten.ts';

const secret = 'autosleutel24-app-secret';
const body = JSON.stringify({ object: 'instagram', entry: [{ id: '178414', messaging: [] }] });
const sign = (payload: string, key = secret) =>
  `sha256=${createHmac('sha256', key).update(payload, 'utf8').digest('hex')}`;

// A genuine delivery is accepted.
assert.equal(verifyMetaSignature(body, sign(body), secret), true);

// Uppercase hex is the same signature, and must not be read as a forgery.
assert.equal(verifyMetaSignature(body, sign(body).toUpperCase().replace('SHA256', 'sha256'), secret), true);

// A changed body, a wrong secret, or a missing header are all refusals.
assert.equal(verifyMetaSignature(`${body} `, sign(body), secret), false);
assert.equal(verifyMetaSignature(body, sign(body, 'ander-secret'), secret), false);
assert.equal(verifyMetaSignature(body, null, secret), false);
assert.equal(verifyMetaSignature(body, 'sha256=', secret), false);
assert.equal(verifyMetaSignature(body, 'garbage', secret), false);

// The algorithm prefix is checked, not assumed — sha1 is Meta's old header.
assert.equal(verifyMetaSignature(body, sign(body).replace('sha256=', 'sha1='), secret), false);

// No app secret configured means nothing verifies. Fail closed.
assert.equal(verifyMetaSignature(body, sign(body), ''), false);

/*
 * Escaped unicode, which is the whole reason the route must use the raw body.
 *
 * Meta serialises with PHP, which escapes non-ASCII by default, so this is
 * literally what arrives on the wire. JavaScript's JSON.stringify does not
 * escape — so a route that parsed the body and re-serialised it would produce
 * `onWire2` below and compute a different HMAC. Both strings parse to the same
 * object; only one of them is what was signed.
 */
const onWire = '{"text":"h\\u00e9\\u00e9l dringend"}';
const onWire2 = '{"text":"héél dringend"}';
assert.deepEqual(JSON.parse(onWire), JSON.parse(onWire2));
assert.notEqual(onWire, onWire2);

assert.equal(verifyMetaSignature(onWire, sign(onWire), secret), true);
assert.equal(verifyMetaSignature(onWire2, sign(onWire), secret), false);

// The GET handshake echoes the challenge only when mode and token both match.
const url = (params: Record<string, string>) =>
  new URL(`https://www.autosleutel24.nl/api/meta/webhook?${new URLSearchParams(params)}`);

const good = { 'hub.mode': 'subscribe', 'hub.verify_token': 'geheim', 'hub.challenge': '1158201444' };
assert.equal(readVerificationChallenge(url(good), 'geheim'), '1158201444');
assert.equal(readVerificationChallenge(url({ ...good, 'hub.verify_token': 'fout' }), 'geheim'), null);
assert.equal(readVerificationChallenge(url({ ...good, 'hub.mode': 'unsubscribe' }), 'geheim'), null);
assert.equal(readVerificationChallenge(url(good), ''), null);

/*
 * Which events become messages. US is the account id Meta puts in entry[].id —
 * the Page for Messenger, the Instagram account for Instagram. Either way, us.
 */
const US = '178414000';
const THEM = '999888777';
const read = (event: unknown) => readMetaMessage(event as never, US);

// The ordinary case.
const plain = read({ sender: { id: THEM }, message: { mid: 'm1', text: 'Sleutel kwijt' } });
assert.equal(plain?.senderId, THEM);
assert.equal(plain?.text, 'Sleutel kwijt');
assert.equal(plain?.providerMessageId, 'm1');

// THE ONE THAT MATTERS. Our own reply, both shapes, must never be stored.
assert.equal(read({ sender: { id: US }, message: { mid: 'm2', text: 'Goedendag' } }), null);
assert.equal(
  read({ sender: { id: THEM }, message: { mid: 'm3', text: 'Goedendag', is_echo: true } }),
  null,
);

// Everything else Meta puts in the same array.
assert.equal(read({ sender: { id: THEM }, read: { watermark: 1 } }), null);
assert.equal(read({ sender: { id: THEM }, delivery: { watermark: 1 } }), null);
assert.equal(read({ sender: { id: THEM }, reaction: { emoji: '\u2764\ufe0f' } }), null);
assert.equal(read({ sender: { id: THEM }, postback: { payload: 'X' } }), null);
assert.equal(read({ message: { mid: 'm4', text: 'geen afzender' } }), null);
assert.equal(read({}), null);

// A deleted message leaves nothing behind; an empty one is not worth a row.
assert.equal(read({ sender: { id: THEM }, message: { mid: 'm5', text: 'x', is_deleted: true } }), null);
assert.equal(read({ sender: { id: THEM }, message: { mid: 'm6', text: '' } }), null);

// A photo with no caption IS worth a row — for a locksmith it is usually the key.
const photo = read({
  sender: { id: THEM },
  message: { mid: 'm7', attachments: [{ type: 'image', payload: { url: 'https://cdn/x.jpg' } }] },
});
assert.equal(photo?.attachments.length, 1);
assert.equal(photo?.attachments[0].url, 'https://cdn/x.jpg');
assert.equal(photo?.text, '');

// An attachment with no url is not a usable attachment.
assert.equal(read({ sender: { id: THEM }, message: { mid: 'm8', attachments: [{ type: 'image' }] } }), null);

// Something Meta will not hand over still shows that the customer wrote.
assert.equal(
  read({ sender: { id: THEM }, message: { mid: 'm9', is_unsupported: true, text: '' } })?.text,
  '[bericht dat Meta niet doorgeeft]',
);

// No entry id (a payload shape we do not expect) must not swallow real messages.
assert.equal(readMetaMessage({ sender: { id: THEM }, message: { mid: 'm10', text: 'hoi' } }, null)?.text, 'hoi');

console.log('check-meta-webhook: alle controles geslaagd');
