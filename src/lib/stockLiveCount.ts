/**
 * Continuous-scan stock count: the camera stays open and every label that
 * comes into view adds one to a running tally for a single bin.
 *
 * The decoder sees the same label in many consecutive frames, so a label
 * counts once per appearance: it counts again only after it has been out of
 * view for a gap (LIVE_GAP_MS) AND for at least LIVE_MIN_MISSED_FRAMES decoded
 * frames. The frame rule keeps a slow phone (one decode per 700 ms) from
 * counting a label twice just because one frame came back blurry.
 *
 * Two labels of the same article in one frame count as two (highest number of
 * symbols of any single format, as in the photo count: QR + Code 39 on one
 * label is still one label). If more copies show up while the article is still
 * in view, only the extra copies are added.
 *
 * Kept free of React, browser APIs and path aliases so node:test can load it.
 */

export const LIVE_GAP_MS = 1200;
export const LIVE_MIN_MISSED_FRAMES = 2;
export const LIVE_MAX_LINES = 500;
export const LIVE_MAX_QUANTITY = 1_000_000;
const MAX_UNKNOWN = 200;
const BIN_CODE = /^[A-Z0-9-]{1,24}$/;

export interface LiveCode { text: string; format: string; lines?: number }

/** One thing seen in a frame: a known article (key = article id) or an unknown code (key = the code). */
export interface Sighting { key: string; article: string | null; count: number }

export interface LiveLine {
  article: string;
  quantity: number;
  /** How many of the quantity came from the camera (manual changes are not included). */
  scanned: number;
  /** Time of the last camera count, for "newest on top" and the highlight. */
  scannedAt: number;
}

export interface LiveUnknown { code: string; seen: number; lastSeen: number }

interface Track { lastSeen: number; missed: number; peak: number }

export interface LiveTally {
  /** Newest camera count first. */
  lines: LiveLine[];
  unknown: LiveUnknown[];
  tracks: Record<string, Track>;
  /** Articles the camera saw but that could not be added because the 500-line cap was reached. */
  refused: string[];
  last: { article: string; at: number; quantity: number } | null;
}

export interface FrameOptions { gapMs?: number; minMissedFrames?: number }

export interface FrameResult {
  tally: LiveTally;
  /** Article ids that got +1, once per extra label (feedback: one beep per frame is enough). */
  counted: string[];
  /** Unknown codes that got a new appearance in this frame. */
  unknownSeen: string[];
  /** Articles refused in this frame because the cap is reached. */
  refused: string[];
}

export function emptyTally(): LiveTally {
  return { lines: [], unknown: [], tracks: {}, refused: [], last: null };
}

export const isFull = (tally: LiveTally) => tally.lines.length >= LIVE_MAX_LINES;
export const totalCount = (tally: LiveTally) => tally.lines.reduce((sum, line) => sum + line.quantity, 0);
export const hasWork = (tally: LiveTally) => tally.lines.length > 0 || tally.unknown.length > 0;

/**
 * Decoded codes of one frame → sightings. Normalisation, catalogue lookup and
 * the "is an unknown code really read" test are passed in, so this file has no
 * imports (the component passes normaliseCode, resolve and trustedUnknownCode).
 */
export function sightingsFromCodes(codes: LiveCode[], helpers: {
  normalise: (text: string) => string;
  resolve: (code: string) => string | null;
  trusted: (code: LiveCode, normalised: string) => boolean;
}): Sighting[] {
  const perKey = new Map<string, { article: string | null; formats: Map<string, number> }>();
  for (const code of codes) {
    const normalised = helpers.normalise(code.text);
    if (!normalised) continue;
    const article = helpers.resolve(normalised);
    if (!article && !helpers.trusted(code, normalised)) continue;
    const key = article ?? normalised;
    const entry = perKey.get(key) ?? { article, formats: new Map<string, number>() };
    entry.formats.set(code.format, (entry.formats.get(code.format) ?? 0) + 1);
    perKey.set(key, entry);
  }
  return [...perKey].map(([key, { article, formats }]) => ({ key, article, count: Math.max(...formats.values()) }));
}

const trackKey = (sighting: Sighting) => (sighting.article ? `a:${sighting.article}` : `u:${sighting.key}`);

/** Adds camera counts to an article line, newest on top. Returns false when the cap refuses a new line. */
function addScanned(lines: LiveLine[], article: string, add: number, now: number) {
  const index = lines.findIndex((line) => line.article === article);
  if (index < 0 && lines.length >= LIVE_MAX_LINES) return false;
  const current = index >= 0 ? lines[index] : { article, quantity: 0, scanned: 0, scannedAt: now };
  if (index >= 0) lines.splice(index, 1);
  lines.unshift({
    ...current,
    quantity: Math.min(LIVE_MAX_QUANTITY, current.quantity + add),
    scanned: current.scanned + add,
    scannedAt: now,
  });
  return true;
}

/** One decoded frame at time `now` (ms, monotonic). Frames must come in time order. */
export function observeFrame(tally: LiveTally, sightings: Sighting[], now: number, options: FrameOptions = {}): FrameResult {
  const gapMs = options.gapMs ?? LIVE_GAP_MS;
  const minMissed = options.minMissedFrames ?? LIVE_MIN_MISSED_FRAMES;
  const seenKeys = new Set(sightings.map(trackKey));
  const tracks: Record<string, Track> = {};
  for (const [key, track] of Object.entries(tally.tracks)) {
    if (seenKeys.has(key)) { tracks[key] = track; continue; }
    const next = { ...track, missed: track.missed + 1 };
    // Long gone: forgetting it changes nothing, it would count as new anyway.
    if (now - next.lastSeen > gapMs * 10 && next.missed >= minMissed) continue;
    tracks[key] = next;
  }

  const lines = [...tally.lines];
  const unknown = [...tally.unknown];
  const refused = new Set(tally.refused);
  const counted: string[] = [];
  const unknownSeen: string[] = [];
  const refusedNow: string[] = [];
  let last = tally.last;

  for (const sighting of sightings) {
    const count = Math.max(1, Math.floor(sighting.count));
    const key = trackKey(sighting);
    const track = tracks[key];
    const fresh = !track || (now - track.lastSeen >= gapMs && track.missed >= minMissed);
    const add = fresh ? count : Math.max(0, count - track.peak);
    tracks[key] = { lastSeen: now, missed: 0, peak: fresh ? count : Math.max(track.peak, count) };
    if (!add) continue;

    if (sighting.article) {
      if (addScanned(lines, sighting.article, add, now)) {
        for (let i = 0; i < add; i++) counted.push(sighting.article);
        last = { article: sighting.article, at: now, quantity: lines[0].quantity };
        refused.delete(sighting.article);
      } else if (!refused.has(sighting.article)) {
        refused.add(sighting.article);
        refusedNow.push(sighting.article);
      }
    } else {
      const index = unknown.findIndex((entry) => entry.code === sighting.key);
      if (index >= 0) unknown[index] = { ...unknown[index], seen: unknown[index].seen + add, lastSeen: now };
      else if (unknown.length < MAX_UNKNOWN) unknown.unshift({ code: sighting.key, seen: add, lastSeen: now });
      unknownSeen.push(sighting.key);
    }
  }

  return { tally: { lines, unknown, tracks, refused: [...refused], last }, counted, unknownSeen, refused: refusedNow };
}

function clampQuantity(value: number) {
  return Math.min(LIVE_MAX_QUANTITY, Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)));
}

/** Sets a line's quantity. Creates the line (subject to the cap) when it does not exist. */
export function setQuantity(tally: LiveTally, article: string, quantity: number): LiveTally {
  const value = clampQuantity(quantity);
  const index = tally.lines.findIndex((line) => line.article === article);
  if (index < 0) {
    if (isFull(tally)) return tally;
    return { ...tally, lines: [{ article, quantity: value, scanned: 0, scannedAt: 0 }, ...tally.lines] };
  }
  const lines = [...tally.lines];
  lines[index] = { ...lines[index], quantity: value };
  return { ...tally, lines };
}

/** Manual +1 / −1 (or any step). Never below zero; a manual + on a new article adds it on top. */
export function adjust(tally: LiveTally, article: string, delta: number): LiveTally {
  const line = tally.lines.find((item) => item.article === article);
  if (!line && delta <= 0) return tally;
  return setQuantity(tally, article, (line?.quantity ?? 0) + delta);
}

export function removeLine(tally: LiveTally, article: string): LiveTally {
  const tracks = { ...tally.tracks };
  delete tracks[`a:${article}`];
  return {
    ...tally,
    lines: tally.lines.filter((line) => line.article !== article),
    tracks,
    last: tally.last?.article === article ? null : tally.last,
  };
}

export function dismissUnknown(tally: LiveTally, code: string): LiveTally {
  return { ...tally, unknown: tally.unknown.filter((entry) => entry.code !== code) };
}

/**
 * An unknown code was just bound to an article. The code's presence carries
 * over to the article, so a label still in view is not counted a second time
 * when the next frame resolves it. Returns how often it was seen before, so the
 * screen can ask whether to add those scans.
 */
export function linkUnknown(tally: LiveTally, code: string, article: string): { tally: LiveTally; seen: number } {
  const entry = tally.unknown.find((item) => item.code === code);
  const tracks = { ...tally.tracks };
  const from = tracks[`u:${code}`];
  const to = tracks[`a:${article}`];
  if (from && (!to || from.lastSeen > to.lastSeen)) tracks[`a:${article}`] = from;
  delete tracks[`u:${code}`];
  return { tally: { ...dismissUnknown(tally, code), tracks }, seen: entry?.seen ?? 0 };
}

export function cleanBinCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);
}

export function validBinCode(value: string) {
  return BIN_CODE.test(value);
}

export interface CountLine { article: string; shelf: string; box: string; quantity: number }

/** The `lines` payload for one bin. Throws on an invalid bin so a bad payload is never sent. */
export function payloadLines(tally: LiveTally, shelf: string, box: string): CountLine[] {
  if (!validBinCode(shelf) || !validBinCode(box)) throw new Error('Rallocatie en bakcode: alleen A-Z, 0-9 en -, maximaal 24 tekens.');
  return tally.lines
    .slice(0, LIVE_MAX_LINES)
    .map((line) => ({ article: line.article, shelf, box, quantity: clampQuantity(line.quantity) }));
}

export interface ReviewLine { article: string; system: number | null; counted: number }

/** What the save will change: the system quantity in this bin (null when the article is not in it yet) → counted. */
export function reviewLines(tally: LiveTally, bins: { article: string; shelf: string; box: string; quantity: number }[], shelf: string, box: string): ReviewLine[] {
  const here = new Map(bins.filter((bin) => bin.shelf === shelf && bin.box === box).map((bin) => [bin.article, bin.quantity]));
  return tally.lines.map((line) => ({ article: line.article, system: here.get(line.article) ?? null, counted: line.quantity }));
}
