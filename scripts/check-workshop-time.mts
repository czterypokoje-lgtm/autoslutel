// node scripts/check-workshop-time.mts — Europe/Amsterdam helpers used by the workshop calendar.
import assert from 'node:assert/strict';
import {
  addDays, addMonths, amsterdamParts, amsterdamToUtc, daysBetween, endOfMonth, isoWeekday, minutesToTime, startOfWeek,
} from '../src/lib/amsterdamTime.ts';

// Winter (UTC+1) and summer (UTC+2).
assert.equal(amsterdamToUtc('2026-11-24', '09:30').toISOString(), '2026-11-24T08:30:00.000Z');
assert.equal(amsterdamToUtc('2026-07-01', '09:30').toISOString(), '2026-07-01T07:30:00.000Z');
// DST switch days.
assert.equal(amsterdamToUtc('2026-03-29', '10:00').toISOString(), '2026-03-29T08:00:00.000Z');
assert.equal(amsterdamToUtc('2026-10-25', '10:00').toISOString(), '2026-10-25T09:00:00.000Z');
assert.deepEqual(amsterdamParts('2026-11-24T08:30:00Z'), { day: '2026-11-24', time: '09:30', minutes: 570 });
assert.deepEqual(amsterdamParts('2026-11-24T23:30:00Z'), { day: '2026-11-25', time: '00:30', minutes: 30 });
// Monday-first weeks.
assert.equal(isoWeekday('2026-11-23'), 1);
assert.equal(isoWeekday('2026-11-29'), 7);
assert.equal(startOfWeek('2026-11-29'), '2026-11-23');
assert.equal(startOfWeek('2026-11-23'), '2026-11-23');
assert.equal(addDays('2026-03-28', 1), '2026-03-29');
assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
assert.equal(addMonths('2026-03-31', -1), '2026-02-28');
assert.equal(endOfMonth('2026-02-10'), '2026-02-28');
assert.equal(daysBetween('2026-11-01', '2026-11-30'), 29);
assert.equal(minutesToTime(17 * 60 + 15), '17:15');
console.log('Workshop time checks passed.');
