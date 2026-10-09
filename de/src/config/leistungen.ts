import { SITE, isReady } from './site';

/**
 * Was wir machen, in der Sprache, in der danach gesucht wird.
 *
 * Die Slugs sind die Suchbegriffe: "Autoschlüssel nachmachen" ist das
 * Hauptgeldwort, "Autoschlüssel verloren" das mit der höchsten Dringlichkeit
 * und der besten Abschlussquote. Keine niederländischen Slugs in deutschen
 * URLs — /steden/berlin wäre falsch, es heißt /staedte/berlin.
 */

export type Leistung = {
  slug: string;
  titel: string;
  kurz: string;
  /** Preis-Schlüssel in SITE.prices, oder null wenn es keinen Ab-Preis gibt. */
  preis: keyof typeof SITE.prices | null;
  dauer: string;
  /** Wofür ein Kunde das braucht — in seinen Worten, nicht in unseren. */
  wann: string[];
};

export const LEISTUNGEN: Leistung[] = [
  {
    slug: 'autoschluessel-nachmachen',
    titel: 'Autoschlüssel nachmachen',
    kurz: 'Ein zweiter Schlüssel, vor Ort gefräst und angelernt — ohne Termin beim Händler.',
    preis: 'nachmachen',
    dauer: '30–45 Minuten',
    wann: [
      'Sie haben nur noch einen Schlüssel und wollen einen Ersatz, bevor er wegkommt',
      'Der zweite Schlüssel war beim Kauf des Fahrzeugs nicht dabei',
      'Ein Familienmitglied soll einen eigenen Schlüssel haben',
    ],
  },
  {
    slug: 'autoschluessel-verloren',
    titel: 'Autoschlüssel verloren',
    kurz: 'Alle Schlüssel weg? Wir öffnen das Fahrzeug, fräsen einen neuen Schlüssel und löschen den verlorenen aus dem System.',
    preis: 'alleSchluesselVerloren',
    dauer: '45–90 Minuten',
    wann: [
      'Der einzige Schlüssel ist verloren oder gestohlen',
      'Das Fahrzeug steht und kann nicht bewegt werden',
      'Der Händler verlangt, dass das Auto zu ihm abgeschleppt wird',
    ],
  },
  {
    slug: 'funkschluessel-nachmachen',
    titel: 'Funkschlüssel nachmachen',
    kurz: 'Klapp- und Funkschlüssel inklusive Fernbedienung, angelernt an Ihre Wegfahrsperre.',
    preis: 'funkschluessel',
    dauer: '30–60 Minuten',
    wann: [
      'Die Fernbedienung reagiert nicht mehr',
      'Das Schlüsselgehäuse ist gebrochen',
      'Die Tasten funktionieren nicht mehr zuverlässig',
    ],
  },
  {
    slug: 'keyless-go-schluessel',
    titel: 'Keyless-Go-Schlüssel anlernen',
    kurz: 'Schlüssellose Systeme — Keyless Go, Comfort Access, Smart Key — vor Ort programmiert.',
    preis: 'keylessGo',
    dauer: '35–60 Minuten',
    wann: [
      'Das Fahrzeug erkennt den Schlüssel nicht mehr',
      'Sie brauchen einen zweiten schlüssellosen Schlüssel',
      'Nach einem Batteriewechsel ist die Verbindung weg',
    ],
  },
  {
    slug: 'auto-oeffnen',
    titel: 'Auto öffnen ohne Schlüssel',
    kurz: 'Schlüssel im Auto eingeschlossen? Wir öffnen schadenfrei — ohne Scheibe, ohne Aufbohren.',
    preis: 'oeffnung',
    dauer: '15–30 Minuten',
    wann: [
      'Der Schlüssel liegt sichtbar im Fahrzeug',
      'Die Zentralverriegelung hat zugeschlossen, während der Schlüssel drin lag',
      'Das Kind oder das Haustier sitzt im Auto — dann bitte sofort anrufen',
    ],
  },
  {
    slug: 'zuendschloss-reparieren',
    titel: 'Zündschloss reparieren',
    kurz: 'Der Schlüssel dreht nicht mehr oder steckt fest — meist ist das Schloss defekt, nicht der Schlüssel.',
    preis: 'zuendschloss',
    dauer: '60–120 Minuten',
    wann: [
      'Der Schlüssel lässt sich nicht mehr drehen',
      'Der Schlüssel steckt fest und kommt nicht heraus',
      'Das Zündschloss ist ausgeschlagen und greift nicht mehr',
    ],
  },
];

export const findLeistung = (slug: string) => LEISTUNGEN.find((l) => l.slug === slug);

/** Der Ab-Preis einer Leistung, oder null solange er nicht hinterlegt ist. */
export function abPreis(leistung: Leistung): string | null {
  if (!leistung.preis) return null;
  const value = SITE.prices[leistung.preis];
  return typeof value === 'string' && isReady(value) ? value : null;
}

/**
 * Häufige Fragen.
 *
 * Geschrieben gegen das eine Problem, das diese Branche in Deutschland hat:
 * Schlüssel- und Türnotdienste sind seit Jahren Thema in der
 * Verbraucherpresse, und ein deutscher Suchender prüft zuerst, ob er am Ende
 * mehr zahlt als abgesprochen. Darum steht der Festpreis vorne und nicht die
 * Geschwindigkeit. Dass wir den Preis vorher nennen, ist auf diesem Markt ein
 * echtes Unterscheidungsmerkmal — in den Niederlanden ist es nur eine
 * Selbstverständlichkeit.
 */
export const FAQ: { frage: string; antwort: string }[] = [
  {
    frage: 'Was kostet es, einen Autoschlüssel nachmachen zu lassen?',
    antwort:
      'Sie erfahren den Preis am Telefon, bevor jemand losfährt — und er ändert sich vor Ort nicht. Der Preis hängt von Marke, Modell, Baujahr und Schlüsselart ab: ein einfacher Transponderschlüssel ist deutlich günstiger als ein Keyless-Go-Schlüssel, bei dem die Wegfahrsperre neu angelernt werden muss. Alle genannten Preise sind Bruttopreise inklusive 19 % MwSt., es kommt nichts dazu.',
  },
  {
    frage: 'Kommen am Ende noch Kosten dazu?',
    antwort:
      'Nein. Der am Telefon genannte Preis ist der Preis auf der Rechnung. Keine Anfahrtspauschale, kein Nacht- oder Wochenendzuschlag, kein Aufschlag, der erst am Fahrzeug genannt wird. Wenn sich am Fahrzeug zeigt, dass der Auftrag ein anderer ist als beschrieben, hören Sie den neuen Preis, bevor gearbeitet wird — und können ablehnen.',
  },
  {
    frage: 'Ich habe alle Schlüssel verloren. Muss das Auto abgeschleppt werden?',
    antwort:
      'In der Regel nicht. Wir öffnen das Fahrzeug schadenfrei, lesen die nötigen Daten aus, fräsen einen neuen Schlüssel und lernen ihn an der Wegfahrsperre an — alles an dem Ort, an dem das Auto steht. Der verlorene Schlüssel wird dabei aus dem System gelöscht, damit er das Fahrzeug nicht mehr öffnet. Das ist der Teil, den viele vergessen, und er ist der wichtigste.',
  },
  {
    frage: 'Wie schnell ist jemand da?',
    antwort:
      'Das hängt davon ab, wo Sie stehen und was gerade läuft, und wir nennen Ihnen am Telefon ein ehrliches Zeitfenster statt einer Zahl, die gut klingt. Unsere Partner in Berlin, Hamburg, München und Frankfurt am Main arbeiten rund um die Uhr, auch am Wochenende und an Feiertagen.',
  },
  {
    frage: 'Welche Unterlagen brauche ich?',
    antwort:
      'Ihren Personalausweis oder Pass und die Zulassungsbescheinigung Teil I (den Fahrzeugschein). Damit weisen Sie nach, dass das Fahrzeug Ihnen gehört. Ohne diesen Nachweis wird kein Schlüssel angefertigt — das ist keine Bürokratie, sondern der Grund, warum ein Dritter sich für Ihr Auto keinen Schlüssel machen lassen kann.',
  },
  {
    frage: 'Ist der Schlüssel so gut wie der vom Hersteller?',
    antwort:
      'Ja. Es wird dieselbe Technik verwendet: der passende Transponder, am Fahrzeug angelernt, mit einem auf Ihr Schließsystem gefrästen Rohling. Der Unterschied zum Händler ist nicht die Qualität, sondern dass kein Schlüssel auf Fahrgestellnummer bestellt und tagelang geliefert werden muss.',
  },
  {
    frage: 'Arbeiten Sie an allen Marken?',
    antwort:
      'An den allermeisten. Manche sehr neue Modelle sowie einzelne Systeme mit Online-Freischaltung durch den Hersteller lassen sich nicht vor Ort anlernen. Dann sagen wir das am Telefon und fahren nicht los, um Ihnen vor dem Auto eine Rechnung für eine Anfahrt zu stellen.',
  },
  {
    frage: 'Wer kommt — Sie oder ein Partnerbetrieb?',
    antwort:
      'Ein Partnerbetrieb aus Ihrer Stadt, der zu unserem Netzwerk gehört. Er ist ein eigenständiger Fachbetrieb vor Ort, arbeitet aber zu den Preisen und Bedingungen, die Sie bei uns zugesagt bekommen. Deshalb ist jemand in Ihrer Stadt und nicht drei Stunden entfernt.',
  },
];
