// The QR on a printed shelf label (etiketten/LabelPrint) is read as the article it names.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseCode } from '../../src/lib/stockBulkCount.ts';

test('a shelf-label QR (article page link) is the article code', () => {
  assert.equal(normaliseCode('https://keyforcars-crm.vercel.app/admin/voorraad/artikel/KFC-1-2703'), 'KFC-1-2703');
  assert.equal(normaliseCode('https://x.nl/admin/voorraad/artikel/KFC-1-2703?tab=1'), 'KFC-1-2703');
});

test('profile links and plain codes read as before', () => {
  assert.equal(normaliseCode('https://keyforcars.nl/p/alrk03'), 'ALRK03');
  assert.equal(normaliseCode(' alrc03 '), 'ALRC03');
  assert.equal(normaliseCode('HFC-1-12'), 'KFC-1-12');
});
