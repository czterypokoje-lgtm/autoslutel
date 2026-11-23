// Retention periods for AI-agent conversations (src/lib/privacyRetention.ts). Pure.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { purgeRules } from '../../src/lib/privacyRetention.ts';

test('one rule per period, plus a catch-all for unlisted channels', () => {
  const now = new Date('2026-11-23T03:00:00Z');
  const rules = purgeRules(now);
  const find = (channel) => rules.find((r) => r.channels?.includes(channel));
  assert.equal(find('webchat').before, '2026-05-24T03:00:00.000Z');
  assert.equal(find('phone').before, '2025-11-23T03:00:00.000Z');
  assert.deepEqual(find('whatsapp'), find('phone'));
  assert.equal(find('extern').before, now.toISOString()); // not kept at all
  const other = rules.find((r) => r.channels === null);
  assert.equal(other.before, find('webchat').before); // a new channel gets the shortest real period
});
