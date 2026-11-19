// node --experimental-strip-types scripts/test-ops-followups.mjs
import assert from 'node:assert/strict';
import { findFollowups } from '../src/lib/opsFollowups.ts';

const now = new Date('2026-11-06T12:00:00Z');
const ago = (minutes) => new Date(now.getTime() - minutes * 60_000).toISOString();

const lead = (over) => ({
  id: 'l1', created_at: ago(60), name: 'Jan', phone: '0612345678', phone_e164: '+31612345678',
  brand: 'Peugeot', model: '107', service: 'bijmaken', postcode: '1012AB', status: 'new',
  first_contact_at: null, retracted_at: null, consent_marketing: false, ...over,
});
const run = (leads, conversations = [], jobPhones = []) =>
  findFollowups({ leads, conversations, jobPhones, now });

// A new lead nobody answered is the most urgent thing there is.
assert.equal(run([lead()])[0].kind, 'onbeantwoord');
assert.equal(run([lead()])[0].priority, 1);

// Too fresh to chase, already contacted, or withdrawn: left alone.
assert.equal(run([lead({ created_at: ago(5) })]).length, 0);
assert.equal(run([lead({ first_contact_at: ago(30) })]).length, 0);
assert.equal(run([lead({ retracted_at: ago(1) })]).length, 0);

// A customer with a job is not a follow-up, however the number was typed.
assert.equal(run([lead()], [], ['06 12 34 56 78']).length, 0);

// Contacted but unbooked: not yet, then yes, then given up on.
assert.equal(run([lead({ status: 'contacted', created_at: ago(120) })]).length, 0);
assert.equal(run([lead({ status: 'contacted', created_at: ago(2 * 1440) })])[0].kind, 'geen_afspraak');
assert.equal(run([lead({ status: 'contacted', created_at: ago(15 * 1440) })]).length, 0);

// One person with two enquiries appears once, as the latest.
const twice = run([lead({ id: 'old', created_at: ago(300) }), lead({ id: 'new', created_at: ago(60) })]);
assert.equal(twice.length, 1);
assert.equal(twice[0].leadId, 'new');

// An agent conversation with no lead behind it is flagged, without assumed consent.
const talk = { id: 'c1', created_at: ago(90), channel: 'whatsapp', phone: '+31687654321', outcome: 'failure', summary: 'Vroeg om prijs' };
const fromTalk = run([], [talk]);
assert.equal(fromTalk[0].kind, 'gesprek_zonder_lead');
assert.equal(fromTalk[0].consentMarketing, false);

// A conversation that already has a lead is not counted twice.
assert.equal(run([lead({ phone: '0687654321', phone_e164: '+31687654321' })], [talk]).length, 1);

// Most urgent first.
const mixed = run([lead({ id: 'a', status: 'contacted', phone_e164: '+31611111111', created_at: ago(2 * 1440) }), lead({ id: 'b' })]);
assert.deepEqual(mixed.map((f) => f.leadId), ['b', 'a']);

console.log('ops followups: all passed');
