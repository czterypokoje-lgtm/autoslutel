import { prepareZXingModule, readBarcodes, ZXING_WASM_SHA256, ZXING_WASM_VERSION } from 'zxing-wasm/reader';
import { sha256Hex } from '@/lib/sha256';

/**
 * Decodes photos for the bulk count, off the main thread.
 *
 * The photo never leaves the device: only the decoded codes and a SHA-256 of
 * the file go back to the page. The WASM decoder is served from our own
 * origin (public/vendor) and checked against the hash the package ships with
 * before it is instantiated, so a swapped file is refused instead of run.
 */

export interface ScanRequest { id: number; file: Blob; maxSide: number }
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

async function pixels(file: Blob, maxSide: number) {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(bitmap, 0, 0, width, height);
    return context.getImageData(0, 0, width, height);
  } finally {
    bitmap.close();
  }
}

type Found = Awaited<ReturnType<typeof readBarcodes>>[number];
interface Detected { text: string; format: string; lines: number; x: number; y: number; size: number }

function symbolOf(result: Found): Detected {
  const { topLeft, topRight, bottomRight, bottomLeft } = result.position;
  const corners = [topLeft, topRight, bottomRight, bottomLeft];
  return {
    text: result.text.slice(0, 120), format: result.format, lines: result.lineCount,
    x: corners.reduce((sum, point) => sum + point.x, 0) / 4,
    y: corners.reduce((sum, point) => sum + point.y, 0) / 4,
    size: Math.max(Math.hypot(bottomRight.x - topLeft.x, bottomRight.y - topLeft.y), Math.hypot(bottomLeft.x - topRight.x, bottomLeft.y - topRight.y), 8),
  };
}

/**
 * Two passes find more than one: the adaptive binarizer copes with uneven
 * light, the fixed threshold with small sharp codes. The same physical code
 * found by both (same text and format, centres closer than half its size)
 * is kept once.
 */
function merge(results: Found[]) {
  const symbols: Detected[] = [];
  for (const result of results) {
    if (!result.isValid || !result.text) continue;
    const next = symbolOf(result);
    const same = symbols.find((symbol) => symbol.text === next.text && symbol.format === next.format
      && Math.hypot(symbol.x - next.x, symbol.y - next.y) < Math.max(symbol.size, next.size) / 2);
    if (same) same.lines = Math.max(same.lines, next.lines);
    else symbols.push(next);
  }
  return symbols;
}

scope.onmessage = async ({ data: { id, file, maxSide } }) => {
  const started = performance.now();
  let hash = '';
  try {
    [, hash] = await Promise.all([decoder(), file.arrayBuffer().then(sha256Hex)]);
    // Full phone resolution: a key label or a book barcode at arm's length is only a few hundred pixels wide.
    const image = await pixels(file, maxSide);
    const results: Found[] = [];
    for (const binarizer of ['LocalAverage', 'FixedThreshold'] as const) {
      results.push(...await readBarcodes(image, { ...OPTIONS, binarizer, formats: [...FORMATS] }));
    }
    scope.postMessage({
      id, hash, ms: performance.now() - started,
      codes: merge(results).map(({ text, format, lines }) => ({ text, format, lines })),
    });
  } catch (error) {
    scope.postMessage({ id, hash, codes: [], ms: performance.now() - started, error: error instanceof Error ? error.message : 'Foto kon niet worden gelezen.' });
  }
};
