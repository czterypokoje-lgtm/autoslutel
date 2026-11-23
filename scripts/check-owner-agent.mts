// node --experimental-strip-types scripts/check-owner-agent.mts — due-date parsing for the owner's task agent.
import assert from 'node:assert/strict';
import { parseDue } from '../src/lib/tasks.ts';

const now = new Date('2026-11-23T13:00:00Z'); // Monday, winter time (UTC+1)

// Dates and times are Amsterdam local.
assert.equal(parseDue('2026-11-24', now)?.toISOString(), '2026-11-24T08:00:00.000Z');
assert.equal(parseDue('2026-11-24 14:30', now)?.toISOString(), '2026-11-24T13:30:00.000Z');
assert.equal(parseDue('2026-11-24T9:05', now)?.toISOString(), '2026-11-24T08:05:00.000Z'); // datetime-local, no zero pad
assert.equal(parseDue('2026-07-01 09:30', now)?.toISOString(), '2026-07-01T07:30:00.000Z'); // summer
// Words in three languages, with and without a time.
assert.equal(parseDue('vandaag', now)?.toISOString(), '2026-11-23T08:00:00.000Z');
assert.equal(parseDue('morgen 10:00', now)?.toISOString(), '2026-11-24T09:00:00.000Z');
assert.equal(parseDue('yarın', now)?.toISOString(), '2026-11-24T08:00:00.000Z');
assert.equal(parseDue('Tomorrow 17:15', now)?.toISOString(), '2026-11-24T16:15:00.000Z');
// Late evening in Amsterdam is still "today" there, not UTC's today.
assert.equal(parseDue('vandaag', new Date('2026-11-23T23:30:00Z'))?.toISOString(), '2026-11-24T08:00:00.000Z');
// A real ISO instant passes through.
assert.equal(parseDue('2026-11-24T08:00:00.000Z', now)?.toISOString(), '2026-11-24T08:00:00.000Z');
// Nonsense is null, never a guess.
assert.equal(parseDue('overmorgen', now), null);
assert.equal(parseDue('volgende week', now), null);
assert.equal(parseDue('', now), null);
assert.equal(parseDue(42, now), null);


console.log('Owner agent checks passed.');
