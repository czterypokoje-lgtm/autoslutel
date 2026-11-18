import type { StockArticle, StockBin } from '@/lib/keyforcarsStock';

/**
 * Bulk count from photos: turning decoded codes into counted quantities.
 *
 * Every KeyForCars label carries the same article code twice, as a QR code and
 * as a Code 39 barcode. Counting every symbol would count each label twice, so
 * a photo counts an article as the highest number of symbols of any single
 * format. Two labels with a readable QR and one unreadable barcode still count
 * as two.
 *
 * Kept free of React and browser APIs so it can be tested on its own.
 */

export interface DecodedCode {
  text: string;
  format: string;
  /** Scan lines that agreed on a linear barcode (0 for QR and DataMatrix). */
  lines?: number;
}

/**
 * Linear barcodes misread easily: stripes on a bottle label or a line of text
 * can decode as a short Code 39 or a checksum-valid EAN on a single scan line.
 * A code that matches the catalogue is always believed. A code that does not
 * only counts when it is hard to fake: a QR or DataMatrix (error correction),
 * an EAN/UPC read on at least three lines, or a long Code 128 on five.
 */
export function trustedUnknownCode(code: DecodedCode, normalised: string) {
  const lines = code.lines ?? 0;
  if (code.format === 'QRCode' || code.format === 'MicroQRCode' || code.format === 'DataMatrix') return true;
  if (['EAN13', 'EAN8', 'UPCA', 'UPCE'].includes(code.format)) return lines >= 3 && /^\d{8,14}$/.test(normalised);
  if (code.format === 'Code128') return lines >= 5 && normalised.length >= 6;
  return false;
}
export interface PhotoScan { name: string; hash: string; codes: DecodedCode[]; error?: string; ms: number }

export type PhotoStatus = 'ok' | 'empty' | 'error' | 'duplicate' | 'counted-before';

export interface PhotoTally {
  name: string;
  hash: string;
  /** article id → labels seen in this photo */
  articles: Map<string, number>;
  /** codes not in the catalogue → labels seen, counted the same way as articles */
  unknown: Map<string, number>;
  status: PhotoStatus;
  error?: string;
}

export interface BulkLine {
  article: string;
  seen: number;
  photos: number;
}

/**
 * Same normalisation as the single scan: old Code 39 labels encoded HFC for
 * KFC. A label QR may hold a profile link (…/p/ALRK03); the code is its end.
 */
export function normaliseCode(value: string) {
  const link = value.trim().match(/^https?:\/\/[^\s]*\/p\/([^/?#\s]+)/i);
  let code = value.trim();
  if (link) {
    try { code = decodeURIComponent(link[1]); } catch { code = link[1]; }
  }
  return code.toUpperCase().replace(/^H(?=FC-[123]-\d+$)/, 'K');
}

export function articleIndex(articles: StockArticle[]) {
  const index = new Map<string, string>();
  const ambiguous = new Set<string>();
  for (const article of articles) {
    for (const key of [article.id, article.sku].map((value) => value.trim().toUpperCase()).filter(Boolean)) {
      const existing = index.get(key);
      if (existing && existing !== article.id) ambiguous.add(key);
      else index.set(key, article.id);
    }
  }
  // A SKU shared by two articles cannot be counted safely: treat it as unknown.
  for (const key of ambiguous) index.delete(key);
  return index;
}

export function tallyPhoto(scan: PhotoScan, index: Map<string, string>): PhotoTally {
  if (scan.error) return { name: scan.name, hash: scan.hash, articles: new Map(), unknown: new Map(), status: 'error', error: scan.error };
  const known = new Map<string, Map<string, number>>();
  const other = new Map<string, Map<string, number>>();
  for (const code of scan.codes) {
    const key = normaliseCode(code.text);
    if (!key) continue;
    const article = index.get(key);
    if (!article && !trustedUnknownCode(code, key)) continue;
    const bucket = article ? known : other;
    const id = article ?? key;
    const formats = bucket.get(id) ?? new Map<string, number>();
    formats.set(code.format, (formats.get(code.format) ?? 0) + 1);
    bucket.set(id, formats);
  }
  const labels = (bucket: Map<string, Map<string, number>>) => new Map([...bucket].map(([id, formats]) => [id, Math.max(...formats.values())]));
  const articles = labels(known);
  const unknown = labels(other);
  return { name: scan.name, hash: scan.hash, articles, unknown, status: articles.size || unknown.size ? 'ok' : 'empty' };
}

/**
 * Marks repeated photos (same bytes) and photos counted in an earlier batch,
 * then sums what is left per article.
 */
export function aggregate(tallies: PhotoTally[], countedBefore: Set<string>) {
  const seenHashes = new Set<string>();
  const photos: PhotoTally[] = [];
  const lines = new Map<string, BulkLine>();
  const unknown = new Map<string, { code: string; seen: number; photos: number }>();
  for (const tally of tallies) {
    let status = tally.status;
    if (status !== 'error' && tally.hash) {
      if (seenHashes.has(tally.hash)) status = 'duplicate';
      else if (countedBefore.has(tally.hash)) status = 'counted-before';
      seenHashes.add(tally.hash);
    }
    photos.push({ ...tally, status });
    if (status !== 'ok') continue;
    for (const [article, seen] of tally.articles) {
      const line = lines.get(article) ?? { article, seen: 0, photos: 0 };
      line.seen += seen;
      line.photos += 1;
      lines.set(article, line);
    }
    for (const [code, seen] of tally.unknown) {
      const entry = unknown.get(code) ?? { code, seen: 0, photos: 0 };
      entry.seen += seen;
      entry.photos += 1;
      unknown.set(code, entry);
    }
  }
  return {
    photos,
    lines: [...lines.values()].sort((a, b) => b.seen - a.seen || a.article.localeCompare(b.article)),
    unknown: [...unknown.values()].sort((a, b) => b.seen - a.seen || a.code.localeCompare(b.code)),
  };
}

/** The bin a counted line goes to without asking: only when the article has exactly one. */
export function defaultBin(article: string, bins: StockBin[]) {
  const own = bins.filter((bin) => bin.article === article);
  return own.length === 1 ? own[0] : undefined;
}
