// The model list on a drawer label (ShelfLabel modelRows): CRM fitments as entered, catalogue lines filtered.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modelRows, plausibleFit } from '../../src/app/admin/voorraad/ShelfLabelRows.ts';

test('catalogue junk is not a model', () => {
  assert.equal(plausibleFit('Batterij: CR'), false);
  assert.equal(plausibleFit('• Laguna II'), false);
  assert.equal(plausibleFit('BMW all FEM keys suitable'), false);
  assert.equal(plausibleFit('Alfa Romeo Giulietta 940'), true);
});

test('"2015+" in the catalogue reads as 2015 onwards, a make heading comes first', () => {
  const { lines } = modelRows([{ text: 'Audi A3 2015+', vehicle: 'Audi A3', from: 2015, to: 2015 }], 9);
  assert.deepEqual(lines, [{ make: 'Audi' }, { model: 'A3', years: '2015–' }]);
});

test('a CRM fitment prints as entered, also without years', () => {
  const { lines } = modelRows([{ text: 'crm', vehicle: 'Mercedes-Benz Sprinter', from: null, to: null }, { text: 'crm', vehicle: 'Mercedes-Benz Vito', from: 2014, to: 2014 }], 9);
  assert.deepEqual(lines, [{ make: 'Mercedes-Benz' }, { model: 'Sprinter', years: '' }, { model: 'Vito', years: '2014–2014' }]);
});

test('label QR: our shop first, then another known page, then the CRM', async () => {
  const { labelLink } = await import('../../src/app/admin/voorraad/ShelfLabelRows.ts');
  const own = { shop: 'keyforcars.nl', url: 'https://www.keyforcars.nl/product/x/' };
  const other = { shop: 'klapsleutels.nl', url: 'https://www.klapsleutels.nl/product/x/' };
  const supplier = { shop: 'remkeys', url: 'https://remkeys.com/x' };
  assert.equal(labelLink([other, own], [supplier], 'crm'), own.url);
  assert.equal(labelLink([other], [supplier], 'crm'), other.url);
  assert.equal(labelLink([], [supplier], 'crm'), supplier.url);
  assert.equal(labelLink([], [], 'https://crm/admin/voorraad/artikel/X'), 'https://crm/admin/voorraad/artikel/X');
});
