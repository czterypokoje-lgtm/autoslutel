/**
 * Die Städte, in denen ein Partner steht.
 *
 * Nur diese vier, und das ist der ganze Punkt. Eine Stadtseite für einen Ort,
 * in den niemand fährt, ist eine Brückenseite: sie nimmt den Seiten
 * Aufmerksamkeit weg, die echte Anfragen bringen. Die niederländische Seite
 * hat das einmal gelernt und neun Städte wieder auf noindex gesetzt, weil sie
 * in drei Monaten keine einzige Impression hatten.
 *
 * Köln, Düsseldorf, Stuttgart und der Rest kommen dazu, sobald dort ein
 * Partner ist — nicht vorher.
 *
 * `suchvolumen` steht überall auf null. Das ist eine Lücke, keine Behauptung:
 * für die niederländischen Städte liegen echte Zahlen aus der Search Console
 * vor und die Priorisierung ist daraus begründet. Für Deutschland gibt es das
 * noch nicht, und erfundene Zahlen würden hier unbemerkt die Reihenfolge
 * bestimmen.
 */

export type Stadt = {
  slug: string;
  stadt: string;
  /** Bundesland. */
  land: string;
  /** Eine repräsentative fünfstellige PLZ, meist die Mitte. */
  plz: string;
  geo: { lat: string; lng: string };
  /** Stadtteile, in denen der Partner arbeitet. */
  stadtteile: string[];
  /** Das Hauptsuchwort dieser Stadt. */
  keyword: string;
  suchvolumen: number | null;
  /** Häufigster Auftrag hier. */
  typischerAuftrag: string;
  /** Ein wahrer Satz über diese Stadt, kein Füllmaterial. */
  vorOrt: string;
  marken: string[];
};

export const STAEDTE: Stadt[] = [
  {
    slug: 'berlin',
    stadt: 'Berlin',
    land: 'Berlin',
    plz: '10115',
    geo: { lat: '52.5200', lng: '13.4050' },
    stadtteile: [
      'Mitte',
      'Charlottenburg',
      'Kreuzberg',
      'Prenzlauer Berg',
      'Neukölln',
      'Friedrichshain',
      'Pankow',
      'Spandau',
      'Steglitz',
      'Wedding',
    ],
    keyword: 'Autoschlüssel nachmachen Berlin',
    suchvolumen: null,
    typischerAuftrag: 'Autoschlüssel verloren — Ersatzschlüssel vor Ort anlernen',
    vorOrt:
      'In Berlin wird überwiegend am Straßenrand geparkt und nicht in der eigenen Einfahrt. Wer den Schlüssel verliert, steht damit an einem Fahrzeug, das sich nicht einfach in eine Werkstatt bringen lässt — unser Partner kommt zum Auto, egal ob in Mitte oder in Spandau.',
    marken: ['Volkswagen', 'BMW', 'Mercedes-Benz'],
  },
  {
    slug: 'hamburg',
    stadt: 'Hamburg',
    land: 'Hamburg',
    plz: '20095',
    geo: { lat: '53.5511', lng: '9.9937' },
    stadtteile: [
      'Altona',
      'Eimsbüttel',
      'Wandsbek',
      'Harburg',
      'Bergedorf',
      'St. Pauli',
      'HafenCity',
      'Barmbek',
      'Winterhude',
    ],
    keyword: 'Autoschlüssel nachmachen Hamburg',
    suchvolumen: null,
    typischerAuftrag: 'Ersatzschlüssel für Firmen- und Leasingfahrzeuge',
    vorOrt:
      'Hamburg ist Hafen- und Logistikstandort, und ein Transporter, der auf einen Schlüssel wartet, kostet den ganzen Tag. Unser Partner arbeitet auch auf dem Betriebshof, nicht nur in der Werkstatt.',
    marken: ['Volkswagen', 'Mercedes-Benz', 'Audi'],
  },
  {
    slug: 'muenchen',
    stadt: 'München',
    land: 'Bayern',
    plz: '80331',
    geo: { lat: '48.1351', lng: '11.5820' },
    stadtteile: [
      'Altstadt',
      'Maxvorstadt',
      'Schwabing',
      'Haidhausen',
      'Bogenhausen',
      'Sendling',
      'Giesing',
      'Pasing',
      'Neuhausen',
    ],
    keyword: 'Autoschlüssel nachmachen München',
    suchvolumen: null,
    typischerAuftrag: 'Keyless-Go-Schlüssel und Smart Key anlernen',
    vorOrt:
      'In München fahren besonders viele Fahrzeuge mit Keyless Go und schlüssellosem Zugang. Genau diese Systeme sind beim Hersteller am teuersten und beim Termin am langsamsten — vor Ort anlernen spart beides.',
    marken: ['BMW', 'Audi', 'Mercedes-Benz'],
  },
  {
    slug: 'frankfurt',
    stadt: 'Frankfurt am Main',
    land: 'Hessen',
    plz: '60311',
    geo: { lat: '50.1109', lng: '8.6821' },
    stadtteile: [
      'Innenstadt',
      'Sachsenhausen',
      'Bornheim',
      'Nordend',
      'Westend',
      'Bockenheim',
      'Höchst',
      'Niederrad',
      'Gallus',
    ],
    keyword: 'Autoschlüssel nachmachen Frankfurt',
    suchvolumen: null,
    typischerAuftrag: 'Schlüssel im Parkhaus eingeschlossen — Öffnung und Ersatzschlüssel',
    vorOrt:
      'Frankfurt hat als Pendler- und Messestadt sehr viele Parkhäuser, und dort endet die Panne meistens. Unser Partner kommt bis in die Tiefgarage; das Fahrzeug muss nicht abgeschleppt werden.',
    marken: ['Volkswagen', 'Mercedes-Benz', 'BMW'],
  },
];

export const findStadt = (slug: string) => STAEDTE.find((s) => s.slug === slug);
