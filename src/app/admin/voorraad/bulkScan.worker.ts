import { prepareZXingModule, readBarcodes, ZXING_WASM_SHA256, ZXING_WASM_VERSION } from 'zxing-wasm/reader';
import { sha256Hex } from '@/lib/sha256';
import { planTiles, type Tile } from '@/lib/scanTiles';

/**
 * Decodes photos for the bulk count, off the main thread.
 *
 * The photo never leaves the device: only the decoded codes and a SHA-256 of
 * the file go back to the page. The WASM decoder is served from our own
 * origin (public/vendor) and checked against the hash the package ships with
 * before it is instantiated, so a swapped file is refused instead of run.
 */

/** `live`: one camera frame of the continuous count — a single fast pass, no file hash. Absent for photos. */
export interface ScanRequest { id: number; file: Blob; maxSide: number; live?: boolean }
export interface ScanResponse {
  id: number;
  hash: string;
  codes: { text: string; format: string; lines: number }[];
  ms: number;
  error?: string;
}

const scope = self as unknown as { onmessage: ((event: MessageEvent<ScanRequest>) => void) | null; postMessage: (message: ScanResponse) => void };
const WASM_URL = `/vendor/zxing-wasm-${ZXING_WASM_VERSION}/zxing_reader.wasm`;
const FORMATS = ['QRCode', 'Code39', 'Code128', 'EAN13', 'DataMatrix'] as const;
const OPTIONS = { tryHarder: true, tryRotate: true, tryInvert: false, tryDownscale: true, maxNumberOfSymbols: 255 };
const BINARIZERS = ['LocalAverage', 'FixedThreshold'] as const;
/** Tiles: labels stand upright on a shelf, so no rotation, which halves the time per tile. */
const TILE_OPTIONS = { ...OPTIONS, tryRotate: false };
/** Stop tiling in time; the pool gives up on a photo after 30 s and what was read so far is kept. */
const TILE_BUDGET_MS = 20_000;

let ready: Promise<unknown> | undefined;
function decoder() {
  ready ??= (async () => {
    const response = await fetch(WASM_URL, { cache: 'force-cache' });
    if (!response.ok) throw new Error('Decoder kon niet worden geladen.');
    const wasmBinary = await response.arrayBuffer();
    if (await sha256Hex(wasmBinary) !== ZXING_WASM_SHA256) throw new Error('Decoder-bestand komt niet overeen.');
    return prepareZXingModule({ overrides: { wasmBinary }, fireImmediately: true });
  })();
  return ready;
}

async function photoCanvas(file: Blob, maxSide: number) {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    canvas.getContext('2d', { willReadFrequently: true })!.drawImage(bitmap, 0, 0, width, height);
    return canvas;
  } finally {
    bitmap.close();
  }
}

const pixelsOf = (canvas: OffscreenCanvas) => canvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, canvas.width, canvas.height);
const pixels = async (file: Blob, maxSide: number) => pixelsOf(await photoCanvas(file, maxSide));

/** One square of the photo, enlarged (see scanTiles). */
function tilePixels(source: OffscreenCanvas, tile: Tile) {
  const side = Math.round(tile.size * tile.scale);
  const canvas = new OffscreenCanvas(side, side);
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, tile.x, tile.y, tile.size, tile.size, 0, 0, side, side);
  return context.getImageData(0, 0, side, side);
}

type Found = Awaited<ReturnType<typeof readBarcodes>>[number];
interface Detected { text: string; format: string; lines: number; x: number; y: number; size: number }

/** Position in photo coordinates; a symbol read in an enlarged tile is mapped back. */
function symbolOf(result: Found, tile?: Tile): Detected {
  const { topLeft, topRight, bottomRight, bottomLeft } = result.position;
  const corners = [topLeft, topRight, bottomRight, bottomLeft];
  const scale = tile?.scale ?? 1;
  return {
    text: result.text.slice(0, 120), format: result.format, lines: result.lineCount,
    x: (tile?.x ?? 0) + corners.reduce((sum, point) => sum + point.x, 0) / 4 / scale,
    y: (tile?.y ?? 0) + corners.reduce((sum, point) => sum + point.y, 0) / 4 / scale,
    size: Math.max(Math.hypot(bottomRight.x - topLeft.x, bottomRight.y - topLeft.y), Math.hypot(bottomLeft.x - topRight.x, bottomLeft.y - topRight.y), 8) / scale,
  };
}

const readable = (result: Found) => result.isValid && !!result.text;

/**
 * Two passes find more than one: the adaptive binarizer copes with uneven
 * light, the fixed threshold with small sharp codes. The same physical code
 * found twice (by both passes, or in two overlapping tiles: same text and
 * format, centres closer than half its size) is kept once.
 */
function merge(found: Detected[]) {
  const symbols: Detected[] = [];
  for (const next of found) {
    const same = symbols.find((symbol) => symbol.text === next.text && symbol.format === next.format
      && Math.hypot(symbol.x - next.x, symbol.y - next.y) < Math.max(symbol.size, next.size) / 2);
    if (same) same.lines = Math.max(same.lines, next.lines);
    else symbols.push(next);
  }
  return symbols;
}

/**
 * Live camera frames: the label is held up close inside the scan area, a new
 * frame follows within a second, so one binarizer without rotation is enough
 * and keeps a phone at a few frames per second.
 */
const LIVE_OPTIONS = { tryHarder: true, tryRotate: false, tryInvert: false, tryDownscale: true, maxNumberOfSymbols: 16 };

async function liveFrame(id: number, file: Blob, maxSide: number, started: number) {
  try {
    await decoder();
    const image = await pixels(file, maxSide);
    const results = await readBarcodes(image, { ...LIVE_OPTIONS, binarizer: 'LocalAverage', formats: [...FORMATS] });
    scope.postMessage({ id, hash: '', ms: performance.now() - started, codes: merge(results.filter(readable).map((result) => symbolOf(result))).map(({ text, format, lines }) => ({ text, format, lines })) });
  } catch (error) {
    scope.postMessage({ id, hash: '', codes: [], ms: performance.now() - started, error: error instanceof Error ? error.message : 'Beeld kon niet worden gelezen.' });
  }
}

scope.onmessage = async ({ data: { id, file, maxSide, live } }) => {
  const started = performance.now();
  if (live) return liveFrame(id, file, maxSide, started);
  let hash = '';
  try {
    [, hash] = await Promise.all([decoder(), file.arrayBuffer().then(sha256Hex)]);
    // Full phone resolution: a key label or a book barcode at arm's length is only a few hundred pixels wide.
    const canvas = await photoCanvas(file, maxSide);
    const found: Detected[] = [];
    for (const binarizer of BINARIZERS) {
      for (const result of await readBarcodes(pixelsOf(canvas), { ...OPTIONS, binarizer, formats: [...FORMATS] })) {
        if (readable(result)) found.push(symbolOf(result));
      }
    }
    // Shelf photos: drawer labels too fine to read at photo size are read in enlarged tiles.
    for (const tile of planTiles(canvas.width, canvas.height)) {
      if (performance.now() - started > TILE_BUDGET_MS) break;
      const part = tilePixels(canvas, tile);
      for (const binarizer of BINARIZERS) {
        for (const result of await readBarcodes(part, { ...TILE_OPTIONS, binarizer, formats: [...FORMATS] })) {
          if (readable(result)) found.push(symbolOf(result, tile));
        }
      }
    }
    scope.postMessage({
      id, hash, ms: performance.now() - started,
      codes: merge(found).map(({ text, format, lines }) => ({ text, format, lines })),
    });
  } catch (error) {
    scope.postMessage({ id, hash, codes: [], ms: performance.now() - started, error: error instanceof Error ? error.message : 'Foto kon niet worden gelezen.' });
  }
};
