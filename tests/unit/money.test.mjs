// How a typed euro amount becomes cents (src/lib/money.ts). Pure: no database, no Next.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { euroToCents } from '../../src/lib/money.ts';

test('Dutch and English notations give the same cents', () => {
  const table = [
    ['12,50', 1250], ['12.50', 1250], ['12,5', 1250], ['12', 1200], ['0,05', 5],
    ['1.234,56', 123456], ['1,234.56', 123456], ['1.234.567,89', 123456789],
    ['€ 1.250,00', 125000], ['EUR 99', 9900], ['1 250,50', 125050], ['36,30', 3630],
  ];
  for (const [input, cents] of table) assert.equal(euroToCents(input), cents, input);
});

test('"1.500" in a form is fifteen hundred euro, not one euro fifty', () => {
  assert.equal(euroToCents('1.500'), 150000);
  assert.equal(euroToCents('12.345.678'), 1234567800);
});

test('an import refuses "1.500" instead of guessing', () => {
  assert.ok(Number.isNaN(euroToCents('1.500', { dutchThousands: false })));
  assert.equal(euroToCents('1.50', { dutchThousands: false }), 150);
  assert.equal(euroToCents('1500', { dutchThousands: false }), 150000);
});

test('empty is null; unreadable is NaN, never a silent zero or a wrong amount', () => {
  assert.equal(euroToCents(''), null);
  assert.equal(euroToCents('   '), null);
  for (const input of ['abc', '12,345', '1,500', '0.125', '12.5.5', '1,2,3', '-5', '12,50-', '1e3']) {
    assert.ok(Number.isNaN(euroToCents(input)), input);
  }
});

test('bank amounts: sign in front or behind, dot or comma decimals', () => {
  const signed = { signed: true };
  assert.equal(euroToCents('1234.56', signed), 123456); // was read as € 123.456,00
  assert.equal(euroToCents('-12,50', signed), -1250);
  assert.equal(euroToCents('+1500,00', signed), 150000);
  assert.equal(euroToCents('12,50-', signed), -1250);
  assert.equal(euroToCents('1.234,56', signed), 123456);
  assert.ok(Number.isNaN(euroToCents('n/a', signed)));
});

test('no float drift on the cent', () => {
  assert.equal(euroToCents('1,15'), 115);
  assert.equal(euroToCents('19,99'), 1999);
  assert.equal(euroToCents('4,35'), 435);
});
