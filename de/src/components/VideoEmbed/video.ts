import { SITE_CONFIG } from '@/config/site.config';

/*
 * Das Erklärvideo — für diese Domain noch keines.
 *
 * Die niederländische Seite hat eines: "Autosleutel Kwijt? Zo Regel Je Snel
 * een Nieuwe Autosleutel", vierzig Sekunden, niederländisch gesprochen. Die
 * Video-ID ist beim Kopieren mitgekommen, und sie hätte funktioniert — das
 * ist der Grund, warum sie hier entfernt ist und nicht übersetzt:
 *
 *  - Ein deutscher Besucher drückt auf Abspielen und hört Niederländisch. Das
 *    ist schlimmer als kein Video, weil es in der Sekunde, in der Vertrauen
 *    entsteht, zeigt, dass die Seite nicht für ihn gemacht ist.
 *  - Das VideoObject hätte Google gemeldet, dieses niederländische Video sei
 *    der Inhalt dieser Domain. Ein Videoergebnis dafür zu gewinnen, wäre ein
 *    Treffer, der niemandem nützt.
 *  - Der Titel und die Beschreibung im Schema wären niederländischer Text in
 *    den strukturierten Daten einer deutschen Seite.
 *
 * null heißt: VideoEmbed rendert nichts, und die Seiten, die es einbinden,
 * zeigen den Abschnitt nicht. Sobald ein deutsches Video existiert, hier
 * eintragen — dann erscheinen Player und Auszeichnung von selbst.
 *
 * Beim Eintragen zwei Dinge beachten, die auf der niederländischen Seite Zeit
 * gekostet haben:
 *
 *  - uploadDate muss ein vollständiges ISO-8601-Datum MIT Zeitzonen-Offset
 *    sein. Ein bloßes '2026-09-29' wird von der Search Console zweifach
 *    beanstandet: "invalid datetime value", weil es ein Datum und keine
 *    Zeitangabe ist, und "missing a time zone", weil ein Datum keine tragen
 *    kann. Für Deutschland ist der Offset +01:00 (MEZ) bzw. +02:00 (MESZ).
 *  - Ein VideoObject gehört auf EINE Seite, und zwar die, deren Zweck das
 *    Video ist. Google nennt eine Seite, auf der das Video den Text nur
 *    ergänzt, ausdrücklich keine Watch-Page; die Auszeichnung auf jeder
 *    einbindenden Seite zu wiederholen füllt den Videobericht mit
 *    "isn't on a watch page". Der Player darf überall stehen, die
 *    Auszeichnung bleibt zu Hause.
 */

export type VideoFacts = {
  id: string;
  name: string;
  uploadDate: string;
  duration: string;
  description: string;
  poster: string;
};

/*
 * null, solange es kein deutsches Video gibt.
 *
 * Die Annotation steht auf `VideoFacts | null` und nicht auf dem Literal, damit
 * ein Eintrag hier den übrigen Code nicht bricht: ohne sie leitet TypeScript
 * den Typ `null` ab, verengt jeden Wahrheitszweig auf `never` und meldet
 * "Property 'name' does not exist on type 'never'".
 */
export const VIDEO: VideoFacts | null = null;

/** Baut das VideoObject zu einem Video. Getrennt, damit die Verengung greift. */
function buildVideoSchema(video: VideoFacts) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: [`https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`],
    uploadDate: video.uploadDate,
    duration: video.duration,
    embedUrl: `https://www.youtube.com/embed/${video.id}`,
    contentUrl: `https://www.youtube.com/watch?v=${video.id}`,
    publisher: { '@id': `${SITE_CONFIG.domain}/#localbusiness` },
  };
}

/** Das VideoObject, oder null, solange es kein deutsches Video gibt. */
export const videoSchema = VIDEO ? buildVideoSchema(VIDEO) : null;
