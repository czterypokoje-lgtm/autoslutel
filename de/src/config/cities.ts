export type City = {
  slug: string; city: string; region: string;
  /*
   * Four-digit postcode prefix — the bridge between this file and dispatch.
   *
   * technicians.werkgebied stores Dutch postcode ranges ('3500-3599'), and
   * coversPostcode() in src/lib/crmJobs.ts matches on the first four digits.
   * Without a postcode here there is no way to ask "who covers this city?",
   * which is why every city page showed the same technician.
   *
   * One representative prefix per city, normally the centre. It identifies
   * the city to a range test; it is not the city's full postcode span.
   */
  postcode: string;
  country: "NL" | "BE" | "DE";
  lang: "NL" | "FR" | "VL" | "DE"; travelTime: string; keyword: string; nlSearches: number; priority: "P1"|"P2"|"P3";
  subAreas: string[];
  geo: { lat: string; lng: string };
  customH1?: string;
  customMetaTitle?: string;
  customMetaDesc?: string;
  popularBrands?: string[];
  commonJob?: string;
  localFact?: string;
  avgJobDuration?: string;
};

/**
 * Die Städte, in denen ein Partner steht — und nur die.
 *
 * Eine Stadtseite für einen Ort, in den niemand fährt, ist eine Brückenseite:
 * sie nimmt den Seiten Aufmerksamkeit weg, die echte Anfragen bringen. Die
 * niederländische Seite hat das einmal gelernt und neun Städte wieder auf
 * noindex gesetzt, weil sie in drei Monaten keine einzige Impression hatten
 * (siehe thinPages.ts dort). Köln, Düsseldorf und der Rest kommen dazu, sobald
 * dort ein Partner ist.
 *
 * `postcode` hat fünf Stellen, weil deutsche Postleitzahlen fünf haben.
 * `nlSearches` steht überall auf 0: für die niederländischen Städte liegen
 * echte Zahlen aus der Search Console vor, für Deutschland noch nicht, und
 * erfundene Zahlen würden unbemerkt die Reihenfolge bestimmen.
 */
export const CITIES: City[] = [
  { slug:"berlin", city:"Berlin", region:"Berlin", postcode:"10115", country:"DE", lang:"DE", travelTime:"", keyword:"Autoschlüssel nachmachen Berlin", nlSearches:0, priority:"P1", subAreas:["Mitte","Charlottenburg","Kreuzberg","Prenzlauer Berg","Neukölln","Friedrichshain","Pankow","Spandau","Steglitz","Wedding"], geo:{lat:"52.5200",lng:"13.4050"}, popularBrands:["Volkswagen","BMW","Mercedes-Benz"], commonJob:"Autoschlüssel verloren — Ersatzschlüssel vor Ort anlernen", localFact:"In Berlin wird überwiegend am Straßenrand geparkt und nicht in der eigenen Einfahrt. Wer den Schlüssel verliert, steht damit an einem Fahrzeug, das sich nicht einfach in eine Werkstatt bringen lässt — unser Partner kommt zum Auto, in Mitte wie in Spandau.", avgJobDuration:"30-60 Min." },
  { slug:"hamburg", city:"Hamburg", region:"Hamburg", postcode:"20095", country:"DE", lang:"DE", travelTime:"", keyword:"Autoschlüssel nachmachen Hamburg", nlSearches:0, priority:"P1", subAreas:["Altona","Eimsbüttel","Wandsbek","Harburg","Bergedorf","St. Pauli","HafenCity","Barmbek","Winterhude"], geo:{lat:"53.5511",lng:"9.9937"}, popularBrands:["Volkswagen","Mercedes-Benz","Audi"], commonJob:"Ersatzschlüssel für Firmen- und Leasingfahrzeuge", localFact:"Hamburg ist Hafen- und Logistikstandort, und ein Transporter, der auf einen Schlüssel wartet, kostet den ganzen Tag. Unser Partner arbeitet auch auf dem Betriebshof, nicht nur in der Werkstatt.", avgJobDuration:"30-60 Min." },
  { slug:"muenchen", city:"München", region:"Bayern", postcode:"80331", country:"DE", lang:"DE", travelTime:"", keyword:"Autoschlüssel nachmachen München", nlSearches:0, priority:"P1", subAreas:["Altstadt","Maxvorstadt","Schwabing","Haidhausen","Bogenhausen","Sendling","Giesing","Pasing","Neuhausen"], geo:{lat:"48.1351",lng:"11.5820"}, popularBrands:["BMW","Audi","Mercedes-Benz"], commonJob:"Keyless-Go-Schlüssel und Smart Key anlernen", localFact:"In München fahren besonders viele Fahrzeuge mit Keyless Go und schlüssellosem Zugang. Genau diese Systeme sind beim Hersteller am teuersten und beim Termin am langsamsten — vor Ort anlernen spart beides.", avgJobDuration:"35-60 Min." },
  { slug:"frankfurt", city:"Frankfurt am Main", region:"Hessen", postcode:"60311", country:"DE", lang:"DE", travelTime:"", keyword:"Autoschlüssel nachmachen Frankfurt", nlSearches:0, priority:"P1", subAreas:["Innenstadt","Sachsenhausen","Bornheim","Nordend","Westend","Bockenheim","Höchst","Niederrad","Gallus"], geo:{lat:"50.1109",lng:"8.6821"}, popularBrands:["Volkswagen","Mercedes-Benz","BMW"], commonJob:"Schlüssel im Parkhaus eingeschlossen — Öffnung und Ersatzschlüssel", localFact:"Frankfurt hat als Pendler- und Messestadt sehr viele Parkhäuser, und dort endet die Panne meistens. Unser Partner kommt bis in die Tiefgarage; das Fahrzeug muss nicht abgeschleppt werden.", avgJobDuration:"30-55 Min." },
];

export const ALL_CITIES = CITIES;
