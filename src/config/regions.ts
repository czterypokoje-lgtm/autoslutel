import { SITE_CONFIG } from '@/config/site.config';

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
  /** Which country's build this region belongs to. */
  country: 'NL' | 'BE' | 'DE';
  slug: string;
  /** As the CITIES config spells it in `region`. */
  name: string;
  /** What a customer there would type. */
  label: string;
  /** One honest sentence about how this province is served. */
  intro: string;
};

const ALL_SERVICE_REGIONS: readonly ServiceRegion[] = [
  {
    country: 'NL',
    slug: 'utrecht',
    name: 'Utrecht',
    label: 'Utrecht',
    intro: 'Utrecht en de omliggende gemeenten zijn ons kernwerkgebied: van Houten en Zeist tot Amersfoort en Woerden.',
  },
  {
    country: 'NL',
    slug: 'noord-holland',
    name: 'Noord-Holland',
    label: 'Noord-Holland en het Gooi',
    intro: 'Vanuit het Gooi bedienen wij Amsterdam, Amstelveen, Haarlem, Hilversum en de rest van Noord-Holland.',
  },
  {
    country: 'NL',
    slug: 'zuid-holland',
    name: 'Zuid-Holland',
    label: 'Zuid-Holland',
    intro: 'In Zuid-Holland komen wij in Den Haag, Rotterdam, Leiden, Gouda, Zoetermeer en Dordrecht en omgeving.',
  },
  {
    country: 'NL',
    slug: 'gelderland',
    name: 'Gelderland',
    label: 'Gelderland',
    intro: 'In Gelderland komen wij in Arnhem, Nijmegen, Apeldoorn en Ede en omgeving.',
  },
  {
    country: 'NL',
    slug: 'flevoland',
    name: 'Flevoland',
    label: 'Flevoland',
    intro: 'In Flevoland komen wij in Almere en Lelystad en omgeving.',
  },
  // ── GERMANY ──
  /*
   * The Länder the four partner cities sit in, one per city. Not "we serve
   * Bayern": München has a partner and Nürnberg does not, and a Land-wide
   * claim in areaServed would say otherwise. The intro lines say the city.
   */
  {
    country: 'DE',
    slug: 'berlin',
    name: 'Berlin',
    label: 'Berlin',
    intro: 'In Berlin kommt unser Partner zu Ihrem Fahrzeug — in Mitte, Charlottenburg, Kreuzberg, Neukölln und den Bezirken dahinter.',
  },
  {
    country: 'DE',
    slug: 'hamburg',
    name: 'Hamburg',
    label: 'Hamburg',
    intro: 'In Hamburg sind wir von Altona und Eimsbüttel über Wandsbek bis Harburg und Bergedorf für Sie unterwegs.',
  },
  {
    country: 'DE',
    slug: 'bayern',
    name: 'Bayern',
    label: 'München',
    intro: 'In München kommt unser Partner zu Ihrem Fahrzeug, von der Altstadt über Schwabing und Haidhausen bis Pasing.',
  },
  {
    country: 'DE',
    slug: 'hessen',
    name: 'Hessen',
    label: 'Frankfurt am Main',
    intro: 'In Frankfurt am Main erreichen wir Sie in der Innenstadt, in Sachsenhausen, im Nordend und bis nach Höchst — auch im Parkhaus.',
  },
] as const;

/**
 * The regions this build's country serves.
 *
 * Read by the schema (areaServed, so every page says the same thing), by the
 * province/region hub pages and by the sitemap — none of which needed a
 * change, because the filter happens here.
 */
export const SERVICE_REGIONS: readonly ServiceRegion[] = ALL_SERVICE_REGIONS.filter(
  (r) => r.country === SITE_CONFIG.country
);
