/**
 * The one check behind the postvak: `node scripts/check-berichten.mts`.
 *
 * Everything here guards the same thing — the `(channel, external_id)` key.
 * If two spellings of one customer normalise differently, they get two
 * threads, and the second one looks like a brand new lead. That failure is
 * silent: nothing errors, the office simply answers half a conversation.
 */
import assert from 'node:assert/strict';
import {
  normaliseExternalId,
  replySubject,
  isPhoneChannel,
  conversationInitial,
  parseAddress,
  htmlToText,
} from '../src/lib/berichten.ts';

// A Dutch mobile, however it was typed, is one thread.
const number = '+31611751231';
assert.equal(normaliseExternalId('whatsapp', '06 11 75 12 31'), number);
assert.equal(normaliseExternalId('whatsapp', '0611751231'), number);
assert.equal(normaliseExternalId('phone', '+31 6 11 75 12 31'), number);
assert.equal(normaliseExternalId('sms', '0031611751231'), number);
assert.equal(normaliseExternalId('whatsapp', '31611751231'), number);

// A foreign caller keeps their own country code — the agent really gets these.
assert.equal(normaliseExternalId('phone', '+48500312292'), '+48500312292');

// An address is one thread regardless of case or stray spacing.
assert.equal(normaliseExternalId('email', '  Jan@Example.NL '), 'jan@example.nl');
assert.equal(normaliseExternalId('email', 'jan@example.nl'), 'jan@example.nl');

// Unusable input is null, never a guess: a guess opens a duplicate thread.
assert.equal(normaliseExternalId('email', 'jan'), null);
assert.equal(normaliseExternalId('email', 'jan@localhost'), null);
assert.equal(normaliseExternalId('email', ''), null);
assert.equal(normaliseExternalId('whatsapp', 'geen nummer'), null);
assert.equal(normaliseExternalId('phone', null), null);

// Meta ids are opaque and must survive untouched — no phone normalisation.
assert.equal(normaliseExternalId('instagram', '17841400000000000'), '17841400000000000');
assert.equal(normaliseExternalId('messenger', '  8912345678  '), '8912345678');
assert.equal(isPhoneChannel('instagram'), false);
assert.equal(isPhoneChannel('whatsapp'), true);

// A reply says what it is replying to, and does not stack "Re:" forever.
assert.equal(replySubject('Sleutel kwijt'), 'Re: Sleutel kwijt');
assert.equal(replySubject('Re: Sleutel kwijt'), 'Re: Sleutel kwijt');
assert.equal(replySubject('RE:  Sleutel kwijt'), 'RE: Sleutel kwijt');
assert.equal(replySubject(null), 'Re: uw bericht aan Autosleutel24');
assert.equal(replySubject('   '), 'Re: uw bericht aan Autosleutel24');

// The list avatar falls back to the id, and never renders an empty circle.
assert.equal(conversationInitial('Jan Jansen', 'jan@example.nl'), 'J');
assert.equal(conversationInitial(null, 'piet@example.nl'), 'P');
assert.equal(conversationInitial('  ', '+31611751231'), '3');
assert.equal(conversationInitial(null, '+++'), '?');

// An address is the key; the display name is decoration and must not leak in.
assert.equal(parseAddress('jan@example.nl').address, 'jan@example.nl');
assert.equal(parseAddress('Jan Jansen <Jan@Example.NL>').address, 'jan@example.nl');
assert.equal(parseAddress('Jan Jansen <jan@example.nl>').name, 'Jan Jansen');
assert.equal(parseAddress('"Jansen, Jan" <jan@example.nl>').name, 'Jansen, Jan');
assert.equal(parseAddress('<jan@example.nl>').name, null);
assert.equal(parseAddress('<jan@example.nl>').address, 'jan@example.nl');
assert.equal(parseAddress('').address, null);

// The same person writing from two clients is one thread, not two.
assert.equal(
  normaliseExternalId('email', parseAddress('Jan Jansen <Jan@Example.NL>').address),
  normaliseExternalId('email', parseAddress('jan@example.nl').address),
);

// An HTML-only mail still has a readable body in the thread.
assert.equal(htmlToText('<p>Hallo</p><p>Mijn sleutel is kwijt</p>'), 'Hallo\nMijn sleutel is kwijt');
assert.equal(htmlToText('Regel een<br>Regel twee'), 'Regel een\nRegel twee');
assert.equal(htmlToText('<style>p{color:red}</style><p>Hallo</p>'), 'Hallo');
assert.equal(htmlToText('<p>Kosten &lt; &euro;200 &amp; snel</p>'), 'Kosten < &euro;200 & snel');
assert.equal(htmlToText('<ul><li>een</li><li>twee</li></ul>'), '• een\n• twee');
assert.equal(htmlToText('<p>a</p>\n\n\n<p>b</p>'), 'a\n\nb');
assert.equal(htmlToText(null), '');

// Markup from a sender arrives as text, so the console cannot be injected.
assert.equal(htmlToText('<script>alert(1)</script>Hallo'), 'Hallo');
assert.ok(!htmlToText('<img src=x onerror=alert(1)>Hallo').includes('onerror'));

console.log('check-berichten: alle controles geslaagd');
