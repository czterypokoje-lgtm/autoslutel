/**
 * Suchbegriffe für den deutschen Markt, Dienst für Dienst.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * WOHER DAS KOMMT, UND WOHER NICHT
 *
 * Es stehen hier keine Suchvolumina. Für die niederländischen Seiten gibt es
 * echte Zahlen aus der Search Console, und die Priorisierung dort ist daraus
 * begründet. Für Deutschland gibt es die noch nicht — ein Keyword-Planner-
 * oder Ahrefs-Export fehlt. Erfundene Zahlen würden hier unbemerkt die
 * Reihenfolge der Seiten bestimmen, also stehen sie nicht drin.
 *
 * Was stattdessen die Grundlage ist: wer für diese Begriffe in Deutschland
 * rankt und mit welchen Worten. Das ist keine Volumenschätzung, aber es ist
 * Beobachtung statt Vermutung, und es entscheidet die Wortwahl.
 *
 * Geprüft am 9. Oktober 2026:
 *  - adac.de/rund-ums-fahrzeug/.../autoschluessel-nachmachen
 *  - autoscout24.de/informieren/ratgeber/auto-sicherheit/autoschluessel-nachmachen
 *  - allianzdirect.de/kfz-versicherung/autoschluessel-nachmachen-ratgeber
 *  - ruv.de/kfz-versicherung/magazin/rund-ums-auto/autoschluessel-nachmachen
 *  - adac.de/services/pannenhilfe/schluessel-im-auto
 *  - t-online.de/.../schluessel-im-auto-eingeschlossen-das-koennen-sie-jetzt-tun
 *  - carwow.de/automagazin/.../schluessel-im-auto-eingeschlossen
 *  - kfz-dietrich.com/blog/autoschluessel-abgebrochen-steckt-fest-was-tun
 *  - kfz-dietrich.com/blog/schluesselservice-zweitschluessel-anlernen-lassen
 *  - autobild.de/artikel/autoschluessel-reparatur-26194071
 *  - netzwelt.de/news/258464-defekter-autoschluessel-kein-ersatz-hersteller
 *
 * ────────────────────────────────────────────────────────────────────────────
 * DREI BEOBACHTUNGEN, DIE DIE TEXTE BESTIMMEN
 *
 * 1. Die erste Seite gehört Ratgebern, nicht Anbietern.
 *    Für "Autoschlüssel nachmachen" ranken ADAC, AutoScout24, Allianz, R+V,
 *    giga.de — Magazine und Versicherer. Spezialisierte Dienstleister sind
 *    kaum dabei. Das ist eine Lücke: die Suchenden haben eine Absicht
 *    (Schlüssel nachmachen lassen) und finden Erklärtexte.
 *
 * 2. Was diese Ratgeber schreiben, arbeitet gegen uns — und ist angreifbar.
 *    Mehrere sagen wörtlich, bei modernen Autoschlüsseln sei das Anfertigen
 *    beim Schlüsseldienst "nicht möglich", weil ein Chip für die
 *    Wegfahrsperre enthalten sei, und verweisen auf Hersteller oder
 *    Vertragswerkstatt: 200 € und mehr, 3 bis 5 Tage Wartezeit. Genau das ist
 *    unser Unterschied, und er muss auf jeder Dienstseite in den ersten zwei
 *    Sätzen stehen. Nicht als Werbung, sondern als Korrektur: wir lernen die
 *    Wegfahrsperre vor Ort an, am Fahrzeug, am selben Tag.
 *
 * 3. Die Fachwörter sind nicht die niederländischen.
 *    "Anlernen" ist das Wort für programmieren — Zweitschlüssel anlernen,
 *    Wegfahrsperre anlernen. "Wegfahrsperre" ist die Immobilizer.
 *    "Zweitschlüssel" und "Ersatzschlüssel" sind beide gängig und meinen
 *    etwas verschiedenes: Zweitschlüssel = ein zweiter, solange der erste
 *    noch da ist; Ersatzschlüssel = Ersatz für einen weg. Wer sie vertauscht,
 *    schreibt an der Absicht vorbei. "Codieren", "OBD" und bei BMW
 *    "FEM/BDC" tauchen in den Fachtexten auf und sind das Vokabular, mit dem
 *    ein deutscher Suchender Kompetenz prüft.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * WAS NOCH FEHLT
 *
 * Echte Volumina. Mit einem Export (Stadt + Begriff + Volumen) wird aus
 * dieser Liste eine Rangfolge; bis dahin ist `rank` eine Einschätzung aus
 * Absicht und Wettbewerb, und sie ist als solche markiert.
 */

export type KeywordSet = {
  /** Die eine Phrase, auf die die Seite zielt. */
  head: string;
  /** Varianten, die dieselbe Absicht tragen und in den Text gehören. */
  variants: string[];
  /** Fachwörter, mit denen ein Suchender Kompetenz prüft. */
  jargon?: string[];
  /**
   * Einschätzung, nicht Messung: 1 = Geldbegriff, 2 = wichtig,
   * 3 = Langschwanz. Aus Absicht und Wettbewerb begründet, nicht aus Volumen.
   */
  rank: 1 | 2 | 3;
  /** Warum diese Einschätzung. */
  why: string;
};

/** Der Kopfbegriff der ganzen Seite. */
export const HEAD_KEYWORD = 'Autoschlüssel nachmachen';

export const SERVICE_KEYWORDS: Record<string, KeywordSet> = {
  'sleutel-bijmaken': {
    head: 'Autoschlüssel nachmachen',
    variants: [
      'Autoschlüssel nachmachen lassen',
      'Autoschlüssel kopieren',
      'Zweitschlüssel anlernen lassen',
      'Zweitschlüssel Auto',
      'Autoschlüssel nachmachen Kosten',
    ],
    jargon: ['Wegfahrsperre anlernen', 'Transponder', 'codieren', 'OBD'],
    rank: 1,
    why: 'Der Geldbegriff. Erste Seite voller Ratgeber, kaum Anbieter — und die Ratgeber sagen, es gehe beim Schlüsseldienst nicht.',
  },

  'alle-sleutels-kwijt-auto': {
    head: 'Autoschlüssel verloren',
    variants: [
      'Autoschlüssel verloren was tun',
      'Autoschlüssel verloren Kosten',
      'alle Autoschlüssel verloren',
      'Ersatzschlüssel Auto ohne Original',
      'Autoschlüssel weg',
    ],
    jargon: ['Wegfahrsperre neu anlernen', 'verlorenen Schlüssel sperren lassen'],
    rank: 1,
    why: 'Höchste Dringlichkeit und die beste Abschlussquote. Die Ratgeber schicken hier zum Händler mit Abschleppen — der Vergleich gewinnen wir.',
  },

  'noodopening-auto': {
    head: 'Schlüssel im Auto eingeschlossen',
    variants: [
      'Auto aufschließen ohne Schlüssel',
      'Auto öffnen ohne Schlüssel',
      'Autotür öffnen ohne Schlüssel',
      'Schlüsselnotdienst Auto',
      'Auto Notöffnung',
    ],
    jargon: ['schadenfreie Öffnung', 'Zentralverriegelung'],
    rank: 1,
    why: 'ADAC, t-online und carwow benutzen alle "Schlüssel im Auto eingeschlossen" — das ist das Wort der Suchenden, nicht "Notöffnung". Dringend und sofort zahlend.',
  },

  'sleutel-in-auto': {
    head: 'Schlüssel im Auto liegen gelassen',
    variants: [
      'Schlüssel im Auto eingeschlossen was tun',
      'Schlüssel liegt im Auto',
      'Auto zu Schlüssel drin',
    ],
    rank: 2,
    why: 'Dieselbe Situation wie oben, andere Formulierung. Eigene Seite, weil die Suchanfrage anders gestellt wird.',
  },

  'deur-dichtgevallen': {
    head: 'Autotür zugefallen Schlüssel drin',
    variants: [
      'Auto zugefallen Schlüssel innen',
      'Autotür zu Schlüssel im Auto',
      'Wind hat Autotür zugeworfen',
    ],
    rank: 3,
    why: 'Langschwanz derselben Panne. Wenig Volumen zu erwarten, aber sehr klare Absicht.',
  },

  'kofferbak-openen': {
    head: 'Kofferraum öffnen ohne Schlüssel',
    variants: [
      'Kofferraum zu Schlüssel drin',
      'Heckklappe öffnen ohne Schlüssel',
      'Kofferraum lässt sich nicht öffnen',
    ],
    rank: 3,
    why: 'Eigene Panne mit eigener Formulierung. "Heckklappe" ist das Wort bei Kombis und SUV und muss mit drin sein.',
  },

  'sleutel-afgebroken-in-slot': {
    head: 'Autoschlüssel abgebrochen',
    variants: [
      'Autoschlüssel abgebrochen im Schloss',
      'Autoschlüssel steckt fest',
      'Schlüssel im Zündschloss abgebrochen',
      'abgebrochenen Schlüssel entfernen',
    ],
    jargon: ['Schlüsselrohling', 'Schließzylinder'],
    rank: 2,
    why: 'Fachlich belegt: ein Meisterbetrieb rankt mit genau "abgebrochen steckt fest was tun". Panik plus sofortiger Bedarf.',
  },

  'transponder-programmeren': {
    head: 'Transponder anlernen',
    variants: [
      'Autoschlüssel programmieren',
      'Wegfahrsperre anlernen',
      'Transponderschlüssel anlernen lassen',
      'Chip im Autoschlüssel programmieren',
    ],
    jargon: ['OBD-Anlernen', 'FBS4', 'FEM/BDC', 'Immobilizer'],
    rank: 2,
    why: '"Anlernen" ist das deutsche Wort, nicht "programmeren". Wer so sucht, sucht einen Fachbetrieb und vergleicht keine Preise mehr.',
  },

  'smart-key-programmeren': {
    head: 'Keyless Go Schlüssel nachmachen',
    variants: [
      'Smart Key anlernen',
      'Keyless Schlüssel programmieren',
      'Comfort Access Schlüssel',
      'schlüsselloser Zugang Ersatzschlüssel',
    ],
    jargon: ['Keyless Go', 'Comfort Access', 'Smartkey', 'Proximity'],
    rank: 2,
    why: 'Teuerster Auftrag und beim Hersteller am langsamsten. In München besonders verbreitet, siehe die Stadtseite.',
  },

  'afstandsbediening-bijmaken': {
    head: 'Funkschlüssel nachmachen',
    variants: [
      'Funkschlüssel Auto anlernen',
      'Autoschlüssel mit Fernbedienung nachmachen',
      'Klappschlüssel nachmachen',
      'Funkschlüssel defekt',
    ],
    rank: 2,
    why: '"Funkschlüssel defekt" ist ein eigener Einstieg — motor-talk-Threads dazu ranken. Wer das sucht, braucht meist keinen neuen Schlüssel, sondern eine Reparatur: das ist der ehrlichere und billigere Auftrag.',
  },

  'reservesleutel-maken': {
    head: 'Ersatzschlüssel Auto anfertigen',
    variants: [
      'Zweitschlüssel Auto machen lassen',
      'Ersatzschlüssel Auto Kosten',
      'zweiter Autoschlüssel',
    ],
    rank: 2,
    why: 'Vorsorge statt Panne, also günstiger zu gewinnen. Wichtig: Zweitschlüssel (erster noch da) ist eine andere Absicht als Ersatzschlüssel (erster weg) — die beiden nicht vermischen.',
  },

  'batterij-vervangen': {
    head: 'Autoschlüssel Batterie wechseln',
    variants: [
      'Autoschlüssel Batterie leer',
      'Schlüsselbatterie wechseln',
      'Funkschlüssel Batterie tauschen',
    ],
    rank: 3,
    why: 'Hohes Volumen, aber die meisten machen es selbst — vor allem ein Weg auf die Seite, kein Auftrag. Giga und kfz-Blogs ranken markenweise ("Fiat 500e Schlüssel Batterie wechseln").',
  },

  'autosleutels-repareren': {
    head: 'Autoschlüssel reparieren',
    variants: [
      'Autoschlüssel defekt',
      'Autoschlüssel Reparatur Kosten',
      'Autoschlüssel geht nicht mehr',
    ],
    rank: 2,
    why: 'autobild.de und netzwelt.de ranken hier mit "beim Hersteller 200 bis 500 Euro". Reparieren statt ersetzen ist genau das Argument, das diese Artikel selbst machen.',
  },

  'behuizing-vervangen': {
    head: 'Schlüsselgehäuse wechseln',
    variants: [
      'Autoschlüssel Gehäuse tauschen',
      'Schlüsselgehäuse Auto kaufen',
      'Autoschlüssel Gehäuse defekt',
    ],
    rank: 3,
    why: 'Autobild warnt ausdrücklich, dass beim Selbsttausch der Transponder im alten Gehäuse verloren geht. Das ist der Satz, der diese Seite verkauft.',
  },

  'knoppen-repareren': {
    head: 'Autoschlüssel Tasten funktionieren nicht',
    variants: [
      'Autoschlüssel Knöpfe defekt',
      'Fernbedienung Auto Taste kaputt',
      'Autoschlüssel Taste reparieren',
    ],
    jargon: ['Mikroschalter', 'SMD'],
    rank: 3,
    why: 'Sehr spezifisch, kleine Zahl, aber fast keine Konkurrenz und ein echter Auftrag am Ende.',
  },
};

/** Begriffe für die eigenständigen Landingpages. */
export const LANDING_KEYWORDS: Record<string, KeywordSet> = {
  'autoschluessel-verloren': SERVICE_KEYWORDS['alle-sleutels-kwijt-auto'],
  'autoschluessel-nachmachen-lassen': {
    head: 'Autoschlüssel nachmachen lassen',
    variants: ['Autoschlüssel machen lassen', 'wo Autoschlüssel nachmachen lassen'],
    rank: 1,
    why: 'Die Variante mit "lassen" ist eine eigene Anfrage: sie sucht einen Anbieter, nicht eine Anleitung.',
  },
  'autoschluessel-kopieren': {
    head: 'Autoschlüssel kopieren',
    variants: ['Autoschlüssel kopieren lassen', 'Autoschlüssel duplizieren'],
    rank: 2,
    why: 'Wird von Suchenden für den einfachen Fall benutzt, wo ein Original vorhanden ist.',
  },
  'autoschluessel-nachmachen-in-der-naehe': {
    head: 'Autoschlüssel nachmachen in der Nähe',
    variants: [
      'Schlüsseldienst Auto in der Nähe',
      'Autoschlüssel Service in meiner Nähe',
    ],
    rank: 1,
    why: 'Lokale Absicht ohne Städtenamen. Auf der niederländischen Seite ist das die Anfrage mit der besten Klickrate überhaupt.',
  },
  'autoschluessel-gestohlen': {
    head: 'Autoschlüssel gestohlen',
    variants: [
      'Autoschlüssel gestohlen was tun',
      'Autoschlüssel gestohlen Versicherung',
      'Schlüssel gestohlen Auto sperren',
    ],
    rank: 2,
    why: 'Andere Absicht als "verloren": hier geht es zuerst um Sicherheit und Versicherung. Der alte Schlüssel muss aus dem System gelöscht werden, und das ist der Satz, der zählt.',
  },
  'mobiler-schluesseldienst': {
    head: 'mobiler Schlüsseldienst Auto',
    variants: [
      'Autoschlüsseldienst',
      'Schlüsseldienst Auto',
      'Autoschlüssel Notdienst',
      'KFZ Schlüsseldienst',
    ],
    rank: 1,
    why: 'Wer einen Beruf sucht statt eine Aufgabe. Heikel in Deutschland: "Schlüsseldienst" ist durch Abzockerberichte belastet, also muss auf dieser Seite der Festpreis ganz oben stehen.',
  },
  'motorradschluessel-nachmachen': {
    head: 'Motorradschlüssel nachmachen',
    variants: [
      'Motorradschlüssel verloren',
      'Zündschlüssel Motorrad nachmachen',
      'Motorrad Schlüssel anlernen',
    ],
    rank: 3,
    why: 'Eigene Zielgruppe, eigene Marken. Das gs-forum zeigt, dass BMW-Keyless-Motorradschlüssel ein echtes Thema sind.',
  },
};
