/*
 * The provinces the business serves and wants to be found in.
 *
 * Utrecht is the centre of the operation and the Gooi (Noord-Holland) is the
 * base. Zuid-Holland (Den Haag, Rotterdam, Leiden, Gouda and the rest of the
 * Randstad's southern half), Gelderland (Arnhem, Nijmegen, Apeldoorn, Ede) and
 * Flevoland (Almere) are covered by technicians stationed there. "Randstad" is
 * not a province and has no page of its own: it is the name people use for
 * Utrecht + Noord-Holland + Zuid-Holland + Flevoland's edge, so it is handled as
 * text on the province pages rather than as a thin page of its own.
 *
 * Used by the schema (areaServed, so every page says the same thing), by the
 * province hub pages and by the sitemap.
 */
export type ServiceRegion = {
  slug: string;
  /** As the CITIES config spells it in `region`. */
  name: string;
  /** What a customer there would type. */
  label: string;
  /** One honest sentence about how this province is served. */
  intro: string;
};

/**
 * Die Bundesländer, in denen ein Partner steht — eines je Stadt.
 *
 * Nicht "wir bedienen Bayern": München hat einen Partner, Nürnberg nicht, und
 * eine landesweite Aussage in areaServed würde etwas anderes behaupten. Die
 * Einleitungen nennen deshalb die Stadt.
 */
export const SERVICE_REGIONS: readonly ServiceRegion[] = [
  {
    slug: 'berlin',
    name: 'Berlin',
    label: 'Berlin',
    intro:
      'In Berlin kommt unser Partner zu Ihrem Fahrzeug — in Mitte, Charlottenburg, Kreuzberg, Neukölln und den Bezirken dahinter.',
  },
  {
    slug: 'hamburg',
    name: 'Hamburg',
    label: 'Hamburg',
    intro:
      'In Hamburg sind wir von Altona und Eimsbüttel über Wandsbek bis Harburg und Bergedorf für Sie unterwegs.',
  },
  {
    slug: 'bayern',
    name: 'Bayern',
    label: 'München',
    intro:
      'In München kommt unser Partner zu Ihrem Fahrzeug, von der Altstadt über Schwabing und Haidhausen bis Pasing.',
  },
  {
    slug: 'hessen',
    name: 'Hessen',
    label: 'Frankfurt am Main',
    intro:
      'In Frankfurt am Main erreichen wir Sie in der Innenstadt, in Sachsenhausen, im Nordend und bis nach Höchst — auch im Parkhaus.',
  },
] as const;
