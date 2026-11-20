/**
 * Checks behind the inbox webhooks:
 * `node --conditions=react-server scripts/check-inbox.mts`. Plain node, no network.
 *
 * What it guards: an unsigned or tampered webhook must never be accepted, a
 * Meta payload must parse into the messages and statuses we act on, and the
 * quoted history under a customer's e-mail reply must not be stored as if the
 * customer wrote it. (`--conditions=react-server` makes the `server-only`
 * marker a no-op outside Next, exactly as inside a server component.)
 */
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { isAutomated, stripQuoted, verifySvix } from '../src/lib/inbox/emailIn.ts';
import { parseWebhook, verifyMetaSignature, withinServiceWindow } from '../src/lib/inbox/whatsapp.ts';

let n = 0;
const check = (name: string, fn: () => void) => {
  try {
    fn();
    n++;
  } catch (e) {
    console.error(`FAIL: ${name}`);
    throw e;
  }
};

/* ── Meta signature ─────────────────────────────────────────────────── */
check('meta: a correctly signed body passes, a tampered one does not', () => {
  const secret = 'app-secret';
  const body = '{"object":"whatsapp_business_account"}';
  const sig = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  assert.equal(verifyMetaSignature(body, sig, secret), true);
  assert.equal(verifyMetaSignature(body + ' ', sig, secret), false);
  assert.equal(verifyMetaSignature(body, sig, 'other'), false);
  assert.equal(verifyMetaSignature(body, null, secret), false);
  assert.equal(verifyMetaSignature(body, sig, undefined), false);
});

/* ── Meta payload ───────────────────────────────────────────────────── */
check('meta: messages and statuses come out of the envelope', () => {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [{ wa_id: '31612345678', profile: { name: 'Test Klant' } }],
              messages: [
                { id: 'wamid.1', from: '31612345678', timestamp: '1700000000', type: 'text', text: { body: '  Hallo, sleutel kwijt  ' } },
                { id: 'wamid.2', from: '31612345678', timestamp: '1700000001', type: 'image', image: { id: 'm1' } },
              ],
            },
          },
          { value: { statuses: [{ id: 'wamid.out', status: 'delivered' }, { id: 'wamid.bad', status: 'weird' }] } },
        ],
      },
    ],
  };
  const { messages, statuses } = parseWebhook(payload);
  assert.equal(messages.length, 2);
  assert.deepEqual({ ...messages[0] }, { id: 'wamid.1', from: '31612345678', name: 'Test Klant', text: 'Hallo, sleutel kwijt', type: 'text', timestamp: 1700000000000 });
  assert.equal(messages[1].text, '[image]');
  assert.deepEqual(statuses, [{ id: 'wamid.out', status: 'delivered', error: null }]);
  assert.deepEqual(parseWebhook(null), { messages: [], statuses: [] });
  assert.deepEqual(parseWebhook({ entry: [{ changes: [{ value: { messages: [{ id: '', from: '' }] } }] }] }).messages, []);
});

check('meta: the 24-hour service window', () => {
  assert.equal(withinServiceWindow(null), false);
  assert.equal(withinServiceWindow(new Date(Date.now() - 3_600_000).toISOString()), true);
  assert.equal(withinServiceWindow(new Date(Date.now() - 25 * 3_600_000).toISOString()), false);
});

/* ── Svix (Resend) signature ────────────────────────────────────────── */
check('resend: svix signature, timestamp tolerance, multiple signatures', () => {
  const key = Buffer.from('0123456789abcdef0123456789abcdef');
  const secret = `whsec_${key.toString('base64')}`;
  const body = '{"type":"email.received"}';
  const id = 'msg_1';
  const ts = String(Math.floor(Date.now() / 1000));
  const sign = (k: Buffer, t: string) => createHmac('sha256', k).update(`${id}.${t}.${body}`).digest('base64');
  const headers = (sig: string, t = ts) => new Headers({ 'svix-id': id, 'svix-timestamp': t, 'svix-signature': sig });
  assert.equal(verifySvix(body, headers(`v1,${sign(key, ts)}`), secret), true);
  assert.equal(verifySvix(body, headers(`v1,${sign(Buffer.from('x'), ts)} v1,${sign(key, ts)}`), secret), true, 'any matching v1 signature');
  assert.equal(verifySvix(body + 'x', headers(`v1,${sign(key, ts)}`), secret), false);
  const old = String(Math.floor(Date.now() / 1000) - 3600);
  assert.equal(verifySvix(body, headers(`v1,${sign(key, old)}`, old), secret), false, 'stale timestamp');
  assert.equal(verifySvix(body, headers(`v1,${sign(key, ts)}`), undefined), false);
  assert.equal(verifySvix(body, new Headers(), secret), false);
});

/* ── Quoted history ─────────────────────────────────────────────────── */
check('resend: the customer text survives, the quoted history goes', () => {
  const gmail = 'Ja graag morgen.\n\nGroet, Piet\n\nOp di 18 nov 2026 om 10:12 schreef Autosleutel24 <info@autosleutel24.nl>:\n> Kunt u morgen?\n> Met vriendelijke groet';
  assert.equal(stripQuoted(gmail), 'Ja graag morgen.\n\nGroet, Piet');
  const outlook = 'Prima.\r\n\r\n-----Original Message-----\r\nFrom: info@autosleutel24.nl\r\nSent: Monday';
  assert.equal(stripQuoted(outlook), 'Prima.');
  const english = 'Thanks!\nOn Mon, Nov 17, 2026 at 9:00 AM Someone <a@b.c> wrote:\n> hi';
  assert.equal(stripQuoted(english), 'Thanks!');
  assert.equal(stripQuoted('> only a quote'), '');
});

check('resend: bounces, out-of-office and lists are not conversations', () => {
  const base = { from: 'klant@example.com', subject: 'Vraag', headers: {} as Record<string, string> };
  assert.equal(isAutomated(base), false);
  assert.equal(isAutomated({ ...base, headers: { 'auto-submitted': 'auto-replied' } }), true);
  assert.equal(isAutomated({ ...base, headers: { 'auto-submitted': 'no' } }), false);
  assert.equal(isAutomated({ ...base, headers: { precedence: 'bulk' } }), true);
  assert.equal(isAutomated({ ...base, headers: { 'list-unsubscribe': '<mailto:x>' } }), true);
  assert.equal(isAutomated({ ...base, from: 'mailer-daemon@googlemail.com' }), true);
  assert.equal(isAutomated({ ...base, from: 'noreply@shop.nl' }), true);
  assert.equal(isAutomated({ ...base, subject: 'Automatisch antwoord: Vraag' }), true);
});

console.log(`check-inbox: ${n} checks passed`);
