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

export const SERVICE_REGIONS: readonly ServiceRegion[] = [
  {
    slug: 'utrecht',
    name: 'Utrecht',
    label: 'Utrecht',
    intro: 'Utrecht en de omliggende gemeenten zijn ons kernwerkgebied: van Houten en Zeist tot Amersfoort en Woerden.',
  },
  {
    slug: 'noord-holland',
    name: 'Noord-Holland',
    label: 'Noord-Holland en het Gooi',
    intro: 'Vanuit het Gooi bedienen wij Amsterdam, Amstelveen, Haarlem, Hilversum en de rest van Noord-Holland.',
  },
  {
    slug: 'zuid-holland',
    name: 'Zuid-Holland',
    label: 'Zuid-Holland',
    intro: 'In Zuid-Holland komen wij in Den Haag, Rotterdam, Leiden, Gouda, Zoetermeer en Dordrecht en omgeving.',
  },
  {
    slug: 'gelderland',
    name: 'Gelderland',
    label: 'Gelderland',
    intro: 'In Gelderland komen wij in Arnhem, Nijmegen, Apeldoorn en Ede en omgeving.',
  },
  {
    slug: 'flevoland',
    name: 'Flevoland',
    label: 'Flevoland',
    intro: 'In Flevoland komen wij in Almere en Lelystad en omgeving.',
  },
] as const;
