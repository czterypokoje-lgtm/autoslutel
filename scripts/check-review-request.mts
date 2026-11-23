// node --experimental-strip-types scripts/check-review-request.mts — review-request rules.
import assert from 'node:assert/strict';
import { isDue, inSendingHours, recentlyAsked, isStopMessage } from '../src/lib/reviewRequest.ts';

const afgerond = (hoursAgo: number, overrides: Partial<Parameters<typeof isDue>[0]> = {}) => ({
  completed_at: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
  status: 'afgerond',
  customer_phone: '+31611751231',
  review_requested_at: null,
  ...overrides,
});

// isDue
const now = new Date();
assert.deepEqual(isDue(afgerond(1), now), { due: false, reason: 'too_soon' });
assert.deepEqual(isDue(afgerond(5), now), { due: true });
assert.deepEqual(isDue(afgerond(4 * 24), now), { due: false, reason: 'too_old' });
assert.deepEqual(isDue(afgerond(5, { status: 'gepland' }), now), { due: false, reason: 'not_done' });
assert.deepEqual(isDue(afgerond(5, { customer_phone: null }), now), { due: false, reason: 'no_phone' });
assert.deepEqual(isDue(afgerond(5, { review_requested_at: new Date().toISOString() }), now), { due: false, reason: 'already' });

// inSendingHours — Europe/Amsterdam 09:00-20:00, winter (CET, UTC+1) and summer (CEST, UTC+2)
assert.equal(inSendingHours(new Date('2026-11-23T07:30:00Z')), false); // 08:30 winter
assert.equal(inSendingHours(new Date('2026-11-23T11:00:00Z')), true); // 12:00 winter
assert.equal(inSendingHours(new Date('2026-11-23T19:30:00Z')), false); // 20:30 winter
assert.equal(inSendingHours(new Date('2026-07-01T10:00:00Z')), true); // 12:00 summer

// recentlyAsked
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
assert.equal(recentlyAsked(daysAgo(89), now), true);
assert.equal(recentlyAsked(daysAgo(91), now), false);
assert.equal(recentlyAsked(null, now), false);

// isStopMessage — explicit opt-out words only, whole message
assert.equal(isStopMessage('STOP'), true);
assert.equal(isStopMessage(' stop. '), true);
assert.equal(isStopMessage('Afmelden'), true);
assert.equal(isStopMessage('stop met bellen aub'), false); // not a whole-message opt-out
assert.equal(isStopMessage('ok'), false);
assert.equal(isStopMessage('geen berichten meer'), true);

console.log('Review request checks passed.');
