// Continuous-scan stock count (src/lib/stockLiveCount.ts). Pure: no camera, no React.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIVE_GAP_MS, LIVE_MAX_LINES, adjust, emptyTally, isFull, linkUnknown, observeFrame, payloadLines,
  removeLine, reviewLines, setQuantity, sightingsFromCodes, totalCount, validBinCode,
} from '../../src/lib/stockLiveCount.ts';

const A = { key: 'A', article: 'A', count: 1 };
const B = { key: 'B', article: 'B', count: 1 };
const FRAME = 300; // ms between decoded frames

/** Runs frames: each item is the sightings of one frame, FRAME ms apart. */
function run(frames, tally = emptyTally(), start = 0) {
  let now = start;
  const counted = [];
  for (const sightings of frames) {
    const result = observeFrame(tally, sightings, now);
    tally = result.tally;
    counted.push(...result.counted);
    now += FRAME;
  }
  return { tally, counted, now };
}
const qty = (tally, article) => tally.lines.find((line) => line.article === article)?.quantity ?? 0;

test('one label held in view for many frames counts once', () => {
  const { tally, counted } = run(Array(40).fill([A]));
  assert.equal(qty(tally, 'A'), 1);
  assert.deepEqual(counted, ['A']);
});

test('leaving and coming back after the gap counts again', () => {
  const away = Math.ceil(LIVE_GAP_MS / FRAME) + 1;
  const { tally } = run([[A], [A], ...Array(away).fill([]), [A], [A]]);
  assert.equal(qty(tally, 'A'), 2);
});

test('coming back before the gap does not count again', () => {
  const { tally } = run([[A], [A], [], [], [A], [A]]); // away 900 ms
  assert.equal(qty(tally, 'A'), 1);
});

test('one blurry frame on a slow phone does not count twice', () => {
  // 1.5 s between frames: the gap has passed, but only one frame missed the label.
  let tally = emptyTally();
  tally = observeFrame(tally, [A], 0).tally;
  tally = observeFrame(tally, [], 1500).tally;
  tally = observeFrame(tally, [A], 3000).tally;
  assert.equal(qty(tally, 'A'), 1);
});

test('two labels in one frame each count, extra copies of a label in view are added', () => {
  let { tally } = run([[A, B]]);
  assert.equal(qty(tally, 'A'), 1);
  assert.equal(qty(tally, 'B'), 1);
  ({ tally } = run([[{ ...A, count: 2 }], [{ ...A, count: 2 }], [A], [{ ...A, count: 2 }]], tally, FRAME));
  assert.equal(qty(tally, 'A'), 2, 'second copy added once, flicker 2→1→2 does not add again');
  assert.equal(totalCount(tally), 3);
});

test('newest scan on top', () => {
  const { tally } = run([[A], [B]]);
  assert.deepEqual(tally.lines.map((line) => line.article), ['B', 'A']);
  assert.equal(tally.last.article, 'B');
});

test('sightings: QR + Code 39 of one label is one; unknown codes only when trusted', () => {
  const sightings = sightingsFromCodes([
    { text: 'kfc-1-001', format: 'QRCode' },
    { text: 'KFC-1-001', format: 'Code39', lines: 4 },
    { text: '8712345678901', format: 'EAN13', lines: 5 },
    { text: 'XY', format: 'Code39', lines: 1 },
  ], {
    normalise: (text) => text.trim().toUpperCase(),
    resolve: (code) => (code === 'KFC-1-001' ? 'art-1' : null),
    trusted: (code) => code.format === 'EAN13',
  });
  assert.deepEqual(sightings, [
    { key: 'art-1', article: 'art-1', count: 1 },
    { key: '8712345678901', article: null, count: 1 },
  ]);
});

test('unknown codes are tallied apart, once per appearance', () => {
  const U = { key: '8712345678901', article: null, count: 1 };
  const away = Math.ceil(LIVE_GAP_MS / FRAME) + 1;
  const { tally } = run([[U, A], [U], ...Array(away).fill([]), [U]]);
  assert.equal(tally.lines.length, 1);
  assert.deepEqual(tally.unknown.map(({ code, seen }) => ({ code, seen })), [{ code: '8712345678901', seen: 2 }]);
});

test('linking an unknown code keeps a label in view from counting twice', () => {
  const U = { key: '871', article: null, count: 1 };
  let { tally } = run([[U], [U]]);
  const linked = linkUnknown(tally, '871', 'A');
  assert.equal(linked.seen, 1);
  assert.equal(linked.tally.unknown.length, 0);
  ({ tally } = run([[{ key: 'A', article: 'A', count: 1 }]], linked.tally, 2 * FRAME));
  assert.equal(qty(tally, 'A'), 0, 'still the same appearance');
  tally = adjust(tally, 'A', linked.seen);
  assert.equal(qty(tally, 'A'), 1);
});

test('manual adjust, set quantity and remove', () => {
  let { tally } = run([[A]]);
  tally = adjust(tally, 'A', 1);
  assert.equal(qty(tally, 'A'), 2);
  tally = adjust(tally, 'A', -5);
  assert.equal(qty(tally, 'A'), 0, 'never below zero');
  tally = setQuantity(tally, 'A', 12);
  assert.equal(qty(tally, 'A'), 12);
  tally = adjust(tally, 'C', -1);
  assert.equal(tally.lines.length, 1, 'minus on an absent article does nothing');
  tally = adjust(tally, 'C', 1);
  assert.equal(qty(tally, 'C'), 1);
  tally = removeLine(tally, 'A');
  assert.deepEqual(tally.lines.map((line) => line.article), ['C']);
  // Removed while still in view: the next frame starts a fresh appearance.
  const after = observeFrame(tally, [A], FRAME).tally;
  assert.equal(qty(after, 'A'), 1);
});

test('500-line cap: new articles are refused, existing ones still count', () => {
  let tally = emptyTally();
  for (let i = 0; i < LIVE_MAX_LINES; i++) tally = setQuantity(tally, `X${i}`, 1);
  assert.equal(isFull(tally), true);
  const result = observeFrame(tally, [A, { key: 'X0', article: 'X0', count: 1 }], 0);
  assert.equal(result.tally.lines.length, LIVE_MAX_LINES);
  assert.deepEqual(result.refused, ['A']);
  assert.deepEqual(result.tally.refused, ['A']);
  assert.equal(qty(result.tally, 'X0'), 2);
  assert.equal(setQuantity(result.tally, 'NEW', 3), result.tally, 'manual add refused too');
  const again = observeFrame(result.tally, [A], FRAME);
  assert.deepEqual(again.refused, [], 'refusal reported once');
});

test('payload for one bin and the review against the system', () => {
  let { tally } = run([[A, B]]);
  tally = setQuantity(tally, 'A', 7);
  assert.deepEqual(payloadLines(tally, 'A-01', 'B01'), [
    { article: 'B', shelf: 'A-01', box: 'B01', quantity: 1 },
    { article: 'A', shelf: 'A-01', box: 'B01', quantity: 7 },
  ]);
  assert.throws(() => payloadLines(tally, 'a 01', 'B01'));
  assert.equal(validBinCode('A-01'), true);
  assert.equal(validBinCode(''), false);
  assert.equal(validBinCode('X'.repeat(25)), false);
  const bins = [
    { article: 'A', shelf: 'A-01', box: 'B01', quantity: 3, minimum: 0 },
    { article: 'B', shelf: 'A-02', box: 'B01', quantity: 9, minimum: 0 },
  ];
  assert.deepEqual(reviewLines(tally, bins, 'A-01', 'B01'), [
    { article: 'B', system: null, counted: 1 },
    { article: 'A', system: 3, counted: 7 },
  ]);
});
