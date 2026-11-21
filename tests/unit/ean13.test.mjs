// EAN-13 encoding for shelf labels (src/lib/ean13.ts). Pure.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ean13Modules, ean13Valid } from '../../src/lib/ean13.ts';

test('check digit: drawer numbers from a real shop are valid, a changed digit is not', () => {
  assert.ok(ean13Valid('3921962874003'));
  assert.ok(ean13Valid('3923675687239'));
  assert.equal(ean13Valid('3923675687238'), false);
  assert.equal(ean13Valid('3921341853517'), false, 'the shop also has numbers that are not EAN-13');
  assert.equal(ean13Valid('ALRC03'), false);
});

test('a valid number encodes to 95 modules with start, centre and end guards', () => {
  const modules = ean13Modules('3921962874003');
  assert.equal(modules.length, 95);
  assert.equal(modules.slice(0, 3), '101');
  assert.equal(modules.slice(45, 50), '01010');
  assert.equal(modules.slice(-3), '101');
});

test('a known reference encodes exactly (4006381333931)', () => {
  // Left half with parity LGLLGG for first digit 4, right half R-codes.
  assert.equal(ean13Modules('4006381333931'),
    '101' + '0001101' + '0100111' + '0101111' + '0111101' + '0001001' + '0110011' + '01010'
    + '1000010' + '1000010' + '1000010' + '1110100' + '1000010' + '1100110' + '101');
});

test('an invalid number has no modules', () => {
  assert.equal(ean13Modules('3921341853517'), null);
});
