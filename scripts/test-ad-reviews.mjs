// node --experimental-strip-types scripts/test-ad-reviews.mjs
import assert from 'node:assert/strict';
import { readDecision, reviewsCsv } from '../src/lib/adReviews.ts';

assert.deepEqual(readDecision({ decision: 'geen_job', value: '5' }), { decision: 'geen_job', value: null, workDate: null });
assert.deepEqual(readDecision({ decision: 'gedaan', workDate: '2026-11-06', value: '150,50' }), { decision: 'gedaan', value: 150.5, workDate: '2026-11-06' });
assert.equal(readDecision({ decision: 'gedaan', workDate: '2026-11-06', value: '' }).value, null);
assert.ok(readDecision({ decision: 'gedaan', value: '10' }).error);
assert.ok(readDecision({ decision: 'gedaan', workDate: '2026-11-06', value: '-1' }).error);
assert.ok(readDecision({ decision: 'x' }).error);

const csv = reviewsCsv([
  { gclid: 'abc', work_date: '2026-11-06', value: '150.00' },
  { gclid: 'def', work_date: '2026-11-05', value: null },
  { gclid: null, work_date: '2026-11-05', value: '10' },
  { gclid: 'ghi', work_date: null, value: '10' },
]);
const lines = csv.trim().split('\n');
assert.equal(lines[0], 'Parameters:TimeZone=Europe/Amsterdam');
assert.equal(lines[2], 'abc,Job Completed,2026-11-06 12:00:00,150,EUR');
assert.equal(lines[3], 'def,Job Completed,2026-11-05 12:00:00,,EUR');
assert.equal(lines.length, 4);
console.log('ad reviews: all passed');
