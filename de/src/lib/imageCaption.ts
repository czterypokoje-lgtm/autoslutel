/**
 * A human caption from an image filename.
 *
 * The gallery captions were built by stripping the extension, swapping
 * hyphens for spaces and title-casing whatever was left. Most of the
 * photographs in public/images/marken carry a six-character hash on the end
 * to keep two shots of the same car apart, so visitors were reading
 * "Ford Autosleutel Bijmaken A8b252" under a real photo of a real job.
 *
 * The hash is dropped, the rest is cleaned up:
 *  - both separators count, since the merken files use "-" and the gallery
 *    files use "_", and only the first was ever handled;
 *  - a trailing hash is only removed when it is exactly six hex characters
 *    *and* contains a digit. Without that second condition an ordinary word
 *    made of a–f letters ("decade", "facade") would be silently eaten. Every
 *    hash actually on disk contains a digit, and none of the real trailing
 *    words do — "centrum", "overvecht", "zuid", "vathorst" and the rest all
 *    survive.
 */

const HASH_SUFFIX = /[-_][0-9a-f]{6}$/i;

/**
 * Makes that are initials, not words. Title-casing turns BMW into "Bmw",
 * which looks like a typo under a photo of somebody's BMW.
 */
const ACRONYMS: Record<string, string> = {
  bmw: 'BMW',
  vw: 'VW',
  mg: 'MG',
  ds: 'DS',
  gmc: 'GMC',
  suv: 'SUV',
  /* Immobiliser and lock systems, which read as typos title-cased:
     "Eis", "Elv", "Cas", "Bcm". */
  eis: 'EIS',
  elv: 'ELV',
  esl: 'ESL',
  cas: 'CAS',
  bcm: 'BCM',
  obd: 'OBD',
  akl: 'AKL',
};

/**
 * Wörter, die ein Dateiname nicht tragen kann.
 *
 * Dateinamen bleiben ohne Umlaut, weil sie in URLs stehen — "autoschluessel",
 * nicht "autoschlüssel". Unter einem Foto gelesen ist das aber falsch
 * geschrieben, also wird es hier zurückgesetzt, genau wie BMW oben nicht zu
 * "Bmw" werden darf.
 */
const SPELLINGS: Record<string, string> = {
  autoschluessel: 'Autoschlüssel',
  schluessel: 'Schlüssel',
  funkschluessel: 'Funkschlüssel',
  schluesseldienst: 'Schlüsseldienst',
  oeffnen: 'öffnen',
  zuendschloss: 'Zündschloss',
  muenchen: 'München',
  koeln: 'Köln',
  duesseldorf: 'Düsseldorf',
};

export function captionFromFilename(input: string): string {
  // Filename only, whether a bare name or a full path was passed.
  const base = input.split('/').pop() ?? input;
  const withoutExtension = base.replace(/\.(webp|jpe?g|png|avif|gif)$/i, '');

  const candidate = withoutExtension.replace(HASH_SUFFIX, '');
  // Only treat it as a hash when it has a digit in it; see the note above.
  const trailing = withoutExtension.slice(candidate.length + 1);
  const isHash = candidate !== withoutExtension && /[0-9]/.test(trailing);
  const hashless = isHash ? candidate : withoutExtension;
  // A trailing counter ("…-utrecht-22") tells two files apart, not the reader.
  const stem = hashless.replace(/[-_]\d{1,2}$/, '');

  return stem
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(
      (word) =>
        ACRONYMS[word.toLowerCase()] ??
        SPELLINGS[word.toLowerCase()] ??
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}
