// What a scanned code may stand for (src/lib/stockBulkCount.ts): our label code, the SKU,
// or a barcode learned on the shop floor. Pure: no database, no Next.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { articleIndex, tallyPhoto, aggregate } from '../../src/lib/stockBulkCount.ts';

const article = (id, sku) => ({ id, sku, name: id, image: '', category: '', sources: [] });
const ARTICLES = [article('KFC-1-1', 'ALRK03'), article('KFC-1-2', 'ALRK04'), article('KFC-1-3', 'SHARED'), article('KFC-1-4', 'SHARED')];
const EAN = '8712345678906';

test('without learned barcodes the index is what it always was: code and unique SKU', () => {
  const index = articleIndex(ARTICLES);
  assert.equal(index.get('KFC-1-1'), 'KFC-1-1');
  assert.equal(index.get('ALRK03'), 'KFC-1-1');
  assert.equal(index.get('SHARED'), undefined, 'a SKU on two cards picks neither');
  assert.equal(index.get(EAN), undefined);
});

test('a learned barcode finds its article, also for a card whose SKU is shared', () => {
  const index = articleIndex(ARTICLES, { [EAN]: 'KFC-1-1', '4006381333931': 'KFC-1-3', 'abc-12.x': 'KFC-1-2' });
  assert.equal(index.get(EAN), 'KFC-1-1');
  assert.equal(index.get('4006381333931'), 'KFC-1-3', 'the barcode tells the two SHARED cards apart');
  assert.equal(index.get('ABC-12.X'), 'KFC-1-2', 'matched the way a scan is normalised: upper case');
});

test('our own codes win, and a barcode for an article that is not in the list is ignored', () => {
  const index = articleIndex(ARTICLES, { ALRK03: 'KFC-1-2', SHARED: 'KFC-1-1', '999': 'NIET-IN-LIJST' });
  assert.equal(index.get('ALRK03'), 'KFC-1-1', 'a barcode never replaces a SKU that already points somewhere');
  assert.equal(index.get('SHARED'), undefined, 'a shared SKU stays unknown even when a barcode has the same text');
  assert.equal(index.get('999'), undefined);
});

test('a photo with a manufacturer barcode counts once it is learned, and is "unknown" before', () => {
  const scan = { name: 'foto.jpg', hash: 'h1', ms: 1, codes: [{ text: EAN, format: 'EAN13', lines: 4 }, { text: EAN, format: 'EAN13', lines: 5 }] };
  const before = tallyPhoto(scan, articleIndex(ARTICLES));
  assert.equal(before.articles.size, 0);
  assert.equal(before.unknown.get(EAN), 2, 'read reliably, but no article yet');
  const after = tallyPhoto(scan, articleIndex(ARTICLES, { [EAN]: 'KFC-1-1' }));
  assert.equal(after.articles.get('KFC-1-1'), 2);
  assert.equal(after.unknown.size, 0);
  assert.deepEqual(aggregate([after], new Set()).lines, [{ article: 'KFC-1-1', seen: 2, photos: 1 }]);
});
