// Tiles for reading small shelf labels (src/lib/scanTiles.ts). Pure.
//   node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planTiles } from '../../src/lib/scanTiles.ts';

const covered = (tiles, width, height) => {
  for (const tile of tiles) {
    assert.ok(tile.x >= 0 && tile.y >= 0, 'tile starts inside the photo');
    assert.ok(tile.x + tile.size <= width && tile.y + tile.size <= height, 'tile ends inside the photo');
  }
  const xs = [...new Set(tiles.map((tile) => tile.x))].sort((a, b) => a - b);
  const ys = [...new Set(tiles.map((tile) => tile.y))].sort((a, b) => a - b);
  const size = tiles[0].size;
  assert.equal(xs[0], 0); assert.equal(ys[0], 0);
  assert.equal(xs.at(-1) + size, width); assert.equal(ys.at(-1) + size, height);
  for (const list of [xs, ys]) for (let i = 1; i < list.length; i++) {
    assert.ok(list[i - 1] + size - list[i] >= size / 3 - 1, 'neighbours overlap by a third');
  }
};

test('a phone photo (4032x3024) is cut into enlarged, overlapping tiles that cover it', () => {
  const tiles = planTiles(4032, 3024);
  assert.ok(tiles.length >= 4 && tiles.length <= 16, `${tiles.length} tiles`);
  assert.ok(tiles[0].scale > 1.25);
  assert.ok(tiles[0].size * tiles[0].scale <= 2401, 'an enlarged tile stays phone-sized');
  covered(tiles, 4032, 3024);
});

test('a smaller photo is enlarged more, never more than 4x', () => {
  const tiles = planTiles(2016, 1512);
  assert.ok(tiles[0].scale > 2.9 && tiles[0].scale <= 4);
  covered(tiles, 2016, 1512);
  assert.equal(planTiles(400, 300)[0].scale, 4);
});

test('a photo already large enough, or an empty one, gets no tiles', () => {
  assert.deepEqual(planTiles(6000, 4000), []);
  assert.deepEqual(planTiles(0, 0), []);
});

test('a narrow photo still gets tiles within its bounds', () => {
  covered(planTiles(1000, 3000), 1000, 3000);
});
