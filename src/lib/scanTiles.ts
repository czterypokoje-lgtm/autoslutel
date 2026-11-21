/**
 * Tiles for reading small barcodes in a photo of a whole shelf.
 *
 * Drawer labels carry a fine EAN-13 whose bars are one or two pixels wide in
 * a shelf photo, too thin for the decoder. Cutting the photo into overlapping
 * squares and enlarging each one reads them: on real shelf photos the plain
 * pass read 0 labels, enlarged tiles 13–16 per photo.
 *
 * The overlap is a third of a tile, wider than a label, so every label lies
 * whole inside at least one tile.
 */

export interface Tile { x: number; y: number; size: number; scale: number }

/** Enlarge until the photo's long side would be about this many pixels. */
const TARGET_SIDE = 6000;
/** Longest side of one enlarged tile: memory and decode time on a phone. */
const TILE_SIDE = 2400;
const MAX_SCALE = 4;

function starts(length: number, tile: number, overlap: number) {
  if (tile >= length) return [0];
  const count = Math.ceil((length - overlap) / (tile - overlap));
  const step = (length - tile) / (count - 1);
  return Array.from({ length: count }, (_, index) => Math.round(index * step));
}

/** No tiles when the photo is already large enough to read as it is. */
export function planTiles(width: number, height: number): Tile[] {
  const longSide = Math.max(width, height);
  if (!(longSide > 0)) return [];
  const scale = Math.min(MAX_SCALE, TARGET_SIDE / longSide);
  if (scale < 1.25) return [];
  const size = Math.min(Math.round(TILE_SIDE / scale), width, height);
  const overlap = Math.round(size / 3);
  const tiles: Tile[] = [];
  for (const y of starts(height, size, overlap)) {
    for (const x of starts(width, size, overlap)) tiles.push({ x, y, size, scale });
  }
  return tiles;
}
